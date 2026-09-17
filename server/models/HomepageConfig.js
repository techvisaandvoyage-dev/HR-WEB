const mongoose = require('mongoose');

const homepageConfigSchema = new mongoose.Schema({
  logo: {
    type: {
      type: String,
      enum: ['text', 'image'],
      default: 'text'
    },
    text: { type: String, default: 'sahijob' },
    accentText: { type: String, default: '.com' },
    imageUrl: { type: String, default: '' },
    altText: { type: String, default: 'sahijob.com' },
    height: { type: Number, default: 36 }
  },
  hero: {
    titlePrefix: { type: String, default: 'Find Your' },
    titleHighlight: { type: String, default: 'Dream Job' },
    subtitle: { type: String, default: 'Discover opportunities that align with your passion and expertise.' }
  },
  searchBar: {
    jobPlaceholder: { type: String, default: 'Job title...' },
    locationPlaceholder: { type: String, default: 'City, state, or country...' },
    buttonText: { type: String, default: 'Search Jobs' },
    showArrow: { type: Boolean, default: true }
  },
  jobCards: {
    heading: { type: String, default: 'Latest Opportunities' },
    showSparkleIcon: { type: Boolean, default: true },
    subtextTemplate: { type: String, default: 'Showing {count} jobs' },
    viewAllButtonText: { type: String, default: 'View All Jobs' },
    initialCount: { type: Number, default: 6 },
    showMoreCount: { type: Number, default: 6 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HomepageConfig', homepageConfigSchema);
