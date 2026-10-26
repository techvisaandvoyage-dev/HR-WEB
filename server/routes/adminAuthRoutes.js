const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
  sendAdminOtp,
  resendAdminOtp,
  verifyAdminOtp,
  getAdminSession,
  getAuthorizedAdminEmails,
  getPublicAllowedAdminEmails,
  addAuthorizedAdminEmail,
  removeAuthorizedAdminEmail,
  sendAddAdminOtp,
  resendAddAdminOtp,
} = require('../controllers/adminAuthController');

// Public route to request OTP (strictly validates whitelisted admin emails)
router.post('/send-otp', sendAdminOtp);

// Public route to resend OTP
router.post('/resend-otp', resendAdminOtp);

// Public route to verify OTP and obtain admin token
router.post('/verify-otp', verifyAdminOtp);

// Public route to get allowed emails for login pre-check
router.get('/allowed-emails', getPublicAllowedAdminEmails);

// Protected routes for managing authorized admin emails
router.get('/emails', adminAuth, getAuthorizedAdminEmails);
router.post('/emails/send-otp', adminAuth, sendAddAdminOtp);
router.post('/emails/resend-otp', adminAuth, resendAddAdminOtp);
router.post('/emails', adminAuth, addAuthorizedAdminEmail);
router.delete('/emails', adminAuth, removeAuthorizedAdminEmail);

// Protected route to check active admin session
router.get('/me', adminAuth, getAdminSession);

module.exports = router;
