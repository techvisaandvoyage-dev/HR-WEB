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

    // Synchronize employerRegister settings to consultantRegister so that any changes
    // in Employer Auth & Controls (industries & roles, company sizes, designation options, field configurations)
    // automatically update the Consultant registration form as well.
    if (updateData.employerRegister) {
      const empReg = updateData.employerRegister;

      // If consultantRegister is not explicitly sent or only partially sent, merge with existing from DB
      let currentConsReg = updateData.consultantRegister;
      if (!currentConsReg || Object.keys(currentConsReg).length === 0) {
        const currentCfg = await HomepageConfig.findOne();
        currentConsReg = currentCfg?.consultantRegister ? JSON.parse(JSON.stringify(currentCfg.consultantRegister)) : {};
      }

      const mergedConsReg = {
        ...currentConsReg,
        // Preserve consultant modal titles / subtitles if present, otherwise fallback
        modalTitle: currentConsReg.modalTitle || 'Create Consultant Account',
        modalSubtitle: currentConsReg.modalSubtitle || 'Register to find qualified talent and post jobs for clients on sahijob.com',
        
        // Sync hiring / account type labels
        ...(empReg.accountTypeCompanyLabel ? { accountTypeCompanyLabel: empReg.accountTypeCompanyLabel } : {}),
        ...(empReg.accountTypeIndividualLabel ? { accountTypeIndividualLabel: empReg.accountTypeIndividualLabel } : {}),
        ...(empReg.termsText ? { termsText: empReg.termsText } : {}),
        ...(empReg.hiringForLabel ? { hiringForLabel: empReg.hiringForLabel } : {}),
        ...(empReg.hiringForOptions ? { hiringForOptions: empReg.hiringForOptions } : {}),

        // Sync Step 1 fields (labels, placeholders, isRequired)
        step1: {
          ...(currentConsReg.step1 || {}),
          ...(empReg.step1 || {}),
          title: currentConsReg.step1?.title || empReg.step1?.title || 'Account Information',
          subtitle: currentConsReg.step1?.subtitle || empReg.step1?.subtitle || 'Enter your basic contact details',
          fields: {
            ...(currentConsReg.step1?.fields || {}),
            ...(empReg.step1?.fields || {})
          }
        },

        // Sync Step 2 options and fields (industries, roles, company sizes, designations, fields)
        step2: {
          ...(currentConsReg.step2 || {}),
          ...(empReg.step2 || {}),
          title: currentConsReg.step2?.title || empReg.step2?.title || 'Company Details',
          subtitle: currentConsReg.step2?.subtitle || empReg.step2?.subtitle || 'Tell us about your organization & hiring requirements',
          // Industries with custom roles
          industriesData: empReg.step2?.industriesData || currentConsReg.step2?.industriesData,
          industryOptions: empReg.step2?.industryOptions || currentConsReg.step2?.industryOptions,
          // Company sizes
          employeeSizeOptions: empReg.step2?.employeeSizeOptions || currentConsReg.step2?.employeeSizeOptions,
          // Designations
          designationOptions: empReg.step2?.designationOptions || currentConsReg.step2?.designationOptions,
          fields: {
            ...(currentConsReg.step2?.fields || {}),
            ...(empReg.step2?.fields || {})
          }
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
