const express = require('express');
const router = express.Router();
const optionalAuth = require('../middleware/optionalAuth');
const {
  getPublicProblems,
  createSupportRequest,
} = require('../controllers/supportController');

// Public route to fetch active problems
router.get('/problems', getPublicProblems);

// Public route (with optional token verification) to submit support requests
router.post('/requests', optionalAuth, createSupportRequest);

module.exports = router;
