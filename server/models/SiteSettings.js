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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
