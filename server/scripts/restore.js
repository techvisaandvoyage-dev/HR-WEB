require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI not found in .env file!');
  process.exit(1);
}

const runRestore = async () => {
  try {
    const backupArg = process.argv[2];
    const backupsDir = path.join(__dirname, '..', 'backups');

    if (!fs.existsSync(backupsDir)) {
      console.error('❌ No backups directory found at:', backupsDir);
      process.exit(1);
    }

    const availableBackups = fs.readdirSync(backupsDir).filter(f => {
      const full = path.join(backupsDir, f);
      return fs.statSync(full).isDirectory();
    });

    if (availableBackups.length === 0) {
      console.error('❌ No backup folders found in:', backupsDir);
      process.exit(1);
    }

    let selectedFolder = backupArg;
    if (!selectedFolder) {
      // Pick the latest backup folder by default
      selectedFolder = availableBackups[availableBackups.length - 1];
      console.log(`ℹ️ No backup folder specified. Defaulting to latest: "${selectedFolder}"`);
      console.log(`💡 Available backup folders:`);
      availableBackups.forEach(b => console.log(`   - ${b}`));
    }

    const restorePath = path.isAbsolute(selectedFolder) 
      ? selectedFolder 
      : path.join(backupsDir, selectedFolder);

    if (!fs.existsSync(restorePath)) {
      console.error(`❌ Backup folder not found: ${restorePath}`);
      console.log('Available backups:', availableBackups);
      process.exit(1);
    }

    console.log('\n🔄 Connecting to MongoDB for Restore...');
    const conn = await mongoose.connect(MONGO_URI);
    const db = conn.connection.db;

    console.log(`⚠️ Restoring into database: "${db.databaseName}" from folder:`);
    console.log(`📂 ${restorePath}\n`);

    const files = fs.readdirSync(restorePath).filter(f => f.endsWith('.json') && f !== '_metadata.json');

    for (const file of files) {
      const colName = path.basename(file, '.json');
      const filePath = path.join(restorePath, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const docs = JSON.parse(raw);

      const collection = db.collection(colName);

      // Clean existing records in the collection before restoring
      await collection.deleteMany({});

      if (docs.length > 0) {
        // Convert any $oid or string _id if needed, insert raw docs
        await collection.insertMany(docs);
      }

      console.log(`  ✅ Restored collection "${colName}" (${docs.length} documents)`);
    }

    console.log('\n🎉 ================================================');
    console.log('✅ Database restore completed successfully!');
    console.log('🎉 ================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Restore Failed:', error);
    process.exit(1);
  }
};

runRestore();
