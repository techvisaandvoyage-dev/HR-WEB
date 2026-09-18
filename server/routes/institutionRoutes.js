const express = require('express');
const router = express.Router();
const { searchInstitutions, getInstitutionById } = require('../controllers/institutionController');

// Search Master Institutions
router.get('/search', searchInstitutions);

// Get Institution by ID
router.get('/:id', getInstitutionById);

module.exports = router;
