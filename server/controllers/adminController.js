const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');
const Job = require('../models/Job');
const Application = require('../models/Application');
const SiteSettings = require('../models/SiteSettings');

// @desc    Get Admin Dashboard Stats & Activity Overview
// @route   GET /api/admin/stats
// @access  Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const existingJobIds = await Job.distinct('_id');
    const [
      totalEmployees,
      totalEmployers,
      totalJobs,
      activeJobs,
      closedJobs,
      totalApplications
    ] = await Promise.all([
      Employee.countDocuments(),
      Employer.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: 'Active' }),
      Job.countDocuments({ status: 'Closed' }),
      Application.countDocuments({ jobId: { $in: existingJobIds } })
    ]);

    // Recent 5 Employees
    const recentEmployees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email mobile designation location createdAt lastLogin avatar');

    // Recent 5 Employers
    const recentEmployers = await Employer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email mobile companyName industry location createdAt lastLogin');

    // Recent 5 Jobs
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employerId', 'fullName companyName email mobile phone countryCode location isConsultant');

    // Recent 5 Applications
    const recentApplications = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('jobId', 'title company location')
      .populate('employeeId', 'name email mobile')
      .populate('employerId', 'companyName fullName email mobile phone countryCode');

    // Registration chart data (7, 14, or 30 days)
    const daysRange = parseInt(req.query.days) || 7;
    const registrationTrends = [];
    let periodCandidates = 0;
    let periodEmployers = 0;
    let periodApplications = 0;
    let maxDayActivity = -1;
    let peakDayLabel = '';

    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      
      const [empCount, emprCount, appCount] = await Promise.all([
        Employee.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Employer.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Application.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } })
      ]);

      periodCandidates += empCount;
      periodEmployers += emprCount;
      periodApplications += appCount;

      const totalDay = empCount + emprCount + appCount;
      if (totalDay > maxDayActivity) {
        maxDayActivity = totalDay;
        peakDayLabel = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      const label = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayOfWeek = dayStart.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = dayStart.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      registrationTrends.push({
        date: label,
        label,
        dayOfWeek,
        fullDate,
        employees: empCount,
        employers: emprCount,
        applications: appCount,
        total: totalDay
      });
    }

    res.json({
      success: true,
      data: {
        totals: {
          totalEmployees,
          totalEmployers,
          totalJobs,
          activeJobs,
          closedJobs,
          totalApplications
        },
        trendsSummary: {
          daysRange,
          periodCandidates,
          periodEmployers,
          periodApplications,
          peakDay: peakDayLabel,
          peakCount: maxDayActivity,
          avgPerDay: (periodCandidates / daysRange).toFixed(1)
        },
        recentEmployees,
        recentEmployers,
        recentJobs,
        recentApplications,
        registrationTrends
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching statistics', error: error.message });
  }
};

// @desc    Get all registered employees with profile details & application counts
// @route   GET /api/admin/employees
// @access  Admin
exports.getAllEmployees = async (req, res) => {
  try {
    const { search, experience, industry, sourceType, jobId, employerId, utmSource } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { designation: searchRegex },
        { location: searchRegex },
        { preferredLocation: searchRegex },
        { 'acquisition.jobSnapshot.title': searchRegex },
        { 'acquisition.jobSnapshot.companyName': searchRegex },
        { 'acquisition.utmSource': searchRegex }
      ];
    }

    if (experience && experience !== 'All') {
      query.totalExperience = experience;
    }

    if (industry && industry !== 'All') {
      query.industry = new RegExp(industry, 'i');
    }

    if (sourceType && sourceType !== 'All') {
      query['acquisition.sourceType'] = sourceType;
    }

    if (jobId && jobId !== 'All') {
      query['acquisition.firstTouchJob'] = jobId;
    }

    if (employerId && employerId !== 'All') {
      query['acquisition.firstTouchEmployer'] = employerId;
    }

    if (utmSource && utmSource !== 'All') {
      query['acquisition.utmSource'] = new RegExp(utmSource, 'i');
    }

    const employees = await Employee.find(query)
      .select('-password')
      .populate('acquisition.firstTouchJob', 'title company location status salary createdAt employerId')
      .populate('acquisition.firstTouchEmployer', 'employerId companyName fullName email mobile location isConsultant')
      .sort({ createdAt: -1 })
      .lean();

    // Attach application counts for each employee
    const employeeIds = employees.map(e => e._id);
    const applications = await Application.find({ employeeId: { $in: employeeIds } }).lean();

    const applicationCountMap = {};
    applications.forEach(app => {
      const idStr = String(app.employeeId);
      applicationCountMap[idStr] = (applicationCountMap[idStr] || 0) + 1;
    });

    const enrichedEmployees = employees.map(emp => {
      const acq = emp.acquisition || {};
      const job = acq.firstTouchJob || null;
      const employer = acq.firstTouchEmployer || null;

      return {
        ...emp,
        id: emp._id,
        sourceType: acq.sourceType || 'direct',
        utmSource: acq.utmSource || null,
        firstTouchJob: job ? {
          _id: job._id,
          title: job.title,
          status: job.status,
          location: job.location,
          employerId: job.employerId || null
        } : (acq.jobSnapshot?.title ? {
          _id: null,
          title: acq.jobSnapshot.title,
          status: 'Closed',
          isDeleted: true
        } : null),
        firstTouchEmployer: employer ? {
          _id: employer._id,
          employerId: employer.employerId || null,
          companyName: employer.companyName || employer.fullName,
          fullName: employer.fullName,
          email: employer.email,
          mobile: employer.mobile,
          location: employer.location,
          isConsultant: employer.isConsultant || false
        } : (acq.jobSnapshot?.companyName ? {
          _id: null,
          employerId: null,
          companyName: acq.jobSnapshot.companyName,
          isDeleted: true
        } : null),
        applicationsCount: applicationCountMap[String(emp._id)] || 0
      };
    });

    res.json({
      success: true,
      count: enrichedEmployees.length,
      data: enrichedEmployees
    });
  } catch (error) {
    console.error('Error fetching employees list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error.message });
  }
};

// @desc    Get single employee by ID with full details, attribution, visits & applications history
// @route   GET /api/admin/employees/:id
// @access  Admin
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select('-password')
      .populate('acquisition.firstTouchJob')
      .populate('acquisition.firstTouchEmployer')
      .lean();

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const applications = await Application.find({ employeeId: employee._id })
      .populate({
        path: 'jobId',
        select: 'title company location salary status details'
      })
      .populate({
        path: 'employerId',
        select: 'companyName fullName email mobile'
      })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch candidate activity timeline (job link visits)
    const attributionService = require('../services/attributionService');
    const visits = await attributionService.getCandidateVisits(employee._id);

    // Format firstTouchJob full details
    let firstTouchJob = null;
    if (employee.acquisition?.firstTouchJob) {
      const job = employee.acquisition.firstTouchJob;
      firstTouchJob = {
        _id: job._id,
        title: job.title || employee.acquisition?.jobSnapshot?.title || 'Job Opening',
        company: job.company || employee.acquisition?.jobSnapshot?.companyName || '',
        employerId: job.employerId || null,
        descriptionSummary: job.details?.aboutRole || job.details?.responsibilities || job.details?.skillsRequired || 'No role summary provided.',
        location: job.location || 'Not specified',
        salaryRange: job.salary || (job.details?.salary ? `${job.details.salary} ${job.details.salaryType || ''}` : 'Not specified'),
        jobType: job.details?.employmentType || 'Full-time',
        status: job.status || 'Active',
        postedDate: job.createdAt || null,
        createdAt: job.createdAt || null,
        publicJobUrl: `/apply-job/${job._id}`,
        applicantsCount: job.applications || 0,
        isDeleted: false
      };
    } else if (employee.acquisition?.sourceType === 'job_link') {
      firstTouchJob = {
        _id: null,
        title: employee.acquisition?.jobSnapshot?.title || 'Job no longer available',
        company: employee.acquisition?.jobSnapshot?.companyName || '',
        employerId: null,
        descriptionSummary: 'This job posting was archived or removed.',
        location: 'N/A',
        salaryRange: 'N/A',
        jobType: 'N/A',
        status: 'Closed',
        postedDate: null,
        createdAt: null,
        publicJobUrl: null,
        applicantsCount: 0,
        isDeleted: true
      };
    }

    // Format employer details
    let employer = null;
    const Employer = require('../employer/models/Employer');
    const emprTargetId = employee.acquisition?.firstTouchEmployer?._id || employee.acquisition?.firstTouchEmployer || employee.acquisition?.firstTouchJob?.employerId;
    let empr = null;
    if (emprTargetId) {
      empr = await Employer.findById(emprTargetId).lean();
    }
    if (empr) {
      const totalJobs = await Job.countDocuments({ employerId: empr._id });
      employer = {
        _id: empr._id,
        employerId: empr.employerId || null,
        isConsultant: empr.isConsultant || false,
        accountType: empr.accountType || (empr.isConsultant ? 'consultant' : 'company'),
        hiringFor: empr.hiringFor || (empr.isConsultant ? 'consultant' : 'employer'),
        fullName: empr.fullName || 'Recruiter',
        companyName: empr.companyName || employee.acquisition?.jobSnapshot?.companyName || empr.fullName || 'Company',
        contactPerson: empr.fullName || 'Recruiter',
        email: empr.email || '',
        phone: empr.mobile || '',
        website: empr.website || '',
        location: empr.location || '',
        totalJobs: totalJobs,
        activeJobs: totalJobs,
        totalJobsPosted: totalJobs,
        isDeleted: false
      };
    } else if (employee.acquisition?.sourceType === 'job_link') {
      employer = {
        _id: null,
        employerId: null,
        isConsultant: false,
        fullName: 'N/A',
        companyName: employee.acquisition?.jobSnapshot?.companyName || 'Employer record no longer available',
        contactPerson: 'N/A',
        email: '',
        phone: '',
        website: '',
        location: '',
        totalJobsPosted: 0,
        isDeleted: true
      };
    }

    res.json({
      success: true,
      data: {
        ...employee,
        id: employee._id,
        sourceType: employee.acquisition?.sourceType || 'direct',
        utmSource: employee.acquisition?.utmSource || null,
        firstTouchJob,
        employer,
        visits,
        applications
      }
    });
  } catch (error) {
    console.error('Error fetching employee detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee details', error: error.message });
  }
};

// @desc    Get all registered employers with jobs count and applications received
// @route   GET /api/admin/employers
// @access  Admin
exports.getAllEmployers = async (req, res) => {
  try {
    const { search, industry } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { fullName: searchRegex },
        { companyName: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { location: searchRegex },
        { designation: searchRegex }
      ];
    }

    if (industry && industry !== 'All') {
      query.industry = new RegExp(industry, 'i');
    }

    const employers = await Employer.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const employerIds = employers.map(e => e._id);

    // Get jobs grouped by employerId
    const jobs = await Job.find({ employerId: { $in: employerIds } }).lean();
    const applications = await Application.find({ employerId: { $in: employerIds } }).lean();

    const jobStatsMap = {};
    const jobsByEmployerMap = {};
    jobs.forEach(job => {
      const empIdStr = String(job.employerId);
      if (!jobStatsMap[empIdStr]) {
        jobStatsMap[empIdStr] = { totalJobs: 0, activeJobs: 0, closedJobs: 0 };
        jobsByEmployerMap[empIdStr] = [];
      }
      jobStatsMap[empIdStr].totalJobs += 1;
      const statusLower = (job.status || '').toLowerCase();
      if (statusLower === 'active') jobStatsMap[empIdStr].activeJobs += 1;
      if (statusLower === 'closed') jobStatsMap[empIdStr].closedJobs += 1;
      jobsByEmployerMap[empIdStr].push(job);
    });

    const applicationCountMap = {};
    applications.forEach(app => {
      const empIdStr = String(app.employerId);
      applicationCountMap[empIdStr] = (applicationCountMap[empIdStr] || 0) + 1;
    });

    const enrichedEmployers = employers.map(employer => {
      const stats = jobStatsMap[String(employer._id)] || { totalJobs: 0, activeJobs: 0, closedJobs: 0 };
      return {
        ...employer,
        id: employer._id,
        totalJobs: stats.totalJobs,
        activeJobs: stats.activeJobs,
        closedJobs: stats.closedJobs,
        totalApplicationsReceived: applicationCountMap[String(employer._id)] || 0,
        jobs: jobsByEmployerMap[String(employer._id)] || []
      };
    });

    res.json({
      success: true,
      count: enrichedEmployers.length,
      data: enrichedEmployers
    });
  } catch (error) {
    console.error('Error fetching employers list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employers', error: error.message });
  }
};

// @desc    Get single employer by ID with all their posted jobs & candidate counts
// @route   GET /api/admin/employers/:id
// @access  Admin
exports.getEmployerById = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id).select('-password').lean();
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const jobs = await Job.find({ employerId: employer._id })
      .populate('employerId', 'fullName companyName email mobile phone countryCode location isConsultant')
      .sort({ createdAt: -1 })
      .lean();

    // Attach application counts
    const jobIds = jobs.map(j => j._id);
    const applications = await Application.find({ jobId: { $in: jobIds } }).lean();
    const appCountMap = {};
    applications.forEach(a => {
      const idStr = String(a.jobId);
      appCountMap[idStr] = (appCountMap[idStr] || 0) + 1;
    });

    const enrichedJobs = jobs.map(j => ({
      ...j,
      id: j._id,
      employerId: (j.employerId && typeof j.employerId === 'object') ? j.employerId : employer,
      applicationsCount: appCountMap[String(j._id)] || 0
    }));

    const activeJobs = enrichedJobs.filter(j => (j.status || '').toLowerCase() === 'active').length;
    const closedJobs = enrichedJobs.filter(j => (j.status || '').toLowerCase() === 'closed').length;

    res.json({
      success: true,
      data: {
        ...employer,
        id: employer._id,
        totalJobs: enrichedJobs.length,
        activeJobs,
        closedJobs,
        jobs: enrichedJobs
      }
    });
  } catch (error) {
    console.error('Error fetching employer detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employer details', error: error.message });
  }
};

// @desc    Update Job Status (Active/Closed) by Admin
// @route   PUT /api/admin/jobs/:id/status
// @access  Admin
exports.updateJobStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.status = status || (job.status === 'Active' ? 'Closed' : 'Active');
    job.statusColor = job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';

    await job.save();

    res.json({
      success: true,
      message: `Job status updated to ${job.status}`,
      data: job
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ success: false, message: 'Failed to update job status', error: error.message });
  }
};

// @desc    Update Employer Display Controls (Hide 'Posted by' card, Hide analytics)
// @route   PUT /api/admin/employers/:id/controls
// @access  Admin
exports.updateEmployerControls = async (req, res) => {
  try {
    const { hidePostedByCard, hideJobAnalytics } = req.body;
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    if (typeof hidePostedByCard !== 'undefined') {
      employer.hidePostedByCard = Boolean(hidePostedByCard);
    }
    if (typeof hideJobAnalytics !== 'undefined') {
      employer.hideJobAnalytics = Boolean(hideJobAnalytics);
    }

    await employer.save();

    res.json({
      success: true,
      message: 'Employer display controls updated successfully',
      data: {
        id: employer._id,
        hidePostedByCard: employer.hidePostedByCard,
        hideJobAnalytics: employer.hideJobAnalytics
      }
    });
  } catch (error) {
    console.error('Error updating employer controls:', error);
    res.status(500).json({ success: false, message: 'Failed to update employer controls', error: error.message });
  }
};

// @desc    Get Global Site Settings
// @route   GET /api/admin/site-settings
// @access  Public / Admin
exports.getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({ hidePostedByCardGlobally: false });
    }
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch site settings', error: error.message });
  }
};

// @desc    Update Global Site Settings
// @route   PUT /api/admin/site-settings
// @access  Admin
exports.updateSiteSettings = async (req, res) => {
  try {
    const { hidePostedByCardGlobally, dailyJobLimitEnabled, maxJobsPerDay, limitErrorMessage } = req.body;
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({});
    }

    if (typeof hidePostedByCardGlobally !== 'undefined') {
      settings.hidePostedByCardGlobally = Boolean(hidePostedByCardGlobally);
      // Synchronize all existing employers
      await Employer.updateMany({}, { $set: { hidePostedByCard: Boolean(hidePostedByCardGlobally) } });
    }

    if (typeof dailyJobLimitEnabled !== 'undefined') {
      settings.dailyJobLimitEnabled = Boolean(dailyJobLimitEnabled);
    }

    if (typeof maxJobsPerDay !== 'undefined') {
      const parsedMax = parseInt(maxJobsPerDay, 10);
      if (!isNaN(parsedMax) && parsedMax > 0) {
        settings.maxJobsPerDay = parsedMax;
      }
    }

    if (typeof limitErrorMessage !== 'undefined') {
      settings.limitErrorMessage = String(limitErrorMessage).trim();
    }

    if (typeof req.body.backupEmail !== 'undefined') {
      settings.backupEmail = String(req.body.backupEmail).trim().toLowerCase();
    }

    if (typeof req.body.backupFrequencyDays !== 'undefined') {
      const parsedFreq = parseInt(req.body.backupFrequencyDays, 10);
      if (!isNaN(parsedFreq) && parsedFreq > 0) {
        settings.backupFrequencyDays = parsedFreq;
      }
    }

    if (req.body.seo && typeof req.body.seo === 'object') {
      const existingSeo = settings.seo?.toObject ? settings.seo.toObject() : (settings.seo || {});
      settings.seo = { ...existingSeo, ...req.body.seo };
    }

    await settings.save();

    // Invalidate public SEO cache
    try {
      const { invalidateSeoCache } = require('../services/seoService');
      invalidateSeoCache();
    } catch (_) {}

    // Trigger live employer sync
    try {
      const { triggerLiveEmployerSync } = require('../services/googleSheetService');
      triggerLiveEmployerSync();
    } catch (_) {}

    res.json({
      success: true,
      message: `Global Recruiter Card display updated to ${settings.hidePostedByCardGlobally ? 'HIDDEN (OFF)' : 'VISIBLE (ON)'} for all employers across the website`,
      data: settings
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update site settings', error: error.message });
  }
};

// @desc    Get Google Sheets sync status for Candidates & Employers
// @route   GET /api/admin/sheets/status
// @access  Admin
exports.getSheetsStatus = async (req, res) => {
  try {
    const { extractSpreadsheetId } = require('../services/googleSheetService');
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    const envCand = process.env.CANDIDATES_SHEET_ID || process.env.EMPLOYEE_SHEET_ID || process.env.CANDIDATE_SHEET_URL || process.env.EMPLOYEE_SHEET_URL || '';
    const candId = settings.candidatesSheetId || (envCand ? extractSpreadsheetId(envCand) : '');
    const candUrl = settings.candidatesSheetUrl || (candId ? `https://docs.google.com/spreadsheets/d/${candId}/edit` : '');

    const envEmpr = process.env.EMPLOYERS_SHEET_ID || process.env.EMPLOYER_SHEET_ID || process.env.EMPLOYERS_SHEET_URL || process.env.EMPLOYER_SHEET_URL || '';
    const emprId = settings.employersSheetId || (envEmpr ? extractSpreadsheetId(envEmpr) : '');
    const emprUrl = settings.employersSheetUrl || (emprId ? `https://docs.google.com/spreadsheets/d/${emprId}/edit` : '');

    res.json({
      success: true,
      data: {
        serviceAccountEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        candidatesSheetUrl: candUrl,
        candidatesSheetLastSynced: settings.candidatesSheetLastSynced || null,
        employersSheetUrl: emprUrl,
        employersSheetLastSynced: settings.employersSheetLastSynced || null
      }
    });
  } catch (error) {
    console.error('Error fetching sheet status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sheet status', error: error.message });
  }
};

// @desc    Manually trigger sync for Candidates Google Sheet
// @route   POST /api/admin/sheets/candidates/sync
// @access  Admin
exports.syncCandidatesSheetAdmin = async (req, res) => {
  try {
    const { syncCandidatesSheet } = require('../services/googleSheetService');
    const { customUrl } = req.body || {};
    const result = await syncCandidatesSheet(customUrl);
    res.json({
      success: true,
      message: `Successfully live synced ${result.count} candidates to Google Sheet!`,
      data: result
    });
  } catch (error) {
    console.error('Error syncing candidates sheet:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to sync candidates sheet' });
  }
};

// @desc    Manually trigger sync for Employers Google Sheet
// @route   POST /api/admin/sheets/employers/sync
// @access  Admin
exports.syncEmployersSheetAdmin = async (req, res) => {
  try {
    const { syncEmployersSheet } = require('../services/googleSheetService');
    const { customUrl } = req.body || {};
    const result = await syncEmployersSheet(customUrl);
    res.json({
      success: true,
      message: `Successfully live synced ${result.count} employers to Google Sheet!`,
      data: result
    });
  } catch (error) {
    console.error('Error syncing employers sheet:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to sync employers sheet' });
  }
};

// @desc    Get all jobs for Admin
// @route   GET /api/admin/jobs
// @access  Admin
exports.getAllJobsAdmin = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { location: searchRegex }
      ];
    }
    const jobs = await Job.find(query)
      .populate('employerId', 'fullName companyName email mobile phone countryCode location isConsultant')
      .sort({ createdAt: -1 })
      .lean();

    // Attach application counts
    const jobIds = jobs.map(j => j._id);
    const applications = await Application.find({ jobId: { $in: jobIds } }).lean();
    const appCountMap = {};
    applications.forEach(a => {
      const idStr = String(a.jobId);
      appCountMap[idStr] = (appCountMap[idStr] || 0) + 1;
    });

    const enrichedJobs = jobs.map(j => ({
      ...j,
      id: j._id,
      applicationsCount: appCountMap[String(j._id)] || 0
    }));

    res.json({ success: true, count: enrichedJobs.length, data: enrichedJobs });
  } catch (error) {
    console.error('Error fetching admin jobs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching jobs', error: error.message });
  }
};

// @desc    Get all applications for Admin
// @route   GET /api/admin/applications
// @access  Admin
exports.getAllApplicationsAdmin = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    const applications = await Application.find(query)
      .populate('jobId', 'title company location status salary jobType')
      .populate('employeeId', 'name email mobile designation location totalExperience resumeUrl avatar')
      .populate('employerId', 'companyName fullName email mobile')
      .sort({ createdAt: -1 })
    // Only keep applications linked to existing valid jobs
    const validApplications = applications.filter(a => a.jobId && a.jobId._id);

    let filtered = validApplications;
    if (search) {
      const s = search.toLowerCase();
      filtered = applications.filter(a => 
        (a.employeeId?.name && a.employeeId.name.toLowerCase().includes(s)) ||
        (a.employeeId?.email && a.employeeId.email.toLowerCase().includes(s)) ||
        (a.employeeId?.mobile && a.employeeId.mobile.toLowerCase().includes(s)) ||
        (a.jobId?.title && a.jobId.title.toLowerCase().includes(s)) ||
        (a.employerId?.companyName && a.employerId.companyName.toLowerCase().includes(s)) ||
        (a.applicationNumber && String(a.applicationNumber).includes(s))
      );
    }

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    console.error('Error fetching admin applications:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applications', error: error.message });
  }
};



