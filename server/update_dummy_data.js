const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const employeeSchema = new mongoose.Schema({}, { strict: false });
const Employee = mongoose.model('Employee', employeeSchema);

const designations = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Product Manager",
  "UI/UX Designer",
  "HR Executive"
];

const experiences = [
  "Fresher",
  "Less than 1 Year",
  "1 Year",
  "2 Years",
  "3 Years",
  "5 Years"
];

async function updateDummyData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const employees = await Employee.find({});
    let updatedCount = 0;

    for (let emp of employees) {
      const randomDesig = designations[Math.floor(Math.random() * designations.length)];
      const randomExp = experiences[Math.floor(Math.random() * experiences.length)];

      emp.set('designation', randomDesig);
      emp.set('totalExperience', randomExp);
      
      await emp.save();
      updatedCount++;
    }

    console.log(`Updated ${updatedCount} employees with random designation and experience!`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating dummy data:', error);
    process.exit(1);
  }
}

updateDummyData();
