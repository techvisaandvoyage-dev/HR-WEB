const mongoose = require('mongoose');
const Job = require('../models/Job');
const Employee = require('../employee/models/Employee');
const JobLinkVisit = require('../models/JobLinkVisit');

/**
 * Safely parse a MongoDB ObjectId or return null
 */
const safeObjectId = (id) => {
  if (!id) return null;
  const str = String(id).trim();
  if (mongoose.Types.ObjectId.isValid(str)) {
    return new mongoose.Types.ObjectId(str);
  }
  return null;
};

/**
 * Log a job link interaction event (landed, signed_up, logged_in, started_application, applied)
 * Silently ignores invalid/non-existent jobs (never throws).
 */
const recordJobVisit = async ({ candidateId = null, jobId, utmSource = null, event }) => {
  try {
    if (!jobId || !event) return null;

    const validJobId = safeObjectId(jobId);
    if (!validJobId) return null;

    const job = await Job.findById(validJobId).select('_id employerId title company');
    if (!job) return null;

    const validCandidateId = safeObjectId(candidateId);

    const visit = await JobLinkVisit.create({
      candidateId: validCandidateId,
      jobId: job._id,
      employerId: job.employerId || null,
      utmSource: utmSource ? String(utmSource).trim() : null,
      event,
      createdAt: new Date()
    });

    return visit;
  } catch (err) {
    console.warn('[AttributionService] Failed to record visit:', err.message);
    return null;
  }
};

/**
 * Apply first-touch attribution to an employee.
 * Rules:
 * 1. Attribution is FIRST-TOUCH: once set to 'job_link', it must NEVER be overwritten.
 * 2. Validate on the server that the jobId actually exists.
 * 3. Ignore invalid or tampered values silently.
 * 4. Never trust client for employerId; derive it from the Job record.
 */
const applyFirstTouchAttribution = async (employeeId, attributionData = {}) => {
  try {
    const validEmpId = safeObjectId(employeeId);
    if (!validEmpId) return null;

    const employee = await Employee.findById(validEmpId);
    if (!employee) return null;

    // Rule 1: If already attributed to a job link, never overwrite!
    if (employee.acquisition && employee.acquisition.firstTouchJob) {
      return employee.acquisition;
    }

    const { jobId, utmSource, landedAt } = attributionData || {};
    const validJobId = safeObjectId(jobId);

    let job = null;
    if (validJobId) {
      job = await Job.findById(validJobId).select('_id employerId title company');
    }

    if (job) {
      // First touch from job link!
      employee.acquisition = {
        firstTouchJob: job._id,
        firstTouchEmployer: job.employerId || null,
        sourceType: 'job_link',
        utmSource: utmSource ? String(utmSource).trim() : null,
        landedAt: landedAt ? new Date(landedAt) : new Date(),
        registeredAt: employee.createdAt || new Date(),
        jobSnapshot: {
          title: job.title || '',
          companyName: job.company || ''
        }
      };
    } else {
      // No valid job link -> Direct / Organic
      // If candidate already has acquisition.sourceType set to 'direct', preserve existing registeredAt
      const existingRegisteredAt = employee.acquisition?.registeredAt || employee.createdAt || new Date();
      employee.acquisition = {
        firstTouchJob: null,
        firstTouchEmployer: null,
        sourceType: 'direct',
        utmSource: utmSource ? String(utmSource).trim() : null,
        landedAt: null,
        registeredAt: existingRegisteredAt,
        jobSnapshot: {
          title: '',
          companyName: ''
        }
      };
    }

    await employee.save();
    return employee.acquisition;
  } catch (err) {
    console.warn('[AttributionService] Failed to apply attribution:', err.message);
    return null;
  }
};

/**
 * Get all job link visits for a candidate, populated with job title and employer name
 */
const getCandidateVisits = async (candidateId) => {
  try {
    const validCandidateId = safeObjectId(candidateId);
    if (!validCandidateId) return [];

    const visits = await JobLinkVisit.find({ candidateId: validCandidateId })
      .populate('jobId', 'title company location status')
      .populate('employerId', 'companyName fullName email')
      .sort({ createdAt: 1 })
      .lean();

    return visits.map(v => ({
      _id: v._id,
      event: v.event,
      utmSource: v.utmSource,
      createdAt: v.createdAt,
      jobId: v.jobId?._id || v.jobId,
      jobTitle: v.jobId?.title || 'Unknown Job',
      jobLocation: v.jobId?.location || '',
      companyName: v.employerId?.companyName || v.jobId?.company || 'Unknown Employer',
      employerId: v.employerId?._id || v.employerId
    }));
  } catch (err) {
    console.warn('[AttributionService] Failed to get candidate visits:', err.message);
    return [];
  }
};

module.exports = {
  recordJobVisit,
  applyFirstTouchAttribution,
  getCandidateVisits,
  safeObjectId
};
