const Job = require('../../models/Job');
const Application = require('../../models/Application');

// @desc    Get all active jobs
// @route   GET /api/employee/jobs
// @access  Public or Private (Let's make it private if needed, but usually jobs can be public)
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Active' })
      .populate('employerId', 'fullName designation companyName')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: jobs });
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

    const application = await Application.create({
      jobId,
      employeeId,
      employerId: job.employerId,
      screeningAnswers: req.body.screeningAnswers || []
    });

    // Increment applications count
    job.applications += 1;
    await job.save();

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
