const OtpTracker = require('../models/OtpTracker');
const OtpUnlockLog = require('../models/OtpUnlockLog');
const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');
const { adminUnlockUser } = require('../utils/email');

const escapeRegex = (string = '') => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getRoleField = (role, type) => {
  // type: 'FailedAttempts' | 'LockUntil'
  if (role === 'employee' || role === 'employer' || role === 'consultant' || role === 'admin') {
    return `${role}${type}`;
  }
  return type.charAt(0).toLowerCase() + type.slice(1);
};

const formatRemainingTime = (lockUntilDate) => {
  if (!lockUntilDate) return '0m';
  const diffMs = new Date(lockUntilDate).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const totalMinutes = Math.ceil(diffMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};

/**
 * GET /api/admin/otp-locks
 * Lists all currently locked users (lockUntil > now) across Employee, Employer, Consultant.
 * Supports pagination, filter by role, and search by name/email/phone.
 */
const getLockedUsers = async (req, res) => {
  try {
    const now = new Date();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const roleFilter = (req.query.role || 'all').toLowerCase();
    const search = (req.query.search || '').trim();

    // Find all trackers that currently have an active lock in any role or general
    const query = {
      $or: [
        { employeeLockUntil: { $gt: now } },
        { employerLockUntil: { $gt: now } },
        { consultantLockUntil: { $gt: now } },
        { adminLockUntil: { $gt: now } },
        { lockUntil: { $gt: now } },
      ],
    };

    if (roleFilter === 'employee') {
      query.$or = [{ employeeLockUntil: { $gt: now } }];
    } else if (roleFilter === 'employer') {
      query.$or = [{ employerLockUntil: { $gt: now } }];
    } else if (roleFilter === 'consultant') {
      query.$or = [{ consultantLockUntil: { $gt: now } }];
    } else if (roleFilter === 'admin') {
      query.$or = [{ adminLockUntil: { $gt: now } }];
    }

    const trackers = await OtpTracker.find(query).sort({ updatedAt: -1, createdAt: -1 });

    // Collect all locked emails for minimal instant lookup by other views (like Support Requests)
    const allActiveLockedEmails = [];

    // Flatten into individual locked user entries per role
    const rawLockedList = [];

    for (const tracker of trackers) {
      const email = tracker.email;
      const rolesToCheck = ['employee', 'employer', 'consultant', 'admin'];

      let hasRoleLock = false;

      for (const role of rolesToCheck) {
        if (roleFilter !== 'all' && roleFilter !== role) continue;

        const lockUntil = tracker[`${role}LockUntil`];
        const failedAttempts = tracker[`${role}FailedAttempts`] || 0;

        if (lockUntil && new Date(lockUntil) > now) {
          hasRoleLock = true;
          if (!allActiveLockedEmails.includes(email)) {
            allActiveLockedEmails.push(email);
          }
          rawLockedList.push({
            trackerId: tracker._id,
            email,
            role,
            failedAttempts,
            lockUntil,
            remainingLockTime: formatRemainingTime(lockUntil),
          });
        }
      }

      // Check legacy/general lockUntil if no role-specific lock or requested
      if (!hasRoleLock && tracker.lockUntil && new Date(tracker.lockUntil) > now) {
        if (roleFilter === 'all' || roleFilter === 'general') {
          if (!allActiveLockedEmails.includes(email)) {
            allActiveLockedEmails.push(email);
          }
          rawLockedList.push({
            trackerId: tracker._id,
            email,
            role: 'general',
            failedAttempts: tracker.failedAttempts || 0,
            lockUntil: tracker.lockUntil,
            remainingLockTime: formatRemainingTime(tracker.lockUntil),
          });
        }
      }
    }

    // Populate user profile info (name, phone, userId) from collections
    const populatedList = await Promise.all(
      rawLockedList.map(async (item) => {
        let userId = null;
        let name = 'Registration Pending';
        let phone = 'N/A';

        try {
          if (item.role === 'employee') {
            const employee = await Employee.findOne({
              email: new RegExp(`^${escapeRegex(item.email)}$`, 'i'),
            }).select('_id name mobile');
            if (employee) {
              userId = employee._id;
              name = employee.name || 'Candidate';
              phone = employee.mobile || 'N/A';
            }
          } else if (item.role === 'employer') {
            const employer = await Employer.findOne({
              email: new RegExp(`^${escapeRegex(item.email)}$`, 'i'),
              isConsultant: { $ne: true },
            }).select('_id fullName mobile');
            if (employer) {
              userId = employer._id;
              name = employer.fullName || 'Employer';
              phone = employer.mobile || 'N/A';
            }
          } else if (item.role === 'consultant') {
            const consultant = await Employer.findOne({
              email: new RegExp(`^${escapeRegex(item.email)}$`, 'i'),
              isConsultant: true,
            }).select('_id fullName mobile');
            if (consultant) {
              userId = consultant._id;
              name = consultant.fullName || 'Consultant';
              phone = consultant.mobile || 'N/A';
            }
          } else {
            // General: try Employee then Employer
            const emp = await Employee.findOne({
              email: new RegExp(`^${escapeRegex(item.email)}$`, 'i'),
            }).select('_id name mobile');
            if (emp) {
              userId = emp._id;
              name = emp.name;
              phone = emp.mobile || 'N/A';
            } else {
              const empl = await Employer.findOne({
                email: new RegExp(`^${escapeRegex(item.email)}$`, 'i'),
              }).select('_id fullName mobile');
              if (empl) {
                userId = empl._id;
                name = empl.fullName;
                phone = empl.mobile || 'N/A';
              }
            }
          }
        } catch (_) {}

        return {
          ...item,
          userId,
          name,
          phone,
        };
      })
    );

    // Apply text search on name, email, or phone
    let filteredList = populatedList;
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      filteredList = populatedList.filter(
        (u) =>
          searchRegex.test(u.name || '') ||
          searchRegex.test(u.email || '') ||
          searchRegex.test(u.phone || '')
      );
    }

    // Pagination
    const totalRecords = filteredList.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredList.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      data: paginatedData,
      activeLockedEmails: allActiveLockedEmails,
      activeLocks: rawLockedList.map((item) => ({
        email: item.email.toLowerCase(),
        role: item.role.toLowerCase(),
      })),
      counts: {
        totalLocked: totalRecords,
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalRecords,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching locked users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch locked users: ' + error.message,
    });
  }
};

/**
 * PATCH /api/admin/otp-locks/unlock
 * Resets failedAttempts to 0 and clears lockUntil for a given user role.
 * Body: { role, userId, email, phone, reason }
 */
const unlockUserOtp = async (req, res) => {
  try {
    const { role = 'employee', userId, reason = 'Admin manual unlock' } = req.body;
    let email = (req.body.email || '').trim().toLowerCase();
    let phone = (req.body.phone || '').trim();

    let targetUserId = userId || null;
    let targetUserName = '';

    // If email is not supplied directly, find via userId or phone
    if (!email && userId) {
      if (role === 'employee') {
        const emp = await Employee.findById(userId).select('email name mobile');
        if (emp) {
          email = emp.email?.toLowerCase();
          phone = phone || emp.mobile;
          targetUserName = emp.name;
        }
      } else {
        const empl = await Employer.findById(userId).select('email fullName mobile');
        if (empl) {
          email = empl.email?.toLowerCase();
          phone = phone || empl.mobile;
          targetUserName = empl.fullName;
        }
      }
    }

    if (!email && phone) {
      // Lookup by mobile number in employees or employers
      const emp = await Employee.findOne({ mobile: phone }).select('email name mobile _id');
      if (emp) {
        email = emp.email?.toLowerCase();
        targetUserId = targetUserId || emp._id;
        targetUserName = emp.name;
      } else {
        const empl = await Employer.findOne({ mobile: phone }).select('email fullName mobile _id');
        if (empl) {
          email = empl.email?.toLowerCase();
          targetUserId = targetUserId || empl._id;
          targetUserName = empl.fullName;
        }
      }
    }

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please provide a valid email, userId, or phone number.',
      });
    }

    const now = new Date();
    const failedAttemptsField = getRoleField(role, 'FailedAttempts');
    const lockUntilField = getRoleField(role, 'LockUntil');

    // Check if user currently has an active lock
    const existingTracker = await OtpTracker.findOne({
      email,
      $or: [
        { [lockUntilField]: { $gt: now } },
        { lockUntil: { $gt: now } },
      ],
    }).sort({ [lockUntilField]: -1, lockUntil: -1 });

    if (!existingTracker) {
      return res.status(400).json({
        success: false,
        message: `User (${email}) is not currently locked for role "${role}".`,
      });
    }

    const previousFailedAttempts =
      existingTracker[failedAttemptsField] || existingTracker.failedAttempts || 5;
    const previousLockUntil =
      existingTracker[lockUntilField] || existingTracker.lockUntil || null;

    // 1. Clear in-memory lockout map & reset OTP tokens via email utility (also resets dailyCountStore)
    if (typeof adminUnlockUser === 'function') {
      await adminUnlockUser(email, role);
    }

    // 2. Clear MongoDB OtpTracker records — also reset daily sendCount
    const updateQuery = {
      $set: {
        [failedAttemptsField]: 0,
        [lockUntilField]: null,
        sendCount: 0,   // reset daily OTP send limit so user can immediately request OTP
      },
    };
    if (role === 'general') {
      updateQuery.$set.failedAttempts = 0;
      updateQuery.$set.lockUntil = null;
    }

    await OtpTracker.updateMany({ email }, updateQuery);

    // 3. Save audit log
    await OtpUnlockLog.create({
      userId: targetUserId,
      role: role || 'employee',
      email,
      phone: phone || '',
      adminId: req.admin?.id || 'admin',
      unlockedAt: new Date(),
      previousFailedAttempts,
      previousLockUntil,
      reason,
    });

    return res.json({
      success: true,
      message: `OTP lock removed successfully for ${email} (${role}). The user can now request and verify OTP immediately.`,
      data: {
        email,
        role,
        unlockedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error unlocking user OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlock user: ' + error.message,
    });
  }
};

module.exports = {
  getLockedUsers,
  unlockUserOtp,
};
