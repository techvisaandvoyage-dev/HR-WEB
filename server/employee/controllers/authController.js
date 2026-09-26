const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const dns = require('dns').promises;
const { verifyIdToken } = require('../../config/firebaseAdmin');
const { sendOtp, verifyOtp, resendOtp } = require('../../utils/email');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Helper: validate email format + DNS MX lookup to confirm domain is real
const validateEmailDomain = async (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address (e.g. name@gmail.com)' };
  }
  const domain = email.split('@')[1];
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, message: 'Email domain does not exist. Please use a real email address.' };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, message: 'Email domain does not exist. Please use a real email address (e.g. name@gmail.com).' };
  }
};

// @desc    Send registration OTP to email
// @route   POST /api/employee/auth/send-otp
// @access  Public
const sendRegistrationOtp = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required', field: 'email' });
    }

    // Validate email format and domain
    const domainCheck = await validateEmailDomain(email.trim().toLowerCase());
    if (!domainCheck.valid) {
      return res.status(400).json({ message: domainCheck.message, field: 'email' });
    }

    const emailExists = await Employee.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Employee already exists with this email', field: 'email' });
    }

    if (mobile && mobile.trim()) {
      const mobileExists = await Employee.findOne({ mobile: mobile.trim() });
      if (mobileExists) {
        return res.status(400).json({ message: 'Phone number already exists', field: 'mobile' });
      }
    }

    const result = await sendOtp({ email, name: email.split('@')[0], purpose: 'registration:employee' });
    res.json({
      message: result.message || 'OTP sent successfully to your email',
      cooldownSeconds: result.cooldownSeconds || 30
    });
  } catch (error) {
    console.error('Send OTP Error:', error.message);
    res.status(error.status || 400).json({
      message: error.message || 'Failed to send OTP',
      cooldownRemaining: error.cooldownRemaining
    });
  }
};

// @desc    Resend registration OTP
// @route   POST /api/employee/auth/resend-otp
// @access  Public
const resendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required to resend OTP' });
    }

    const result = await resendOtp({ email, name: email.split('@')[0], purpose: 'registration:employee' });
    return res.json({
      message: result.message || 'OTP resent successfully to your email',
      cooldownSeconds: result.cooldownSeconds || 30
    });
  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    res.status(error.status || 400).json({
      message: error.message || 'Failed to resend OTP',
      cooldownRemaining: error.cooldownRemaining
    });
  }
};

// @desc    Register a new employee (after OTP verification)
// @route   POST /api/employee/auth/register
// @access  Public
const registerEmployee = async (req, res) => {
  try {
    const { name, email, password, mobile, location, otp } = req.body;

    // Check for empty fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    if (!otp || String(otp).length < 4) {
      return res.status(400).json({ message: 'Please enter the 4-digit OTP sent to your email' });
    }

    // Verify email OTP before creating account
    try {
      await verifyOtp({ email, otp, purpose: 'registration:employee' });
    } catch (otpError) {
      return res.status(otpError.status || 400).json({
        message: otpError.message || 'Invalid or expired OTP',
      });
    }

    // Check if employee exists
    const employeeExists = await Employee.findOne({ email });

    if (employeeExists) {
      return res.status(400).json({ message: 'Employee already exists with this email' });
    }

    if (mobile && mobile.trim()) {
      const mobileExists = await Employee.findOne({ mobile: mobile.trim() });
      if (mobileExists) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }
    }

    // Create employee
    const employee = await Employee.create({
      name: name || 'Anonymous User',
      email,
      password,
      mobile: mobile ? mobile.trim() : undefined,
      location
    });

    if (employee) {
      res.status(201).json({
        _id: employee.id,
        name: employee.name,
        email: employee.email,
        mobile: employee.mobile,
        location: employee.location,
        isNewUser: true,
        isOnboardingCompleted: false,
        onboardingStep: 1,
        hasProfile: false,
        token: generateToken(employee._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid employee data' });
    }
  } catch (error) {
    console.error("Register Backend Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
};

// @desc    Quick register candidate for direct apply link / simplified auth
// @route   POST /api/employee/auth/quick-register
// @access  Public
const quickRegisterCandidate = async (req, res) => {
  try {
    const { name, email, password, mobile, location } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your email address' });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await Employee.findOne({ 
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email already exists. Please login to continue.' 
      });
    }

    if (mobile && String(mobile).trim()) {
      const cleanMobile = String(mobile).trim();
      const mobileExists = await Employee.findOne({ mobile: cleanMobile });
      if (mobileExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'This phone number is already registered with another account.' 
        });
      }
    }

    const employee = await Employee.create({
      name: (name && String(name).trim()) ? String(name).trim() : cleanEmail.split('@')[0],
      email: cleanEmail,
      password,
      mobile: mobile ? String(mobile).trim() : '',
      location: location ? String(location).trim() : ''
    });

    res.status(201).json({
      success: true,
      _id: employee.id,
      name: employee.name,
      email: employee.email,
      mobile: employee.mobile,
      location: employee.location,
      isNewUser: true,
      isOnboardingCompleted: false,
      onboardingStep: 1,
      hasProfile: false,
      token: generateToken(employee._id),
      profile: {
        firstName: employee.name ? employee.name.split(' ')[0] : '',
        lastName: employee.name && employee.name.split(' ').length > 1 ? employee.name.split(' ').slice(1).join(' ') : '',
        email: employee.email,
        phone: employee.mobile || '',
        brief: '',
        avatar: '',
        designation: '',
        totalExperience: '',
        isFresher: true,
        qualifications: [],
        experience: [],
        professionalDetails: { currentLocation: employee.location || '' },
        resume: '',
        coverLetter: ''
      }
    });
  } catch (error) {
    console.error("Quick Register Error:", error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Authenticate an employee
// @route   POST /api/employee/auth/login
// @access  Public
const loginEmployee = async (req, res) => {
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
    const employee = await Employee.findOne({ 
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    }).select('+password');

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        field: 'email', 
        message: "We couldn't find an account with this email. Please register first to continue." 
      });
    }

    if (!employee.password) {
      return res.status(400).json({ 
        success: false, 
        field: 'email', 
        message: 'This email is linked to a Google account. Please log in with Google.' 
      });
    }

    // Check if password matches
    const isMatch = await employee.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        field: 'password', 
        message: 'Invalid password. Please check and try again.' 
      });
    }

    await Employee.findByIdAndUpdate(employee._id, { lastLogin: new Date() });

    const isCompleted = employee.isOnboardingCompleted !== undefined 
      ? Boolean(employee.isOnboardingCompleted) 
      : Boolean(employee.designation || employee.resume || (employee.qualifications && employee.qualifications.length > 0));
    const currentOnboardingStep = employee.onboardingStep || 1;

    res.json({
      success: true,
      _id: employee.id,
      name: employee.name,
      email: employee.email,
      mobile: employee.mobile,
      location: employee.location,
      isOnboardingCompleted: isCompleted,
      onboardingStep: currentOnboardingStep,
      hasProfile: isCompleted,
      token: generateToken(employee._id),
      profile: {
        firstName: employee.name ? employee.name.split(' ')[0] : '',
        lastName: employee.name && employee.name.split(' ').length > 1 ? employee.name.split(' ').slice(1).join(' ') : '',
        email: employee.email,
        phone: employee.mobile,
        brief: employee.brief || '',
        avatar: employee.avatar || '',
        designation: employee.designation || '',
        totalExperience: employee.totalExperience || '',
        isFresher: employee.isFresher,
        qualifications: employee.qualifications || [],
        experience: employee.experience || [],
        professionalDetails: employee.professionalDetails || {
          currentLocation: employee.location
        },
        resume: employee.resume || '',
        coverLetter: employee.coverLetter || ''
      }
    });
  } catch (error) {
    console.error("Login Backend Error:", error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Send OTP to email for login
// @route   POST /api/employee/auth/login/send-otp
// @access  Public
const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please enter your email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const employee = await Employee.findOne({ email: cleanEmail });

    if (!employee) {
      return res.status(404).json({ message: "We couldn't find an account with this email. Please register first to continue." });
    }

    const result = await sendOtp({
      email: employee.email,
      name: employee.name || 'Employee',
      purpose: 'login:employee',
    });

    res.json({
      success: true,
      message: result.message || 'OTP sent successfully to your email.',
      email: employee.email,
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('sendLoginOtp error:', error.message);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to send OTP.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Resend OTP for email login
// @route   POST /api/employee/auth/login/resend-otp
// @access  Public
const resendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required to resend OTP.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const employee = await Employee.findOne({ email: cleanEmail });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found with this email.' });
    }

    const result = await resendOtp({
      email: employee.email,
      name: employee.name || 'Employee',
      purpose: 'login:employee',
    });

    res.json({
      success: true,
      message: result.message || 'A new OTP has been sent to your email.',
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('resendLoginOtp error:', error.message);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to resend OTP.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Verify OTP and log in employee
// @route   POST /api/employee/auth/login/verify-otp
// @access  Public
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide both email and OTP.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const employee = await Employee.findOne({ email: cleanEmail });

    if (!employee) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    // Verify OTP
    try {
      await verifyOtp({
        email: employee.email,
        otp: String(otp).trim(),
        purpose: 'login:employee',
        consume: true,
      });
    } catch (otpErr) {
      return res.status(otpErr.status || 400).json({
        message: otpErr.message || 'Invalid or expired OTP. Please try again.',
      });
    }

    await Employee.findByIdAndUpdate(employee._id, { lastLogin: new Date() });

    const isCompleted = employee.isOnboardingCompleted !== undefined 
      ? Boolean(employee.isOnboardingCompleted) 
      : Boolean(employee.designation || employee.resume || (employee.qualifications && employee.qualifications.length > 0));
    const currentOnboardingStep = employee.onboardingStep || 1;

    res.json({
      _id: employee.id,
      name: employee.name,
      email: employee.email,
      mobile: employee.mobile,
      location: employee.location,
      isOnboardingCompleted: isCompleted,
      onboardingStep: currentOnboardingStep,
      hasProfile: isCompleted,
      token: generateToken(employee._id),
      profile: {
        firstName: employee.name ? employee.name.split(' ')[0] : '',
        lastName: employee.name && employee.name.split(' ').length > 1 ? employee.name.split(' ').slice(1).join(' ') : '',
        email: employee.email,
        phone: employee.mobile,
        brief: employee.brief || '',
        avatar: employee.avatar || '',
        designation: employee.designation || '',
        totalExperience: employee.totalExperience || '',
        isFresher: employee.isFresher,
        qualifications: employee.qualifications || [],
        experience: employee.experience || [],
        professionalDetails: employee.professionalDetails || {
          currentLocation: employee.location
        },
        resume: employee.resume || '',
        coverLetter: employee.coverLetter || ''
      }
    });
  } catch (error) {
    console.error('verifyLoginOtp error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check if mobile exists and return employee
// @route   POST /api/employee/auth/check-mobile
// @access  Public
const checkMobile = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Please provide mobile number' });
    }

    const employee = await Employee.findOne({ mobile });
    if (!employee) {
      return res.status(404).json({ message: 'Mobile number not registered' });
    }

    res.json({ success: true, name: employee.name });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check if email or mobile exists for registration/login
// @route   POST /api/employee/auth/check-existence
// @access  Public
const checkExistence = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    
    if (email) {
      const emailExists = await Employee.findOne({ email });
      if (emailExists) return res.status(400).json({ message: 'Employee already exists with this email', field: 'email' });
    }
    
    if (mobile) {
      const mobileExists = await Employee.findOne({ mobile });
      if (mobileExists) return res.status(400).json({ message: 'Phone number already exists', field: 'mobile' });
    }

    res.json({ message: 'No conflicts' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check if mobile is available or belongs to current employee
// @route   POST /api/employee/auth/check-mobile-available
// @access  Public
const checkMobileAvailable = async (req, res) => {
  try {
    const { mobile, currentEmail, currentUserId } = req.body;
    if (!mobile || String(mobile).trim().length < 10) {
      return res.json({ available: true });
    }

    const cleanMobile = String(mobile).trim();
    let query = { mobile: cleanMobile };

    if (currentUserId) {
      query._id = { $ne: currentUserId };
    } else if (currentEmail) {
      query.email = { $ne: String(currentEmail).trim().toLowerCase() };
    }

    const existing = await Employee.findOne(query);
    if (existing) {
      return res.json({ 
        available: false, 
        message: 'This phone number is already registered with another account.' 
      });
    }

    return res.json({ available: true });
  } catch (error) {
    res.status(500).json({ available: true, error: error.message });
  }
};

// @desc    Request OTP for forgot password
// @route   POST /api/employee/auth/forgot-password/otp
// @access  Public
const forgotPasswordOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ message: 'Please provide mobile number or email' });
    }

    const employee = await Employee.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { mobile: identifier.trim() }]
    }).select('+password');

    if (!employee) {
      return res.status(404).json({ message: 'No account found with this email or mobile' });
    }

    if (!employee.password && employee.authProvider === 'google') {
      return res.status(400).json({ message: 'This account was created with Google. Please log in with Google instead.' });
    }

    const result = await sendOtp({
      email: employee.email,
      name: employee.name,
      purpose: 'forgot_password:employee'
    });

    res.json({
      message: result.message || 'Password reset OTP sent to your registered email',
      email: employee.email,
      cooldownSeconds: result.cooldownSeconds || 30
    });
  } catch (error) {
    console.error('Employee Forgot Password OTP error:', error.message);
    res.status(error.status || 500).json({
      message: error.message || 'Server error',
      cooldownRemaining: error.cooldownRemaining
    });
  }
};

// @desc    Resend OTP for forgot password
// @route   POST /api/employee/auth/forgot-password/resend-otp
// @access  Public
const resendForgotPasswordOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ message: 'Please provide mobile number or email' });
    }

    const employee = await Employee.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { mobile: identifier.trim() }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await resendOtp({
      email: employee.email,
      name: employee.name,
      purpose: 'forgot_password:employee'
    });

    res.json({
      message: result.message || 'OTP resent successfully to your email',
      cooldownSeconds: result.cooldownSeconds || 30
    });
  } catch (error) {
    console.error('Employee Resend Forgot Password OTP error:', error.message);
    res.status(error.status || 400).json({
      message: error.message || 'Failed to resend OTP',
      cooldownRemaining: error.cooldownRemaining
    });
  }
};

// @desc    Verify OTP for forgot password
// @route   POST /api/employee/auth/forgot-password/verify-otp
// @access  Public
const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP are required' });
    }

    const employee = await Employee.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { mobile: identifier.trim() }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    await verifyOtp({
      email: employee.email,
      otp,
      purpose: 'forgot_password:employee',
      consume: false // Do not consume yet so resetPassword can finalize
    });

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message || 'Invalid or expired OTP' });
  }
};

// @desc    Reset password
// @route   POST /api/employee/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { identifier, password, otp } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const employee = await Employee.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { mobile: identifier.trim() }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify and consume OTP if provided
    if (otp) {
      await verifyOtp({
        email: employee.email,
        otp,
        purpose: 'forgot_password:employee',
        consume: true
      });
    }

    employee.password = password;
    await employee.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Google Auth (Login/Signup)
// @route   POST /api/employee/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({ message: 'Token missing' });
    }

    const decodedToken = await verifyIdToken(id_token);
    const { email, name, picture, sub, uid } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email not found in Google account' });
    }

    let isNewUser = false;
    let employee = await Employee.findOne({ email });

    if (!employee) {
      // Register
      isNewUser = true;
      employee = await Employee.create({
        name: name || email.split('@')[0],
        email,
        avatar: picture || '',
        mobile: '',
        location: '',
        googleId: sub || uid || '',
        authProvider: 'google',
        isOnboardingCompleted: false,
        onboardingStep: 1,
      });
    } else if (!employee.googleId) {
      employee.googleId = sub || uid || '';
      if (!employee.authProvider) employee.authProvider = 'google';
      employee.lastLogin = new Date();
      await employee.save();
    } else {
      employee.lastLogin = new Date();
      await employee.save();
    }

    const isCompleted = employee.isOnboardingCompleted !== undefined 
      ? Boolean(employee.isOnboardingCompleted) 
      : Boolean(employee.designation || employee.resume || (employee.qualifications && employee.qualifications.length > 0));
    const currentOnboardingStep = employee.onboardingStep || 1;

    res.json({
      success: true,
      isNewUser: isNewUser || !isCompleted,
      isOnboardingCompleted: isCompleted,
      onboardingStep: currentOnboardingStep,
      hasProfile: isCompleted,
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      token: generateToken(employee._id)
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current employee security & authentication status
// @route   GET /api/employee/auth/security
// @access  Private
const getSecurityStatus = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id).select('+password');
    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasPassword = Boolean(employee.password && employee.password.length > 0);
    const isGoogleConnected = Boolean(employee.googleId || employee.authProvider === 'google' || !employee.password);

    res.json({
      success: true,
      email: employee.email,
      hasPassword,
      isGoogleConnected,
      authProvider: employee.authProvider || (hasPassword ? 'local' : 'google'),
    });
  } catch (error) {
    console.error('getSecurityStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Set password for accounts without a password (e.g. Google-authenticated users)
// @route   POST /api/employee/auth/set-password
// @access  Private
const setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const employee = await Employee.findById(req.employee._id).select('+password');
    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    employee.password = newPassword;
    await employee.save();

    res.json({
      success: true,
      message: 'Password set successfully. You can now sign in using your email and password or continue with Google.',
      hasPassword: true,
    });
  } catch (error) {
    console.error('setPassword error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Send OTP to change account password
// @route   POST /api/employee/auth/change-password/send-otp
// @access  Private
const sendChangePasswordOtp = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: 'Please provide your current password.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    const employee = await Employee.findById(req.employee._id).select('+password');
    if (!employee) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!employee.password) {
      return res.status(400).json({ message: 'No password is set on this account. Please use "Set Password" instead.' });
    }

    const isMatch = await employee.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password. Please try again.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from your current password.' });
    }

    const result = await sendOtp({
      email: employee.email,
      name: employee.name || 'Employee',
      purpose: 'change_password:employee',
    });

    res.json({
      success: true,
      message: result.message || 'OTP sent successfully to your registered email.',
      email: employee.email,
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('sendChangePasswordOtp error:', error.message);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to send OTP.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Resend OTP for change password
// @route   POST /api/employee/auth/change-password/resend-otp
// @access  Private
const resendChangePasswordOtp = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id);
    if (!employee) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const result = await resendOtp({
      email: employee.email,
      name: employee.name || 'Employee',
      purpose: 'change_password:employee',
    });

    res.json({
      success: true,
      message: result.message || 'A new OTP has been sent to your registered email.',
      cooldownSeconds: result.cooldownSeconds || 30,
    });
  } catch (error) {
    console.error('resendChangePasswordOtp error:', error.message);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to resend OTP.',
      cooldownRemaining: error.cooldownRemaining,
    });
  }
};

// @desc    Change password for accounts that already have a password set (requires OTP)
// @route   POST /api/employee/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both your current and new password.' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'Please provide the OTP code sent to your email.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    const employee = await Employee.findById(req.employee._id).select('+password');
    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!employee.password) {
      return res.status(400).json({ message: 'No password is set on this account. Please use "Set Password" instead.' });
    }

    const isMatch = await employee.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password. Please try again.' });
    }

    // Verify OTP
    try {
      await verifyOtp({
        email: employee.email,
        otp: String(otp).trim(),
        purpose: 'change_password:employee',
        consume: true,
      });
    } catch (otpErr) {
      return res.status(otpErr.status || 400).json({
        message: otpErr.message || 'Invalid or expired OTP. Please try again.',
      });
    }

    employee.password = newPassword;
    await employee.save();

    res.json({
      success: true,
      message: 'Your password has been updated successfully.',
      hasPassword: true,
    });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  registerEmployee,
  quickRegisterCandidate,
  loginEmployee,
  sendLoginOtp,
  resendLoginOtp,
  verifyLoginOtp,
  googleAuth,
  checkExistence,
  checkMobile,
  checkMobileAvailable,
  sendRegistrationOtp,
  resendRegistrationOtp,
  forgotPasswordOtp,
  resendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  getSecurityStatus,
  setPassword,
  sendChangePasswordOtp,
  resendChangePasswordOtp,
  changePassword
};
