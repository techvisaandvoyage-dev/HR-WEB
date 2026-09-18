const express = require('express');
const router = express.Router();
const { searchInstitutions, getMeta } = require('../controllers/educationController');

// Search institutions across K-12 and Postsecondary globally
router.get('/search', searchInstitutions);

// Get directory metadata
router.get('/meta', getMeta);

module.exports = router;
