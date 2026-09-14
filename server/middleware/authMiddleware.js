const jwt = require('jsonwebtoken');
const Employee = require('../employee/models/Employee');

const protectEmployee = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.employee = await Employee.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.warn("Auth Middleware warning (invalid or expired token):", error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const Employer = require('../employer/models/Employer');

const protectEmployer = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token || token === 'undefined' || token === 'null') {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      req.user = await Employer.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      console.warn("Auth Middleware warning (invalid or expired token):", error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protectEmployee, protectEmployer };
