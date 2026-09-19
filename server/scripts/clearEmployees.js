require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function clearEmployeeData() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    const Employee = require('../employee/models/Employee');
    const Employer = require('../employer/models/Employer');
    const Job = require('../models/Job');
    const Application = require('../models/Application');
    const Message = require('../models/Message');

    // Counts before
    const beforeEmployees = await Employee.countDocuments();
    const beforeEmployers = await Employer.countDocuments();
    const beforeJobs = await Job.countDocuments();
    const beforeApplications = await Application.countDocuments();
    const beforeMessages = await Message.countDocuments();

    console.log('=== BEFORE CLEARING ===');
    console.log(`Employees:    ${beforeEmployees}`);
    console.log(`Employers:    ${beforeEmployers} (Will be preserved)`);
    console.log(`Jobs:         ${beforeJobs} (Will be preserved)`);
    console.log(`Applications: ${beforeApplications}`);
    console.log(`Messages:     ${beforeMessages}`);

    // Clear employee records
    const deleteEmpResult = await Employee.deleteMany({});
    console.log(`Deleted ${deleteEmpResult.deletedCount} employee records.`);

    // Clear applications & messages from/to employees to prevent orphaned data
    const deleteAppResult = await Application.deleteMany({});
    console.log(`Deleted ${deleteAppResult.deletedCount} application records.`);

    const deleteMsgResult = await Message.deleteMany({});
    console.log(`Deleted ${deleteMsgResult.deletedCount} message records.`);

    // Reset application count and viewedBy on all jobs
    const updateJobsResult = await Job.updateMany({}, { $set: { applications: 0, viewedBy: [] } });
    console.log(`Reset application counters on ${updateJobsResult.modifiedCount} jobs.`);

    // Counts after
    const afterEmployees = await Employee.countDocuments();
    const afterEmployers = await Employer.countDocuments();
    const afterJobs = await Job.countDocuments();
    const afterApplications = await Application.countDocuments();
    const afterMessages = await Message.countDocuments();

    console.log('=== AFTER CLEARING ===');
    console.log(`Employees:    ${afterEmployees} (Cleared to 0)`);
    console.log(`Employers:    ${afterEmployers} (Intact & preserved)`);
    console.log(`Jobs:         ${afterJobs} (Intact & preserved)`);
    console.log(`Applications: ${afterApplications} (Cleared to 0)`);
    console.log(`Messages:     ${afterMessages} (Cleared to 0)`);

    console.log('\nEmployee DB successfully cleared for fresh test!');
  } catch (error) {
    console.error('Error clearing employee DB:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

clearEmployeeData();
