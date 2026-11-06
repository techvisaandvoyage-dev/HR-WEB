const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const SecurityEvent = require('../models/SecurityEvent');
const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');

const getAccount = (req) => {
  if (req.employee) return { user: req.employee, role: 'candidate' };
  if (req.user && req.user.isConsultant) return { user: req.user, role: 'consultant' };
  if (req.user) return { user: req.user, role: 'employer' };
  return null;
};

const ipAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many authentication requests. Please try again later.'
  }
});

const userApiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const account = getAccount(req);
    return account?.user?._id
      ? `account:${account.user._id}`
      : ipKeyGenerator(req.ip);
  },
  skip: (req) => Boolean(req.admin),
  handler: async (req, res) => {
    const account = getAccount(req);
    if (account?.user?._id) {
      try {
        const eventDetails = {
          userId: account.user._id,
          role: account.role,
          type: 'RATE_LIMIT',
          ip: req.ip || '',
          path: req.originalUrl || req.path,
          note: 'Authenticated API request limit exceeded'
        };
        await SecurityEvent.create(eventDetails);

        const recentRateLimits = await SecurityEvent.countDocuments({
          userId: account.user._id,
          role: account.role,
          type: 'RATE_LIMIT',
          createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
        });

        if (recentRateLimits >= 5) {
          const UserModel = account.role === 'candidate' ? Employee : Employer;
          const blockedUser = await UserModel.findOneAndUpdate(
            { _id: account.user._id, 'account.status': { $ne: 'blocked' } },
            {
              $set: {
                'account.status': 'blocked',
                'account.blockReason': 'Suspicious activity: too many requests',
                'account.blockedAt': new Date(),
                'account.blockedBy': 'system',
                'account.blockedByEmail': '',
                'account.unblockedAt': null
              }
            },
            { new: true }
          );
          if (blockedUser) {
            await SecurityEvent.create({
              ...eventDetails,
              type: 'AUTO_BLOCK',
              note: 'Automatically blocked after five rate-limit events within ten minutes'
            });
          }
        }
      } catch (error) {
        console.error('[Security] Failed to record rate-limit event:', error.message);
      }
    }

    return res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.'
    });
  }
});

module.exports = { ipAuthRateLimiter, userApiRateLimiter };
