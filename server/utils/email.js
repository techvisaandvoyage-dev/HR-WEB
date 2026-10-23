const nodemailer = require('nodemailer');
const crypto = require('crypto');

let BouncedEmail;
try {
  BouncedEmail = require('../models/BouncedEmail');
} catch (_) {}

let OtpTracker;
try {
  OtpTracker = require('../models/OtpTracker');
} catch (_) {}

// key (purpose:email) -> { otpHash, expiresAt, lastSentAt, resendCount, wrongAttempts, lockedUntil }
const otpStore = new Map();

// Daily in-memory count fallback: email:YYYY-MM-DD -> count
const dailyCountStore = new Map();

const OTP_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN || 30);
const MAX_DAILY_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_SECONDS = 30; // 30 sec cooldown after 3 wrong attempts
const OTP_EXPIRY_MINUTES = 1; // 1 OTP is valid for 1 minute

const generateOtp = (length = 4) => {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
};

// SHA-256 hash for secure storage (plain OTP is never saved in DB/memory)
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getStoreKey = (email, purpose = 'registration') => {
  return `${purpose}:${normalizeEmail(email)}`;
};

const getTodayDateStr = () => {
  // Format YYYY-MM-DD in Indian Standard Time (IST, UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10);
};

const getRemainingCooldown = (key) => {
  const record = otpStore.get(key);
  if (!record || !record.lastSentAt) return 0;
  const elapsedMs = Date.now() - record.lastSentAt;
  const cooldownMs = OTP_COOLDOWN_SECONDS * 1000;
  if (elapsedMs < cooldownMs) {
    return Math.ceil((cooldownMs - elapsedMs) / 1000);
  }
  return 0;
};

// Check and increment daily OTP usage (Max 5 times per day)
const checkAndIncrementDailyLimit = async (email) => {
  const cleanEmail = normalizeEmail(email);
  const dateStr = getTodayDateStr();
  const memKey = `${cleanEmail}:${dateStr}`;

  let currentCount = dailyCountStore.get(memKey) || 0;

  if (OtpTracker) {
    try {
      const tracker = await OtpTracker.findOne({ email: cleanEmail, date: dateStr });
      if (tracker) {
        currentCount = Math.max(currentCount, tracker.sendCount || 0);
      }
    } catch (dbErr) {
      console.warn('[OtpTracker] DB check error, fallback to memory:', dbErr.message);
    }
  }

  if (currentCount >= MAX_DAILY_OTP_ATTEMPTS) {
    const err = new Error('Daily OTP limit reached (maximum 5 times per day). Please contact our support team at support@sahijob.com for assistance.');
    err.status = 429;
    err.dailyLimitReached = true;
    err.maxDaily = MAX_DAILY_OTP_ATTEMPTS;
    throw err;
  }

  const newCount = currentCount + 1;
  dailyCountStore.set(memKey, newCount);

  if (OtpTracker) {
    try {
      await OtpTracker.findOneAndUpdate(
        { email: cleanEmail, date: dateStr },
        { $set: { sendCount: newCount, lastSentAt: new Date() } },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn('[OtpTracker] DB update error:', dbErr.message);
    }
  }

  return newCount;
};

// Rollback daily OTP count if email delivery fails
const rollbackDailyLimit = async (email) => {
  const cleanEmail = normalizeEmail(email);
  const dateStr = getTodayDateStr();
  const memKey = `${cleanEmail}:${dateStr}`;

  const current = dailyCountStore.get(memKey) || 0;
  if (current > 0) {
    dailyCountStore.set(memKey, current - 1);
  }

  if (OtpTracker) {
    try {
      await OtpTracker.findOneAndUpdate(
        { email: cleanEmail, date: dateStr },
        { $inc: { sendCount: -1 } }
      );
    } catch (_) {}
  }
};

const saveOtp = (email, otp, expiryMinutes = OTP_EXPIRY_MINUTES, purpose = 'registration') => {
  const key = getStoreKey(email, purpose);
  const existing = otpStore.get(key);
  otpStore.set(key, {
    otpHash: hashOtp(otp),
    expiresAt: Date.now() + expiryMinutes * 60 * 1000,
    lastSentAt: Date.now(),
    resendCount: existing ? (existing.resendCount || 0) + 1 : 0,
    wrongAttempts: existing ? (existing.wrongAttempts || 0) : 0,
    lockedUntil: existing ? (existing.lockedUntil || 0) : 0,
  });
};

const consumeOtp = (email, otp, purpose = 'registration', consume = true) => {
  const key = getStoreKey(email, purpose);
  const record = otpStore.get(key);

  if (!record) {
    const err = new Error('OTP not found. Please request a new OTP.');
    err.status = 400;
    throw err;
  }

  // 1. Check if user is locked out after 3 wrong attempts
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remainingLockSec = Math.ceil((record.lockedUntil - Date.now()) / 1000);
    const err = new Error(`3 incorrect OTP attempts. Please wait ${remainingLockSec}s before trying again.`);
    err.status = 429;
    err.cooldownRemaining = remainingLockSec;
    err.isLocked = true;
    throw err;
  }

  // 2. Check if OTP is expired (1 minute validity)
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    const err = new Error('OTP has expired (valid for 1 minute). Please request a new OTP.');
    err.status = 400;
    throw err;
  }

  // 3. Check OTP match
  if (hashOtp(otp) !== record.otpHash) {
    record.wrongAttempts = (record.wrongAttempts || 0) + 1;
    if (record.wrongAttempts >= 3) {
      record.lockedUntil = Date.now() + OTP_LOCKOUT_SECONDS * 1000;
      record.wrongAttempts = 0; // reset for subsequent round
      const err = new Error(`3 incorrect OTP attempts. Please wait ${OTP_LOCKOUT_SECONDS} seconds before trying again.`);
      err.status = 429;
      err.cooldownRemaining = OTP_LOCKOUT_SECONDS;
      err.isLocked = true;
      throw err;
    } else {
      const remaining = 3 - record.wrongAttempts;
      const err = new Error(`Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before 30s lockout.`);
      err.status = 400;
      err.remainingAttempts = remaining;
      throw err;
    }
  }

  // If correct, reset wrong attempts and lockout
  record.wrongAttempts = 0;
  record.lockedUntil = 0;

  if (consume) {
    otpStore.delete(key);
  }
  return true;
};

// Configure Nodemailer transporter
const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user,
      pass,
    },
  });
};

const sendOtp = async ({ email, name, purpose = 'registration' }) => {
  const toEmail = normalizeEmail(email);
  if (!toEmail) {
    const err = new Error('Email is required to send OTP');
    err.status = 400;
    throw err;
  }

  const key = getStoreKey(toEmail, purpose);
  const remainingCooldown = getRemainingCooldown(key);
  if (remainingCooldown > 0) {
    const err = new Error(`Please wait ${remainingCooldown}s before requesting a new OTP.`);
    err.status = 429;
    err.cooldownRemaining = remainingCooldown;
    throw err;
  }

  // 1. Enforce Daily Limit (Maximum 5 times per day)
  await checkAndIncrementDailyLimit(toEmail);

  // 2. Set OTP parameters: 1 minute expiry
  const otpLength = Number(process.env.MSG91_OTP_LENGTH || 4);
  const otpExpiryMinutes = OTP_EXPIRY_MINUTES; // 1 minute
  const companyName = process.env.MSG91_COMPANY_NAME || 'sahijob.com';

  const otp = generateOtp(otpLength);
  saveOtp(toEmail, otp, otpExpiryMinutes, purpose);

  console.log(`\n========================================`);
  console.log(`⚡ [OTP DISPATCHED] Purpose: ${purpose}`);
  console.log(`Recipient: ${toEmail} | Code: ${otp}`);
  console.log(`Expires in: ${otpExpiryMinutes}m (60s) | Cooldown: ${OTP_COOLDOWN_SECONDS}s`);
  console.log(`========================================\n`);

  const isPasswordReset = purpose.includes('forgot') || purpose.includes('password');
  const subject = isPasswordReset
    ? `${otp} is your password reset OTP for ${companyName}`
    : `${otp} is your verification code for ${companyName}`;

  const html = isPasswordReset
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0d9488; margin-bottom: 8px;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 15px;">Hi ${name || 'there'},</p>
        <p style="color: #475569; font-size: 15px;">We received a request to reset your password for <strong>${companyName}</strong>. Use the OTP code below to continue:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0d9488; padding: 14px 28px; background: #f0fdfa; border: 1px dashed #0d9488; border-radius: 8px; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>1 minute</strong>. If you did not request a password reset, please disregard this message or contact support immediately.</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0d9488; margin-bottom: 8px;">Welcome to ${companyName}!</h2>
        <p style="color: #475569; font-size: 15px;">Hi ${name || 'there'},</p>
        <p style="color: #475569; font-size: 15px;">Please use the verification code below to verify your email address and complete your registration:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0d9488; padding: 14px 28px; background: #f0fdfa; border: 1px dashed #0d9488; border-radius: 8px; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>1 minute</strong>. Please do not share this code with anyone.</p>
      </div>
    `;

  // 1. Try Resend.com API if RESEND_API_KEY is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || `"${companyName}" <onboarding@resend.dev>`;
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: subject,
          html: html,
        }),
        signal: AbortSignal.timeout(7000),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        if (BouncedEmail && (resendRes.status === 422 || resendRes.status === 400)) {
          BouncedEmail.create({ email: toEmail, reason: resendData.message || 'resend_rejected', provider: 'resend' }).catch(() => {});
        }
        throw new Error('Unable to deliver verification code to this email address. Please check your email or try again.');
      }

      return {
        message: 'OTP sent successfully to your email',
        cooldownSeconds: OTP_COOLDOWN_SECONDS,
        expiresInSeconds: 60,
        provider: resendData,
      };
    } catch (resendErr) {
      otpStore.delete(key);
      await rollbackDailyLimit(toEmail);
      const friendlyMsg = resendErr.message.includes('Unable to deliver') 
        ? resendErr.message 
        : 'Unable to deliver verification code to this email address. Please check your email or try again.';
      const err = new Error(friendlyMsg);
      err.status = 400;
      throw err;
    }
  }

  // 2. Try Nodemailer SMTP if configured
  const transporter = getTransporter();
  if (transporter) {
    const mailOptions = {
      from: `"${companyName}" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return {
        message: 'OTP sent successfully to your email',
        cooldownSeconds: OTP_COOLDOWN_SECONDS,
        expiresInSeconds: 60,
        provider: info,
      };
    } catch (error) {
      otpStore.delete(key);
      await rollbackDailyLimit(toEmail);
      if (BouncedEmail && (error.responseCode === 550 || error.responseCode === 553 || String(error.message).includes('Recipient address rejected'))) {
        BouncedEmail.create({ email: toEmail, reason: error.message, provider: 'smtp' }).catch(() => {});
      }
      const err = new Error('Unable to deliver verification code to this email address. Please verify your email.');
      err.status = 400;
      throw err;
    }
  }

  // 3. Dev Fallback: If neither Resend nor SMTP is configured
  console.log(`\n========================================`);
  console.log(`[DEV OTP SERVICE] Purpose: ${purpose}`);
  console.log(`Recipient: ${toEmail} | OTP: ${otp}`);
  console.log(`Expires in: 1 minute (60s) | Max Daily: 5 times`);
  console.log(`========================================\n`);
  return {
    message: 'OTP sent successfully to your email',
    cooldownSeconds: OTP_COOLDOWN_SECONDS,
    expiresInSeconds: 60,
  };
};

const resendOtp = async ({ email, name, purpose = 'registration' }) => {
  return sendOtp({ email, name, purpose });
};

const verifyOtp = async ({ email, otp, purpose = 'registration', consume = true }) => {
  const toEmail = normalizeEmail(email);
  if (!toEmail) {
    const err = new Error('Email is required to verify OTP');
    err.status = 400;
    throw err;
  }
  if (!otp) {
    const err = new Error('OTP is required');
    err.status = 400;
    throw err;
  }
  consumeOtp(toEmail, otp, purpose, consume);
  return { message: 'OTP verified successfully' };
};

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
  getRemainingCooldown: (email, purpose) => getRemainingCooldown(getStoreKey(email, purpose)),
  OTP_COOLDOWN_SECONDS,
  OTP_LOCKOUT_SECONDS,
  MAX_DAILY_OTP_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
};
