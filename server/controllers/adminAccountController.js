const mongoose = require('mongoose');
const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');
const SecurityEvent = require('../models/SecurityEvent');

const VALID_ROLES = ['candidate', 'employer', 'consultant'];
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getUserModel = (role) => role === 'candidate' ? Employee : Employer;
const getRoleFilter = (role) => role === 'consultant'
  ? { isConsultant: true }
  : role === 'employer'
    ? { isConsultant: { $ne: true } }
    : {};

const validateTarget = (req, res) => {
  const { role, id } = req.params;
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ success: false, message: 'Role must be candidate, employer, or consultant.' });
    return false;
  }
  if (!/^[a-f\d]{24}$/i.test(id) || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'A valid account ID is required.' });
    return false;
  }
  return true;
};

const getBlockedAccounts = async (req, res) => {
  try {
    const role = typeof req.query.role === 'string' ? req.query.role : 'all';
    const source = typeof req.query.source === 'string' ? req.query.source : 'all';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (role !== 'all' && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid account role filter.' });
    }
    if (!['all', 'auto', 'manual'].includes(source)) {
      return res.status(400).json({ success: false, message: 'Invalid block source filter.' });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const sourceFilter = source === 'auto'
      ? 'system'
      : source === 'manual'
        ? { $ne: 'system' }
        : { $exists: true };
    const roles = role === 'all' ? VALID_ROLES : [role];
    const searchRegex = search ? new RegExp(escapeRegex(search), 'i') : null;

    const [allCounts, matchingAccounts] = await Promise.all([
      Promise.all([
        Employee.countDocuments({ 'account.status': 'blocked' }),
        Employer.countDocuments({ 'account.status': 'blocked' }),
        Employer.countDocuments({ 'account.status': 'blocked', isConsultant: true }),
        Employee.countDocuments({ 'account.status': 'blocked', 'account.blockedBy': 'system' }),
        Employer.countDocuments({ 'account.status': 'blocked', 'account.blockedBy': 'system' })
      ]),
      Promise.all(roles.map(async (accountRole) => {
        const Model = getUserModel(accountRole);
        const query = {
          ...getRoleFilter(accountRole),
          'account.status': 'blocked',
          'account.blockedBy': sourceFilter
        };
        if (searchRegex) {
          query.$or = accountRole === 'candidate'
            ? [{ name: searchRegex }, { email: searchRegex }, { mobile: searchRegex }]
            : [{ fullName: searchRegex }, { email: searchRegex }, { mobile: searchRegex }];
        }
        const users = await Model.find(query)
          .select('name fullName email mobile account')
          .sort({ 'account.blockedAt': -1 })
          .lean();
        return users.map((user) => ({
          _id: user._id,
          name: user.name || user.fullName || 'Account',
          email: user.email,
          phone: user.mobile || '',
          role: accountRole,
          blockReason: user.account?.blockReason || '',
          blockedBy: user.account?.blockedBy || 'admin',
          blockedByName: user.account?.blockedByEmail || 'Admin',
          source: user.account?.blockedBy === 'system' ? 'auto' : 'manual',
          blockedAt: user.account?.blockedAt || null
        }));
      }))
    ]);

    const auto = allCounts[3] + allCounts[4];
    const total = allCounts[0] + allCounts[1];
    const rows = matchingAccounts.flat().sort(
      (a, b) => new Date(b.blockedAt || 0) - new Date(a.blockedAt || 0)
    );
    const totalRecords = rows.length;

    return res.json({
      success: true,
      data: rows.slice((page - 1) * limit, page * limit),
      count: totalRecords,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        totalRecords
      },
      counts: {
        total,
        auto,
        manual: total - auto,
        candidates: allCounts[0],
        employers: allCounts[1] - allCounts[2],
        consultants: allCounts[2]
      }
    });
  } catch (error) {
    console.error('[AdminAccounts] Failed to list blocked accounts:', error);
    return res.status(500).json({ success: false, message: 'Failed to load blocked accounts.' });
  }
};

const updateAccountStatus = async (req, res) => {
  try {
    if (!validateTarget(req, res)) return;
    const { role, id } = req.params;
    const Model = getUserModel(role);
    const roleFilter = getRoleFilter(role);
    const user = await Model.findOne({ _id: id, ...roleFilter }).select('name fullName email mobile account');
    if (!user) return res.status(404).json({ success: false, message: 'Account not found for this role.' });

    if (String(req.admin?.id || '') === String(user._id)
      || (req.admin?.email && req.admin.email.toLowerCase() === user.email.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Administrators cannot block or unblock their own account.' });
    }

    const eventType = req.path.endsWith('/block') && !req.path.endsWith('/unblock') ? 'MANUAL_BLOCK' : 'UNBLOCK';
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (eventType === 'MANUAL_BLOCK' && !reason) {
      return res.status(400).json({ success: false, message: 'A reason is required to block an account.' });
    }
    if (reason.length > 500) {
      return res.status(400).json({ success: false, message: 'Block reason must be 500 characters or fewer.' });
    }
    if (eventType === 'MANUAL_BLOCK' && user.account?.status === 'blocked') {
      return res.status(409).json({ success: false, message: 'This account is already blocked.' });
    }
    if (eventType === 'UNBLOCK' && user.account?.status !== 'blocked') {
      return res.status(409).json({ success: false, message: 'This account is not blocked.' });
    }

    const now = new Date();
    const update = eventType === 'MANUAL_BLOCK'
      ? {
          'account.status': 'blocked',
          'account.blockReason': reason,
          'account.blockedAt': now,
          'account.blockedBy': String(req.admin?.id || 'admin'),
          'account.blockedByEmail': req.admin?.email || '',
          'account.unblockedAt': null
        }
      : {
          'account.status': 'active',
          'account.blockReason': '',
          'account.unblockedAt': now
        };
    const currentStatusFilter = user.account?.status === 'blocked'
      ? 'blocked'
      : { $in: ['active', null] };
    const updatedUser = await Model.findOneAndUpdate(
      { _id: id, ...roleFilter, 'account.status': currentStatusFilter },
      { $set: update },
      { new: true, runValidators: true }
    ).select('name fullName email mobile account').lean();
    if (!updatedUser) {
      return res.status(409).json({ success: false, message: 'Account status changed. Refresh and try again.' });
    }

    let auditWarning = '';
    try {
      await SecurityEvent.create({
        userId: updatedUser._id,
        role,
        type: eventType,
        ip: req.ip || '',
        path: req.originalUrl || req.path,
        note: eventType === 'MANUAL_BLOCK' ? reason : 'Account unblocked by administrator'
      });
    } catch (error) {
      auditWarning = 'Account status was updated, but its security event could not be recorded.';
      console.error('[AdminAccounts] Account status updated but security event failed:', error);
    }

    return res.json({
      success: true,
      message: eventType === 'MANUAL_BLOCK' ? 'Account blocked successfully.' : 'Account unblocked successfully.',
      ...(auditWarning ? { warning: auditWarning } : {}),
      data: {
        _id: updatedUser._id,
        account: updatedUser.account,
        name: updatedUser.name || updatedUser.fullName,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error('[AdminAccounts] Failed to update account status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update account status.' });
  }
};

const getSecurityEvents = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const [events, total] = await Promise.all([
      SecurityEvent.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SecurityEvent.countDocuments()
    ]);

    const data = await Promise.all(events.map(async (event) => {
      const Model = event.role === 'candidate' ? Employee : Employer;
      const user = event.userId
        ? await Model.findById(event.userId).select('name fullName email').lean()
        : null;
      return {
        ...event,
        userName: user?.name || user?.fullName || 'Unknown account',
        email: user?.email || ''
      };
    }));

    return res.json({
      success: true,
      data,
      pagination: { page, limit, totalRecords: total, totalPages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    console.error('[AdminAccounts] Failed to load security events:', error);
    return res.status(500).json({ success: false, message: 'Failed to load security events.' });
  }
};

module.exports = { getBlockedAccounts, getSecurityEvents, updateAccountStatus };
