const Job = require('../../models/Job');
const Application = require('../../models/Application');

// @desc    Create a new job
// @route   POST /api/employer/jobs
// @access  Private
exports.createJob = async (req, res) => {
  try {
    const employerId = req.user.id;

    // -------------------------------------------------------------------------
    // Daily Job Post Limit Check (Applies to both Employers and Consultants)
    // -------------------------------------------------------------------------
    const SiteSettings = require('../../models/SiteSettings');
    const HomepageConfig = require('../../models/HomepageConfig');

    let isLimitEnabled = false;
    let maxLimit = 5;
    let limitMessage = 'Daily job post limit reached ({limit} jobs/day). You can post new jobs tomorrow.';

    try {
      const siteSettings = await SiteSettings.findOne().lean();
      if (siteSettings && typeof siteSettings.dailyJobLimitEnabled !== 'undefined') {
        isLimitEnabled = Boolean(siteSettings.dailyJobLimitEnabled);
        if (siteSettings.maxJobsPerDay) maxLimit = Number(siteSettings.maxJobsPerDay);
        if (siteSettings.limitErrorMessage) limitMessage = siteSettings.limitErrorMessage;
      } else {
        const hpConfig = await HomepageConfig.findOne().lean();
        const limitCfg = hpConfig?.employerPostJob?.dailyJobLimit || hpConfig?.consultantPostJob?.dailyJobLimit;
        if (limitCfg) {
          isLimitEnabled = Boolean(limitCfg.enabled);
          if (limitCfg.maxJobsPerDay) maxLimit = Number(limitCfg.maxJobsPerDay);
          if (limitCfg.errorMessage) limitMessage = limitCfg.errorMessage;
        }
      }
    } catch (cfgErr) {
      console.warn('[JobController] Could not load daily limit config:', cfgErr.message);
    }

    if (isLimitEnabled && maxLimit > 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayJobsCount = await Job.countDocuments({
        employerId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      if (todayJobsCount >= maxLimit) {
        const formattedMsg = limitMessage.replace('{limit}', String(maxLimit));
        return res.status(403).json({
          success: false,
          message: formattedMsg,
          limitReached: true,
          dailyLimit: maxLimit,
          todayJobsCount
        });
      }
    }

    let {
      company, companyInitial, companyLogo, title, location, salary, salaryNote, employerProvided,
      easyApply, qualifications, details, screeningQuestions, seo
    } = req.body;

    if (!company) {
      company = (req.user && req.user.companyName) || (req.user && req.user.fullName) || 'Company';
    }
    if (!companyInitial) {
      companyInitial = company ? company.charAt(0).toUpperCase() : 'C';
    }
    if (!companyLogo && req.user && req.user.companyLogo) {
      companyLogo = req.user.companyLogo;
    }

    if (Array.isArray(screeningQuestions)) {
      screeningQuestions = screeningQuestions.slice(0, 5);
    }

    // Deduplication safeguard: Prevent duplicate job if submitted within 10 seconds with identical title
    const recentDuplicate = await Job.findOne({
      employerId,
      title: title || 'Untitled Job',
      createdAt: { $gte: new Date(Date.now() - 10000) }
    });

    if (recentDuplicate) {
      console.warn(`[JobController] Duplicate job creation prevented for employer ${employerId}, title "${title}". Returning existing job.`);
      return res.status(200).json({ success: true, data: recentDuplicate });
    }

    const job = await Job.create({
      employerId,
      company,
      companyInitial,
      companyLogo,
      title,
      location,
      salary,
      salaryNote: salaryNote || (details && details.salaryNote) || '',
      employerProvided,
      easyApply,
      qualifications,
      details,
      screeningQuestions,
      ...(seo && typeof seo === 'object' ? { seo } : {})
    });

    res.status(201).json({ success: true, data: job });

    try {
      const { invalidateSeoCache } = require('../../services/seoService');
      invalidateSeoCache();
    } catch (_) {}

    try {
      const { triggerLiveEmployerSync } = require('../../services/googleSheetService');
      triggerLiveEmployerSync();
    } catch (_) {}
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all jobs for logged in employer
// @route   GET /api/employer/jobs
// @access  Private
exports.getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user.id }).sort({ createdAt: -1 }).lean();

    // Compute live valid applications count for each job to keep in sync with Applications tab
    const jobIds = jobs.map(j => j._id);
    const validApplications = await Application.find({ jobId: { $in: jobIds } })
      .populate('employeeId', '_id')
      .lean();

    const countByJobId = {};
    const countByJobAndLink = {}; // { [jobId]: { '01': 3, 'Portal': 1 } }
    validApplications.forEach(app => {
      if (app.employeeId && app.jobId) {
        const jId = String(app.jobId._id || app.jobId);
        countByJobId[jId] = (countByJobId[jId] || 0) + 1;

        const src = String(app.sourceLink || app.utmSource || 'Portal').trim();
        if (!countByJobAndLink[jId]) countByJobAndLink[jId] = {};
        countByJobAndLink[jId][src] = (countByJobAndLink[jId][src] || 0) + 1;
      }
    });

    const enrichedJobs = jobs.map(job => {
      const jId = String(job._id);
      const linkStats = countByJobAndLink[jId] || {};

      // Ensure shareLinks exists with at least default link '01' if empty
      let shareLinks = Array.isArray(job.shareLinks) && job.shareLinks.length > 0
        ? job.shareLinks
        : [{ linkId: '01', name: '01', createdAt: job.createdAt || new Date() }];

      // Enrich shareLinks with application count strictly for that shareable link
      const enrichedShareLinks = shareLinks.map(link => {
        const appsForLink = (linkStats[link.linkId] || 0) + (link.name !== link.linkId ? (linkStats[link.name] || 0) : 0);
        return {
          ...link,
          applicationsCount: appsForLink
        };
      });

      return {
        ...job,
        applications: countByJobId[jId] ?? 0,
        shareLinks: enrichedShareLinks,
        linkStats: linkStats
      };
    });

    res.status(200).json({ success: true, data: enrichedJobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a job owned by the logged-in employer
// @route   PUT /api/employer/jobs/:id
// @access  Private
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.employerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    let {
      company, companyInitial, companyLogo, title, location, salary, salaryNote, employerProvided,
      easyApply, qualifications, details, screeningQuestions, seo
    } = req.body;

    if (Array.isArray(screeningQuestions)) {
      screeningQuestions = screeningQuestions.slice(0, 5);
    }

    if (!company) {
      company = job.company || (req.user && req.user.companyName) || (req.user && req.user.fullName) || 'Company';
    }
    if (!companyInitial) {
      companyInitial = company ? company.charAt(0).toUpperCase() : 'C';
    }
    if (companyLogo === undefined && req.user && req.user.companyLogo) {
      companyLogo = req.user.companyLogo;
    }

    Object.assign(job, {
      company,
      companyInitial,
      ...(companyLogo !== undefined ? { companyLogo } : {}),
      title,
      location,
      salary,
      salaryNote: salaryNote !== undefined ? salaryNote : (details && details.salaryNote !== undefined ? details.salaryNote : job.salaryNote),
      employerProvided,
      easyApply,
      qualifications,
      details,
      screeningQuestions,
      ...(seo && typeof seo === 'object' ? { seo } : {})
    });

    const updatedJob = await job.save();

    try {
      const { invalidateSeoCache } = require('../../services/seoService');
      invalidateSeoCache();
    } catch (_) {}

    res.status(200).json({ success: true, data: updatedJob });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Job Status (Active/Closed)
// @route   PUT /api/employer/jobs/:id/status
// @access  Private
exports.toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    // Ensure job belongs to this employer
    if (job.employerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    job.status = job.status === 'Closed' ? 'Active' : 'Closed';
    job.statusColor = job.status === 'Closed' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700';
    
    await job.save();
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all applications for this employer
// @route   GET /api/employer/applications
// @access  Private
exports.getApplicationsForEmployer = async (req, res) => {
  try {
    const employerJobs = await Job.find({ employerId: req.user.id }).select('_id');
    const jobIds = employerJobs.map(j => j._id);

    const applications = await Application.find({
      $or: [
        { employerId: req.user.id },
        { jobId: { $in: jobIds } }
      ]
    })
      .populate('employeeId', '-password') // Don't send password!
      .populate('jobId')
      .sort({ createdAt: -1 });

    // Filter out orphaned records where candidate or job is null
    const validApplications = applications.filter(app => app.employeeId && app.jobId);
      
    res.status(200).json({ success: true, data: validApplications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/employer/applications/:id/status
// @access  Private
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Check authorization
    if (application.employerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    application.status = status;
    
    // Set status color based on status
    if (status.toLowerCase() === 'shortlisted') {
      application.statusColor = 'bg-green-50 text-green-600 border border-green-100';
    } else if (status.toLowerCase() === 'rejected') {
      application.statusColor = 'bg-red-50 text-red-600 border border-red-100';
    } else if (status.toLowerCase() === 'viewed') {
      application.statusColor = 'bg-gray-100 text-gray-700 border border-gray-200';
    } else {
      application.statusColor = 'bg-blue-50 text-blue-600 border border-blue-100'; // Default / New
    }

    await application.save();

    // Recalculate distinct recruiter actions on the Job:
    // Only genuine decisions (Shortlisted, Rejected, etc.) are counted.
    // 'Viewed', 'New', and 'Applied' are NOT counted.
    // Each unique application counts at most ONCE.
    const actionedCount = await Application.countDocuments({
      jobId: application.jobId,
      status: { $nin: ['New', 'new', 'Viewed', 'viewed', 'Applied', 'applied', null] }
    });
    await Job.findByIdAndUpdate(application.jobId, { $set: { recruiterActions: actionedCount } });
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Daily Job Posting Limit and Quota for logged in Employer / Consultant
// @route   GET /api/employer/jobs/daily-quota
// @access  Private
exports.getDailyJobQuota = async (req, res) => {
  try {
    const employerId = req.user.id;
    const SiteSettings = require('../../models/SiteSettings');
    const HomepageConfig = require('../../models/HomepageConfig');

    let isLimitEnabled = false;
    let maxLimit = 5;
    let limitMessage = 'Daily job post limit reached ({limit} jobs/day). You can post new jobs tomorrow.';

    try {
      const siteSettings = await SiteSettings.findOne().lean();
      if (siteSettings && typeof siteSettings.dailyJobLimitEnabled !== 'undefined') {
        isLimitEnabled = Boolean(siteSettings.dailyJobLimitEnabled);
        if (siteSettings.maxJobsPerDay) maxLimit = Number(siteSettings.maxJobsPerDay);
        if (siteSettings.limitErrorMessage) limitMessage = siteSettings.limitErrorMessage;
      } else {
        const hpConfig = await HomepageConfig.findOne().lean();
        const limitCfg = hpConfig?.employerPostJob?.dailyJobLimit || hpConfig?.consultantPostJob?.dailyJobLimit;
        if (limitCfg) {
          isLimitEnabled = Boolean(limitCfg.enabled);
          if (limitCfg.maxJobsPerDay) maxLimit = Number(limitCfg.maxJobsPerDay);
          if (limitCfg.errorMessage) limitMessage = limitCfg.errorMessage;
        }
      }
    } catch (cfgErr) {
      console.warn('[JobController] Could not load daily limit config:', cfgErr.message);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayJobsCount = await Job.countDocuments({
      employerId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const remainingJobs = isLimitEnabled ? Math.max(0, maxLimit - todayJobsCount) : null;
    const limitReached = isLimitEnabled ? (todayJobsCount >= maxLimit) : false;

    res.json({
      success: true,
      data: {
        limitEnabled: isLimitEnabled,
        maxLimit: isLimitEnabled ? maxLimit : null,
        todayJobsCount,
        remainingJobs,
        limitReached,
        message: limitReached ? limitMessage.replace('{limit}', String(maxLimit)) : null
      }
    });
  } catch (error) {
    console.error('Error fetching daily job quota:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Helper to compute enriched share links with application counts for a job
const computeEnrichedShareLinks = async (jobId, shareLinks) => {
  const applications = await Application.find({ jobId }).select('sourceLink utmSource').lean();
  const linkStats = {};
  applications.forEach(app => {
    const src = String(app.sourceLink || app.utmSource || 'Portal').trim();
    linkStats[src] = (linkStats[src] || 0) + 1;
  });

  const links = Array.isArray(shareLinks) && shareLinks.length > 0
    ? shareLinks
    : [{ linkId: '01', name: '01', createdAt: new Date() }];

  return links.map(l => {
    const linkId = l.linkId || l.name;
    const name = l.name || linkId;
    const count = (linkStats[linkId] || 0) + (name !== linkId ? (linkStats[name] || 0) : 0);
    return {
      _id: l._id,
      linkId,
      name,
      createdAt: l.createdAt || new Date(),
      applicationsCount: count
    };
  });
};

// @desc    Add a new shareable link to a job
// @route   POST /api/employer/jobs/:id/share-links
// @access  Private
exports.createShareLink = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.employerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!Array.isArray(job.shareLinks) || job.shareLinks.length === 0) {
      job.shareLinks = [{ linkId: '01', name: '01', createdAt: new Date() }];
    }

    // Auto-compute next number name e.g. 02, 03... if name not provided
    let newName = req.body.name ? String(req.body.name).trim() : '';
    if (!newName) {
      let maxNum = 0;
      job.shareLinks.forEach(l => {
        const num = parseInt(l.name, 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      });
      const nextNum = maxNum > 0 ? maxNum + 1 : job.shareLinks.length + 1;
      newName = String(nextNum).padStart(2, '0');
    }

    // Ensure uniqueness of linkId
    let uniqueLinkId = newName;
    while (job.shareLinks.some(l => l.linkId === uniqueLinkId)) {
      uniqueLinkId = `${newName}_${Date.now().toString().slice(-4)}`;
    }

    job.shareLinks.push({
      linkId: uniqueLinkId,
      name: newName,
      createdAt: new Date()
    });

    await job.save();

    const enrichedLinks = await computeEnrichedShareLinks(job._id, job.shareLinks);
    res.status(201).json({ success: true, data: enrichedLinks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update / rename a shareable link
// @route   PUT /api/employer/jobs/:id/share-links/:linkId
// @access  Private
exports.updateShareLink = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.employerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Link name is required' });
    }

    if (!Array.isArray(job.shareLinks) || job.shareLinks.length === 0) {
      job.shareLinks = [{ linkId: '01', name: '01', createdAt: new Date() }];
    }

    const link = job.shareLinks.find(
      l => l.linkId === req.params.linkId || String(l._id) === req.params.linkId
    );

    if (!link) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    link.name = name.trim();
    await job.save();

    const enrichedLinks = await computeEnrichedShareLinks(job._id, job.shareLinks);
    res.status(200).json({ success: true, data: enrichedLinks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a shareable link
// @route   DELETE /api/employer/jobs/:id/share-links/:linkId
// @access  Private
exports.deleteShareLink = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.employerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (Array.isArray(job.shareLinks)) {
      job.shareLinks = job.shareLinks.filter(
        l => l.linkId !== req.params.linkId && String(l._id) !== req.params.linkId
      );
      if (job.shareLinks.length === 0) {
        job.shareLinks = [{ linkId: '01', name: '01', createdAt: new Date() }];
      }
      await job.save();
    }

    const enrichedLinks = await computeEnrichedShareLinks(job._id, job.shareLinks);
    res.status(200).json({ success: true, data: enrichedLinks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
