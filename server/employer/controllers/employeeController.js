const Employee = require('../../employee/models/Employee');
const Application = require('../../models/Application');

// @desc    Get all registered employees
// @route   GET /api/employer/employees
// @access  Private (Employer)
exports.getAllEmployees = async (req, res) => {
  try {
    const employerId = req.employer?._id || req.user?._id;

    // Find all candidate IDs who have applied to any job posted by this employer
    let appliedEmployeeIds = new Set();
    if (employerId) {
      const applications = await Application.find({ employerId }).select('employeeId');
      appliedEmployeeIds = new Set(
        applications
          .map(app => (app.employeeId ? app.employeeId.toString() : null))
          .filter(Boolean)
      );
    }

    const employees = await Employee.find().select('-password').sort({ createdAt: -1 });

    const sanitizedEmployees = employees.map(emp => {
      const e = emp.toObject ? emp.toObject() : { ...emp };
      const empIdStr = (e._id || '').toString();
      const hasApplied = appliedEmployeeIds.has(empIdStr);

      // Check if profile is private and candidate has NOT applied to this employer
      if (e.isProfilePrivate && !hasApplied) {
        return {
          _id: e._id,
          candidateId: e.candidateId,
          name: e.name,
          avatar: e.avatar,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
          isProfilePrivate: true,
          isPrivate: true,
          appliedToYou: false,
          // Masked/Hidden fields
          email: '',
          mobile: '',
          location: '',
          preferredLocation: '',
          designation: '',
          industry: '',
          totalExperience: '',
          brief: '',
          resume: '',
          coverLetter: '',
          introVideo: '',
          qualifications: [],
          experience: [],
          professionalDetails: {}
        };
      }

      if (e.videoVisibility === 'applied' && !hasApplied) {
        e.introVideo = '';
      }

      e.isPrivate = false;
      e.appliedToYou = hasApplied;
      return e;
    });

    res.status(200).json({
      success: true,
      count: sanitizedEmployees.length,
      data: sanitizedEmployees
    });
  } catch (error) {
    console.error("Error in getAllEmployees:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

