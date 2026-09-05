const crypto = require('crypto');

const otpStore = new Map(); // email -> { otp, expiresAt }

const getConfig = () => {
  const authkey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const domain = process.env.MSG91_DOMAIN;
  const fromEmail = process.env.MSG91_FROM_EMAIL;
  const fromName = process.env.MSG91_FROM_NAME || 'Meraki HR';
  const companyName = process.env.MSG91_COMPANY_NAME || 'Meraki HR';
  const otpLength = Number(process.env.MSG91_OTP_LENGTH || 4);
  const otpExpiryMinutes = Number(process.env.MSG91_OTP_EXPIRY || 5);

  if (!authkey || !templateId) {
    throw new Error('MSG91_AUTH_KEY and MSG91_TEMPLATE_ID must be set in .env');
  }
  if (!domain || !fromEmail) {
    throw new Error('MSG91_DOMAIN and MSG91_FROM_EMAIL must be set in .env');
  }

  return {
    authkey,
    templateId,
    domain,
    fromEmail,
    fromName,
    companyName,
    otpLength,
    otpExpiryMinutes,
  };
};

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

const parseMsg91Response = async (response) => {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text || 'Invalid response from MSG91' };
  }
  return { ok: response.ok, status: response.status, data };
};

/**
 * Send email OTP using MSG91 Email API (template_id like for_otp_2).
 * This is NOT the SMS/OTP SendOTP API — email templates use /email/send.
 */
const sendOtp = async ({ email, name }) => {
  const config = getConfig();
  const toEmail = normalizeEmail(email);

  if (!toEmail) throw new Error('Email is required to send OTP');

  const otp = generateOtp(config.otpLength);
  saveOtp(toEmail, otp, config.otpExpiryMinutes);

  const payload = {
    recipients: [
      {
        to: [
          {
            name: name || toEmail.split('@')[0],
            email: toEmail,
          },
        ],
        variables: {
          otp: otp,
          company_name: config.companyName,
        },
      },
    ],
    from: {
      email: config.fromEmail,
    },
    domain: config.domain,
    template_id: config.templateId,
  };

  const response = await fetch('https://control.msg91.com/api/v5/email/send', {
    method: 'POST',
    headers: {
      authkey: config.authkey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const { data } = await parseMsg91Response(response);
  const success =
    data.type === 'success' ||
    data.status === 'success' ||
    Boolean(data.data) ||
    response.ok;

  if (!success) {
    otpStore.delete(toEmail);
    const err = new Error(data.message || data.error || 'Failed to send OTP email');
    err.msg91 = data;
    throw err;
  }

  return { message: 'OTP sent successfully to your email', provider: data };
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
