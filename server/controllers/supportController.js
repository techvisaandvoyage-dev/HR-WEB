const mongoose = require('mongoose');
const SupportProblem = require('../models/SupportProblem');
const SupportRequest = require('../models/SupportRequest');
const SupportQuickReply = require('../models/SupportQuickReply');
const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');
const { getIO } = require('../socket');

// Strip HTML tags and limit length
const sanitizeString = (str = '', maxLength = 250) => {
  return String(str)
    .replace(/<[^>]*>?/gm, '')
    .trim()
    .slice(0, maxLength);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email || '').trim().toLowerCase());
};

// Validate phone number (digits, optional +, 10-15 digits)
const isValidPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

// Get client IP address
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '';
};

/**
 * @desc    Get active support problems for public selection
 * @route   GET /api/support/problems
 * @access  Public
 */
exports.getPublicProblems = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.role && req.query.role !== 'all') {
      filter.role = { $in: [req.query.role.toLowerCase(), 'all'] };
    }

    const problems = await SupportProblem.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .select('_id title role order')
      .lean();

    return res.status(200).json({
      success: true,
      data: problems,
    });
  } catch (error) {
    console.error('getPublicProblems error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch support problems',
      error: error.message,
    });
  }
};

/**
 * @desc    Submit a support request
 * @route   POST /api/support/requests
 * @access  Public (Optional Auth)
 */
exports.createSupportRequest = async (req, res) => {
  try {
    const { problemId, customProblemText, description } = req.body;
    const customText = (customProblemText || description || '').trim();

    if (!problemId && !customText) {
      return res.status(400).json({
        success: false,
        message: 'Please select a problem from the list or type your issue.',
      });
    }

    let resolvedProblemId = null;
    let resolvedProblemText = '';

    if (problemId) {
      const problem = await SupportProblem.findById(problemId);
      if (problem && problem.isActive) {
        resolvedProblemId = problem._id;
        resolvedProblemText = problem.title;
      }
    }

    if (!resolvedProblemText) {
      resolvedProblemText = customText.slice(0, 150);
      try {
        const fallback = await SupportProblem.findOne({
          $or: [{ title: /other/i }, { role: 'all' }],
        });
        if (fallback) resolvedProblemId = fallback._id;
      } catch (_) {}
    } else if (customText && resolvedProblemText.toLowerCase().includes('other')) {
      resolvedProblemText = `Other: ${customText.slice(0, 120)}`;
    }

    const clientIp = getClientIp(req);
    let finalUserType = 'guest';
    let finalUserId = null;
    let finalName = '';
    let finalEmail = '';
    let finalPhone = '';

    // 2. Resolve Contact Details (prefer user-typed values, fall back to logged-in user profile if blank)
    const { name, email, phone, countryCode } = req.body;

    if (req.user && req.userType && req.userType !== 'guest') {
      finalUserType = req.userType;
      finalUserId = req.user._id;
      finalName = sanitizeString(name, 100) || (req.userType === 'employee' ? req.user.name : req.user.fullName) || 'User';
      finalEmail = String(email || req.user.email || '').toLowerCase().trim();
      finalPhone = sanitizeString(phone, 20) || req.user.mobile || '';
    } else {
      finalName = sanitizeString(name, 100);
      finalEmail = String(email || '').trim().toLowerCase();
      finalPhone = sanitizeString(phone, 20);
    }

    // 3. Validation: Name, Email & Phone must always be valid
    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your full name.',
        field: 'name',
      });
    }

    if (!finalEmail || !isValidEmail(finalEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
        field: 'email',
      });
    }

    if (!finalPhone || !isValidPhone(finalPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number.',
        field: 'phone',
      });
    }

    // 4. Spam protection: Check identical pending request (same user/email + same problem)
    const pendingQuery = {
      status: 'pending',
    };
    if (resolvedProblemId) {
      pendingQuery.problemId = resolvedProblemId;
    } else {
      pendingQuery.problemText = resolvedProblemText;
    }

    if (finalUserId) {
      pendingQuery.$or = [
        { userId: finalUserId },
        { email: finalEmail },
      ];
    } else {
      pendingQuery.email = finalEmail;
    }

    const existingPending = await SupportRequest.findOne(pendingQuery);
    if (existingPending) {
      return res.status(429).json({
        success: false,
        message: 'You already have an open support request for this problem. Our team will contact you soon.',
      });
    }

    // 5. Spam protection: Max 15 requests per hour per user / email / IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyOrConditions = [];

    if (finalUserId) {
      hourlyOrConditions.push({ userId: finalUserId });
    }
    if (finalEmail) {
      hourlyOrConditions.push({ email: finalEmail });
    }
    if (clientIp) {
      hourlyOrConditions.push({ ip: clientIp });
    }

    const hourlyFilter = {
      createdAt: { $gte: oneHourAgo },
      ...(hourlyOrConditions.length > 0 ? { $or: hourlyOrConditions } : {}),
    };

    const recentRequestsCount = await SupportRequest.countDocuments(hourlyFilter);
    if (recentRequestsCount >= 15) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. You have reached the maximum of 15 support requests per hour. Please try again later.',
      });
    }

    // Initial messages with user custom text if provided
    const initialMessages = [];
    if (customText) {
      initialMessages.push({
        sender: 'user',
        text: customText,
        createdAt: new Date(),
      });
    }

    // 6. Create the support request
    const newRequest = await SupportRequest.create({
      problemId: resolvedProblemId,
      problemText: resolvedProblemText,
      description: customText,
      userType: finalUserType,
      userId: finalUserId,
      name: finalName,
      email: finalEmail,
      phone: finalPhone,
      ip: clientIp,
      status: 'pending',
      messages: initialMessages,
    });

    try {
      const io = getIO();
      if (io) {
        io.to('support_admin_room').emit('support_request_new', {
          _id: newRequest._id,
          name: newRequest.name,
          email: newRequest.email,
          phone: newRequest.phone,
          problemText: newRequest.problemText,
          description: newRequest.description,
          userType: newRequest.userType,
          status: newRequest.status,
          messages: newRequest.messages,
          createdAt: newRequest.createdAt,
        });
      }
    } catch (sockErr) {
      console.warn('Socket emit error in createSupportRequest:', sockErr.message);
    }

    // 7. Auto-update user account profile across the 3 verticals (Employee, Employer, Consultant)
    let savedMobileDigits = '';
    let savedCountryCode = countryCode || '+91';

    try {
      let rawDigits = String(finalPhone || '').replace(/\D/g, '');
      if (finalPhone.includes('+')) {
        const parts = finalPhone.trim().split(/\s+/);
        if (parts[0] && parts[0].startsWith('+')) {
          savedCountryCode = parts[0];
          rawDigits = parts.slice(1).join('').replace(/\D/g, '');
        }
      }
      if (rawDigits.length > 10 && savedCountryCode === '+91') {
        rawDigits = rawDigits.slice(-10);
      }

      if (rawDigits && rawDigits.length >= 10) {
        savedMobileDigits = rawDigits;

        // If authenticated with Bearer token
        if (req.user && req.user._id) {
          if (req.userType === 'employee') {
            await Employee.findByIdAndUpdate(req.user._id, {
              $set: { mobile: rawDigits, countryCode: savedCountryCode }
            });
          } else if (req.userType === 'employer' || req.userType === 'consultant') {
            await Employer.findByIdAndUpdate(req.user._id, {
              $set: { mobile: rawDigits, countryCode: savedCountryCode }
            });
          }
        } else if (finalEmail) {
          // If token wasn't present or expired, update by email & target role
          const targetRole = req.body.targetRole;
          if (targetRole === 'employee' || targetRole === 'candidate') {
            await Employee.findOneAndUpdate(
              { email: finalEmail },
              { $set: { mobile: rawDigits, countryCode: savedCountryCode } }
            );
          } else if (targetRole === 'employer' || targetRole === 'consultant') {
            await Employer.findOneAndUpdate(
              { email: finalEmail },
              { $set: { mobile: rawDigits, countryCode: savedCountryCode } }
            );
          }
        }
      }
    } catch (profErr) {
      console.warn('Auto-update user profile phone error:', profErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Your request has been submitted. Our team will contact you soon.',
      updatedMobile: savedMobileDigits,
      countryCode: savedCountryCode,
      data: {
        _id: newRequest._id,
        problemText: newRequest.problemText,
        userType: newRequest.userType,
        status: newRequest.status,
        createdAt: newRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('createSupportRequest error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit support request. Please try again.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update phone number for user profile (employee, employer, consultant)
 * @route   POST /api/support/update-phone
 * @access  Public (Optional Auth)
 */
exports.updateUserPhone = async (req, res) => {
  try {
    const { phone, countryCode, email, targetRole } = req.body;
    let rawDigits = String(phone || '').replace(/\D/g, '');
    let cc = countryCode || '+91';

    if (phone && phone.includes('+')) {
      const parts = phone.trim().split(/\s+/);
      if (parts[0] && parts[0].startsWith('+')) {
        cc = parts[0];
        rawDigits = parts.slice(1).join('').replace(/\D/g, '');
      }
    }
    if (rawDigits.length > 10 && cc === '+91') {
      rawDigits = rawDigits.slice(-10);
    }

    if (cc === '+91' ? !/^[6-9]\d{9}$/.test(rawDigits) : !/^\d{7,15}$/.test(rawDigits)) {
      return res.status(400).json({
        success: false,
        message: cc === '+91' ? 'Please enter a valid 10-digit mobile number.' : 'Please enter a valid mobile number.',
      });
    }

    // 1. If authenticated via Bearer token
    if (req.user && req.user._id) {
      if (req.userType === 'employee') {
        await Employee.findByIdAndUpdate(req.user._id, {
          $set: { mobile: rawDigits, countryCode: cc },
        });
      } else if (req.userType === 'employer' || req.userType === 'consultant') {
        await Employer.findByIdAndUpdate(req.user._id, {
          $set: { mobile: rawDigits, countryCode: cc },
        });
      }
    } else if (email) {
      // 2. Fallback by email & role
      const cleanEmail = email.trim().toLowerCase();
      if (targetRole === 'employee' || targetRole === 'candidate') {
        await Employee.findOneAndUpdate(
          { email: cleanEmail },
          { $set: { mobile: rawDigits, countryCode: cc } }
        );
      } else if (targetRole === 'employer' || targetRole === 'consultant') {
        await Employer.findOneAndUpdate(
          { email: cleanEmail },
          { $set: { mobile: rawDigits, countryCode: cc } }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Mobile number updated successfully.',
      mobile: rawDigits,
      countryCode: cc,
    });
  } catch (error) {
    console.error('updateUserPhone error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update mobile number.',
      error: error.message,
    });
  }
};

/**
 * Idempotent Seed for initial predefined problems
 */
exports.seedSupportProblems = async () => {
  try {
    const hasEmployee = await SupportProblem.exists({ role: 'employee' });
    const hasEmployer = await SupportProblem.exists({ role: 'employer' });
    const hasConsultant = await SupportProblem.exists({ role: 'consultant' });

    if (hasEmployee && hasEmployer && hasConsultant) return;

    // Seed role-specific problems
    const roleProblems = [
      // Candidate / Employee Problems
      { title: 'I am unable to login', role: 'employee', order: 0, isActive: true },
      { title: 'OTP not received', role: 'employee', order: 1, isActive: true },
      { title: 'Problem in registration / onboarding', role: 'employee', order: 2, isActive: true },
      { title: 'Profile / resume upload issue', role: 'employee', order: 3, isActive: true },
      { title: 'Job search or application issue', role: 'employee', order: 4, isActive: true },
      { title: 'Other issue, please contact me', role: 'employee', order: 5, isActive: true },

      // Employer Problems
      { title: 'I am unable to login', role: 'employer', order: 0, isActive: true },
      { title: 'OTP not received', role: 'employer', order: 1, isActive: true },
      { title: 'Problem in employer registration', role: 'employer', order: 2, isActive: true },
      { title: 'Unable to post or edit a job', role: 'employer', order: 3, isActive: true },
      { title: 'Payment / subscription related issue', role: 'employer', order: 4, isActive: true },
      { title: 'Candidate search or messaging issue', role: 'employer', order: 5, isActive: true },
      { title: 'Other issue, please contact me', role: 'employer', order: 6, isActive: true },

      // Consultant Problems
      { title: 'I am unable to login', role: 'consultant', order: 0, isActive: true },
      { title: 'OTP not received', role: 'consultant', order: 1, isActive: true },
      { title: 'Problem in consultant registration', role: 'consultant', order: 2, isActive: true },
      { title: 'Unable to post a job for clients', role: 'consultant', order: 3, isActive: true },
      { title: 'Consultant verification inquiry', role: 'consultant', order: 4, isActive: true },
      { title: 'Payment / billing related issue', role: 'consultant', order: 5, isActive: true },
      { title: 'Other issue, please contact me', role: 'consultant', order: 6, isActive: true },
    ];

    // Clean up generic problems if replacing
    await SupportProblem.deleteMany({ role: { $in: [null, undefined, 'all'] } });
    await SupportProblem.deleteMany({ role: { $exists: false } });

    await SupportProblem.insertMany(roleProblems);
    console.log('✅ [Support] Seeded role-categorized support problems successfully.');
  } catch (err) {
    console.warn('⚠️ [Support] SupportProblem seed warning:', err.message);
  }
};

// Default quick follow-up options
const DEFAULT_QUICK_REPLIES = [
  "Yes, my issue is resolved. Thank you!",
  "Still facing issue with OTP verification",
  "I tried again, but still getting error",
  "Please call me on my phone number",
  "Waiting for resolution, please check soon",
  "Please unlock my account, still showing locked"
];

/**
 * Idempotent Seed for initial predefined quick replies
 */
exports.seedSupportQuickReplies = async () => {
  try {
    const count = await SupportQuickReply.countDocuments();
    if (count === 0) {
      const initial = DEFAULT_QUICK_REPLIES.map((text, idx) => ({
        title: text,
        order: idx,
        isActive: true,
      }));
      await SupportQuickReply.insertMany(initial);
      console.log('✅ [Support] Seeded initial support quick replies successfully.');
    }
  } catch (err) {
    console.warn('⚠️ [Support] SupportQuickReply seed warning:', err.message);
  }
};

/**
 * @desc    Get active quick reply options for public support widget
 * @route   GET /api/support/quick-replies
 * @access  Public
 */
exports.getPublicQuickReplies = async (req, res) => {
  try {
    let list = await SupportQuickReply.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    if (!list || list.length === 0) {
      await exports.seedSupportQuickReplies();
      list = await SupportQuickReply.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    }
    return res.status(200).json({
      success: true,
      data: list.map(item => item.title),
      items: list,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch quick replies.' });
  }
};

const ALLOWED_USER_FOLLOWUPS = DEFAULT_QUICK_REPLIES;

/**
 * @desc    Get all support requests submitted by current user (or by email / stored request ids / phone)
 * @route   GET /api/support/my-requests
 * @access  Public (Optional Auth)
 */
exports.getMySupportRequests = async (req, res) => {
  try {
    const orConditions = [];

    // 1. If authenticated via Bearer token
    if (req.user && req.user._id) {
      orConditions.push({ userId: req.user._id });
      if (req.user.email) {
        const cleanUserEmail = String(req.user.email).trim();
        orConditions.push({ email: cleanUserEmail.toLowerCase() });
        orConditions.push({ email: { $regex: new RegExp(`^${cleanUserEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      }
      if (req.user.mobile) {
        const cleanUserPhone = String(req.user.mobile).replace(/\D/g, '').slice(-10);
        if (cleanUserPhone.length >= 10) {
          orConditions.push({ phone: { $regex: cleanUserPhone } });
        }
      }
    }

    // 2. Query param email (case-insensitive and exact lowercase match)
    if (req.query.email && String(req.query.email).trim()) {
      const cleanEmail = String(req.query.email).trim();
      orConditions.push({ email: cleanEmail.toLowerCase() });
      orConditions.push({ email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    }

    // 3. Query param phone (matches last 10 digits)
    if (req.query.phone && String(req.query.phone).trim()) {
      const cleanPhone = String(req.query.phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length >= 10) {
        orConditions.push({ phone: { $regex: cleanPhone } });
      }
    }

    // 4. Query param ids (comma-separated list of request IDs stored in localStorage)
    if (req.query.ids && String(req.query.ids).trim()) {
      const idList = String(req.query.ids)
        .split(',')
        .map((s) => s.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (idList.length > 0) {
        orConditions.push({ _id: { $in: idList } });
      }
    }

    if (orConditions.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const requests = await SupportRequest.find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .select('problemText name email phone status messages hasUnreadAdminReply createdAt resolvedAt description')
      .lean();

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('getMySupportRequests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user support requests.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get status and messages for a submitted request
 * @route   GET /api/support/requests/:id/messages
 * @access  Public
 */
exports.getPublicRequestMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await SupportRequest.findById(id)
      .select('problemText name email status messages createdAt resolvedAt hasUnreadAdminReply')
      .lean();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Support request not found.' });
    }

    // Fetch dynamic quick reply options configured in admin
    let dynamicQuickReplies = await SupportQuickReply.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('title')
      .lean();
    let dynamicOptions = (dynamicQuickReplies || []).map(r => r.title);
    if (!dynamicOptions || dynamicOptions.length === 0) {
      dynamicOptions = DEFAULT_QUICK_REPLIES;
    }

    return res.status(200).json({ 
      success: true, 
      data: request,
      allowedFollowUps: dynamicOptions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch status.' });
  }
};

/**
 * @desc    User sends a predefined follow-up response to admin
 * @route   POST /api/support/requests/:id/followup
 * @access  Public
 */
exports.submitUserFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionText } = req.body;

    const trimmedOption = String(optionText || '').trim();

    // Check against dynamic options from DB
    let dynamicQuickReplies = await SupportQuickReply.find({ isActive: true })
      .select('title')
      .lean();
    let allowedOptions = (dynamicQuickReplies || []).map(r => r.title);
    if (!allowedOptions || allowedOptions.length === 0) {
      allowedOptions = DEFAULT_QUICK_REPLIES;
    }

    const isValidOption = trimmedOption && (
      allowedOptions.includes(trimmedOption) ||
      DEFAULT_QUICK_REPLIES.includes(trimmedOption)
    );

    if (!isValidOption) {
      return res.status(400).json({
        success: false,
        message: 'Invalid follow-up option selected.',
        allowedOptions,
      });
    }

    const request = await SupportRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Support request not found.' });
    }

    request.messages.push({
      sender: 'user',
      text: String(optionText).trim(),
      createdAt: new Date(),
    });
    
    // If user says still facing issue, reopen status if it was resolved
    const lower = optionText.toLowerCase();
    if (lower.includes('still') || lower.includes('error') || lower.includes('locked')) {
      request.status = 'pending';
      request.resolvedAt = null;
    }
    await request.save();

    try {
      const io = getIO();
      if (io) {
        io.to(`support_${id}`).emit('support_message', {
          requestId: id,
          message: request.messages[request.messages.length - 1],
          allMessages: request.messages,
          status: request.status,
          hasUnreadAdminReply: false,
        });
        io.to('support_admin_room').emit('support_request_updated', {
          requestId: id,
          status: request.status,
          messagesCount: request.messages.length,
          lastMessage: request.messages[request.messages.length - 1],
          hasUnreadAdminReply: false,
        });
      }
    } catch (sockErr) {
      console.warn('Socket emit error in submitUserFollowUp:', sockErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Update sent to support team.',
      data: request.messages[request.messages.length - 1],
      allMessages: request.messages,
    });
  } catch (error) {
    console.error('submitUserFollowUp error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send follow-up.' });
  }
};

exports.ALLOWED_USER_FOLLOWUPS = ALLOWED_USER_FOLLOWUPS;
