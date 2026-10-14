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
    const plainConfig = toPlain(config);

    // Also include hidePostedByCardGlobally from SiteSettings
    try {
      const SiteSettings = require('../models/SiteSettings');
      const settings = await SiteSettings.findOne();
      plainConfig.hidePostedByCardGlobally = Boolean(settings?.hidePostedByCardGlobally);
    } catch (e) {
      plainConfig.hidePostedByCardGlobally = false;
    }

    // Ensure jobMatchBanner is populated from step6 or fallback
    if (!plainConfig.jobMatchBanner && plainConfig.employerPostJob?.step6) {
      plainConfig.jobMatchBanner = plainConfig.employerPostJob.step6;
    }

    res.json({ success: true, data: plainConfig });
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

    // Synchronize hidePostedByCardGlobally to SiteSettings and all Employer documents if provided
    if (typeof updateData.hidePostedByCardGlobally !== 'undefined') {
      try {
        const SiteSettings = require('../models/SiteSettings');
        const Employer = require('../employer/models/Employer');
        await SiteSettings.findOneAndUpdate(
          {},
          { $set: { hidePostedByCardGlobally: Boolean(updateData.hidePostedByCardGlobally) } },
          { upsert: true }
        );
        await Employer.updateMany({}, { $set: { hidePostedByCard: Boolean(updateData.hidePostedByCardGlobally) } });
      } catch (siteErr) {
        console.warn('Could not sync hidePostedByCardGlobally to SiteSettings/Employers:', siteErr.message);
      }
    }

    // Ensure jobMatchBanner is also synced into employerPostJob.step6
    if (updateData.jobMatchBanner) {
      if (!updateData.employerPostJob) updateData.employerPostJob = {};
      updateData.employerPostJob.step6 = updateData.jobMatchBanner;
    } else if (updateData.employerPostJob?.step6) {
      updateData.jobMatchBanner = updateData.employerPostJob.step6;
    }

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

    // Synchronize employerRegister OPTIONS to consultantRegister so that any changes
    // in Employer Auth & Controls (industries & roles, company sizes, designation options)
    // automatically update the Consultant registration form as well.
    // NOTE: Text labels & placeholders are NOT synced — consultant admin can set them independently.
    if (updateData.employerRegister) {
      const empReg = updateData.employerRegister;

      // If consultantRegister is not explicitly sent, fetch existing from DB
      let currentConsReg = updateData.consultantRegister;
      if (!currentConsReg || Object.keys(currentConsReg).length === 0) {
        const currentCfg = await HomepageConfig.findOne();
        currentConsReg = currentCfg?.consultantRegister ? JSON.parse(JSON.stringify(currentCfg.consultantRegister)) : {};
      }

      const mergedConsReg = {
        // Keep all existing consultant settings as base
        ...currentConsReg,
        // Preserve consultant-specific modal titles
        modalTitle: currentConsReg.modalTitle || 'Create Consultant Account',
        modalSubtitle: currentConsReg.modalSubtitle || 'Register to find qualified talent and post jobs for clients on sahijob.com',

        // Sync hiringFor options from employer (consultant admin can still override label)
        ...(empReg.hiringForOptions ? { hiringForOptions: empReg.hiringForOptions } : {}),

        // Step 1: Keep consultant's own fields/labels intact — DO NOT overwrite with employer labels
        step1: {
          ...(currentConsReg.step1 || {}),
          // Only preserve consultant's own step1 settings
        },

        // Step 2: Only sync OPTIONS, keep consultant's own labels/fields
        step2: {
          ...(currentConsReg.step2 || {}),
          // Sync only option arrays from employer
          ...(empReg.step2?.industriesData ? { industriesData: empReg.step2.industriesData } : {}),
          ...(empReg.step2?.industryOptions ? { industryOptions: empReg.step2.industryOptions } : {}),
          ...(empReg.step2?.employeeSizeOptions ? { employeeSizeOptions: empReg.step2.employeeSizeOptions } : {}),
          ...(empReg.step2?.designationOptions ? { designationOptions: empReg.step2.designationOptions } : {}),
          // Keep consultant's own field labels/placeholders — DO NOT overwrite
          fields: currentConsReg.step2?.fields || {}
        }
      };

      updateData.consultantRegister = mergedConsReg;
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
