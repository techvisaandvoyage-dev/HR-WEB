const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Job = require('../models/Job');
const Application = require('../models/Application');

async function clearJobs() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not set in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const totalJobs = await Job.countDocuments();
    const totalApps = await Application.countDocuments();

    console.log(`Found ${totalJobs} jobs and ${totalApps} applications in database.`);

    const deletedApps = await Application.deleteMany({});
    console.log(`Deleted ${deletedApps.deletedCount} applications.`);

    const deletedJobs = await Job.deleteMany({});
    console.log(`Deleted ${deletedJobs.deletedCount} jobs.`);

    console.log('All dummy/existing jobs and related applications successfully removed!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing jobs:', error);
    process.exit(1);
  }
}

clearJobs();
