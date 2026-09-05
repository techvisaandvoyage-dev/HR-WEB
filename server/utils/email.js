const nodemailer = require('nodemailer');
const crypto = require('crypto');

const otpStore = new Map(); // email -> { otp, expiresAt }

const generateOtp = (length = 4) => {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const saveOtp = (email, otp, expiryMinutes) => {
  const key = normalizeEmail(email);
  otpStore.set(key, {
    otp: String(otp),
    expiresAt: Date.now() + expiryMinutes * 60 * 1000,
  });
};

const consumeOtp = (email, otp) => {
  const key = normalizeEmail(email);
  const record = otpStore.get(key);

  if (!record) {
    throw new Error('OTP not found. Please request a new OTP.');
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    throw new Error('OTP expired. Please request a new OTP.');
  }
  if (String(otp) !== record.otp) {
    throw new Error('Invalid OTP. Please try again.');
  }

  otpStore.delete(key);
  return true;
};

// Configure Nodemailer transporter
const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS must be set in .env');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });
};

const sendOtp = async ({ email, name }) => {
  const toEmail = normalizeEmail(email);
  if (!toEmail) throw new Error('Email is required to send OTP');

  const otpLength = Number(process.env.MSG91_OTP_LENGTH || 4);
  const otpExpiryMinutes = Number(process.env.MSG91_OTP_EXPIRY || 5);
  const companyName = process.env.MSG91_COMPANY_NAME || 'HR Website';

  const otp = generateOtp(otpLength);
  saveOtp(toEmail, otp, otpExpiryMinutes);

  const transporter = getTransporter();

  const mailOptions = {
    from: `"${companyName}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${otp} is your verification code for ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Welcome to ${companyName}!</h2>
        <p style="color: #555; font-size: 16px;">Hi ${name || 'there'},</p>
        <p style="color: #555; font-size: 16px;">Please use the following OTP to verify your email address. This OTP is valid for ${otpExpiryMinutes} minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a73e8; padding: 15px 30px; background: #f0f4f8; border-radius: 5px;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { message: 'OTP sent successfully to your email', provider: info };
  } catch (error) {
    otpStore.delete(toEmail);
    throw new Error('Failed to send OTP email: ' + error.message);
  }
};

const verifyOtp = async ({ email, otp }) => {
  if (!email) throw new Error('Email is required to verify OTP');
  if (!otp) throw new Error('OTP is required');
  consumeOtp(email, otp);
  return { message: 'OTP verified successfully' };
};

const resendOtp = async ({ email, name }) => {
  return sendOtp({ email, name });
};

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
};
