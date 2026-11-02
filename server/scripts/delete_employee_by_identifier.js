/**
 * Delete employee account by identifier (passed as argument or default)
 * Usage: node scripts/delete_employee_by_identifier.js <term>
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const searchTerms = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['sonic', 'yashrajsingh28359'];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const Employee = require('../employee/models/Employee');
  const Application = mongoose.model('Application', new mongoose.Schema({}, { strict: false }));

  for (const term of searchTerms) {
    console.log(`\nSearching for: "${term}"...`);
    const query = {
      $or: [
        { email: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } }
      ]
    };

    const employees = await Employee.find(query);

    if (employees.length === 0) {
      console.log(`  No employee found matching "${term}"`);
      continue;
    }

    for (const employee of employees) {
      console.log('  Found employee:');
      console.log('    _id        :', employee._id.toString());
      console.log('    name       :', employee.name);
      console.log('    email      :', employee.email);
      console.log('    candidateId:', employee.candidateId);

      let appDeleted = 0;
      try {
        const appResult = await Application.deleteMany({
          $or: [
            { candidateEmail: employee.email },
            { candidateId: employee._id },
            { applicantId: employee._id }
          ]
        });
        appDeleted = appResult.deletedCount;
      } catch (e) {
        console.log('    Could not delete applications:', e.message);
      }

      await Employee.deleteOne({ _id: employee._id });
      console.log(`    ✅ Deleted employee "${employee.name}" (${employee.email}) - Applications deleted: ${appDeleted}`);
    }
  }

  process.exit(0);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
