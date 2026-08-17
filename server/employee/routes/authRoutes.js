const express = require('express');
const router = express.Router();
const { registerEmployee, loginEmployee, googleAuth, checkMobile, forgotPasswordOtp, resetPassword } = require('../controllers/authController');

router.post('/register', registerEmployee);
router.post('/login', loginEmployee);
router.post('/google', googleAuth);
router.post('/check-mobile', checkMobile);
router.post('/forgot-password/otp', forgotPasswordOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
