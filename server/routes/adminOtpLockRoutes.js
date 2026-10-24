const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
  getLockedUsers,
  unlockUserOtp,
} = require('../controllers/adminOtpLockController');

// All OTP lock admin endpoints are protected with admin authentication
router.use(adminAuth);

// GET /api/admin/otp-locks - List all currently locked users
router.get('/', getLockedUsers);

// PATCH /api/admin/otp-locks/unlock - Manually remove OTP lock for a user
router.patch('/unlock', unlockUserOtp);

module.exports = router;
