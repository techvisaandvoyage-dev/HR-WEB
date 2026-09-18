const express = require('express');
const router = express.Router();
const { searchCompanies } = require('../controllers/companyController');

// Search Companies / OpenCorporates
router.get('/search', searchCompanies);

module.exports = router;
