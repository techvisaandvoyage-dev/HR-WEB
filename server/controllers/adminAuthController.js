const jwt = require('jsonwebtoken');
const { sendOtp, resendOtp, verifyOtp } = require('../utils/email');
const SiteSettings = require('../models/SiteSettings');

// Fallback baseline of authorized Administrator emails
const DEFAULT_ADMIN_EMAILS = [
  'yashrajsingh28359@gmail.com',
  'gauravajm@gmail.com',
  'merakimovies@gmail.com',
];

/**
 * Returns dynamic authorized admin email list from SiteSettings in MongoDB or defaults
 */
const getAllowedAdminEmails = async () => {
  try {
    const settings = await SiteSettings.findOne().select('authorizedAdminEmails');
    if (settings && Array.isArray(settings.authorizedAdminEmails) && settings.authorizedAdminEmails.length > 0) {
      const dbEmails = settings.authorizedAdminEmails
        .map((e) => String(e).trim().toLowerCase())
        .filter(Boolean);
      if (dbEmails.length > 0) {
        return Array.from(new Set(dbEmails));
      }
    }
  } catch (err) {
    console.error('Error fetching authorizedAdminEmails from db:', err);
  }

  const envList = (process.env.ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...envList]));
};

/**
 * Helper to check if an email is authorized
 */
const isEmailAuthorized = async (email) => {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  const allowed = await getAllowedAdminEmails();
  return allowed.includes(clean);
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

    // STRICT WHITELIST CHECK: Reject immediately if not in the authorized admin emails
    const authorized = await isEmailAuthorized(cleanEmail);
    if (!authorized) {
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
    const authorized = await isEmailAuthorized(cleanEmail);

    if (!authorized) {
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
    const authorized = await isEmailAuthorized(cleanEmail);

    if (!authorized) {
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
 * @desc    Get all authorized admin emails
 * @route   GET /api/admin/auth/emails
 * @access  Private (Admin only)
 */
exports.getAuthorizedAdminEmails = async (req, res) => {
  try {
    const emails = await getAllowedAdminEmails();
    return res.status(200).json({
      success: true,
      emails,
    });
  } catch (error) {
    console.error('getAuthorizedAdminEmails error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch authorized admin emails.',
    });
  }
};

/**
 * @desc    Get allowed admin emails for public client pre-check
 * @route   GET /api/admin/auth/allowed-emails
 * @access  Public
 */
exports.getPublicAllowedAdminEmails = async (req, res) => {
  try {
    const emails = await getAllowedAdminEmails();
    return res.status(200).json({
      success: true,
      emails,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      emails: DEFAULT_ADMIN_EMAILS,
    });
  }
};

/**
 * @desc    Send verification OTP to an email before authorizing it as Admin
 * @route   POST /api/admin/auth/emails/send-otp
 * @access  Private (Admin only)
 */
exports.sendAddAdminOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const currentList = await getAllowedAdminEmails();
    if (currentList.includes(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'This email is already in the authorized administrator list.',
      });
    }

    const result = await sendOtp({
      email: cleanEmail,
      name: 'New Administrator',
      purpose: 'admin:add-email',
    });

    return res.status(200).json({
      success: true,
      message: `Verification OTP sent to ${cleanEmail}. Please enter the code to confirm authorization.`,
      cooldownSeconds: result.cooldownSeconds || 30,
      expiresInSeconds: result.expiresInSeconds || 120,
    });
  } catch (error) {
    console.error('sendAddAdminOtp error:', error);
    const status = error.status || (error.message.includes('wait') ? 429 : 400);
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to send verification OTP to this email.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

/**
 * @desc    Resend verification OTP for adding admin email
 * @route   POST /api/admin/auth/emails/resend-otp
 * @access  Private (Admin only)
 */
exports.resendAddAdminOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const result = await resendOtp({
      email: cleanEmail,
      name: 'New Administrator',
      purpose: 'admin:add-email',
    });

    return res.status(200).json({
      success: true,
      message: `Verification OTP resent to ${cleanEmail}.`,
      cooldownSeconds: result.cooldownSeconds || 30,
      expiresInSeconds: result.expiresInSeconds || 120,
    });
  } catch (error) {
    console.error('resendAddAdminOtp error:', error);
    const status = error.status || (error.message.includes('wait') ? 429 : 400);
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to resend OTP.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

/**
 * @desc    Verify OTP and Add a new authorized admin email
 * @route   POST /api/admin/auth/emails
 * @access  Private (Admin only)
 */
exports.addAuthorizedAdminEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Verification OTP is required to authorize this email as Administrator.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Verify the OTP code sent to this email address
    await verifyOtp({
      email: cleanEmail,
      otp: String(otp).trim(),
      purpose: 'admin:add-email',
      consume: true,
    });

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({
        authorizedAdminEmails: DEFAULT_ADMIN_EMAILS,
      });
    }

    let currentList =
      Array.isArray(settings.authorizedAdminEmails) && settings.authorizedAdminEmails.length > 0
        ? settings.authorizedAdminEmails.map((e) => e.trim().toLowerCase())
        : [...DEFAULT_ADMIN_EMAILS];

    if (currentList.includes(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'This email is already in the authorized administrator list.',
      });
    }

    currentList.push(cleanEmail);
    settings.authorizedAdminEmails = Array.from(new Set(currentList));
    await settings.save();

    return res.status(200).json({
      success: true,
      message: `${cleanEmail} verified and successfully added to authorized administrators.`,
      emails: settings.authorizedAdminEmails,
    });
  } catch (error) {
    console.error('addAuthorizedAdminEmail error:', error);
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || 'Invalid or expired OTP code. Failed to authorize admin email.',
    });
  }
};

/**
 * @desc    Remove an authorized admin email
 * @route   DELETE /api/admin/auth/emails
 * @access  Private (Admin only)
 */
exports.removeAuthorizedAdminEmail = async (req, res) => {
  try {
    const emailToRemove = req.body?.email || req.query?.email;
    if (!emailToRemove) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the email to remove.',
      });
    }

    const cleanEmail = String(emailToRemove).trim().toLowerCase();

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({
        authorizedAdminEmails: DEFAULT_ADMIN_EMAILS,
      });
    }

    let currentList =
      Array.isArray(settings.authorizedAdminEmails) && settings.authorizedAdminEmails.length > 0
        ? settings.authorizedAdminEmails.map((e) => e.trim().toLowerCase())
        : [...DEFAULT_ADMIN_EMAILS];

    if (!currentList.includes(cleanEmail)) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in the authorized list.',
      });
    }

    if (currentList.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last remaining administrator email. At least one admin must exist.',
      });
    }

    currentList = currentList.filter((e) => e !== cleanEmail);
    settings.authorizedAdminEmails = currentList;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: `${cleanEmail} has been removed from authorized administrators.`,
      emails: settings.authorizedAdminEmails,
    });
  } catch (error) {
    console.error('removeAuthorizedAdminEmail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove authorized admin email.',
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
exports.getAllowedAdminEmails = getAllowedAdminEmails;
