const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const { respondIfAccountBlocked } = require('../utils/accountStatus');
const adminAuth = require('../middleware/adminAuth');

const createResponse = () => {
  const response = {
    statusCode: null,
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
  return response;
};

test('blocked accounts receive the standard account-blocked response', () => {
  const response = createResponse();

  assert.equal(respondIfAccountBlocked({ status: 'blocked', blockReason: 'Policy violation' }, response), true);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.code, 'ACCOUNT_BLOCKED');
  assert.equal(response.body.reason, 'Policy violation');
});

test('active and legacy accounts continue through existing auth middleware', () => {
  const response = createResponse();

  assert.equal(respondIfAccountBlocked({ status: 'active' }, response), false);
  assert.equal(respondIfAccountBlocked(undefined, response), false);
  assert.equal(response.statusCode, null);
});

test('new account-management routes reject legacy header-only sessions with 403', () => {
  for (const headers of [{ 'x-admin-auth': 'true' }, { 'x-admin-secret': 'anything' }]) {
    const response = createResponse();
    let nextCalled = false;

    adminAuth.strict({ headers }, response, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 403);
  }
});

test('new account-management routes accept an admin JWT', () => {
  const response = createResponse();
  const token = jwt.sign(
    { id: 'admin', email: 'admin@example.invalid', role: 'admin' },
    'test-admin-secret'
  );
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-admin-secret';
  let nextCalled = false;

  adminAuth.strict({ headers: { authorization: `Bearer ${token}` } }, response, () => { nextCalled = true; });

  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
  assert.equal(nextCalled, true);
});

test('existing admin routes retain their 401 unauthenticated response', () => {
  const response = createResponse();
  let nextCalled = false;

  adminAuth({ headers: {} }, response, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 401);
});
