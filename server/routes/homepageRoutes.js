const express = require('express');
const router = express.Router();
const HomepageConfig = require('../models/HomepageConfig');

// GET homepage configuration
router.get('/', async (req, res) => {
  try {
    let config = await HomepageConfig.findOne();
    if (!config) {
      config = await HomepageConfig.create({});
    }
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching homepage config:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Helper: safely convert Mongoose subdoc or plain object to a plain JS object
const toPlain = (val) => {
  if (!val) return {};
  if (typeof val.toObject === 'function') return val.toObject();
  return JSON.parse(JSON.stringify(val));
};

// PUT update homepage configuration
router.put('/', async (req, res) => {
  try {
    let config = await HomepageConfig.findOne();
    if (!config) {
      config = new HomepageConfig(req.body);
    } else {
      if (req.body.logo !== undefined) { config.logo = req.body.logo; config.markModified('logo'); }
      if (req.body.hero !== undefined) { config.hero = req.body.hero; config.markModified('hero'); }
      if (req.body.searchBar !== undefined) { config.searchBar = req.body.searchBar; config.markModified('searchBar'); }
      if (req.body.jobCards !== undefined) { config.jobCards = req.body.jobCards; config.markModified('jobCards'); }
      if (req.body.typography !== undefined) { config.typography = req.body.typography; config.markModified('typography'); }
      if (req.body.customFontsLibrary !== undefined) { config.customFontsLibrary = req.body.customFontsLibrary; config.markModified('customFontsLibrary'); }
      if (req.body.employeeRegister !== undefined) { config.employeeRegister = req.body.employeeRegister; config.markModified('employeeRegister'); }
      if (req.body.employeeLogin !== undefined) { config.employeeLogin = req.body.employeeLogin; config.markModified('employeeLogin'); }
      if (req.body.employeeOnboarding !== undefined) { config.employeeOnboarding = req.body.employeeOnboarding; config.markModified('employeeOnboarding'); }
      if (req.body.employerRegister !== undefined) { config.employerRegister = req.body.employerRegister; config.markModified('employerRegister'); }
      if (req.body.employerLogin !== undefined) { config.employerLogin = req.body.employerLogin; config.markModified('employerLogin'); }
      if (req.body.employerPostJob !== undefined) { config.employerPostJob = req.body.employerPostJob; config.markModified('employerPostJob'); }
    }

    const updated = await config.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating homepage config:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
