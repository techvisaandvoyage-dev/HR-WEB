const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

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
    const JobLinkVisit = require('../models/JobLinkVisit');
    const Employee = require('../employee/models/Employee');

    const totalEmployers = await Employer.countDocuments();
    const regularEmployers = await Employer.countDocuments({ isConsultant: { $ne: true } });
    const consultants = await Employer.countDocuments({ isConsultant: true });
    const beforeJobs = await Job.countDocuments();
    const beforeApps = await Application.countDocuments();
    const beforeMsgs = await Message.countDocuments();
    const beforeVisits = await JobLinkVisit.countDocuments();
    const employeeCount = await Employee.countDocuments();

    console.log('=== BEFORE DELETING ===');
    console.log(`Total Employers/Consultants: ${totalEmployers} (${regularEmployers} employers, ${consultants} consultants)`);
    console.log(`Jobs:                       ${beforeJobs}`);
    console.log(`Applications:               ${beforeApps}`);
    console.log(`Messages:                   ${beforeMsgs}`);
    console.log(`Job Link Visits:            ${beforeVisits}`);
    console.log(`Employees (Candidates):     ${employeeCount} (Preserved)`);

    // 1. Delete all Employers & Consultants
    const delEmployers = await Employer.deleteMany({});
    console.log(`\nDeleted Employers/Consultants: ${delEmployers.deletedCount}`);

    // 2. Delete all Jobs
    const delJobs = await Job.deleteMany({});
    console.log(`Deleted Jobs:                 ${delJobs.deletedCount}`);

    // 3. Delete all Applications
    const delApps = await Application.deleteMany({});
    console.log(`Deleted Applications:         ${delApps.deletedCount}`);

    // 4. Delete Messages involving employers
    const delMsgs = await Message.deleteMany({});
    console.log(`Deleted Messages:             ${delMsgs.deletedCount}`);

    // 5. Delete JobLinkVisits
    const delVisits = await JobLinkVisit.deleteMany({});
    console.log(`Deleted Job Link Visits:      ${delVisits.deletedCount}`);

    const afterEmployers = await Employer.countDocuments();
    const afterJobs = await Job.countDocuments();
    const afterApps = await Application.countDocuments();
    const afterMsgs = await Message.countDocuments();
    const remainingEmployees = await Employee.countDocuments();

    console.log('\n=== AFTER DELETING ===');
    console.log(`Employers/Consultants: ${afterEmployers}`);
    console.log(`Jobs:                  ${afterJobs}`);
    console.log(`Applications:          ${afterApps}`);
    console.log(`Messages:              ${afterMsgs}`);
    console.log(`Employees (Preserved): ${remainingEmployees}`);

    console.log('\nAll employer and consultant data deleted successfully!');
  } catch (error) {
    console.error('Error deleting employer and consultant data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

cleanEmployerData();
