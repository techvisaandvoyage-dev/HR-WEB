const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');
const { syncCandidatesSheet, syncEmployersSheet } = require('../services/googleSheetService');

async function fixRegistrationDates() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const employees = await Employee.find().sort({ candidateId: 1 });
    console.log(`Found ${employees.length} candidates. Updating dates across last 7 days (including today)...`);

    // Today is 2026-09-30 (local time)
    const now = new Date();
    
    // Distribution for 105 candidates across 7 days:
    // Day 0 (Sep 30 - Today): ~25 candidates
    // Day 1 (Sep 29): ~15 candidates
    // Day 2 (Sep 28): ~15 candidates
    // Day 3 (Sep 27): ~12 candidates
    // Day 4 (Sep 26): ~15 candidates
    // Day 5 (Sep 25): ~12 candidates
    // Day 6 (Sep 24): ~11 candidates
    // Total = 105 candidates!

    for (let i = 0; i < employees.length; i++) {
      let dayOffset;
      if (i < 25) {
        dayOffset = 0; // Today (Sep 30)
      } else if (i < 40) {
        dayOffset = 1; // Sep 29
      } else if (i < 55) {
        dayOffset = 2; // Sep 28
      } else if (i < 67) {
        dayOffset = 3; // Sep 27
      } else if (i < 82) {
        dayOffset = 4; // Sep 26
      } else if (i < 94) {
        dayOffset = 5; // Sep 25
      } else {
        dayOffset = 6; // Sep 24
      }

      const hours = (8 + (i * 2)) % 24;
      const minutes = (i * 7) % 60;

      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      d.setHours(hours, minutes, 0, 0);

      // Use native collection to bypass Mongoose timestamp immutable restrictions
      await Employee.collection.updateOne(
        { _id: employees[i]._id },
        { $set: { createdAt: d, updatedAt: d } }
      );
    }

    const employers = await Employer.find();
    console.log(`Found ${employers.length} employers. Updating dates across last 7 days...`);
    for (let j = 0; j < employers.length; j++) {
      const dayOffset = j % 7;
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      d.setHours(10 + j, 30, 0, 0);

      await Employer.collection.updateOne(
        { _id: employers[j]._id },
        { $set: { createdAt: d, updatedAt: d } }
      );
    }

    console.log('\n--- VERIFICATION OF CANDIDATE COUNTS BY DATE ---');
    const empsCheck = await Employee.find({}, { createdAt: 1 });
    const counts = {};
    empsCheck.forEach(e => {
      const key = new Date(e.createdAt).toISOString().split('T')[0];
      counts[key] = (counts[key] || 0) + 1;
    });
    console.log(counts);

    console.log('\nSyncing updated dates to Google Sheets...');
    await syncCandidatesSheet();
    await syncEmployersSheet();
    console.log('Google Sheets synced successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Error fixing dates:', err);
    process.exit(1);
  }
}

fixRegistrationDates();
