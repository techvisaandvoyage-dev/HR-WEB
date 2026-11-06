const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');

const otpRecords = new Map();
const trackerModelPath = require.resolve('../models/OtpTracker');
const otpCodeModelPath = require.resolve('../models/OtpCode');
const emailServicePath = require.resolve('../utils/email');

const trackerQuery = {
  sort: async () => null,
  then: (resolve, reject) => Promise.resolve(null).then(resolve, reject)
};

require.cache[trackerModelPath] = {
  id: trackerModelPath,
  filename: trackerModelPath,
  loaded: true,
  exports: {
    findOne: () => trackerQuery,
    findOneAndUpdate: async () => null,
    updateMany: async () => null
  },
  children: [],
  paths: []
};

require.cache[otpCodeModelPath] = {
  id: otpCodeModelPath,
  filename: otpCodeModelPath,
  loaded: true,
  exports: {
    findOneAndUpdate: async (filter, update) => {
      otpRecords.set(`${filter.email}:${filter.purpose}`, { ...filter, ...update.$set });
    },
    findOne: (filter) => ({
      lean: async () => otpRecords.get(`${filter.email}:${filter.purpose}`) || null
    }),
    deleteOne: async (filter) => {
      otpRecords.delete(`${filter.email}:${filter.purpose}`);
    },
    deleteMany: async ({ email }) => {
      for (const [key, record] of otpRecords) {
        if (record.email === email) otpRecords.delete(key);
      }
    }
  },
  children: [],
  paths: []
};

const loadEmailServiceAsNewInstance = () => {
  delete require.cache[emailServicePath];
  return require(emailServicePath);
};

test('OTP sent by one backend instance is verified by another', async () => {
  const originalReadyState = mongoose.connection.readyState;
  const originalLog = console.log;
  const originalEnv = {
    resend: process.env.RESEND_API_KEY,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS
  };
  let dispatchedCode = '';

  try {
    mongoose.connection.readyState = 1;
    process.env.RESEND_API_KEY = '';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASS = '';
    console.log = (...args) => {
      const match = args.join(' ').match(/Recipient: .*? \| Code: (\d+)/);
      if (match) dispatchedCode = match[1];
    };

    const email = `otp-persistence-${Date.now()}@example.invalid`;
    const sendingInstance = loadEmailServiceAsNewInstance();
    const sendResult = await sendingInstance.sendOtp({ email, purpose: 'login:employee' });

    const verifyingInstance = loadEmailServiceAsNewInstance();
    await assert.rejects(
      verifyingInstance.sendOtp({ email, purpose: 'login:employee' }),
      (error) => error.status === 429
    );
    await assert.rejects(
      verifyingInstance.verifyOtp({ email, otp: 'not-the-code', purpose: 'login:employee' }),
      (error) => /Invalid OTP/.test(error.message)
    );

    assert.equal(sendResult.otpLength, 4);
    assert.equal(dispatchedCode.length, 4);
    assert.deepEqual(
      await verifyingInstance.verifyOtp({ email, otp: dispatchedCode, purpose: 'login:employee' }),
      { message: 'OTP verified successfully' }
    );
  } finally {
    console.log = originalLog;
    mongoose.connection.readyState = originalReadyState;
    if (originalEnv.resend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalEnv.resend;
    if (originalEnv.smtpUser === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = originalEnv.smtpUser;
    if (originalEnv.smtpPass === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = originalEnv.smtpPass;
    delete require.cache[emailServicePath];
  }
});
