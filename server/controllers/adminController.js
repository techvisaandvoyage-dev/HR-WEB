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
      Application.countDocuments()
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
      .populate('employerId', 'fullName companyName email');

    // Recent 5 Applications
    const recentApplications = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('jobId', 'title company location')
      .populate('employeeId', 'name email mobile')
      .populate('employerId', 'companyName fullName email');

    // 7-day registration chart data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));
      
      const [empCount, emprCount] = await Promise.all([
        Employee.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Employer.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } })
      ]);

      const label = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last7Days.push({ date: label, employees: empCount, employers: emprCount });
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
        recentEmployees,
        recentEmployers,
        recentJobs,
        recentApplications,
        registrationTrends: last7Days
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
    const { search, experience, industry } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { designation: searchRegex },
        { location: searchRegex },
        { preferredLocation: searchRegex }
      ];
    }

    if (experience && experience !== 'All') {
      query.totalExperience = experience;
    }

    if (industry && industry !== 'All') {
      query.industry = new RegExp(industry, 'i');
    }

    const employees = await Employee.find(query)
      .select('-password')
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

    const enrichedEmployees = employees.map(emp => ({
      ...emp,
      id: emp._id,
      applicationsCount: applicationCountMap[String(emp._id)] || 0
    }));

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

// @desc    Get single employee by ID with full details and applications history
// @route   GET /api/admin/employees/:id
// @access  Admin
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-password').lean();
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const applications = await Application.find({ employeeId: employee._id })
      .populate({
        path: 'jobId',
        select: 'title company location salary status'
      })
      .populate({
        path: 'employerId',
        select: 'companyName fullName email mobile'
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        ...employee,
        id: employee._id,
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
      if (job.status === 'Active') jobStatsMap[empIdStr].activeJobs += 1;
      if (job.status === 'Closed') jobStatsMap[empIdStr].closedJobs += 1;
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
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        ...employer,
        id: employer._id,
        jobs
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
    const { hidePostedByCardGlobally } = req.body;
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({});
    }

    if (typeof hidePostedByCardGlobally !== 'undefined') {
      settings.hidePostedByCardGlobally = Boolean(hidePostedByCardGlobally);
      // Synchronize all existing employers
      await Employer.updateMany({}, { $set: { hidePostedByCard: Boolean(hidePostedByCardGlobally) } });
    }

    await settings.save();

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


