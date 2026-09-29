const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Employee = require('../models/Employee');
const Employer = require('../../employer/models/Employer');
const googleSheetService = require('../../services/googleSheetService');

// @desc    Get all active jobs
// @route   GET /api/employee/jobs
// @access  Public or Private (Let's make it private if needed, but usually jobs can be public)
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Active' })
      .populate('employerId', 'fullName designation companyName hiringFor employees industry location aboutCompany website hidePostedByCard hideJobAnalytics')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single job by ID
// @route   GET /api/employee/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employerId', 'fullName designation companyName hiringFor employees industry location aboutCompany website hidePostedByCard hideJobAnalytics');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Increment job views
// @route   POST /api/employee/jobs/:id/view
// @access  Public
exports.incrementJobViews = async (req, res) => {
  try {
    const { viewerId } = req.body;
    if (!viewerId) {
      return res.status(400).json({ success: false, message: 'viewerId is required' });
    }

    // Use $addToSet to guarantee uniqueness at the DB level
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { viewedBy: viewerId } },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Sync the views count with the array length
    if (updatedJob.views !== updatedJob.viewedBy.length) {
      updatedJob.views = updatedJob.viewedBy.length;
      await updatedJob.save();
    }

    res.status(200).json({ success: true, data: { views: updatedJob.views } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply for a job
// @route   POST /api/employee/jobs/:id/apply
// @access  Private
exports.applyForJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const employeeId = req.employee.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'This job is closed' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({ jobId, employeeId });
    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    // Update candidate CV / Resume / mobile in DB if provided
    if (req.body.resume || req.body.mobile || req.body.name) {
      const updateFields = {};
      if (req.body.resume) updateFields.resume = req.body.resume;
      if (req.body.mobile) updateFields.mobile = req.body.mobile;
      if (req.body.name) updateFields.name = req.body.name;
      await Employee.findByIdAndUpdate(employeeId, updateFields);
    }

    // Calculate sequential applicationNumber starting from 500101
    const lastApp = await Application.findOne({ applicationNumber: { $exists: true } }).sort({ applicationNumber: -1 });
    const applicationNumber = (lastApp && lastApp.applicationNumber) ? lastApp.applicationNumber + 1 : 500101;

    const application = await Application.create({
      applicationNumber,
      jobId,
      employeeId,
      employerId: job.employerId,
      screeningAnswers: req.body.screeningAnswers || []
    });

    // Increment applications count
    job.applications = (job.applications || 0) + 1;
    await job.save();

    // Background Auto-Sync to Employer's Google Sheet (Real-time without blocking response)
    (async () => {
      try {
        const employer = await Employer.findById(job.employerId).select('googleSheetId autoSyncGoogleSheet');
        if (employer && employer.googleSheetId && employer.autoSyncGoogleSheet !== false) {
          const candidate = await Employee.findById(employeeId).select('-password');
          const populatedApp = { ...application.toObject(), jobId: job };
          await googleSheetService.appendApplicationToSpreadsheet(employer.googleSheetId, populatedApp, candidate);
        }
        // Trigger live candidates & employers sheet update
        googleSheetService.triggerLiveCandidateSync();
        googleSheetService.triggerLiveEmployerSync();
      } catch (sheetSyncErr) {
        console.error('[GoogleSheet] Background auto-sync error:', sheetSyncErr.message);
      }
    })();

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my applications
// @route   GET /api/employee/jobs/my-applications
// @access  Private
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ employeeId: req.employee.id })
      .populate('jobId')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
