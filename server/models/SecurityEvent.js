const mongoose = require('mongoose');

const SecurityEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  role: {
    type: String,
    enum: ['candidate', 'employer', 'consultant'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['RATE_LIMIT', 'AUTO_BLOCK', 'MANUAL_BLOCK', 'UNBLOCK'],
    required: true,
    index: true
  },
  ip: { type: String, default: '' },
  path: { type: String, default: '' },
  note: { type: String, default: '' },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60
  }
});

SecurityEventSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityEvent', SecurityEventSchema);
