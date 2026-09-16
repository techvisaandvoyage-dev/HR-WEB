const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  hidePostedByCardGlobally: {
    type: Boolean,
    default: false, // Default is false (Turned ON / Visible)
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
