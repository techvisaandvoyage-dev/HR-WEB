const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Employer = require('../employer/models/Employer');
const { syncEmployersSheet } = require('../services/googleSheetService');

async function migrateEmployerIds() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Fetch all employers sorted chronologically (or by createdAt)
    const employers = await Employer.find().sort({ createdAt: 1 });
    console.log(`Found ${employers.length} employers to assign Employer IDs...`);

    let currentId = 400201;
    for (let i = 0; i < employers.length; i++) {
      const emp = employers[i];
      await Employer.updateOne(
        { _id: emp._id },
        { $set: { employerId: currentId } }
      );
      console.log(`Assigned Employer ID #${currentId} -> ${emp.companyName || emp.fullName} (${emp.email})`);
      currentId++;
    }

    console.log('\nAll employers updated with Employer IDs (starting from 400201)!');
    console.log('Syncing updated Employer IDs to Google Sheet...');
    const syncRes = await syncEmployersSheet();
    console.log('Employers Google Sheet Synced Successfully:', syncRes);

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateEmployerIds();
