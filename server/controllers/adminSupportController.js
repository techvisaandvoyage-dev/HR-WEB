const SupportProblem = require('../models/SupportProblem');
const SupportRequest = require('../models/SupportRequest');
const { getIO } = require('../socket');

// Helper to escape regex special characters
const escapeRegex = (string = '') => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/* ========================================================
 * Problem Management Helpers & Controllers
 * ======================================================== */

/**
 * Normalizes all problems for a specific role so orders are strictly contiguous: 0, 1, 2, 3...
 * Prevents any duplicate orders or skipped gaps.
 */
const normalizeRoleOrders = async (role) => {
  if (!role) return;
  try {
    const list = await SupportProblem.find({ role }).sort({ order: 1, updatedAt: -1, createdAt: 1 });
    for (let i = 0; i < list.length; i++) {
      if (list[i].order !== i) {
        await SupportProblem.updateOne({ _id: list[i]._id }, { $set: { order: i } });
      }
    }
  } catch (err) {
    console.error('normalizeRoleOrders error:', err);
  }
};

/**
 * Normalizes all roles across the database to fix legacy duplicate orders
 */
const autoFixAllRolesOrders = async () => {
  const roles = ['employee', 'employer', 'consultant', 'all'];
  for (const r of roles) {
    await normalizeRoleOrders(r);
  }
};

/**
 * @desc    Get all problems (including inactive) with contiguous order normalization
 * @route   GET /api/admin/support/problems
 * @access  Admin
 */
exports.getAllProblems = async (req, res) => {
  try {
    // Automatically repair any legacy duplicate orders across all roles
    await autoFixAllRolesOrders();

    const problems = await SupportProblem.find().sort({ role: 1, order: 1, createdAt: 1 }).lean();
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
 * @desc    Create a new problem (automatically shifts subsequent items down)
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

    const targetRole = ['all', 'employee', 'employer', 'consultant'].includes(role) ? role : 'all';
    const targetOrder = Math.max(0, parseInt(order, 10) || 0);

    // Shift all existing problems in this role with order >= targetOrder down by 1
    await SupportProblem.updateMany(
      { role: targetRole, order: { $gte: targetOrder } },
      { $inc: { order: 1 } }
    );

    const problem = await SupportProblem.create({
      title: title.trim(),
      role: targetRole,
      order: targetOrder,
      isActive: Boolean(isActive),
    });

    // Ensure contiguous ordering without gaps or duplicates
    await normalizeRoleOrders(targetRole);

    const freshProblem = await SupportProblem.findById(problem._id).lean();

    return res.status(201).json({
      success: true,
      message: 'Support problem created successfully',
      data: freshProblem || problem,
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
 * @desc    Update a problem (shifts intermediate items when order changes)
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

    const oldRole = problem.role;
    const oldOrder = problem.order;

    let targetRole = oldRole;
    if (role !== undefined && ['all', 'employee', 'employer', 'consultant'].includes(role)) {
      targetRole = role;
    }

    let targetOrder = oldOrder;
    if (order !== undefined) {
      targetOrder = Math.max(0, parseInt(order, 10) || 0);
    }

    if (targetRole === oldRole) {
      // Reordering within the same role
      if (targetOrder < oldOrder) {
        // Moving up: shift intermediate items down
        await SupportProblem.updateMany(
          {
            role: targetRole,
            _id: { $ne: problem._id },
            order: { $gte: targetOrder, $lt: oldOrder },
          },
          { $inc: { order: 1 } }
        );
      } else if (targetOrder > oldOrder) {
        // Moving down: shift intermediate items up
        await SupportProblem.updateMany(
          {
            role: targetRole,
            _id: { $ne: problem._id },
            order: { $gt: oldOrder, $lte: targetOrder },
          },
          { $inc: { order: -1 } }
        );
      }
    } else {
      // Role changed
      // In old role: items after oldOrder shift up
      await SupportProblem.updateMany(
        { role: oldRole, order: { $gt: oldOrder } },
        { $inc: { order: -1 } }
      );
      // In new role: items at or after targetOrder shift down
      await SupportProblem.updateMany(
        { role: targetRole, order: { $gte: targetOrder } },
        { $inc: { order: 1 } }
      );
    }

    if (title !== undefined) problem.title = String(title).trim();
    problem.role = targetRole;
    problem.order = targetOrder;
    if (isActive !== undefined) problem.isActive = Boolean(isActive);

    await problem.save();

    // Normalize roles to keep contiguous 0, 1, 2...
    await normalizeRoleOrders(targetRole);
    if (targetRole !== oldRole) {
      await normalizeRoleOrders(oldRole);
    }

    const updatedProblem = await SupportProblem.findById(id).lean();

    return res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      data: updatedProblem || problem,
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
 * @desc    Move problem up or down by 1 position in its role
 * @route   PATCH /api/admin/support/problems/:id/move
 * @access  Admin
 */
exports.moveProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: "Direction must be 'up' or 'down'",
      });
    }

    const problem = await SupportProblem.findById(id);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    // Normalize first to ensure contiguous indices
    await normalizeRoleOrders(problem.role);
    const refreshed = await SupportProblem.findById(id);
    const currentOrder = refreshed.order;

    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    if (targetOrder < 0) {
      return res.status(400).json({
        success: false,
        message: 'Problem is already at the top',
      });
    }

    const neighbor = await SupportProblem.findOne({
      role: refreshed.role,
      order: targetOrder,
    });

    if (!neighbor) {
      return res.status(200).json({
        success: true,
        message: 'Problem cannot be moved further',
      });
    }

    // Swap orders
    neighbor.order = currentOrder;
    refreshed.order = targetOrder;

    await neighbor.save();
    await refreshed.save();

    await normalizeRoleOrders(refreshed.role);

    return res.status(200).json({
      success: true,
      message: `Problem moved ${direction} successfully`,
    });
  } catch (error) {
    console.error('moveProblem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to move problem',
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

    // Shift subsequent items up
    await SupportProblem.updateMany(
      { role: problem.role, order: { $gt: problem.order } },
      { $inc: { order: -1 } }
    );

    await normalizeRoleOrders(problem.role);

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

    try {
      const io = getIO();
      if (io) {
        io.to(`support_${id}`).emit('support_status_change', {
          requestId: id,
          status: 'resolved',
          resolvedAt: request.resolvedAt,
        });
        io.to('support_admin_room').emit('support_request_updated', {
          requestId: id,
          status: 'resolved',
        });
      }
    } catch (sockErr) {
      console.warn('Socket emit error in resolveSupportRequest:', sockErr.message);
    }

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

    try {
      const io = getIO();
      if (io) {
        io.to(`support_${id}`).emit('support_status_change', {
          requestId: id,
          status: 'pending',
        });
        io.to('support_admin_room').emit('support_request_updated', {
          requestId: id,
          status: 'pending',
        });
      }
    } catch (sockErr) {
      console.warn('Socket emit error in reopenSupportRequest:', sockErr.message);
    }

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

    try {
      const io = getIO();
      if (io) {
        io.to(`support_${id}`).emit('support_request_deleted', { requestId: id });
        io.to('support_admin_room').emit('support_request_deleted', { requestId: id });
      }
    } catch (sockErr) {
      console.warn('Socket emit error in deleteSupportRequest:', sockErr.message);
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

/**
 * @desc    Admin sends a reply message to a support request thread
 * @route   POST /api/admin/support/requests/:id/reply
 * @access  Admin
 */
exports.adminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required.' });
    }
    const request = await SupportRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Support request not found.' });

    const msg = { sender: 'admin', text: String(text).trim(), createdAt: new Date() };
    request.messages.push(msg);
    request.hasUnreadAdminReply = true;
    await request.save();

    // Broadcast message instantly to client room and admin room
    try {
      const io = getIO();
      if (io) {
        io.to(`support_${id}`).emit('support_message', {
          requestId: id,
          message: msg,
          allMessages: request.messages,
          status: request.status,
          hasUnreadAdminReply: true,
        });
        io.to('support_admin_room').emit('support_request_updated', {
          requestId: id,
          status: request.status,
          messagesCount: request.messages.length,
          lastMessage: msg,
          hasUnreadAdminReply: true,
        });
      }
    } catch (sockErr) {
      console.warn('Socket emit error in adminReply:', sockErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Reply sent.',
      data: request.messages[request.messages.length - 1],
      allMessages: request.messages,
    });
  } catch (error) {
    console.error('adminReply error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send reply.' });
  }
};

/**
 * @desc    Get messages for a support request (used by admin chat panel)
 * @route   GET /api/admin/support/requests/:id/messages
 * @access  Admin
 */
exports.getRequestMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await SupportRequest.findById(id).select('messages name email status hasUnreadAdminReply').lean();
    if (!request) return res.status(404).json({ success: false, message: 'Support request not found.' });
    return res.status(200).json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
};
