const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');
const { syncCandidatesSheet, syncEmployersSheet } = require('../services/googleSheetService');

async function updateRegistrationDates() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const employees = await Employee.find().sort({ candidateId: 1 });
    console.log(`Updating ${employees.length} candidates across the last 7 days...`);

    const now = new Date();
    // Distribute nicely across past 0 to 6 days
    for (let i = 0; i < employees.length; i++) {
      const dayOffset = i % 7; // 0, 1, 2, 3, 4, 5, 6
      const hours = (9 + (i * 2)) % 24;
      const minutes = (i * 13) % 60;
      
      const createdDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset, hours, minutes, 0);

      await Employee.updateOne(
        { _id: employees[i]._id },
        { $set: { createdAt: createdDate } }
      );
    }

    const employers = await Employer.find();
    console.log(`Updating ${employers.length} employers across the last 7 days...`);
    for (let j = 0; j < employers.length; j++) {
      const dayOffset = (j * 2) % 7;
      const createdDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset, 10 + (j % 8), 30, 0);

      await Employer.updateOne(
        { _id: employers[j]._id },
        { $set: { createdAt: createdDate } }
      );
    }

    console.log('Registration dates distributed across last 7 days successfully!');

    // Re-sync sheets
    console.log('Syncing Google Sheets with updated dates...');
    await syncCandidatesSheet();
    await syncEmployersSheet();
    console.log('Google Sheets synced successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Error updating dates:', err);
    process.exit(1);
  }
}

updateRegistrationDates();
