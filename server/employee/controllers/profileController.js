const Employee = require('../models/Employee');

// @desc    Get employee profile
// @route   GET /api/employee/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id);

    if (employee) {
      const nameParts = (employee.name || '').split(' ');
      res.json({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: employee.email || '',
        phone: employee.mobile || '',
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
        coverLetter: employee.coverLetter || '',
        introVideo: employee.introVideo || '',
        videoVisibility: employee.videoVisibility || 'everyone'
      });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update employee profile
// @route   PUT /api/employee/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const updateData = {};

    // Handle name updates
    if (req.body.firstName !== undefined || req.body.lastName !== undefined) {
      const currentFirstName = (employee.name || '').split(' ')[0] || '';
      const currentLastName = (employee.name || '').split(' ').slice(1).join(' ') || '';
      const newFirstName = req.body.firstName !== undefined ? req.body.firstName : currentFirstName;
      const newLastName = req.body.lastName !== undefined ? req.body.lastName : currentLastName;
      updateData.name = `${newFirstName} ${newLastName}`.trim();
    }

    if (req.body.phone !== undefined && req.body.phone !== '') {
      updateData.mobile = req.body.phone;
    }
    
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.preferredLocation !== undefined) updateData.preferredLocation = req.body.preferredLocation;
    if (req.body.industry !== undefined) updateData.industry = req.body.industry;
    if (req.body.brief !== undefined) updateData.brief = req.body.brief;
    if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;
    if (req.body.designation !== undefined) updateData.designation = req.body.designation;
    if (req.body.totalExperience !== undefined) updateData.totalExperience = req.body.totalExperience;
    if (req.body.isFresher !== undefined) updateData.isFresher = req.body.isFresher;
    if (req.body.qualifications !== undefined) updateData.qualifications = req.body.qualifications;
    if (req.body.experience !== undefined) updateData.experience = req.body.experience;
    if (req.body.professionalDetails !== undefined) updateData.professionalDetails = req.body.professionalDetails;

    // Handle documents
    const resume = req.body.documents?.resume !== undefined ? req.body.documents.resume : req.body.resume;
    if (resume !== undefined) updateData.resume = resume;

    const coverLetter = req.body.documents?.coverLetter !== undefined ? req.body.documents.coverLetter : req.body.coverLetter;
    if (coverLetter !== undefined) updateData.coverLetter = coverLetter;

    const introVideo = req.body.documents?.introVideo !== undefined ? req.body.documents.introVideo : req.body.introVideo;
    if (introVideo !== undefined) updateData.introVideo = introVideo;

    const videoVisibility = req.body.documents?.videoVisibility !== undefined 
      ? req.body.documents.videoVisibility 
      : req.body.videoVisibility;
    if (videoVisibility !== undefined) updateData.videoVisibility = videoVisibility;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.employee._id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: false }
    );

    const nameParts = (updatedEmployee.name || '').split(' ');
    res.json({
      message: 'Profile updated successfully',
      profile: {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
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
        coverLetter: updatedEmployee.coverLetter,
        introVideo: updatedEmployee.introVideo,
        videoVisibility: updatedEmployee.videoVisibility || 'everyone'
      }
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = { getProfile, updateProfile };
