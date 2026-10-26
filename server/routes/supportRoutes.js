const express = require('express');
const router = express.Router();
const optionalAuth = require('../middleware/optionalAuth');
const {
  getPublicProblems,
  createSupportRequest,
  getPublicRequestMessages,
  submitUserFollowUp,
} = require('../controllers/supportController');

// Public route to fetch active problems
router.get('/problems', getPublicProblems);

// Public route (with optional token verification) to submit support requests
router.post('/requests', optionalAuth, createSupportRequest);

// Public route to view status & messages for a submitted request
router.get('/requests/:id/messages', getPublicRequestMessages);

// Public route for user to reply using predefined selected options
router.post('/requests/:id/followup', submitUserFollowUp);

module.exports = router;
