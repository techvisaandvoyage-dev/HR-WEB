const Job = require('../../models/Job');
const Application = require('../../models/Application');

// @desc    Create a new job
// @route   POST /api/employer/jobs
// @access  Private
exports.createJob = async (req, res) => {
  try {
    const employerId = req.user.id;
    const {
      company, companyInitial, title, location, salary, employerProvided,
      easyApply, qualifications, details, screeningQuestions
    } = req.body;

    const job = await Job.create({
      employerId,
      company,
      companyInitial,
      title,
      location,
      salary,
      employerProvided,
      easyApply,
      qualifications,
      details,
      screeningQuestions
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all jobs for logged in employer
// @route   GET /api/employer/jobs
// @access  Private
exports.getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: jobs });
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
    const applications = await Application.find({ employerId: req.user.id })
      .populate('employeeId', '-password') // Don't send password!
      .populate('jobId')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, data: applications });
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
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
