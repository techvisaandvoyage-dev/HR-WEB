const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'Viewed', 'Shortlisted', 'Rejected'],
    default: 'New'
  },
  statusColor: {
    type: String,
    default: 'bg-blue-50 text-blue-600 border border-blue-100'
  },
  screeningAnswers: [{
    question: String,
    answer: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
