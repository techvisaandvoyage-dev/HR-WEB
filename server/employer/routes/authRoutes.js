const express = require('express');
const { register, login, getMe, updateProfile, forgotPasswordOtp, resetPassword } = require('../controllers/authController');
const { protectEmployer } = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password/otp', forgotPasswordOtp);
router.post('/reset-password', resetPassword);

router.get('/me', protectEmployer, getMe);
router.put('/update', protectEmployer, updateProfile);

module.exports = router;
