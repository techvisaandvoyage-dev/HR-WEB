const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');
const Application = require('../models/Application');
const Job = require('../models/Job');

const emails = ['yashrajsingh28359@gmail.com', 'sonic16t@gmail.com'];

async function inspectAndDelete() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully.');

    for (const email of emails) {
      console.log(`\n================ Checking data for: ${email} ================`);
      const regex = new RegExp(`^${email.trim()}$`, 'i');

      // 1. Employees (Candidates)
      const employees = await Employee.find({ email: regex });
      console.log(`Found ${employees.length} Employee(s):`, employees.map(e => ({ id: e._id, name: e.name, email: e.email })));

      // 2. Employers / Consultants
      const employers = await Employer.find({ email: regex });
      console.log(`Found ${employers.length} Employer(s):`, employers.map(e => ({ id: e._id, name: e.fullName, email: e.email, isConsultant: e.isConsultant, hiringFor: e.hiringFor })));

      const employeeIds = employees.map(e => e._id);
      const employerIds = employers.map(e => e._id);

      // 3. Applications
      const applications = await Application.find({
        $or: [
          { employeeId: { $in: employeeIds } },
          { employerId: { $in: employerIds } }
        ]
      });
      console.log(`Found ${applications.length} Application(s) linked to this user.`);

      // 4. Jobs posted by this employer
      const jobs = await Job.find({ employerId: { $in: employerIds } });
      console.log(`Found ${jobs.length} Job(s) posted by this employer.`);

      // DELETE:
      if (applications.length > 0) {
        const delApps = await Application.deleteMany({
          $or: [
            { employeeId: { $in: employeeIds } },
            { employerId: { $in: employerIds } }
          ]
        });
        console.log(`Deleted ${delApps.deletedCount} Application(s).`);
      }

      if (jobs.length > 0) {
        const delJobs = await Job.deleteMany({ employerId: { $in: employerIds } });
        console.log(`Deleted ${delJobs.deletedCount} Job(s).`);
      }

      if (employees.length > 0) {
        const delEmp = await Employee.deleteMany({ _id: { $in: employeeIds } });
        console.log(`Deleted ${delEmp.deletedCount} Employee(s).`);
      }

      if (employers.length > 0) {
        const delEmpr = await Employer.deleteMany({ _id: { $in: employerIds } });
        console.log(`Deleted ${delEmpr.deletedCount} Employer(s).`);
      }

      console.log(`Completed deletion for ${email}`);
    }

    console.log('\nAll targeted data deleted successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during deletion:', err);
    process.exit(1);
  }
}

inspectAndDelete();
