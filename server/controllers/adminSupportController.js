const SupportProblem = require('../models/SupportProblem');
const SupportRequest = require('../models/SupportRequest');

// Helper to escape regex special characters
const escapeRegex = (string = '') => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/* ========================================================
 * Problem Management Controllers
 * ======================================================== */

/**
 * @desc    Get all problems (including inactive)
 * @route   GET /api/admin/support/problems
 * @access  Admin
 */
exports.getAllProblems = async (req, res) => {
  try {
    const problems = await SupportProblem.find().sort({ order: 1, createdAt: 1 }).lean();
    return res.status(200).json({
      success: true,
      data: problems,
    });
  } catch (error) {
    console.error('getAllProblems error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch problems',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new problem
 * @route   POST /api/admin/support/problems
 * @access  Admin
 */
exports.createProblem = async (req, res) => {
  try {
    const { title, role = 'all', order = 0, isActive = true } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Problem title is required',
      });
    }

    const problem = await SupportProblem.create({
      title: title.trim(),
      role: ['all', 'employee', 'employer', 'consultant'].includes(role) ? role : 'all',
      order: Number(order) || 0,
      isActive: Boolean(isActive),
    });

    return res.status(201).json({
      success: true,
      message: 'Support problem created successfully',
      data: problem,
    });
  } catch (error) {
    console.error('createProblem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create problem',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a problem
 * @route   PUT /api/admin/support/problems/:id
 * @access  Admin
 */
exports.updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, role, order, isActive } = req.body;

    const problem = await SupportProblem.findById(id);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    if (title !== undefined) problem.title = String(title).trim();
    if (role !== undefined && ['all', 'employee', 'employer', 'consultant'].includes(role)) {
      problem.role = role;
    }
    if (order !== undefined) problem.order = Number(order) || 0;
    if (isActive !== undefined) problem.isActive = Boolean(isActive);

    await problem.save();

    return res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      data: problem,
    });
  } catch (error) {
    console.error('updateProblem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update problem',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle problem active status
 * @route   PATCH /api/admin/support/problems/:id/toggle
 * @access  Admin
 */
exports.toggleProblemActive = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await SupportProblem.findById(id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    problem.isActive = !problem.isActive;
    await problem.save();

    return res.status(200).json({
      success: true,
      message: `Problem marked as ${problem.isActive ? 'Active' : 'Inactive'}`,
      data: problem,
    });
  } catch (error) {
    console.error('toggleProblemActive error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle problem status',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a problem
 * @route   DELETE /api/admin/support/problems/:id
 * @access  Admin
 */
exports.deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await SupportProblem.findByIdAndDelete(id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Problem deleted successfully',
      data: { _id: id },
    });
  } catch (error) {
    console.error('deleteProblem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete problem',
      error: error.message,
    });
  }
};

/* ========================================================
 * Support Requests Controllers
 * ======================================================== */

/**
 * @desc    Get support requests with pagination, filters, search & counts
 * @route   GET /api/admin/support/requests
 * @access  Admin
 */
exports.getSupportRequests = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { status, userType, search } = req.query;

    const filter = {};

    // Filter by status (all / pending / resolved)
    if (status && status !== 'all') {
      filter.status = status.toLowerCase();
    }

    // Filter by userType (all / guest / employee / employer / consultant)
    if (userType && userType !== 'all') {
      filter.userType = userType.toLowerCase();
    }

    // Search by name, email, phone (case-insensitive)
    if (search && search.trim()) {
      const cleanSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(cleanSearch, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { problemText: searchRegex },
      ];
    }

    // Fetch total, pending, and resolved counts across all requests (or filtered by userType/search)
    const [totalCounts, requests, totalFiltered] = await Promise.all([
      SupportRequest.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
            },
          },
        },
      ]),
      SupportRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('problemId', 'title order isActive')
        .lean(),
      SupportRequest.countDocuments(filter),
    ]);

    const counts = totalCounts[0] || { total: 0, pending: 0, resolved: 0 };

    return res.status(200).json({
      success: true,
      counts: {
        total: counts.total || 0,
        pending: counts.pending || 0,
        resolved: counts.resolved || 0,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
        totalRecords: totalFiltered,
        limit,
      },
      data: requests,
    });
  } catch (error) {
    console.error('getSupportRequests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch support requests',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark a support request as resolved
 * @route   PATCH /api/admin/support/requests/:id/resolve
 * @access  Admin
 */
exports.resolveSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await SupportRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found',
      });
    }

    request.status = 'resolved';
    request.resolvedAt = new Date();
    request.resolvedBy = req.user?._id || null;
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Support request marked as resolved',
      data: request,
    });
  } catch (error) {
    console.error('resolveSupportRequest error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve request',
      error: error.message,
    });
  }
};

/**
 * @desc    Reopen a support request (set status back to pending)
 * @route   PATCH /api/admin/support/requests/:id/reopen
 * @access  Admin
 */
exports.reopenSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await SupportRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found',
      });
    }

    request.status = 'pending';
    request.resolvedAt = null;
    request.resolvedBy = null;
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Support request reopened',
      data: request,
    });
  } catch (error) {
    console.error('reopenSupportRequest error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reopen request',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a support request
 * @route   DELETE /api/admin/support/requests/:id
 * @access  Admin
 */
exports.deleteSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await SupportRequest.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Support request deleted successfully',
      data: { _id: id },
    });
  } catch (error) {
    console.error('deleteSupportRequest error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete request',
      error: error.message,
    });
  }
};
