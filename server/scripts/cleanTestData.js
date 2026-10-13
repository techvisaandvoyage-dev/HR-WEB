const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');
const Job = require('../models/Job');
const Application = require('../models/Application');
const JobLinkVisit = require('../models/JobLinkVisit');
const Message = require('../models/Message');

const PRESERVED_EMAIL = 'gauravajm@gmail.com';
const emailRegex = new RegExp(`^${PRESERVED_EMAIL}$`, 'i');

async function cleanData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.');

  // 1. Check preserved records
  const preservedEmployees = await Employee.find({ email: emailRegex });
  const preservedEmployers = await Employer.find({ email: emailRegex });

  console.log(`Preserved Candidate(s) matching ${PRESERVED_EMAIL}:`, preservedEmployees.map(e => ({ id: e._id, name: e.name, email: e.email })));
  console.log(`Preserved Employer(s) matching ${PRESERVED_EMAIL}:`, preservedEmployers.map(e => ({ id: e._id, name: e.fullName, email: e.email, hiringFor: e.hiringFor })));

  const preservedEmployerIds = preservedEmployers.map(e => e._id);
  const preservedEmployeeIds = preservedEmployees.map(e => e._id);

  // 2. Delete all other Employees (Candidates)
  const delEmployeesResult = await Employee.deleteMany({ email: { $not: emailRegex } });
  console.log(`Deleted other Candidates: ${delEmployeesResult.deletedCount}`);

  // 3. Delete all other Employers & Consultants
  const delEmployersResult = await Employer.deleteMany({ email: { $not: emailRegex } });
  console.log(`Deleted other Employers/Consultants: ${delEmployersResult.deletedCount}`);

  // 4. Delete Jobs belonging to deleted employers
  let delJobsResult;
  if (preservedEmployerIds.length > 0) {
    delJobsResult = await Job.deleteMany({ employerId: { $nin: preservedEmployerIds } });
  } else {
    delJobsResult = await Job.deleteMany({});
  }
  console.log(`Deleted Jobs belonging to deleted employers: ${delJobsResult.deletedCount}`);

  // 5. Delete Applications not belonging to preserved employees or preserved jobs
  const remainingJobIds = (await Job.find({}, '_id')).map(j => j._id);
  const delAppsResult = await Application.deleteMany({
    $or: [
      { candidateId: { $nin: preservedEmployeeIds } },
      { jobId: { $nin: remainingJobIds } }
    ]
  });
  console.log(`Deleted Applications: ${delAppsResult.deletedCount}`);

  // 6. Delete Messages
  const delMsgResult = await Message.deleteMany({
    $and: [
      { senderId: { $nin: [...preservedEmployerIds, ...preservedEmployeeIds] } },
      { receiverId: { $nin: [...preservedEmployerIds, ...preservedEmployeeIds] } }
    ]
  });
  console.log(`Cleaned Messages: ${delMsgResult.deletedCount}`);

  // 7. Clean JobLinkVisits for non-existent jobs
  const delVisitsResult = await JobLinkVisit.deleteMany({ jobId: { $nin: remainingJobIds } });
  console.log(`Cleaned JobLinkVisits: ${delVisitsResult.deletedCount}`);

  console.log('Cleanup completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

cleanData().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
