const jwt = require('jsonwebtoken');
const { sendOtp, resendOtp, verifyOtp } = require('../utils/email');

// STRICT Whitelist of authorized Administrator emails
const ALLOWED_ADMIN_EMAILS = [
  'yashrajsingh28359@gmail.com',
  'gauravajm@gmail.com',
  'merakimovies@gmail.com',
];

/**
 * Returns complete authorized admin email list (combining defaults and any env override)
 */
const getAllowedAdminEmails = () => {
  const envList = (process.env.ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...ALLOWED_ADMIN_EMAILS, ...envList]));
};

/**
 * Helper to check if an email is authorized
 */
const isEmailAuthorized = (email) => {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  return getAllowedAdminEmails().includes(clean);
};

/**
 * @desc    Send OTP to authorized admin email
 * @route   POST /api/admin/auth/send-otp
 * @access  Public (Strictly restricted to Whitelisted Admin Emails)
 */
exports.sendAdminOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your admin email address.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // STRICT WHITELIST CHECK: Reject immediately if not in the 3 allowed admin emails
    if (!isEmailAuthorized(cleanEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This email is not authorized for Admin access.',
      });
    }

    const result = await sendOtp({
      email: cleanEmail,
      name: 'Administrator',
      purpose: 'admin:login',
    });

    return res.status(200).json({
      success: true,
      message: result.message || 'OTP sent successfully to your email address.',
      cooldownSeconds: result.cooldownSeconds || 30,
      expiresInSeconds: result.expiresInSeconds || 120,
    });
  } catch (error) {
    console.error('sendAdminOtp error:', error);
    const status = error.status || (error.message.includes('wait') ? 429 : 400);
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

/**
 * @desc    Resend OTP to authorized admin email
 * @route   POST /api/admin/auth/resend-otp
 * @access  Public (Strictly restricted to Whitelisted Admin Emails)
 */
exports.resendAdminOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your admin email address.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (!isEmailAuthorized(cleanEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This email is not authorized for Admin access.',
      });
    }

    const result = await resendOtp({
      email: cleanEmail,
      name: 'Administrator',
      purpose: 'admin:login',
    });

    return res.status(200).json({
      success: true,
      message: result.message || 'OTP resent successfully.',
      cooldownSeconds: result.cooldownSeconds || 30,
      expiresInSeconds: result.expiresInSeconds || 120,
    });
  } catch (error) {
    console.error('resendAdminOtp error:', error);
    const status = error.status || (error.message.includes('wait') ? 429 : 400);
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to resend OTP. Please try again.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

/**
 * @desc    Verify OTP and generate Admin authentication token
 * @route   POST /api/admin/auth/verify-otp
 * @access  Public (Strictly restricted to Whitelisted Admin Emails)
 */
exports.verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are both required.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (!isEmailAuthorized(cleanEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This email is not authorized for Admin access.',
      });
    }

    await verifyOtp({
      email: cleanEmail,
      otp: String(otp).trim(),
      purpose: 'admin:login',
      consume: true,
    });

    const token = jwt.sign(
      { id: 'admin', email: cleanEmail, role: 'admin' },
      process.env.JWT_SECRET || 'supersecretjwtkey_replace_me_in_production',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      admin: {
        email: cleanEmail,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('verifyAdminOtp error:', error);
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || 'Invalid or expired OTP code. Please check and try again.',
    });
  }
};

/**
 * @desc    Get current admin session details
 * @route   GET /api/admin/auth/me
 * @access  Private (Admin only)
 */
exports.getAdminSession = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin || { role: 'admin' },
  });
};

exports.isEmailAuthorized = isEmailAuthorized;
exports.ALLOWED_ADMIN_EMAILS = ALLOWED_ADMIN_EMAILS;
