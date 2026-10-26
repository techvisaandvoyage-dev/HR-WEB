const SupportProblem = require('../models/SupportProblem');
const SupportRequest = require('../models/SupportRequest');

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
    const { problemId } = req.body;

    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a problem from the list.',
      });
    }

    // 1. Validate that the problem exists and is active
    const problem = await SupportProblem.findById(problemId);
    if (!problem || !problem.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected problem is invalid or no longer active. Please choose another option.',
      });
    }

    const clientIp = getClientIp(req);
    let finalUserType = 'guest';
    let finalUserId = null;
    let finalName = '';
    let finalEmail = '';
    let finalPhone = '';

    // 2. Resolve Contact Details (prefer user-typed values, fall back to logged-in user profile if blank)
    const { name, email, phone } = req.body;

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
      problemId: problem._id,
      status: 'pending',
    };

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

    // 5. Spam protection: Max 3 requests per hour per user / email / IP
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
    if (recentRequestsCount >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. You have reached the maximum of 3 support requests per hour. Please try again later.',
      });
    }

    // 6. Create the support request
    const newRequest = await SupportRequest.create({
      problemId: problem._id,
      problemText: problem.title,
      userType: finalUserType,
      userId: finalUserId,
      name: finalName,
      email: finalEmail,
      phone: finalPhone,
      ip: clientIp,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Your request has been submitted. Our team will contact you soon.',
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

// Predefined follow-up options the user is allowed to choose from
const ALLOWED_USER_FOLLOWUPS = [
  "Yes, my issue is resolved. Thank you!",
  "Still facing issue with OTP verification",
  "I tried again, but still getting error",
  "Please call me on my phone number",
  "Waiting for resolution, please check soon",
  "Please unlock my account, still showing locked"
];

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
    return res.status(200).json({ 
      success: true, 
      data: request,
      allowedFollowUps: ALLOWED_USER_FOLLOWUPS
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

    if (!optionText || !ALLOWED_USER_FOLLOWUPS.includes(String(optionText).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid follow-up option selected.',
        allowedOptions: ALLOWED_USER_FOLLOWUPS,
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
