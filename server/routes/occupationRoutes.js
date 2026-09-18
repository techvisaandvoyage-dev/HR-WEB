const express = require('express');
const router = express.Router();
const { searchOccupations } = require('../controllers/occupationController');

// Search ESCO Occupations / Job Titles
router.get('/search', searchOccupations);

module.exports = router;
