const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Employee = require('../employee/models/Employee');
  
  const res = await Employee.updateOne({ email: /sonic16t/i }, { $set: { isProfilePrivate: true } });
  console.log('Update result for sonic:', res);

  const updated = await Employee.findOne({ email: /sonic16t/i }).select('name email isProfilePrivate');
  console.log('Updated Sonic in DB:', updated);

  process.exit(0);
}
run();
