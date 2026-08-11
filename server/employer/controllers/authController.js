const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');

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
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
// @access  Private (Needs auth middleware, but we'll mock it for now if middleware isn't present)
exports.getMe = async (req, res) => {
  try {
    // Assuming you have an auth middleware that sets req.user
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    
    const employer = await Employer.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: employer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
