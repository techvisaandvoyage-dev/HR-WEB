const mongoose = require('mongoose');

const OtpUnlockLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['employee', 'employer', 'consultant', 'general'],
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: '',
    },
    adminId: {
      type: String,
      default: 'admin',
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    previousFailedAttempts: {
      type: Number,
      default: 0,
    },
    previousLockUntil: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      default: 'Admin manual unlock',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OtpUnlockLog', OtpUnlockLogSchema);
