const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  normalizedName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['university', 'college', 'school', 'institute', 'other'],
    default: 'college',
    index: true
  },
  sector: {
    type: String,
    enum: ['higher_education', 'school', 'research', 'other'],
    default: 'higher_education',
    index: true
  },
  country: {
    type: String,
    default: 'India',
    index: true
  },
  countryCode: {
    type: String,
    default: 'IN',
    index: true
  },
  state: {
    type: String,
    default: '',
    index: true
  },
  district: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: '',
    index: true
  },
  address: {
    type: String,
    default: ''
  },
  postalCode: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  affiliatedUniversity: {
    type: String,
    default: ''
  },
  institutionCode: {
    type: String,
    default: ''
  },
  aliases: [{
    type: String,
    trim: true
  }],
  normalizedAliases: [{
    type: String,
    trim: true
  }],
  acronyms: [{
    type: String,
    trim: true
  }],
  normalizedAcronyms: [{
    type: String,
    trim: true
  }],
  source: {
    type: String,
    enum: ['AISHE', 'UGC', 'UDISE', 'IDSCU', 'WIKIDATA', 'HIPO', 'MANUAL'],
    default: 'AISHE',
    index: true
  },
  sourceId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'verified'],
    default: 'active'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound & Single Indexes for fast search and unique lookup
institutionSchema.index({ normalizedName: 1, country: 1, state: 1, city: 1 });
institutionSchema.index({ normalizedAliases: 1 });
institutionSchema.index({ normalizedAcronyms: 1 });
institutionSchema.index({ acronyms: 1, city: 1, state: 1 });
institutionSchema.index({ city: 1, state: 1, country: 1 });
institutionSchema.index({ name: 'text', normalizedName: 'text', affiliatedUniversity: 'text' });

module.exports = mongoose.model('Institution', institutionSchema);
