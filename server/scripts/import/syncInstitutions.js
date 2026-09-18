/**
 * Master Institution Database Synchronizer
 * Usage: node scripts/import/syncInstitutions.js
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Institution = require('../../models/Institution');
const { importAisheInstitutions } = require('./importAishe');
const { importGlobalInstitutions } = require('./importGlobal');

const runSync = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URI is missing from .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB database...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB Connected successfully.');

  console.log('\n=============================================');
  console.log('  STARTING INSTITUTION MASTER DB SYNC');
  console.log('=============================================\n');

  const aisheStats = await importAisheInstitutions(Institution);
  console.log(`[${aisheStats.source}]`);
  console.log(`  Imported: ${aisheStats.imported}`);
  console.log(`  Updated:  ${aisheStats.updated}`);
  console.log(`  Duplicates: ${aisheStats.duplicates}`);
  console.log(`  Failed:   ${aisheStats.failed}`);
  console.log(`  Total:    ${aisheStats.totalProcessed}\n`);

  const globalStats = await importGlobalInstitutions(Institution);
  console.log(`[${globalStats.source}]`);
  console.log(`  Imported: ${globalStats.imported}`);
  console.log(`  Updated:  ${globalStats.updated}`);
  console.log(`  Duplicates: ${globalStats.duplicates}`);
  console.log(`  Failed:   ${globalStats.failed}`);
  console.log(`  Total:    ${globalStats.totalProcessed}\n`);

  const totalInDb = await Institution.countDocuments();
  console.log('=============================================');
  console.log(`  SYNC COMPLETE! Total institutions in Master DB: ${totalInDb}`);
  console.log('=============================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

runSync().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
