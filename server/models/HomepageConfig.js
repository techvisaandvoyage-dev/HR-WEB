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
  },
  typography: {
    primaryFont: {
      source: { type: String, enum: ['google', 'custom'], default: 'google' },
      family: { type: String, default: 'Inter' },
      customUrl: { type: String, default: '' },
      urlType: { type: String, enum: ['font-file', 'stylesheet'], default: 'font-file' },
      appliedTo: { type: String, default: 'Body paragraphs, buttons, form inputs, candidate cards, and UI' }
    },
    headingFont: {
      source: { type: String, enum: ['google', 'custom'], default: 'google' },
      family: { type: String, default: 'Plus Jakarta Sans' },
      customUrl: { type: String, default: '' },
      urlType: { type: String, enum: ['font-file', 'stylesheet'], default: 'font-file' },
      appliedTo: { type: String, default: 'H1-H6 titles, section headers, card titles, and modals' }
    },
    secondaryFont: {
      source: { type: String, enum: ['google', 'custom'], default: 'google' },
      family: { type: String, default: 'Roboto' },
      customUrl: { type: String, default: '' },
      urlType: { type: String, enum: ['font-file', 'stylesheet'], default: 'font-file' },
      appliedTo: { type: String, default: 'Hero highlights, badges, chips, tags, and stats' }
    }
  },
  customFontsLibrary: [{
    family: { type: String, required: true },
    customUrl: { type: String, required: true },
    urlType: { type: String, enum: ['font-file', 'stylesheet'], default: 'font-file' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  employeeRegister: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  employeeLogin: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  employeeOnboarding: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('HomepageConfig', homepageConfigSchema);
