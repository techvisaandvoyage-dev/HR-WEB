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
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.__v;

    // Synchronize daily job post limit to consultantPostJob if provided in employerPostJob
    if (updateData.employerPostJob && updateData.employerPostJob.dailyJobLimit) {
      const limitCfg = updateData.employerPostJob.dailyJobLimit;
      if (!updateData.consultantPostJob) {
        updateData.consultantPostJob = {};
      }
      updateData.consultantPostJob.dailyJobLimit = limitCfg;

      // Also persist to SiteSettings for fast global lookups
      try {
        const SiteSettings = require('../models/SiteSettings');
        await SiteSettings.findOneAndUpdate(
          {},
          {
            $set: {
              dailyJobLimitEnabled: Boolean(limitCfg.enabled),
              maxJobsPerDay: Number(limitCfg.maxJobsPerDay) || 5,
              limitErrorMessage: limitCfg.errorMessage || 'Daily job post limit reached ({limit} jobs/day). You can post new jobs tomorrow.'
            }
          },
          { upsert: true }
        );
      } catch (siteErr) {
        console.warn('Could not sync dailyJobLimit to SiteSettings:', siteErr.message);
      }
    }

    const updated = await HomepageConfig.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating homepage config:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
