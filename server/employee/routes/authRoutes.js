const express = require('express');
const router = express.Router();
const { protectEmployee } = require('../../middleware/authMiddleware');
const {
  registerEmployee,
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

router.post('/register', registerEmployee);
router.post('/login', loginEmployee);
router.post('/login/send-otp', sendLoginOtp);
router.post('/login/resend-otp', resendLoginOtp);
router.post('/login/verify-otp', verifyLoginOtp);
router.post('/google', googleAuth);
router.post('/check-existence', checkExistence);
router.post('/check-mobile', checkMobile);
router.post('/check-mobile-available', checkMobileAvailable);
router.post('/send-otp', sendRegistrationOtp);
router.post('/resend-otp', resendRegistrationOtp);
router.post('/forgot-password/otp', forgotPasswordOtp);
router.post('/forgot-password/resend-otp', resendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);

// Security & Password Management (Protected)
router.get('/security', protectEmployee, getSecurityStatus);
router.post('/set-password', protectEmployee, setPassword);
router.post('/change-password/send-otp', protectEmployee, sendChangePasswordOtp);
router.post('/change-password/resend-otp', protectEmployee, resendChangePasswordOtp);
router.post('/change-password', protectEmployee, changePassword);

module.exports = router;


