const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  hidePostedByCardGlobally: {
    type: Boolean,
    default: false, // Default is false (Turned ON / Visible)
  },
  // Candidates Live Google Sheet
  candidatesSheetId: {
    type: String,
    default: ''
  },
  candidatesSheetUrl: {
    type: String,
    default: ''
  },
  candidatesSheetLastSynced: {
    type: Date,
    default: null
  },
  // Employers Live Google Sheet
  employersSheetId: {
    type: String,
    default: ''
  },
  employersSheetUrl: {
    type: String,
    default: ''
  },
  employersSheetLastSynced: {
    type: Date,
    default: null
  },
  // Daily Job Posting Limit Controls (Applies to both Employers and Consultants)
  dailyJobLimitEnabled: {
    type: Boolean,
    default: false
  },
  maxJobsPerDay: {
    type: Number,
    default: 5
  },
  limitErrorMessage: {
    type: String,
    default: 'Daily job post limit reached ({limit} jobs/day). You can post new jobs tomorrow.'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
