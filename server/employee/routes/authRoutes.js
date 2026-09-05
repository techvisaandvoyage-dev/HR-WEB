const express = require('express');
const router = express.Router();
const {
  registerEmployee,
  loginEmployee,
  googleAuth,
  checkExistence,
  sendRegistrationOtp,
  resendRegistrationOtp,
  forgotPasswordOtp,
  resetPassword
} = require('../controllers/authController');

router.post('/register', registerEmployee);
router.post('/login', loginEmployee);
router.post('/google', googleAuth);
router.post('/check-existence', checkExistence);
router.post('/send-otp', sendRegistrationOtp);
router.post('/resend-otp', resendRegistrationOtp);
router.post('/forgot-password/otp', forgotPasswordOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
