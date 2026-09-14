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
  checkEmail,
  googleAuth
} = require('../controllers/authController');
const { protectEmployer } = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login/send-otp', sendLoginOtp);
router.post('/login/resend-otp', resendLoginOtp);
router.post('/login/verify-otp', verifyLoginOtp);
router.post('/google', googleAuth);
router.post('/check-mobile', checkMobile);
router.post('/check-email', checkEmail);
router.post('/send-otp', sendRegistrationOtp);
router.post('/resend-otp', resendRegistrationOtp);
router.post('/verify-otp', verifyRegistrationOtp);
router.post('/forgot-password/otp', forgotPasswordOtp);
router.post('/forgot-password/resend-otp', resendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);

router.get('/me', protectEmployer, getMe);
router.put('/update', protectEmployer, updateProfile);

module.exports = router;

