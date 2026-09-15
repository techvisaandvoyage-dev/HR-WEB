const nodemailer = require('nodemailer');
const crypto = require('crypto');

const otpStore = new Map(); // key (purpose:email) -> { otp, expiresAt, lastSentAt, resendCount }

const OTP_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN || 30);

const generateOtp = (length = 4) => {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getStoreKey = (email, purpose = 'registration') => {
  return `${purpose}:${normalizeEmail(email)}`;
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

const saveOtp = (email, otp, expiryMinutes, purpose = 'registration') => {
  const key = getStoreKey(email, purpose);
  const existing = otpStore.get(key);
  otpStore.set(key, {
    otp: String(otp),
    expiresAt: Date.now() + expiryMinutes * 60 * 1000,
    lastSentAt: Date.now(),
    resendCount: existing ? (existing.resendCount || 0) + 1 : 0,
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
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    const err = new Error('OTP has expired. Please request a new OTP.');
    err.status = 400;
    throw err;
  }
  if (String(otp).trim() !== record.otp) {
    const err = new Error('Invalid OTP. Please try again.');
    err.status = 400;
    throw err;
  }

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
    // Return null if not configured
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

  const otpLength = Number(process.env.MSG91_OTP_LENGTH || 4);
  const otpExpiryMinutes = Number(process.env.MSG91_OTP_EXPIRY || 5);
  const companyName = process.env.MSG91_COMPANY_NAME || 'sahijob.com';

  const otp = generateOtp(otpLength);
  saveOtp(toEmail, otp, otpExpiryMinutes, purpose);

  console.log(`\n========================================`);
  console.log(`⚡ [OTP DISPATCHED] Purpose: ${purpose}`);
  console.log(`Recipient: ${toEmail} | Code: ${otp}`);
  console.log(`Expires in: ${otpExpiryMinutes}m | Cooldown: ${OTP_COOLDOWN_SECONDS}s`);
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
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>${otpExpiryMinutes} minutes</strong>. If you did not request a password reset, please disregard this message or contact support immediately.</p>
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
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>${otpExpiryMinutes} minutes</strong>. Please do not share this code with anyone.</p>
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
        throw new Error(resendData.message || resendData.error || 'Failed to send email via Resend');
      }

      return {
        message: 'OTP sent successfully to your email',
        cooldownSeconds: OTP_COOLDOWN_SECONDS,
        provider: resendData,
      };
    } catch (resendErr) {
      otpStore.delete(key);
      const err = new Error('Failed to send OTP via Resend: ' + resendErr.message);
      err.status = 500;
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
        provider: info,
      };
    } catch (error) {
      otpStore.delete(key);
      const err = new Error('Failed to send OTP email: ' + error.message);
      err.status = 500;
      throw err;
    }
  }

  // 3. Dev Fallback: If neither Resend nor SMTP is configured
  console.log(`\n========================================`);
  console.log(`[DEV OTP SERVICE] Purpose: ${purpose}`);
  console.log(`Recipient: ${toEmail} | OTP: ${otp}`);
  console.log(`Expires in: ${otpExpiryMinutes} minutes`);
  console.log(`========================================\n`);
  return {
    message: 'OTP sent successfully to your email',
    cooldownSeconds: OTP_COOLDOWN_SECONDS,
    expiresInMinutes: otpExpiryMinutes,
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
};
