const express = require('express');
const router = express.Router();
const optionalAuth = require('../middleware/optionalAuth');
const {
  getPublicProblems,
  createSupportRequest,
  updateUserPhone,
  getMySupportRequests,
  getPublicRequestMessages,
  submitUserFollowUp,
  getPublicQuickReplies,
} = require('../controllers/supportController');

// Public route to fetch active problems
router.get('/problems', getPublicProblems);

// Public route to fetch active quick follow-up replies
router.get('/quick-replies', getPublicQuickReplies);

// Public route (with optional token verification) to submit support requests
router.post('/requests', optionalAuth, createSupportRequest);

// Update user phone number (logged-in user across Employee, Employer, Consultant)
router.post('/update-phone', optionalAuth, updateUserPhone);

// Get all support requests for current user (list view for Updates & chat)
router.get('/my-requests', optionalAuth, getMySupportRequests);

// Public route to view status & messages for a submitted request
router.get('/requests/:id/messages', getPublicRequestMessages);

// Public route for user to reply using predefined selected options
router.post('/requests/:id/followup', submitUserFollowUp);

module.exports = router;
