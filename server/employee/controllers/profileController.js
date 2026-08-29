const Employee = require('../models/Employee');

// @desc    Get employee profile
// @route   GET /api/employee/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id);

    if (employee) {
      res.json({
        firstName: employee.name.split(' ')[0],
        lastName: employee.name.split(' ').slice(1).join(' '),
        email: employee.email,
        phone: employee.mobile,
        brief: employee.brief || '',
        avatar: employee.avatar || '',
        designation: employee.designation || '',
        industry: employee.industry || '',
        totalExperience: employee.totalExperience || '',
        location: employee.location || '',
        preferredLocation: employee.preferredLocation || '',
        isFresher: employee.isFresher,
        qualifications: employee.qualifications || [],
        experience: employee.experience || [],
        professionalDetails: employee.professionalDetails || {},
        resume: employee.resume || '',
        coverLetter: employee.coverLetter || ''
      });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update employee profile
// @route   PUT /api/employee/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id);

    if (employee) {
      // Handle name updates
      if (req.body.firstName || req.body.lastName) {
        const currentFirstName = employee.name.split(' ')[0];
        const currentLastName = employee.name.split(' ').slice(1).join(' ');
        const newFirstName = req.body.firstName !== undefined ? req.body.firstName : currentFirstName;
        const newLastName = req.body.lastName !== undefined ? req.body.lastName : currentLastName;
        employee.name = `${newFirstName} ${newLastName}`.trim();
      }

      // Handle mobile update and default to prevent validation error on old docs
      employee.mobile = req.body.phone !== undefined && req.body.phone !== '' ? req.body.phone : (employee.mobile || 'N/A');
      
      // Handle location update and default
      employee.location = req.body.location !== undefined ? req.body.location : employee.location;
      employee.preferredLocation = req.body.preferredLocation !== undefined ? req.body.preferredLocation : employee.preferredLocation;
      employee.industry = req.body.industry !== undefined ? req.body.industry : employee.industry;

      employee.brief = req.body.brief !== undefined ? req.body.brief : employee.brief;
      employee.avatar = req.body.avatar !== undefined ? req.body.avatar : employee.avatar;
      employee.designation = req.body.designation !== undefined ? req.body.designation : employee.designation;
      employee.totalExperience = req.body.totalExperience !== undefined ? req.body.totalExperience : employee.totalExperience;
      employee.isFresher = req.body.isFresher !== undefined ? req.body.isFresher : employee.isFresher;
      
      if (req.body.qualifications) {
        employee.qualifications = req.body.qualifications;
        employee.markModified('qualifications');
      }
      
      if (req.body.experience) {
        employee.experience = req.body.experience;
        employee.markModified('experience');
      }
      
      if (req.body.professionalDetails) {
        employee.professionalDetails = req.body.professionalDetails;
        employee.markModified('professionalDetails');
      }
      
      employee.resume = req.body.documents?.resume !== undefined ? req.body.documents.resume : (req.body.resume !== undefined ? req.body.resume : employee.resume);
      employee.coverLetter = req.body.documents?.coverLetter !== undefined ? req.body.documents.coverLetter : (req.body.coverLetter !== undefined ? req.body.coverLetter : employee.coverLetter);

      const updatedEmployee = await employee.save();

      res.json({
        message: 'Profile updated successfully',
        profile: {
          firstName: updatedEmployee.name.split(' ')[0],
          lastName: updatedEmployee.name.split(' ').slice(1).join(' '),
          email: updatedEmployee.email,
          phone: updatedEmployee.mobile,
          brief: updatedEmployee.brief,
          avatar: updatedEmployee.avatar,
          designation: updatedEmployee.designation,
          industry: updatedEmployee.industry,
          totalExperience: updatedEmployee.totalExperience,
          location: updatedEmployee.location,
          preferredLocation: updatedEmployee.preferredLocation,
          isFresher: updatedEmployee.isFresher,
          qualifications: updatedEmployee.qualifications,
          experience: updatedEmployee.experience,
          professionalDetails: updatedEmployee.professionalDetails,
          resume: updatedEmployee.resume,
          coverLetter: updatedEmployee.coverLetter
        }
      });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getProfile, updateProfile };
