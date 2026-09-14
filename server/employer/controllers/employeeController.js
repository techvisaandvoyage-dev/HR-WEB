const Employee = require('../../employee/models/Employee');

// @desc    Get all registered employees
// @route   GET /api/employer/employees
// @access  Private (Employer)
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select('-password').sort({ createdAt: -1 });
    const sanitizedEmployees = employees.map(emp => {
      const e = emp.toObject ? emp.toObject() : { ...emp };
      if (e.videoVisibility === 'applied') {
        e.introVideo = '';
      }
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
