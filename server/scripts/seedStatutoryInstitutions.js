const mongoose = require('mongoose');
require('dotenv').config();
const Institution = require('../models/Institution');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // 1. Delete bare acronym records like 'ICAI'
  const del = await Institution.deleteMany({ name: /^icai$/i });
  console.log('Deleted bare ICAI documents:', del.deletedCount);

  // 2. Upsert The Institute of Chartered Accountants of India
  const icai = await Institution.findOneAndUpdate(
    { normalizedName: 'the institute of chartered accountants of india' },
    {
      $set: {
        id: 'STAT-ICAI',
        name: 'The Institute of Chartered Accountants of India',
        normalizedName: 'the institute of chartered accountants of india',
        aliases: [
          'Institute of Chartered Accountants of India',
          'ICAI',
          'ICAI New Delhi',
          'Chartered Accountants of India',
          'CA Institute'
        ],
        normalizedAliases: [
          'institute of chartered accountants of india',
          'icai',
          'icai new delhi',
          'chartered accountants of india',
          'ca institute'
        ],
        acronyms: ['ICAI', 'CA'],
        normalizedAcronyms: ['icai', 'ca'],
        type: 'institute',
        sector: 'higher_education',
        country: 'India',
        countryCode: 'IN',
        state: 'Delhi',
        city: 'New Delhi',
        district: 'Central Delhi',
        address: 'ICAI Bhawan, Indraprastha Marg, New Delhi 110002',
        website: 'https://www.icai.org',
        source: 'MANUAL',
        status: 'verified'
      }
    },
    { upsert: true, new: true }
  );
  console.log('Upserted ICAI:', icai.name);

  // 3. Upsert The Institute of Company Secretaries of India
  const icsi = await Institution.findOneAndUpdate(
    { normalizedName: 'the institute of company secretaries of india' },
    {
      $set: {
        id: 'STAT-ICSI',
        name: 'The Institute of Company Secretaries of India',
        normalizedName: 'the institute of company secretaries of india',
        aliases: [
          'Institute of Company Secretaries of India',
          'ICSI',
          'ICSI New Delhi',
          'Company Secretaries of India',
          'CS Institute'
        ],
        normalizedAliases: [
          'institute of company secretaries of india',
          'icsi',
          'icsi new delhi',
          'company secretaries of india',
          'cs institute'
        ],
        acronyms: ['ICSI', 'CS'],
        normalizedAcronyms: ['icsi', 'cs'],
        type: 'institute',
        sector: 'higher_education',
        country: 'India',
        countryCode: 'IN',
        state: 'Delhi',
        city: 'New Delhi',
        district: 'South Delhi',
        address: 'ICSI House, 22 Institutional Area, Lodi Road, New Delhi 110003',
        website: 'https://www.icsi.edu',
        source: 'MANUAL',
        status: 'verified'
      }
    },
    { upsert: true, new: true }
  );
  console.log('Upserted ICSI:', icsi.name);

  // 4. Update Institute of Cost Accountants of India
  const cost = await Institution.updateMany(
    { name: /cost accountants/i },
    {
      $set: {
        acronyms: ['ICMAI', 'ICWAI', 'CMA'],
        normalizedAcronyms: ['icmai', 'icwai', 'cma'],
        city: 'Kolkata',
        state: 'West Bengal'
      }
    }
  );
  console.log('Updated Cost Accountants acronyms:', cost.modifiedCount);

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
