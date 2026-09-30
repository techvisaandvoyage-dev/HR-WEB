const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: Number,
    index: true
  },
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
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedBy: {
    type: String,
    enum: ['Employer', 'Employee', null],
    default: null
  },
  blockedAt: {
    type: Date,
    default: null
  },
  screeningAnswers: [{
    question: String,
    answer: String
  }]
}, { timestamps: true });

// Automatically trigger live Google Sheet sync on Application create/update
ApplicationSchema.post('save', function () {
  try {
    const { triggerLiveCandidateSync, triggerLiveEmployerSync } = require('../services/googleSheetService');
    triggerLiveCandidateSync();
    triggerLiveEmployerSync();
  } catch (err) {
    console.warn('[GoogleSheet] Application sync trigger error:', err.message);
  }
});

module.exports = mongoose.model('Application', ApplicationSchema);
