const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const { verifyIdToken } = require('../../config/firebaseAdmin');
const { sendOtp, verifyOtp, resendOtp } = require('../../utils/email');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Send registration OTP to email via MSG91
// @route   POST /api/employee/auth/send-otp
// @access  Public
const sendRegistrationOtp = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    if (!email || !mobile) {
      return res.status(400).json({ message: 'Email and mobile are required' });
    }

    const emailExists = await Employee.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Employee already exists with this email', field: 'email' });
    }

    const mobileExists = await Employee.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ message: 'Phone number already exists', field: 'mobile' });
    }

    await sendOtp({ email, name: email.split('@')[0] });
    res.json({ message: 'OTP sent successfully to your email' });
  } catch (error) {
    console.error('Send OTP Error:', error.msg91 || error.message);
    res.status(400).json({
      message: error.message || 'Failed to send OTP',
      details: error.msg91 || undefined
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

    await resendOtp({ email, name: email.split('@')[0] });
    return res.json({ message: 'OTP resent successfully to your email' });
  } catch (error) {
    console.error('Resend OTP Error:', error.msg91 || error.message);
    res.status(400).json({
      message: error.message || 'Failed to resend OTP',
      details: error.msg91 || undefined
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
    if (!email || !password || !mobile) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    if (!otp || String(otp).length < 4) {
      return res.status(400).json({ message: 'Please enter the 4-digit OTP sent to your email' });
    }

    // Verify email OTP before creating account
    try {
      await verifyOtp({ email, otp });
    } catch (otpError) {
      return res.status(400).json({
        message: otpError.message || 'Invalid or expired OTP',
        details: otpError.msg91 || undefined
      });
    }

    // Check if employee exists
    const employeeExists = await Employee.findOne({ email });

    if (employeeExists) {
      return res.status(400).json({ message: 'Employee already exists with this email' });
    }

    const mobileExists = await Employee.findOne({ mobile });

    if (mobileExists) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    // Create employee
    const employee = await Employee.create({
      name: name || 'Anonymous User',
      email,
      password,
      mobile,
      location
    });

    if (employee) {
      res.status(201).json({
        _id: employee.id,
        name: employee.name,
        email: employee.email,
        mobile: employee.mobile,
        location: employee.location,
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

// @desc    Authenticate an employee
// @route   POST /api/employee/auth/login
// @access  Public
const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const employee = await Employee.findOne({ email }).select('+password');

    if (!employee) {
      return res.status(404).json({ message: 'We couldn\'t find an account with this email. Please register first to continue.' });
    }

    if (!employee.password) {
      return res.status(401).json({ message: 'This email is linked to a Google account. Please log in with Google.' });
    }

    // Check if password matches
    const isMatch = await employee.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.json({
      _id: employee.id,
      name: employee.name,
      email: employee.email,
      mobile: employee.mobile,
      location: employee.location,
      token: generateToken(employee._id),
      profile: {
        firstName: employee.name.split(' ')[0],
        lastName: employee.name.split(' ').slice(1).join(' '),
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
      $or: [{ email: identifier }, { mobile: identifier }]
    }).select('+password');

    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!employee.password) {
      return res.status(400).json({ message: 'This account was created with Google. Please log in with Google instead.' });
    }

    // In a real app, send actual OTP via email/SMS here
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/employee/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const employee = await Employee.findOne({
      $or: [{ email: identifier }, { mobile: identifier }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }

    employee.password = password;
    await employee.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
    const { email, name, picture } = decodedToken;

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
      });
    }

    res.json({
      success: true,
      isNewUser,
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      token: generateToken(employee._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerEmployee,
  loginEmployee,
  googleAuth,
  checkExistence,
  sendRegistrationOtp,
  resendRegistrationOtp,
  forgotPasswordOtp,
  resetPassword
};
