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
    default: 'sahijob.com',
  },
  logoText: {
    type: String,
    default: 'sahijob',
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
    default: 'contact@sahijob.com',
  },
  copyright: {
    type: String,
    default: '© 2026 sahijob.com. All rights reserved.',
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
  },
  columnOrder: {
    type: [String],
    default: ['Company', 'Services', 'Support', 'Legal']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FooterConfig', footerConfigSchema);
