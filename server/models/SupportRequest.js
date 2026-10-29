const mongoose = require('mongoose');

const SupportMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['admin', 'user'], required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
});

const SupportRequestSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportProblem',
    required: false,
    default: null,
  },
  problemText: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  userType: {
    type: String,
    enum: ['guest', 'employee', 'employer', 'consultant'],
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  ip: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
    index: true,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  // Messaging thread: admin replies + user follow-up selections
  messages: { type: [SupportMessageSchema], default: [] },
  hasUnreadAdminReply: { type: Boolean, default: false },
}, { timestamps: true });

// Add required indexes on status, userType, createdAt, email
SupportRequestSchema.index({ status: 1, createdAt: -1 });
SupportRequestSchema.index({ userType: 1, createdAt: -1 });
SupportRequestSchema.index({ email: 1, createdAt: -1 });
SupportRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);

