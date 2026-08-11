const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protectEmployee } = require('../../middleware/authMiddleware');

router.route('/')
  .get(protectEmployee, getProfile)
  .put(protectEmployee, updateProfile);

module.exports = router;
