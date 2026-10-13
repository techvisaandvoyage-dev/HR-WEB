/**
 * Safe & Idempotent Migration Script: Backfill Candidate Acquisition Attribution
 * 
 * Rules:
 * - If candidate already has acquisition.firstTouchJob or sourceType === 'job_link', it skips (idempotent).
 * - If candidate has applications, sets acquisition from their earliest application's job (sourceType: 'job_link').
 * - Otherwise sets sourceType: 'direct'.
 * 
 * Usage:
 *   cd server
 *   node scripts/backfillAcquisition.js
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Employee = require('../employee/models/Employee');
const Job = require('../models/Job');
const Application = require('../models/Application');
const JobLinkVisit = require('../models/JobLinkVisit');

async function runBackfill() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URI is missing in .env file');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.\n');

  console.log('Starting candidate acquisition backfill...');
  const candidates = await Employee.find({});
  console.log(`Found ${candidates.length} total candidates to inspect.\n`);

  let countSkipped = 0;
  let countJobLink = 0;
  let countDirect = 0;

  for (const candidate of candidates) {
    // 1. Idempotency check: If candidate already has acquisition set to job_link or already initialized
    if (candidate.acquisition && candidate.acquisition.firstTouchJob) {
      countSkipped++;
      continue;
    }

    // 2. Find earliest application submitted by candidate
    const earliestApp = await Application.findOne({ employeeId: candidate._id })
      .sort({ createdAt: 1 })
      .populate('jobId');

    if (earliestApp && earliestApp.jobId) {
      const job = earliestApp.jobId;
      const employerId = earliestApp.employerId || job.employerId || null;

      candidate.acquisition = {
        firstTouchJob: job._id,
        firstTouchEmployer: employerId,
        sourceType: 'job_link',
        utmSource: null,
        landedAt: earliestApp.createdAt || candidate.createdAt,
        registeredAt: candidate.createdAt || new Date(),
        jobSnapshot: {
          title: job.title || '',
          companyName: job.company || ''
        }
      };

      await candidate.save();
      countJobLink++;

      // Also ensure a historical JobLinkVisit 'applied' record exists
      try {
        const existingVisit = await JobLinkVisit.findOne({
          candidateId: candidate._id,
          jobId: job._id,
          event: 'applied'
        });

        if (!existingVisit) {
          await JobLinkVisit.create({
            candidateId: candidate._id,
            jobId: job._id,
            employerId,
            utmSource: null,
            event: 'applied',
            createdAt: earliestApp.createdAt || candidate.createdAt
          });
        }
      } catch (visitErr) {
        console.warn(`[Visit Warning] Could not backfill visit for candidate ${candidate._id}:`, visitErr.message);
      }
    } else {
      // 3. No applications -> Mark as Direct / Organic
      // If candidate already has acquisition.sourceType === 'direct', keep it
      if (candidate.acquisition && candidate.acquisition.sourceType === 'direct' && candidate.acquisition.registeredAt) {
        countSkipped++;
        continue;
      }

      candidate.acquisition = {
        firstTouchJob: null,
        firstTouchEmployer: null,
        sourceType: 'direct',
        utmSource: null,
        landedAt: null,
        registeredAt: candidate.createdAt || new Date(),
        jobSnapshot: {
          title: '',
          companyName: ''
        }
      };

      await candidate.save();
      countDirect++;
    }
  }

  console.log('----------------------------------------------------');
  console.log('Backfill Summary:');
  console.log(`  - Total Candidates Processed: ${candidates.length}`);
  console.log(`  - Already Attributed (Skipped): ${countSkipped}`);
  console.log(`  - Backfilled from Earliest Job Application (Job Link): ${countJobLink}`);
  console.log(`  - Backfilled as Direct / Organic: ${countDirect}`);
  console.log('----------------------------------------------------');
  console.log('Backfill completed successfully!\n');

  await mongoose.disconnect();
  process.exit(0);
}

runBackfill().catch(err => {
  console.error('Backfill migration failed with error:', err);
  process.exit(1);
});
