const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
  sendAdminOtp,
  resendAdminOtp,
  verifyAdminOtp,
  getAdminSession,
} = require('../controllers/adminAuthController');

// Public route to request OTP (strictly validates whitelisted admin emails)
router.post('/send-otp', sendAdminOtp);

// Public route to resend OTP
router.post('/resend-otp', resendAdminOtp);

// Public route to verify OTP and obtain admin token
router.post('/verify-otp', verifyAdminOtp);

// Protected route to check active admin session
router.get('/me', adminAuth, getAdminSession);

module.exports = router;
