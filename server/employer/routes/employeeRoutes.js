const express = require('express');
const router = express.Router();
const { getAllEmployees } = require('../controllers/employeeController');
const { protectEmployer } = require('../../middleware/authMiddleware');

router.get('/', protectEmployer, getAllEmployees);

module.exports = router;
