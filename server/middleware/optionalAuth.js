const jwt = require('jsonwebtoken');
const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');

/**
 * Optional Auth Middleware
 * If a valid token is present in Authorization header:
 * - Decodes token
 * - Looks up user in Employee or Employer collection
 * - Attaches req.user and req.userType ('employee' | 'employer' | 'consultant')
 * If no token or token is invalid/expired:
 * - Leaves req.user = null and sets req.userType = 'guest'
 * Never blocks the request with 401.
 */
const optionalAuth = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token || token === 'undefined' || token === 'null') {
    req.user = null;
    req.userType = 'guest';
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    if (!decoded || !decoded.id) {
      req.user = null;
      req.userType = 'guest';
      return next();
    }

    // 1. Try finding in Employee collection
    const employee = await Employee.findById(decoded.id).select('name email mobile');
    if (employee) {
      req.user = employee;
      req.userType = 'employee';
      return next();
    }

    // 2. Try finding in Employer collection
    const employer = await Employer.findById(decoded.id).select('fullName email mobile isConsultant');
    if (employer) {
      req.user = employer;
      req.userType = employer.isConsultant ? 'consultant' : 'employer';
      return next();
    }

    // 3. User not found in either collection
    req.user = null;
    req.userType = 'guest';
    return next();
  } catch (error) {
    // Expired or invalid token - proceed gracefully as guest
    req.user = null;
    req.userType = 'guest';
    return next();
  }
};

module.exports = optionalAuth;
