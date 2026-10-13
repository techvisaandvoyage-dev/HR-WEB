const mongoose = require('mongoose');

const JobLinkVisitSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    default: null
  },
  utmSource: {
    type: String,
    trim: true,
    default: null
  },
  event: {
    type: String,
    enum: ['landed', 'signed_up', 'logged_in', 'started_application', 'applied'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound indexes for fast admin querying and candidate timeline inspection
JobLinkVisitSchema.index({ candidateId: 1, jobId: 1 });
JobLinkVisitSchema.index({ candidateId: 1, createdAt: -1 });
JobLinkVisitSchema.index({ jobId: 1, event: 1 });

module.exports = mongoose.model('JobLinkVisit', JobLinkVisitSchema);
