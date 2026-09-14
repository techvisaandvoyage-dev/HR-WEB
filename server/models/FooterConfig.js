const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { _id: false });

const footerConfigSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'sahijobs.com',
  },
  logoText: {
    type: String,
    default: 'sahijobs',
  },
  description: {
    type: String,
    default: 'Discover opportunities that align with your passion and expertise. Connecting top talent with leading employers worldwide.',
  },
  phone: {
    type: String,
    default: '+1 (555) 234-5678',
  },
  email: {
    type: String,
    default: 'contact@sahijobs.com',
  },
  copyright: {
    type: String,
    default: '© 2026 sahijobs.com. All rights reserved.',
  },
  socialLinks: {
    type: [socialLinkSchema],
    default: [
      { platform: 'Facebook', url: 'https://facebook.com', isActive: true },
      { platform: 'Twitter', url: 'https://twitter.com', isActive: true },
      { platform: 'Instagram', url: 'https://instagram.com', isActive: true },
      { platform: 'LinkedIn', url: 'https://linkedin.com', isActive: true },
      { platform: 'YouTube', url: 'https://youtube.com', isActive: false },
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FooterConfig', footerConfigSchema);
