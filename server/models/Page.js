const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  summary: {
    type: String,
    default: 'No summary yet.',
  },
  footer: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft',
  },
  content: {
    type: String,
    default: '',
  },
  metaTitle: {
    type: String,
    default: '',
  },
  canonicalUrl: {
    type: String,
    default: '',
  },
  metaDescription: {
    type: String,
    default: '',
  },
  keywords: {
    type: String,
    default: '',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Page', pageSchema);
