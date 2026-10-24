const mongoose = require('mongoose');

const SupportProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['all', 'employee', 'employer', 'consultant'],
    default: 'all',
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  order: {
    type: Number,
    default: 0,
    index: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('SupportProblem', SupportProblemSchema);
