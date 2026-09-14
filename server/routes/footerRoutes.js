const express = require('express');
const router = express.Router();
const FooterConfig = require('../models/FooterConfig');

// GET footer configuration
router.get('/', async (req, res) => {
  try {
    let config = await FooterConfig.findOne();
    if (!config) {
      config = await FooterConfig.create({});
    }
    res.json(config);
  } catch (error) {
    console.error('Error fetching footer config:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT update footer configuration
router.put('/', async (req, res) => {
  try {
    let config = await FooterConfig.findOne();
    if (!config) {
      config = new FooterConfig(req.body);
    } else {
      Object.assign(config, req.body);
    }
    const updated = await config.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating footer config:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
