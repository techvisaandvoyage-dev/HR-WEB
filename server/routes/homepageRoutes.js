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

// PUT update homepage configuration
router.put('/', async (req, res) => {
  try {
    let config = await HomepageConfig.findOne();
    if (!config) {
      config = new HomepageConfig(req.body);
    } else {
      if (req.body.logo) config.logo = { ...config.logo.toObject(), ...req.body.logo };
      if (req.body.hero) config.hero = { ...config.hero.toObject(), ...req.body.hero };
      if (req.body.searchBar) config.searchBar = { ...config.searchBar.toObject(), ...req.body.searchBar };
      if (req.body.jobCards) config.jobCards = { ...config.jobCards.toObject(), ...req.body.jobCards };
    }
    const updated = await config.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating homepage config:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
