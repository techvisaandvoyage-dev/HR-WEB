require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Employer = require('./employer/models/Employer');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://meraki:meraki@cluster0.wp8rmxv.mongodb.net/hr-website').then(async () => {
  console.log("Connected to MongoDB");
  try {
    const employer = await Employer.create({
      mobile: "9876543210",
      accountType: "company",
      fullName: "Test User",
      email: "test4@example.com",
      password: "Password1!",
      hiringFor: "your_company",
      companyName: "Test Company",
      industry: "IT",
      employees: "10-50",
      designation: "HR",
      location: "Mumbai",
      aboutCompany: "Test about",
      website: "https://example.com"
    });
    console.log("Create Success:", employer);
  } catch (error) {
    console.error("Mongoose Create Error:", error.message);
  }
  process.exit();
});
