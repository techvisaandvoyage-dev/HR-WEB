const express = require('express');
const { register, login, getMe, updateProfile, forgotPasswordOtp, resetPassword, checkMobile, checkEmail, googleAuth } = require('../controllers/authController');
const { protectEmployer } = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/check-mobile', checkMobile);
router.post('/check-email', checkEmail);
router.post('/forgot-password/otp', forgotPasswordOtp);
router.post('/reset-password', resetPassword);

router.get('/me', protectEmployer, getMe);
router.put('/update', protectEmployer, updateProfile);

module.exports = router;
