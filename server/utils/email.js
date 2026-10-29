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

let mongoose;
try {
  mongoose = require('mongoose');
} catch (_) {}

const isDbConnected = () => Boolean(mongoose && mongoose.connection && mongoose.connection.readyState === 1);

// key (purpose:email) -> { otpHash, expiresAt, lastSentAt, resendCount }
const otpStore = new Map();

// Daily in-memory count fallback: email:YYYY-MM-DD -> count
const dailyCountStore = new Map();

// In-memory lockout store: cleanEmail -> { failedAttempts, lockUntil }
const lockStore = new Map();

const OTP_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN || 30);
const MAX_DAILY_OTP_ATTEMPTS = 5;
const MAX_FAILED_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 24 * 60 * 60 * 1000; // 24 hours lock
const OTP_LOCKOUT_SECONDS = 24 * 60 * 60; // 24 hours in seconds
const OTP_EXPIRY_MINUTES = 2; // OTP is valid for exactly 2 minutes

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

const formatLockUntil = (date) => {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' IST';
};

const getRoleFromPurpose = (purpose = '') => {
  const p = String(purpose).toLowerCase();
  if (p.includes('admin')) return 'admin';
  if (p.includes('employee')) return 'employee';
  if (p.includes('consultant')) return 'consultant';
  if (p.includes('employer')) return 'employer';
  return 'general';
};

const getRoleField = (role, type) => {
  // type: 'FailedAttempts' | 'LockUntil'
  if (role === 'employee' || role === 'employer' || role === 'consultant' || role === 'admin') {
    return `${role}${type}`;
  }
  return type.charAt(0).toLowerCase() + type.slice(1);
};

const getMaxFailedAttempts = (role) => {
  if (role === 'admin') return 3; // Exactly 3 wrong OTP attempts for Admin before 24h lockout
  return MAX_FAILED_OTP_ATTEMPTS; // 5 for others
};

const checkUserLockout = async (email, purpose = '') => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return;

  const role = getRoleFromPurpose(purpose);
  const lockKey = `${role}:${cleanEmail}`;
  const lockUntilField = getRoleField(role, 'LockUntil');
  const failedAttemptsField = getRoleField(role, 'FailedAttempts');

  const now = Date.now();
  let lockUntil = null;

  // 1. Check in-memory store for this role
  const mem = lockStore.get(lockKey);
  if (mem && mem.lockUntil) {
    lockUntil = new Date(mem.lockUntil);
  }

  // 2. Check DB OtpTracker for this role
  if (OtpTracker && isDbConnected()) {
    try {
      const dbRecord = await OtpTracker.findOne({
        email: cleanEmail,
        [lockUntilField]: { $gt: new Date(now) },
      }).sort({ [lockUntilField]: -1 });

      if (dbRecord && dbRecord[lockUntilField]) {
        lockUntil = dbRecord[lockUntilField];
        lockStore.set(lockKey, {
          failedAttempts: dbRecord[failedAttemptsField] || getMaxFailedAttempts(role),
          lockUntil: new Date(lockUntil).getTime(),
        });
      }
    } catch (dbErr) {
      console.warn('[OtpTracker] Lock check error:', dbErr.message);
    }
  }

  if (lockUntil && new Date(lockUntil).getTime() > now) {
    const lockTimeStr = formatLockUntil(lockUntil);
    const action = String(purpose).toLowerCase().includes('login') ? 'login' : 'verification';
    const rolePrefix = role === 'admin' ? 'Admin ' : '';
    const extraHint = action === 'login' && role !== 'admin' ? ' Continue with Google or login with password instead.' : '';
    const err = new Error(`Too many failed attempts. ${rolePrefix}OTP ${action} is locked for 24 hours. Try again after ${lockTimeStr}.${extraHint}`);
    err.status = 429;
    err.isLocked = true;
    err.lockUntil = lockUntil;
    err.remainingAttempts = 0;
    err.role = role;
    throw err;
  }

  // Auto-unlock and reset counter on next attempt after lockUntil has passed
  if (lockUntil && new Date(lockUntil).getTime() <= now) {
    await resetFailedAttempts(cleanEmail, purpose);
  }
};

const recordFailedAttempt = async (email, purpose = '') => {
  const cleanEmail = normalizeEmail(email);
  const role = getRoleFromPurpose(purpose);
  const lockKey = `${role}:${cleanEmail}`;
  const failedAttemptsField = getRoleField(role, 'FailedAttempts');
  const lockUntilField = getRoleField(role, 'LockUntil');

  const now = Date.now();
  const dateStr = getTodayDateStr();

  let failedAttempts = 0;
  const mem = lockStore.get(lockKey);
  if (mem && typeof mem.failedAttempts === 'number') {
    failedAttempts = mem.failedAttempts;
  } else if (OtpTracker && isDbConnected()) {
    try {
      const tracker = await OtpTracker.findOne({ email: cleanEmail, date: dateStr });
      if (tracker && typeof tracker[failedAttemptsField] === 'number') {
        failedAttempts = tracker[failedAttemptsField];
      }
    } catch (_) {}
  }

  const maxAttempts = getMaxFailedAttempts(role);
  failedAttempts += 1;

  if (failedAttempts >= maxAttempts) {
    const lockUntil = new Date(now + OTP_LOCKOUT_MS);
    lockStore.set(lockKey, {
      failedAttempts,
      lockUntil: lockUntil.getTime(),
    });

    if (OtpTracker && isDbConnected()) {
      try {
        await OtpTracker.findOneAndUpdate(
          { email: cleanEmail, date: dateStr },
          { $set: { [failedAttemptsField]: failedAttempts, [lockUntilField]: lockUntil } },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (dbErr) {
        console.warn('[OtpTracker] Lock update error:', dbErr.message);
      }
    }

    const lockTimeStr = formatLockUntil(lockUntil);
    const action = String(purpose).toLowerCase().includes('login') ? 'login' : 'verification';
    const rolePrefix = role === 'admin' ? 'Admin ' : '';
    const extraHint = action === 'login' && role !== 'admin' ? ' Continue with Google or login with password instead.' : '';
    const err = new Error(`Too many failed attempts. ${rolePrefix}OTP ${action} is locked for 24 hours. Try again after ${lockTimeStr}.${extraHint}`);
    err.status = 429;
    err.isLocked = true;
    err.lockUntil = lockUntil;
    err.remainingAttempts = 0;
    err.role = role;
    throw err;
  } else {
    lockStore.set(lockKey, {
      failedAttempts,
      lockUntil: null,
    });

    if (OtpTracker && isDbConnected()) {
      try {
        await OtpTracker.findOneAndUpdate(
          { email: cleanEmail, date: dateStr },
          { $set: { [failedAttemptsField]: failedAttempts } },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (dbErr) {
        console.warn('[OtpTracker] Failed attempt increment error:', dbErr.message);
      }
    }

    const remaining = maxAttempts - failedAttempts;
    const err = new Error(`Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before 24-hour lockout.`);
    err.status = 400;
    err.remainingAttempts = remaining;
    err.role = role;
    throw err;
  }
};

const resetFailedAttempts = async (email, purpose = '') => {
  const cleanEmail = normalizeEmail(email);
  const role = getRoleFromPurpose(purpose);
  const lockKey = `${role}:${cleanEmail}`;
  const failedAttemptsField = getRoleField(role, 'FailedAttempts');
  const lockUntilField = getRoleField(role, 'LockUntil');

  lockStore.delete(lockKey);

  if (OtpTracker && isDbConnected()) {
    try {
      await OtpTracker.updateMany(
        { email: cleanEmail },
        { $set: { [failedAttemptsField]: 0, [lockUntilField]: null } }
      );
    } catch (dbErr) {
      console.warn('[OtpTracker] Reset lock error:', dbErr.message);
    }
  }
};

const adminUnlockUser = async (email, role = '') => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return false;

  const rolesToClear = role && role !== 'all' ? [role] : ['employee', 'employer', 'consultant', 'admin', 'general'];

  // 1. Clear in-memory lockStore
  for (const r of rolesToClear) {
    lockStore.delete(`${r}:${cleanEmail}`);
  }
  lockStore.delete(cleanEmail);

  // 2. Clear any pending blocked OTP records in otpStore
  for (const [key] of otpStore.entries()) {
    if (key.includes(cleanEmail)) {
      otpStore.delete(key);
    }
  }

  // 3. Also reset in-memory daily count so user can immediately send OTP
  const dateStr = getTodayDateStr();
  const memKey = `${cleanEmail}:${dateStr}`;
  dailyCountStore.delete(memKey);

  // 4. Clear in MongoDB OtpTracker — reset both lock fields AND daily sendCount
  if (OtpTracker && isDbConnected()) {
    try {
      const updateObj = {
        sendCount: 0,        // reset daily send limit so user can request OTP immediately
        failedAttempts: 0,
        lockUntil: null,
      };
      for (const r of rolesToClear) {
        const failedAttemptsField = getRoleField(r, 'FailedAttempts');
        const lockUntilField = getRoleField(r, 'LockUntil');
        updateObj[failedAttemptsField] = 0;
        updateObj[lockUntilField] = null;
      }
      await OtpTracker.updateMany(
        { email: cleanEmail },
        { $set: updateObj }
      );
    } catch (dbErr) {
      console.warn('[OtpTracker] Admin unlock error:', dbErr.message);
    }
  }
  return true;
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

  if (OtpTracker && isDbConnected()) {
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

  if (OtpTracker && isDbConnected()) {
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

  if (OtpTracker && isDbConnected()) {
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
  });
};

const consumeOtp = async (email, otp, purpose = 'registration', consume = true) => {
  const cleanEmail = normalizeEmail(email);
  const key = getStoreKey(cleanEmail, purpose);

  // 1. Check if user is locked out (24 hours after failed attempts)
  await checkUserLockout(cleanEmail, purpose);

  const record = otpStore.get(key);

  if (!record) {
    const err = new Error('OTP not found. Please request a new OTP.');
    err.status = 400;
    throw err;
  }

  // 2. Check if OTP is expired (exactly 2 minutes validity)
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    const err = new Error('OTP has expired. Please request a new one.');
    err.status = 400;
    throw err;
  }

  // 3. Check OTP match
  if (hashOtp(otp) !== record.otpHash) {
    await recordFailedAttempt(cleanEmail, purpose);
  }

  // If correct, reset failed attempts
  await resetFailedAttempts(cleanEmail, purpose);

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

  const isAdmin = purpose && String(purpose).toLowerCase().includes('admin');

  // 1. Check 24-hour lockout before sending OTP
  await checkUserLockout(toEmail, purpose);

  const key = getStoreKey(toEmail, purpose);
  const remainingCooldown = getRemainingCooldown(key);
  if (remainingCooldown > 0) {
    const err = new Error(`Please wait ${remainingCooldown}s before requesting a new OTP.`);
    err.status = 429;
    err.cooldownRemaining = remainingCooldown;
    throw err;
  }

  // 2. Enforce Daily Limit (Maximum 5 times per day) - Skip for Admin
  if (!isAdmin) {
    await checkAndIncrementDailyLimit(toEmail);
  }

  // 3. Set OTP parameters: 2 minutes expiry
  const otpLength = Number(process.env.MSG91_OTP_LENGTH || 4);
  const otpExpiryMinutes = OTP_EXPIRY_MINUTES; // 2 minutes
  const companyName = process.env.MSG91_COMPANY_NAME || 'sahijob.com';

  const otp = generateOtp(otpLength);
  saveOtp(toEmail, otp, otpExpiryMinutes, purpose);

  console.log(`\n========================================`);
  console.log(`⚡ [OTP DISPATCHED] Purpose: ${purpose}`);
  console.log(`Recipient: ${toEmail} | Code: ${otp}`);
  console.log(`Expires in: ${otpExpiryMinutes}m (120s) | Cooldown: ${OTP_COOLDOWN_SECONDS}s`);
  console.log(`========================================\n`);

  const isAdminAddEmail = purpose === 'admin:add-email';
  const isAdminLogin = purpose.includes('admin') && !isAdminAddEmail;
  const isPasswordReset = purpose.includes('forgot') || purpose.includes('password');
  const subject = isAdminAddEmail
    ? `${otp} is your Admin Authorization verification code for ${companyName}`
    : isAdminLogin
    ? `${otp} is your Admin Portal login code for ${companyName}`
    : isPasswordReset
    ? `${otp} is your password reset OTP for ${companyName}`
    : `${otp} is your verification code for ${companyName}`;

  const html = isAdminAddEmail
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #d1fae5; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 16px;">
          <h2 style="color: #065f46; margin: 0;">🛡️ New Administrator Verification</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Authorized Management Access Setup</p>
        </div>
        <p style="color: #334155; font-size: 15px;">Hello,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">A request was made to authorize <strong>${toEmail}</strong> as an Administrator on <strong>${companyName}</strong>. Use the one-time verification code below to confirm this authorization:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #065f46; padding: 14px 28px; background: #ecfdf5; border: 1.5px dashed #059669; border-radius: 10px; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This code is strictly confidential and expires in <strong>2 minutes</strong>. If you did not request this authorization, you may safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} ${companyName}. Secure Admin Access Protocol.</p>
      </div>
    `
    : isAdminLogin
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #d1fae5; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 16px;">
          <h2 style="color: #065f46; margin: 0;">🛡️ Admin Portal Authentication</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Authorized Management Access Verification</p>
        </div>
        <p style="color: #334155; font-size: 15px;">Hello Administrator,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">A login request was initiated for the <strong>${companyName} Admin Portal</strong>. Please use the one-time verification code below to complete your sign-in:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #065f46; padding: 14px 28px; background: #ecfdf5; border: 1.5px dashed #059669; border-radius: 10px; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This code is strictly confidential and expires in <strong>2 minutes</strong>. If you did not initiate this login request, please investigate your account security immediately.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} ${companyName}. Secure Admin Access Protocol.</p>
      </div>
    `
    : isPasswordReset
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0d9488; margin-bottom: 8px;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 15px;">Hi ${name || 'there'},</p>
        <p style="color: #475569; font-size: 15px;">We received a request to reset your password for <strong>${companyName}</strong>. Use the OTP code below to continue:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0d9488; padding: 14px 28px; background: #f0fdfa; border: 1px dashed #0d9488; border-radius: 8px; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>2 minutes</strong>. If you did not request a password reset, please disregard this message or contact support immediately.</p>
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
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>2 minutes</strong>. Please do not share this code with anyone.</p>
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
        expiresInSeconds: 120,
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
        expiresInSeconds: 120,
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
  console.log(`Expires in: 2 minutes (120s) | Max Daily: 5 times`);
  console.log(`========================================\n`);
  return {
    message: 'OTP sent successfully to your email',
    cooldownSeconds: OTP_COOLDOWN_SECONDS,
    expiresInSeconds: 120,
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
  await consumeOtp(toEmail, otp, purpose, consume);
  return { message: 'OTP verified successfully' };
};

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
  checkUserLockout,
  adminUnlockUser,
  getRemainingCooldown: (email, purpose) => getRemainingCooldown(getStoreKey(email, purpose)),
  OTP_COOLDOWN_SECONDS,
  OTP_LOCKOUT_SECONDS,
  MAX_DAILY_OTP_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
};
