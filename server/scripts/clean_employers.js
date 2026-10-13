require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function cleanEmployerData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB.');

    const Employer = require('../employer/models/Employer');
    const Job = require('../models/Job');
    const Application = require('../models/Application');
    const Message = require('../models/Message');

    const beforeEmployers = await Employer.countDocuments();
    const beforeJobs = await Job.countDocuments();
    console.log(`=== BEFORE DELETING ===`);
    console.log(`Total Employers: ${beforeEmployers}`);
    console.log(`Total Jobs:      ${beforeJobs}`);

    // Delete employers
    const delResult = await Employer.deleteMany({});
    console.log(`Deleted ${delResult.deletedCount} employers.`);

    // Also clean any jobs or messages associated with employers if needed
    const delJobsResult = await Job.deleteMany({});
    console.log(`Deleted ${delJobsResult.deletedCount} jobs.`);

    const afterEmployers = await Employer.countDocuments();
    console.log(`=== AFTER DELETING ===`);
    console.log(`Total Employers: ${afterEmployers}`);

    console.log('\nAll employer data has been deleted successfully!');
  } catch (error) {
    console.error('Error deleting employers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

cleanEmployerData();
