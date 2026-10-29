const mongoose = require('mongoose');

const SupportQuickReplySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

SupportQuickReplySchema.index({ order: 1, createdAt: 1 });

module.exports = mongoose.model('SupportQuickReply', SupportQuickReplySchema);
