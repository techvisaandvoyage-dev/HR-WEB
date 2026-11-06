const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
  getBlockedAccounts,
  getSecurityEvents,
  updateAccountStatus
} = require('../controllers/adminAccountController');

const router = express.Router();

router.get('/blocked-accounts', adminAuth.strict, getBlockedAccounts);
router.get('/security-events', adminAuth.strict, getSecurityEvents);
router.patch('/users/:role/:id/block', adminAuth.strict, updateAccountStatus);
router.patch('/users/:role/:id/unblock', adminAuth.strict, updateAccountStatus);

module.exports = router;
