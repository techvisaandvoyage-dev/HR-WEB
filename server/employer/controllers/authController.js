const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');
const { verifyIdToken } = require('../../config/firebaseAdmin');
const { sendOtp, resendOtp, verifyOtp } = require('../../utils/email');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// @desc    Send registration OTP to employer email
// @route   POST /api/employer/auth/send-otp
// @access  Public
exports.sendRegistrationOtp = async (req, res) => {
  try {
    const { email, mobile, fullName } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const userExists = await Employer.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Employer already exists with this email', field: 'email' });
    }

    if (mobile) {
      const mobileExists = await Employer.findOne({ mobile });
      if (mobileExists) {
        return res.status(400).json({ message: 'Mobile number already registered', field: 'mobile' });
      }
    }

    const result = await sendOtp({
      email,
      name: fullName || email.split('@')[0],
      purpose: 'registration:employer',
    });

    res.json({
      message: result.message || 'OTP sent successfully to your email',
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('Employer Send OTP Error:', error.message);
    res.status(error.status || 400).json({
      message: error.message || 'Failed to send OTP',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Resend registration OTP to employer email
// @route   POST /api/employer/auth/resend-otp
// @access  Public
exports.resendRegistrationOtp = async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required to resend OTP' });
    }

    const result = await resendOtp({
      email,
      name: fullName || email.split('@')[0],
      purpose: 'registration:employer',
    });

    res.json({
      message: result.message || 'OTP resent successfully to your email',
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('Employer Resend OTP Error:', error.message);
    res.status(error.status || 400).json({
      message: error.message || 'Failed to resend OTP',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Verify registration OTP
// @route   POST /api/employer/auth/verify-otp
// @access  Public
exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    await verifyOtp({
      email,
      otp,
      purpose: 'registration:employer',
      consume: false,
    });

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message || 'Invalid or expired OTP' });
  }
};

// @desc    Register a new employer
// @route   POST /api/employer/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { 
      mobile, accountType, fullName, email, password,
      hiringFor, companyName, industry, employees, designation, location, aboutCompany, website,
      otp
    } = req.body;

    const cleanEmail = String(email || '').trim().toLowerCase();

    // Check if user exists
    let employer = await Employer.findOne({ email: cleanEmail });

    if (employer && employer.companyName && employer.companyName.trim() !== '') {
      return res.status(400).json({ success: false, message: 'Employer account already exists with this email' });
    }

    // If OTP was provided, verify and consume it
    if (otp) {
      try {
        await verifyOtp({
          email: cleanEmail,
          otp,
          purpose: 'registration:employer',
          consume: true,
        });
      } catch (otpErr) {
        return res.status(otpErr.status || 400).json({ success: false, message: otpErr.message || 'Invalid OTP' });
      }
    }

    if (employer) {
      // Existing Google user completing Company Details
      if (fullName) employer.fullName = fullName;
      if (accountType) employer.accountType = accountType;
      if (password) employer.password = password;
      if (hiringFor) employer.hiringFor = hiringFor;
      employer.companyName = companyName;
      employer.industry = industry;
      employer.employees = employees;
      employer.designation = designation;
      employer.location = location;
      employer.aboutCompany = aboutCompany;
      if (website !== undefined) employer.website = website;
      await employer.save();
    } else {
      // Create new user
      employer = await Employer.create({
        mobile, accountType, fullName, email: cleanEmail, password,
        hiringFor, companyName, industry, employees, designation, location, aboutCompany, website
      });
    }

    if (employer) {
      res.status(201).json({
        success: true,
        _id: employer.id,
        fullName: employer.fullName,
        email: employer.email,
        companyName: employer.companyName,
        token: generateToken(employer._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// @desc    Authenticate an employer
// @route   POST /api/employer/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, field: 'email', message: 'Please enter your email address' });
    }

    if (!password) {
      return res.status(400).json({ success: false, field: 'password', message: 'Please enter your password' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check for user email (case-insensitive)
    const employer = await Employer.findOne({ 
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    }).select('+password');

    if (!employer) {
      return res.status(404).json({ 
        success: false, 
        field: 'email', 
        message: "We couldn't find an employer account with this email. Please register first to continue." 
      });
    }

    if (!employer.password) {
      return res.status(400).json({ 
        success: false, 
        field: 'email', 
        message: 'This email is linked to a Google account. Please log in with Google.' 
      });
    }

    // Check if password matches
    const isMatch = await employer.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        field: 'password', 
        message: 'Invalid password. Please check and try again.' 
      });
    }

    await Employer.findByIdAndUpdate(employer._id, { lastLogin: new Date() });

    res.json({
      success: true,
      _id: employer.id,
      fullName: employer.fullName,
      email: employer.email,
      companyName: employer.companyName,
      token: generateToken(employer._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get current logged in employer
// @route   GET /api/employer/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id);
    
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    res.status(200).json({
      success: true,
      data: employer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update employer profile
// @route   PUT /api/employer/auth/update
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { 
      fullName, mobile, companyName, industry, employees, 
      designation, location, aboutCompany, website, hiringFor
    } = req.body;

    const employer = await Employer.findById(req.user.id);

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    // Update fields
    if (fullName) employer.fullName = fullName;
    if (mobile) employer.mobile = mobile;
    if (companyName) employer.companyName = companyName;
    if (industry) employer.industry = industry;
    if (employees) employer.employees = employees;
    if (designation) employer.designation = designation;
    if (location) employer.location = location;
    if (aboutCompany !== undefined) employer.aboutCompany = aboutCompany;
    if (website !== undefined) employer.website = website;
    if (hiringFor) employer.hiringFor = hiringFor;

    await employer.save();

    res.status(200).json({
      success: true,
      data: employer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Request OTP for forgot password
// @route   POST /api/employer/auth/forgot-password/otp
// @access  Public
exports.forgotPasswordOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const employer = await Employer.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { mobile: identifier.trim() }]
    });

    if (!employer) {
      return res.status(404).json({ message: 'No employer account found with this email' });
    }

    const result = await sendOtp({
      email: employer.email,
      name: employer.fullName,
      purpose: 'forgot_password:employer',
    });

    res.json({
      message: result.message || 'OTP sent successfully to your registered email',
      email: employer.email,
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('Employer Forgot Password OTP error:', error.message);
    res.status(error.status || 500).json({
      message: error.message || 'Server error',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Resend OTP for forgot password
// @route   POST /api/employer/auth/forgot-password/resend-otp
// @access  Public
exports.resendForgotPasswordOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ message: 'Please provide mobile number or email' });
    }

    const employer = await Employer.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { mobile: identifier.trim() }]
    });

    if (!employer) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await resendOtp({
      email: employer.email,
      name: employer.fullName,
      purpose: 'forgot_password:employer',
    });

    res.json({
      message: result.message || 'OTP resent successfully to your email',
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('Employer Resend Forgot Password OTP error:', error.message);
    res.status(error.status || 400).json({
      message: error.message || 'Failed to resend OTP',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Verify OTP for forgot password
// @route   POST /api/employer/auth/forgot-password/verify-otp
// @access  Public
exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP are required' });
    }

    const employer = await Employer.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { mobile: identifier.trim() }]
    });

    if (!employer) {
      return res.status(404).json({ message: 'User not found' });
    }

    await verifyOtp({
      email: employer.email,
      otp,
      purpose: 'forgot_password:employer',
      consume: false,
    });

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message || 'Invalid or expired OTP' });
  }
};

// @desc    Reset password
// @route   POST /api/employer/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, password, otp } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const employer = await Employer.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { mobile: identifier.trim() }]
    });

    if (!employer) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify and consume OTP if provided
    if (otp) {
      await verifyOtp({
        email: employer.email,
        otp,
        purpose: 'forgot_password:employer',
        consume: true,
      });
    }

    employer.password = password;
    await employer.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Check if mobile exists and return name
// @route   POST /api/employer/auth/check-mobile
// @access  Public
exports.checkMobile = async (req, res) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile) {
      return res.status(400).json({ message: 'Please provide mobile number' });
    }

    const employer = await Employer.findOne({ mobile });

    if (!employer) {
      return res.status(404).json({ message: 'Mobile number not registered' });
    }

    // In a real app, send actual OTP via SMS here
    res.json({ 
      success: true, 
      name: employer.fullName 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check if email exists
// @route   POST /api/employer/auth/check-email
// @access  Public
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const employer = await Employer.findOne({ email });

    if (employer) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Google Auth (Login/Signup)
// @route   POST /api/employer/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({ message: 'Token missing' });
    }

    const decodedToken = await verifyIdToken(id_token);
    const { email, name } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email not found in Google account' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let employer = await Employer.findOne({ email: cleanEmail });
    let isNewUser = false;

    if (!employer) {
      isNewUser = true;
      employer = await Employer.create({
        fullName: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        mobile: '',
        companyName: '',
        industry: '',
        googleId: sub || uid || '',
        authProvider: 'google',
      });
    } else {
      if (!employer.companyName || employer.companyName.trim() === '') {
        isNewUser = true;
      }
      if (!employer.googleId) {
        employer.googleId = sub || uid || '';
        if (!employer.authProvider) employer.authProvider = 'google';
      }
      employer.lastLogin = new Date();
      await employer.save();
    }

    res.json({
      success: true,
      isNewUser,
      _id: employer._id,
      fullName: employer.fullName,
      email: employer.email,
      companyName: employer.companyName,
      token: generateToken(employer._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send OTP to email for employer login
// @route   POST /api/employer/auth/login/send-otp
// @access  Public
exports.sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const employer = await Employer.findOne({ email: cleanEmail });

    if (!employer) {
      return res.status(404).json({ success: false, message: "We couldn't find an employer account with this email. Please register first." });
    }

    const result = await sendOtp({
      email: employer.email,
      name: employer.fullName || 'Employer',
      purpose: 'login:employer',
    });

    res.json({
      success: true,
      message: result.message || 'OTP sent successfully to your email.',
      email: employer.email,
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('Employer sendLoginOtp error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to send OTP.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Resend OTP for email login
// @route   POST /api/employer/auth/login/resend-otp
// @access  Public
exports.resendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required to resend OTP.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const employer = await Employer.findOne({ email: cleanEmail });

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found with this email.' });
    }

    const result = await resendOtp({
      email: employer.email,
      name: employer.fullName || 'Employer',
      purpose: 'login:employer',
    });

    res.json({
      success: true,
      message: result.message || 'A new OTP has been sent to your email.',
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('Employer resendLoginOtp error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to resend OTP.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Verify OTP and log in employer
// @route   POST /api/employer/auth/login/verify-otp
// @access  Public
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide both email and OTP.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const employer = await Employer.findOne({ email: cleanEmail });

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    // Verify OTP
    try {
      await verifyOtp({
        email: employer.email,
        otp: String(otp).trim(),
        purpose: 'login:employer',
        consume: true,
      });
    } catch (otpErr) {
      return res.status(otpErr.status || 400).json({
        success: false,
        message: otpErr.message || 'Invalid or expired OTP. Please try again.',
      });
    }

    res.json({
      success: true,
      _id: employer.id,
      fullName: employer.fullName,
      email: employer.email,
      companyName: employer.companyName,
      token: generateToken(employer._id),
    });
  } catch (error) {
    console.error('Employer verifyLoginOtp error:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get current employer security & authentication status
// @route   GET /api/employer/auth/security
// @access  Private
exports.getSecurityStatus = async (req, res) => {
  try {
    const employerId = req.user?._id || req.employer?._id;
    const employer = await Employer.findById(employerId).select('+password');
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const hasPassword = Boolean(employer.password && employer.password.length > 0);
    const isGoogleConnected = Boolean(employer.googleId || employer.authProvider === 'google' || !employer.password);

    res.json({
      success: true,
      email: employer.email,
      fullName: employer.fullName,
      hasPassword,
      isGoogleConnected,
      authProvider: employer.authProvider || (hasPassword ? 'local' : 'google'),
    });
  } catch (error) {
    console.error('Employer getSecurityStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Set password for employer accounts without a password (e.g. Google-authenticated users)
// @route   POST /api/employer/auth/set-password
// @access  Private
exports.setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const employerId = req.user?._id || req.employer?._id;
    const employer = await Employer.findById(employerId).select('+password');
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    employer.password = newPassword;
    await employer.save();

    res.json({
      success: true,
      message: 'Password set successfully. You can now sign in using your email and password or continue with Google.',
      hasPassword: true,
    });
  } catch (error) {
    console.error('Employer setPassword error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Send OTP to change employer account password
// @route   POST /api/employer/auth/change-password/send-otp
// @access  Private
exports.sendChangePasswordOtp = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Please provide your current password.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const employerId = req.user?._id || req.employer?._id;
    const employer = await Employer.findById(employerId).select('+password');
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found.' });
    }

    if (!employer.password) {
      return res.status(400).json({ success: false, message: 'No password is set on this account. Please use "Set Password" instead.' });
    }

    const isMatch = await employer.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password. Please try again.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from your current password.' });
    }

    const result = await sendOtp({
      email: employer.email,
      name: employer.fullName || 'Employer',
      purpose: 'change_password:employer',
    });

    res.json({
      success: true,
      message: result.message || 'OTP sent successfully to your registered email.',
      email: employer.email,
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('Employer sendChangePasswordOtp error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to send OTP.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Resend OTP for change password
// @route   POST /api/employer/auth/change-password/resend-otp
// @access  Private
exports.resendChangePasswordOtp = async (req, res) => {
  try {
    const employerId = req.user?._id || req.employer?._id;
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found.' });
    }

    const result = await resendOtp({
      email: employer.email,
      name: employer.fullName || 'Employer',
      purpose: 'change_password:employer',
    });

    res.json({
      success: true,
      message: result.message || 'A new OTP has been sent to your registered email.',
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('Employer resendChangePasswordOtp error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to resend OTP.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Change password for employer accounts that already have a password set (requires OTP)
// @route   POST /api/employer/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both your current and new password.' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please provide the OTP code sent to your email.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const employerId = req.user?._id || req.employer?._id;
    const employer = await Employer.findById(employerId).select('+password');
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    if (!employer.password) {
      return res.status(400).json({ success: false, message: 'No password is set on this account. Please use "Set Password" instead.' });
    }

    const isMatch = await employer.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password. Please try again.' });
    }

    // Verify OTP
    try {
      await verifyOtp({
        email: employer.email,
        otp: String(otp).trim(),
        purpose: 'change_password:employer',
        consume: true,
      });
    } catch (otpErr) {
      return res.status(otpErr.status || 400).json({
        success: false,
        message: otpErr.message || 'Invalid or expired OTP. Please try again.',
      });
    }

    employer.password = newPassword;
    await employer.save();

    res.json({
      success: true,
      message: 'Password changed successfully! You can now use your new password to sign in.',
    });
  } catch (error) {
    console.error('Employer changePassword error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
