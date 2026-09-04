const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const { verifyIdToken } = require('../../config/firebaseAdmin');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new employee
// @route   POST /api/employee/auth/register
// @access  Public
const registerEmployee = async (req, res) => {
  try {
    const { name, email, password, mobile, location } = req.body;

    // Check for empty fields
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if employee exists
    const employeeExists = await Employee.findOne({ email });

    if (employeeExists) {
      return res.status(400).json({ message: 'Employee already exists with this email' });
    }

    // Create employee
    const employee = await Employee.create({
      name,
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

// @desc    Check if mobile exists for OTP login
// @route   POST /api/employee/auth/check-mobile
// @access  Public
const checkMobile = async (req, res) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile) {
      return res.status(400).json({ message: 'Please provide a mobile number' });
    }

    const employee = await Employee.findOne({ mobile });

    if (!employee) {
      return res.status(404).json({ message: 'This no. is not exist' });
    }

    res.json({ message: 'Mobile exists' });
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
    });

    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
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
  checkMobile,
  forgotPasswordOtp,
  resetPassword
};
