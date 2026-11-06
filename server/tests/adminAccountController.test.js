const assert = require('node:assert/strict');
const test = require('node:test');

const userId = '507f1f77bcf86cd799439011';
const writes = [];
const securityEvents = [];
let failSecurityEventWrite = false;
const blockedUser = {
  _id: userId,
  name: 'Test Candidate',
  email: 'candidate@example.invalid',
  account: { status: 'blocked', blockReason: 'Test', blockedBy: 'system' }
};
const updatedUser = {
  ...blockedUser,
  account: { status: 'active', blockReason: '', blockedBy: 'system', unblockedAt: new Date() }
};

const employeePath = require.resolve('../employee/models/Employee');
const employerPath = require.resolve('../employer/models/Employer');
const securityEventPath = require.resolve('../models/SecurityEvent');
const mockModel = {
  findOne: () => ({ select: async () => blockedUser }),
  findOneAndUpdate: (filter, update, options) => {
    writes.push({ filter, update, options });
    return {
      select: () => ({ lean: async () => updatedUser })
    };
  }
};

for (const [filename, exports] of [
  [employeePath, mockModel],
  [employerPath, mockModel],
  [securityEventPath, {
    create: async (event) => {
      if (failSecurityEventWrite) throw new Error('test audit failure');
      securityEvents.push(event);
    }
  }]
]) {
  require.cache[filename] = {
    id: filename,
    filename,
    loaded: true,
    exports,
    children: [],
    paths: []
  };
}

const { updateAccountStatus } = require('../controllers/adminAccountController');

test('unblock atomically activates account and logs an event', async () => {
  failSecurityEventWrite = false;
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  await updateAccountStatus({
    params: { role: 'candidate', id: userId },
    method: 'PATCH',
    path: `/users/candidate/${userId}/unblock`,
    originalUrl: `/api/admin/users/candidate/${userId}/unblock`,
    body: undefined,
    ip: '127.0.0.1',
    admin: { id: 'admin', email: 'admin@example.invalid' }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.account.status, 'active');
  assert.equal(writes.at(-1).update.$set['account.status'], 'active');
  assert.equal(securityEvents.at(-1).type, 'UNBLOCK');
  assert.equal(securityEvents.at(-1).role, 'candidate');
});

test('unblock still reports the account update when audit logging fails', async () => {
  failSecurityEventWrite = true;
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  await updateAccountStatus({
    params: { role: 'candidate', id: userId },
    method: 'PATCH',
    path: `/users/candidate/${userId}/unblock`,
    originalUrl: `/api/admin/users/candidate/${userId}/unblock`,
    ip: '127.0.0.1',
    admin: { id: 'admin', email: 'admin@example.invalid' }
  }, response);

  failSecurityEventWrite = false;
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.account.status, 'active');
  assert.match(response.body.warning, /security event could not be recorded/i);
});
