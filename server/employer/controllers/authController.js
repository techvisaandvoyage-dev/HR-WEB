const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');
const { verifyIdToken } = require('../../config/firebaseAdmin');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// @desc    Register a new employer
// @route   POST /api/employer/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { 
      mobile, accountType, fullName, email, password,
      hiringFor, companyName, industry, employees, designation, location, aboutCompany, website
    } = req.body;

    // Check if user exists
    const userExists = await Employer.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Create user
    const employer = await Employer.create({
      mobile, accountType, fullName, email, password,
      hiringFor, companyName, industry, employees, designation, location, aboutCompany, website
    });

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

    // Check for user email
    const employer = await Employer.findOne({ email }).select('+password');

    if (!employer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await employer.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
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
      return res.status(400).json({ message: 'Please provide mobile number or email' });
    }

    const employer = await Employer.findOne({
      $or: [{ email: identifier }, { mobile: identifier }]
    });

    if (!employer) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a real app, send actual OTP via email/SMS here
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/employer/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const employer = await Employer.findOne({
      $or: [{ email: identifier }, { mobile: identifier }]
    });

    if (!employer) {
      return res.status(404).json({ message: 'User not found' });
    }

    employer.password = password;
    await employer.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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

    let employer = await Employer.findOne({ email });

    if (!employer) {
      // Register
      employer = await Employer.create({
        fullName: name || email.split('@')[0],
        email,
        mobile: '',
        companyName: '',
        industry: '',
      });
    }

    res.json({
      success: true,
      _id: employer._id,
      fullName: employer.fullName,
      email: employer.email,
      token: generateToken(employer._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
