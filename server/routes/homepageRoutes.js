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
    const updateDoc = {};
    if (req.body.logo !== undefined) updateDoc.logo = req.body.logo;
    if (req.body.hero !== undefined) updateDoc.hero = req.body.hero;
    if (req.body.searchBar !== undefined) updateDoc.searchBar = req.body.searchBar;
    if (req.body.jobCards !== undefined) updateDoc.jobCards = req.body.jobCards;
    if (req.body.typography !== undefined) updateDoc.typography = req.body.typography;
    if (req.body.customFontsLibrary !== undefined) updateDoc.customFontsLibrary = req.body.customFontsLibrary;
    if (req.body.employeeRegister !== undefined) updateDoc.employeeRegister = req.body.employeeRegister;
    if (req.body.employeeLogin !== undefined) updateDoc.employeeLogin = req.body.employeeLogin;
    if (req.body.employeeOnboarding !== undefined) updateDoc.employeeOnboarding = req.body.employeeOnboarding;
    if (req.body.employerRegister !== undefined) updateDoc.employerRegister = req.body.employerRegister;
    if (req.body.employerLogin !== undefined) updateDoc.employerLogin = req.body.employerLogin;
    if (req.body.employerPostJob !== undefined) updateDoc.employerPostJob = req.body.employerPostJob;

    const updated = await HomepageConfig.findOneAndUpdate(
      {},
      { $set: updateDoc },
      { returnDocument: 'after', upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating homepage config:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
