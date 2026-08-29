const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  company: { type: String, required: true },
  companyInitial: { type: String },
  title: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: String, required: true },
  employerProvided: { type: Boolean, default: false },
  rating: { type: String },
  easyApply: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['Active', 'Closed'],
    default: 'Active'
  },
  statusColor: { type: String, default: 'bg-green-100 text-green-700' },
  applications: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  viewedBy: [{ type: String }],
  recruiterActions: { type: Number, default: 0 },
  qualifications: [{
    name: String,
    met: { type: Boolean, default: false }
  }],
  details: {
    workLocation: String,
    jobTitle: String,
    employmentType: String,
    experience: String,
    aboutRole: String,
    responsibilities: String,
    skillsRequired: String,
    salary: String,
    qualification: String,
    stream: String,
    jobCategory: String
  },
  screeningQuestions: [{
    question: String,
    type: { type: String, enum: ['Yes/No', 'Short Text'] },
    required: { type: Boolean, default: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
