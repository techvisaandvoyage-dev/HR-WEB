const Employee = require('../models/Employee');

// @desc    Get employee profile
// @route   GET /api/employee/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    if (!req.employee?._id) {
      return res.status(401).json({ message: 'Not authorized, please log in again' });
    }
    const employee = await Employee.findById(req.employee._id);

    if (employee) {
      const nameParts = (employee.name || '').split(' ');
      res.json({
        _id: employee._id,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: employee.email || '',
        phone: employee.mobile || '',
        countryCode: employee.countryCode || '+91',
        brief: employee.brief || '',
        avatar: employee.avatar || '',
        designation: employee.designation || '',
        industry: employee.industry || '',
        totalExperience: employee.totalExperience || '',
        noticePeriod: employee.noticePeriod || employee.professionalDetails?.noticePeriod || '',
        location: employee.location || '',
        preferredLocation: employee.preferredLocation || '',
        isFresher: employee.isFresher,
        qualifications: employee.qualifications || [],
        experience: employee.experience || [],
        professionalDetails: employee.professionalDetails || {},
        resume: employee.resume || '',
        coverLetter: employee.coverLetter || '',
        introVideo: employee.introVideo || '',
        isVideoApproved: Boolean(employee.isVideoApproved),
        videoApprovalStatus: employee.videoApprovalStatus || (employee.introVideo ? (employee.isVideoApproved ? 'approved' : 'pending') : 'none'),
        videoUploadedAt: employee.videoUploadedAt || null,
        videoApprovedAt: employee.videoApprovedAt || null,
        videoRejectionReason: employee.videoRejectionReason || '',
        videoVisibility: employee.videoVisibility || 'everyone',
        isProfilePrivate: employee.isProfilePrivate !== undefined ? Boolean(employee.isProfilePrivate) : true,
        isOnboardingCompleted: employee.isOnboardingCompleted ?? false,
        onboardingStep: employee.onboardingStep || 1
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

    // Strict cross-account protection: never allow stale tab/localStorage from another user to overwrite this account
    if (req.body._id && String(req.body._id) !== String(employee._id)) {
      console.warn(`[profileController] Blocked cross-account profile overwrite: body._id=${req.body._id} vs token._id=${employee._id}`);
      return res.status(409).json({
        message: 'Session switched to another account. Please refresh the page.',
        accountMismatch: true
      });
    }
    if (
      req.body.email &&
      employee.email &&
      String(req.body.email).trim().toLowerCase() !== String(employee.email).trim().toLowerCase()
    ) {
      console.warn(`[profileController] Blocked cross-account profile overwrite: body.email=${req.body.email} vs token.email=${employee.email}`);
      return res.status(409).json({
        message: 'Session switched to another account. Please refresh the page.',
        accountMismatch: true
      });
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
      const cleanPhone = String(req.body.phone).trim();
      updateData.mobile = cleanPhone;
    }
    if (req.body.countryCode !== undefined) updateData.countryCode = req.body.countryCode;
    
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.preferredLocation !== undefined) updateData.preferredLocation = req.body.preferredLocation;
    if (req.body.industry !== undefined) updateData.industry = req.body.industry;
    if (req.body.brief !== undefined) updateData.brief = req.body.brief;
    if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;
    if (req.body.designation !== undefined) updateData.designation = req.body.designation;
    if (req.body.totalExperience !== undefined) {
      updateData.totalExperience = req.body.totalExperience;
    } else if (req.body.professionalDetails?.totalExperience !== undefined) {
      updateData.totalExperience = req.body.professionalDetails.totalExperience;
    }
    if (req.body.noticePeriod !== undefined) {
      updateData.noticePeriod = req.body.noticePeriod;
    } else if (req.body.professionalDetails?.noticePeriod !== undefined) {
      updateData.noticePeriod = req.body.professionalDetails.noticePeriod;
    }
    if (req.body.isFresher !== undefined) updateData.isFresher = req.body.isFresher;
    if (req.body.qualifications !== undefined) updateData.qualifications = req.body.qualifications;
    if (req.body.experience !== undefined) {
      let exps = req.body.experience;
      if (Array.isArray(exps)) {
        exps = exps.map(exp => {
          const isCurrent = Boolean(
            exp.currentCompany ||
            exp.currentJob ||
            (Array.isArray(exp.roles) && exp.roles.some(r => r.currentCompany || r.currentJob || String(r.leavingDate || '').toLowerCase() === 'present'))
          );
          if (!isCurrent && exp.noticePeriod) {
            return { ...exp, noticePeriod: '' };
          }
          return exp;
        });
        const currentExp = exps.find(exp => 
          exp.currentCompany || 
          exp.currentJob || 
          (Array.isArray(exp.roles) && exp.roles.some(r => r.currentCompany || r.currentJob || String(r.leavingDate || '').toLowerCase() === 'present'))
        );
        if (currentExp?.noticePeriod) {
          updateData.noticePeriod = currentExp.noticePeriod;
        }
      }
      updateData.experience = exps;
    }
    if (req.body.professionalDetails !== undefined) {
      updateData.professionalDetails = req.body.professionalDetails;
      if (updateData.totalExperience && typeof updateData.professionalDetails === 'object') {
        updateData.professionalDetails.totalExperience = updateData.totalExperience;
      }
      if (updateData.noticePeriod && typeof updateData.professionalDetails === 'object') {
        updateData.professionalDetails.noticePeriod = updateData.noticePeriod;
      }
    }

    // Handle documents
    const resume = req.body.documents?.resume !== undefined ? req.body.documents.resume : req.body.resume;
    if (resume !== undefined) updateData.resume = resume;

    const coverLetter = req.body.documents?.coverLetter !== undefined ? req.body.documents.coverLetter : req.body.coverLetter;
    if (coverLetter !== undefined) updateData.coverLetter = coverLetter;

    const introVideo = req.body.documents?.introVideo !== undefined ? req.body.documents.introVideo : req.body.introVideo;
    if (introVideo !== undefined) {
      const trimmedVideo = String(introVideo || '').trim();
      updateData.introVideo = trimmedVideo;

      // When candidate uploads a new or changed video, default hidden pending admin approval
      const currentEmployee = await Employee.findById(req.employee._id).select('introVideo isVideoApproved videoApprovalStatus');
      if (trimmedVideo) {
        if (!currentEmployee || currentEmployee.introVideo !== trimmedVideo) {
          updateData.isVideoApproved = false;
          updateData.videoApprovalStatus = 'pending';
          updateData.videoUploadedAt = new Date();
          updateData.videoRejectionReason = '';
        }
      } else {
        // Video removed
        updateData.isVideoApproved = false;
        updateData.videoApprovalStatus = 'none';
        updateData.videoUploadedAt = null;
        updateData.videoRejectionReason = '';
      }
    }

    const videoVisibility = req.body.documents?.videoVisibility !== undefined 
      ? req.body.documents.videoVisibility 
      : req.body.videoVisibility;
    if (videoVisibility !== undefined) updateData.videoVisibility = videoVisibility;

    if (req.body.isProfilePrivate !== undefined) updateData.isProfilePrivate = Boolean(req.body.isProfilePrivate);
    if (req.body.isOnboardingCompleted !== undefined) updateData.isOnboardingCompleted = Boolean(req.body.isOnboardingCompleted);
    if (req.body.onboardingStep !== undefined) updateData.onboardingStep = Number(req.body.onboardingStep);

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.employee._id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: false }
    );

    const nameParts = (updatedEmployee.name || '').split(' ');
    res.json({
      message: 'Profile updated successfully',
      profile: {
        _id: updatedEmployee._id,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: updatedEmployee.email,
        phone: updatedEmployee.mobile,
        brief: updatedEmployee.brief,
        avatar: updatedEmployee.avatar,
        designation: updatedEmployee.designation,
        industry: updatedEmployee.industry,
        totalExperience: updatedEmployee.totalExperience,
        noticePeriod: updatedEmployee.noticePeriod || updatedEmployee.professionalDetails?.noticePeriod || '',
        location: updatedEmployee.location,
        preferredLocation: updatedEmployee.preferredLocation,
        isFresher: updatedEmployee.isFresher,
        qualifications: updatedEmployee.qualifications,
        experience: updatedEmployee.experience,
        professionalDetails: updatedEmployee.professionalDetails,
        resume: updatedEmployee.resume,
        coverLetter: updatedEmployee.coverLetter,
        introVideo: updatedEmployee.introVideo,
        isVideoApproved: Boolean(updatedEmployee.isVideoApproved),
        videoApprovalStatus: updatedEmployee.videoApprovalStatus || (updatedEmployee.introVideo ? (updatedEmployee.isVideoApproved ? 'approved' : 'pending') : 'none'),
        videoUploadedAt: updatedEmployee.videoUploadedAt || null,
        videoApprovedAt: updatedEmployee.videoApprovedAt || null,
        videoRejectionReason: updatedEmployee.videoRejectionReason || '',
        videoVisibility: updatedEmployee.videoVisibility || 'everyone',
        isProfilePrivate: updatedEmployee.isProfilePrivate !== undefined ? Boolean(updatedEmployee.isProfilePrivate) : true,
        isOnboardingCompleted: updatedEmployee.isOnboardingCompleted ?? false,
        onboardingStep: updatedEmployee.onboardingStep || 1
      }
    });

    // Trigger live Google Sheet sync for candidate
    try {
      const { triggerLiveCandidateSync } = require('../../services/googleSheetService');
      triggerLiveCandidateSync();
    } catch (_) {}
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = { getProfile, updateProfile };
