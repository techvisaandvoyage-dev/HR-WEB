/**
 * Minimal Unit Test Suite for Candidate Attribution & Source Tracking
 * Tests:
 * 1. Safe ObjectId parser ignores invalid or tampered values.
 * 2. First-touch attribution is established on signup via valid job link.
 * 3. Employer ID is derived strictly from Job record (never client input).
 * 4. First-touch attribution is immutable (never overwritten on subsequent visits/logins).
 * 5. Invalid, non-existent, or malformed jobId is silently handled without failing.
 */

const assert = require('node:assert');
const test = require('node:test');
const mongoose = require('mongoose');
const { safeObjectId, applyFirstTouchAttribution } = require('../services/attributionService');
const Job = require('../models/Job');
const Employee = require('../employee/models/Employee');

test('safeObjectId validation tests', () => {
  assert.strictEqual(safeObjectId(null), null, 'null returns null');
  assert.strictEqual(safeObjectId(undefined), null, 'undefined returns null');
  assert.strictEqual(safeObjectId(''), null, 'empty string returns null');
  assert.strictEqual(safeObjectId('invalid-id-string'), null, 'invalid string returns null');
  assert.strictEqual(safeObjectId(12345), null, 'number returns null');

  const validId = new mongoose.Types.ObjectId();
  const parsed = safeObjectId(validId.toString());
  assert.ok(parsed instanceof mongoose.Types.ObjectId, 'valid string produces ObjectId');
  assert.strictEqual(parsed.toString(), validId.toString(), 'matches original id');
});

test('applyFirstTouchAttribution unit logic (mocked models)', async () => {
  const fakeEmpId = new mongoose.Types.ObjectId();
  const fakeJobId = new mongoose.Types.ObjectId();
  const fakeEmployerId = new mongoose.Types.ObjectId();

  const originalFindJob = Job.findById;
  const originalFindEmployee = Employee.findById;

  try {
    // 1. Test: Signup with valid Job -> assigns job_link and derives employer from Job
    let mockEmployee = {
      _id: fakeEmpId,
      createdAt: new Date('2026-01-01T10:00:00Z'),
      acquisition: null,
      save: async function () { return this; }
    };

    Job.findById = () => ({
      select: () => Promise.resolve({
        _id: fakeJobId,
        employerId: fakeEmployerId,
        title: 'Senior Frontend Developer',
        company: 'Meraki Studios'
      })
    });

    Employee.findById = () => Promise.resolve(mockEmployee);

    const acqResult = await applyFirstTouchAttribution(fakeEmpId.toString(), {
      jobId: fakeJobId.toString(),
      utmSource: 'whatsapp',
      landedAt: '2026-01-01T09:55:00Z'
    });

    assert.ok(acqResult, 'Attribution object returned');
    assert.strictEqual(acqResult.sourceType, 'job_link', 'sourceType is job_link');
    assert.strictEqual(acqResult.firstTouchJob.toString(), fakeJobId.toString(), 'firstTouchJob matches');
    assert.strictEqual(acqResult.firstTouchEmployer.toString(), fakeEmployerId.toString(), 'firstTouchEmployer is derived from Job');
    assert.strictEqual(acqResult.utmSource, 'whatsapp', 'utmSource is whatsapp');
    assert.strictEqual(acqResult.jobSnapshot.title, 'Senior Frontend Developer', 'Snapshot job title captured');
    assert.strictEqual(acqResult.jobSnapshot.companyName, 'Meraki Studios', 'Snapshot employer captured');

    // 2. Test: First-touch immutability - second login with a different job MUST NOT overwrite
    const anotherJobId = new mongoose.Types.ObjectId();
    const immutableResult = await applyFirstTouchAttribution(fakeEmpId.toString(), {
      jobId: anotherJobId.toString(),
      utmSource: 'instagram'
    });

    assert.strictEqual(immutableResult.sourceType, 'job_link', 'sourceType remains job_link');
    assert.strictEqual(immutableResult.firstTouchJob.toString(), fakeJobId.toString(), 'firstTouchJob was NOT overwritten');
    assert.strictEqual(immutableResult.utmSource, 'whatsapp', 'utmSource was NOT overwritten');

    // 3. Test: Invalid/non-existent jobId silently handled as direct without error
    let directEmployee = {
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
      acquisition: null,
      save: async function () { return this; }
    };
    Employee.findById = () => Promise.resolve(directEmployee);
    Job.findById = () => ({ select: () => Promise.resolve(null) });

    const directResult = await applyFirstTouchAttribution(directEmployee._id.toString(), {
      jobId: 'bad_tampered_id',
      utmSource: 'test'
    });

    assert.ok(directResult, 'Direct attribution returned');
    assert.strictEqual(directResult.sourceType, 'direct', 'sourceType is direct');
    assert.strictEqual(directResult.firstTouchJob, null, 'firstTouchJob is null');
    assert.strictEqual(directResult.firstTouchEmployer, null, 'firstTouchEmployer is null');

  } finally {
    Job.findById = originalFindJob;
    Employee.findById = originalFindEmployee;
  }
});

console.log('✅ Attribution test definitions loaded.');
