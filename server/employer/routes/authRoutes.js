const express = require('express');
const {
  register,
  login,
  sendLoginOtp,
  resendLoginOtp,
  verifyLoginOtp,
  getMe,
  updateProfile,
  sendRegistrationOtp,
  resendRegistrationOtp,
  verifyRegistrationOtp,
  forgotPasswordOtp,
  resendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  checkMobile,
  checkMobileAvailable,
  checkEmail,
  googleAuth,
  getSecurityStatus,
  setPassword,
  sendChangePasswordOtp,
  resendChangePasswordOtp,
  changePassword
} = require('../controllers/authController');
const { protectEmployer } = require('../../middleware/authMiddleware');
const { ipAuthRateLimiter } = require('../../middleware/rateLimiters');

const router = express.Router();

router.post('/register', ipAuthRateLimiter, register);
router.post('/login', ipAuthRateLimiter, login);
router.post('/login/send-otp', ipAuthRateLimiter, sendLoginOtp);
router.post('/login/resend-otp', ipAuthRateLimiter, resendLoginOtp);
router.post('/login/verify-otp', ipAuthRateLimiter, verifyLoginOtp);
router.post('/google', ipAuthRateLimiter, googleAuth);
router.post('/check-mobile', checkMobile);
router.post('/check-mobile-available', checkMobileAvailable);
router.post('/check-email', checkEmail);
router.post('/send-otp', ipAuthRateLimiter, sendRegistrationOtp);
router.post('/resend-otp', ipAuthRateLimiter, resendRegistrationOtp);
router.post('/verify-otp', ipAuthRateLimiter, verifyRegistrationOtp);
router.post('/forgot-password/otp', ipAuthRateLimiter, forgotPasswordOtp);
router.post('/forgot-password/resend-otp', ipAuthRateLimiter, resendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', ipAuthRateLimiter, verifyForgotPasswordOtp);
router.post('/reset-password', ipAuthRateLimiter, resetPassword);

router.get('/me', protectEmployer, getMe);
router.put('/update', protectEmployer, updateProfile);

// Security & Password Management (Protected)
router.get('/security', protectEmployer, getSecurityStatus);
router.post('/set-password', protectEmployer, setPassword);
router.post('/change-password/send-otp', protectEmployer, sendChangePasswordOtp);
router.post('/change-password/resend-otp', protectEmployer, resendChangePasswordOtp);
router.post('/change-password', protectEmployer, changePassword);

module.exports = router;
