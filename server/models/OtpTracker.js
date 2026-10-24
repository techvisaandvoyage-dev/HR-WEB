const mongoose = require('mongoose');

const OtpTrackerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true,
  },
  sendCount: {
    type: Number,
    default: 0,
  },
  lastSentAt: {
    type: Date,
    default: Date.now,
  },
  failedAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  // Role-specific failed attempts and lock timestamps
  employeeFailedAttempts: {
    type: Number,
    default: 0,
  },
  employeeLockUntil: {
    type: Date,
    default: null,
  },
  employerFailedAttempts: {
    type: Number,
    default: 0,
  },
  employerLockUntil: {
    type: Date,
    default: null,
  },
  consultantFailedAttempts: {
    type: Number,
    default: 0,
  },
  consultantLockUntil: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 172800, // Auto-cleanup after 48 hours (2 days)
  },
});

OtpTrackerSchema.index({ email: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('OtpTracker', OtpTrackerSchema);
