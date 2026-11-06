const express = require('express');
const router = express.Router();
const { protectEmployee } = require('../../middleware/authMiddleware');
const { ipAuthRateLimiter } = require('../../middleware/rateLimiters');
const {
  registerEmployee,
  quickRegisterCandidate,
  loginEmployee,
  sendLoginOtp,
  resendLoginOtp,
  verifyLoginOtp,
  googleAuth,
  checkExistence,
  checkMobile,
  checkMobileAvailable,
  sendRegistrationOtp,
  resendRegistrationOtp,
  forgotPasswordOtp,
  resendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  getSecurityStatus,
  setPassword,
  sendChangePasswordOtp,
  resendChangePasswordOtp,
  changePassword
} = require('../controllers/authController');

router.post('/register', ipAuthRateLimiter, registerEmployee);
router.post('/quick-register', ipAuthRateLimiter, quickRegisterCandidate);
router.post('/login', ipAuthRateLimiter, loginEmployee);
router.post('/login/send-otp', ipAuthRateLimiter, sendLoginOtp);
router.post('/login/resend-otp', ipAuthRateLimiter, resendLoginOtp);
router.post('/login/verify-otp', ipAuthRateLimiter, verifyLoginOtp);
router.post('/google', ipAuthRateLimiter, googleAuth);
router.post('/check-existence', checkExistence);
router.post('/check-mobile', checkMobile);
router.post('/check-mobile-available', checkMobileAvailable);
router.post('/send-otp', ipAuthRateLimiter, sendRegistrationOtp);
router.post('/resend-otp', ipAuthRateLimiter, resendRegistrationOtp);
router.post('/forgot-password/otp', ipAuthRateLimiter, forgotPasswordOtp);
router.post('/forgot-password/resend-otp', ipAuthRateLimiter, resendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', ipAuthRateLimiter, verifyForgotPasswordOtp);
router.post('/reset-password', ipAuthRateLimiter, resetPassword);

// Security & Password Management (Protected)
router.get('/security', protectEmployee, getSecurityStatus);
router.post('/set-password', protectEmployee, setPassword);
router.post('/change-password/send-otp', protectEmployee, sendChangePasswordOtp);
router.post('/change-password/resend-otp', protectEmployee, resendChangePasswordOtp);
router.post('/change-password', protectEmployee, changePassword);

module.exports = router;
