const assert = require('node:assert/strict');
const test = require('node:test');

const email = 'daily-limit@example.invalid';
const dailyTracker = {
  _id: 'tracker-1',
  email,
  sendCount: 5,
  employeeFailedAttempts: 0,
};
const updates = [];
const unlockLogs = [];
let adminUnlockCalls = [];

const trackerPath = require.resolve('../models/OtpTracker');
const unlockLogPath = require.resolve('../models/OtpUnlockLog');
const employeePath = require.resolve('../employee/models/Employee');
const employerPath = require.resolve('../employer/models/Employer');
const emailPath = require.resolve('../utils/email');

require.cache[trackerPath] = {
  id: trackerPath,
  filename: trackerPath,
  loaded: true,
  exports: {
    find: (query) => ({
      sort: async () => (query.date ? [dailyTracker] : []),
    }),
    findOne: (query) => {
      if (query.date) return Promise.resolve(dailyTracker);
      return {
        sort: async () => null,
      };
    },
    updateMany: async (filter, update) => updates.push({ filter, update }),
  },
  children: [],
  paths: [],
};
require.cache[unlockLogPath] = {
  id: unlockLogPath,
  filename: unlockLogPath,
  loaded: true,
  exports: {
    create: async (entry) => unlockLogs.push(entry),
  },
  children: [],
  paths: [],
};
require.cache[employeePath] = {
  id: employeePath,
  filename: employeePath,
  loaded: true,
  exports: {
    findOne: () => ({
      select: async () => ({ _id: 'employee-1', name: 'Test Candidate', mobile: '1234567890' }),
    }),
  },
  children: [],
  paths: [],
};
require.cache[employerPath] = {
  id: employerPath,
  filename: employerPath,
  loaded: true,
  exports: {},
  children: [],
  paths: [],
};
require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: {
    MAX_DAILY_OTP_ATTEMPTS: 5,
    adminUnlockUser: async (...args) => adminUnlockCalls.push(args),
  },
  children: [],
  paths: [],
};

const { getLockedUsers, unlockUserOtp } = require('../controllers/adminOtpLockController');

const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test('lists accounts that reached the current daily OTP send limit', async () => {
  const res = response();
  await getLockedUsers({ query: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].email, email);
  assert.equal(res.body.data[0].role, 'employee');
  assert.equal(res.body.data[0].dailyLimitReached, true);
  assert.equal(res.body.data[0].sendCount, 5);
  assert.equal(res.body.counts.totalLocked, 0);
  assert.equal(res.body.counts.totalDailyLimitReached, 1);
  assert.deepEqual(res.body.activeLocks, []);
});

test('allows an admin to reset a daily limit without a failed-attempt lock', async () => {
  const res = response();
  await unlockUserOtp({
    body: { email, role: 'employee', reason: 'Support request' },
    admin: { id: 'admin-1' },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.dailyLimitReset, true);
  assert.equal(adminUnlockCalls.at(-1)[0], email);
  assert.equal(adminUnlockCalls.at(-1)[1], 'employee');
  assert.equal(updates.at(-1).update.$set.sendCount, 0);
  assert.equal(unlockLogs.at(-1).previousDailySendCount, 5);
  assert.equal(unlockLogs.at(-1).reason, 'Support request');
});
