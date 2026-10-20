const mongoose = require('mongoose');

const BouncedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  reason: {
    type: String,
    default: 'delivery_failure',
  },
  provider: {
    type: String,
    default: 'resend',
  },
  bouncedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('BouncedEmail', BouncedEmailSchema);
