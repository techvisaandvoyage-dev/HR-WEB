const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

async function checkApps() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Application = mongoose.model('Application', new mongoose.Schema({}, { strict: false }));
    const count = await Application.countDocuments({});
    console.log('Total Apps count in DB:', count);

    const sample = await Application.find({}).limit(5).lean();
    console.log('Sample applications:', sample.map(s => ({ _id: s._id, createdAt: s.createdAt, appliedAt: s.appliedAt, date: s.date })));

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const cnt = await Application.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } });
      console.log(`Day ${d.toLocaleDateString()}: ${cnt} apps`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkApps();
