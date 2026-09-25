require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI not found in .env file!');
  process.exit(1);
}

const runBackup = async () => {
  try {
    console.log('🔄 Connecting to MongoDB for Backup...');
    const conn = await mongoose.connect(MONGO_URI);
    const db = conn.connection.db;

    const customName = process.argv[2];
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const backupFolderName = customName ? `backup_${customName}` : `backup_${dateStr}`;
    
    const backupsDir = path.join(__dirname, '..', 'backups');
    const targetDir = path.join(backupsDir, backupFolderName);

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const collections = await db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections in database: "${db.databaseName}"`);

    const singleBackup = {
      version: '1.0',
      database: db.databaseName,
      timestamp: now.toISOString(),
      tag: backupFolderName,
      collections: {}
    };

    let totalDocs = 0;

    for (const col of collections) {
      const colName = col.name;
      if (colName.startsWith('system.')) continue;

      const collection = db.collection(colName);
      const docs = await collection.find({}).toArray();
      singleBackup.collections[colName] = docs;
      totalDocs += docs.length;

      // Save individual JSON
      const filePath = path.join(targetDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      console.log(`  ✅ Saved "${colName}" (${docs.length} documents)`);
    }

    // Save single all-in-one backup file inside backupsDir and targetDir
    const singleFileName = `sahijob_${backupFolderName}.json`;
    const singleFilePath = path.join(targetDir, singleFileName);
    const rootSingleFilePath = path.join(backupsDir, singleFileName);
    const singleJsonString = JSON.stringify(singleBackup, null, 2);

    fs.writeFileSync(singleFilePath, singleJsonString, 'utf-8');
    fs.writeFileSync(rootSingleFilePath, singleJsonString, 'utf-8');

    console.log('\n🎉 ================================================');
    console.log(`✅ Single-File Backup created at:`);
    console.log(`📄 ${singleFilePath}`);
    console.log(`📄 ${rootSingleFilePath}`);
    console.log(`📦 Total Collections: ${Object.keys(singleBackup.collections).length} | Total Records: ${totalDocs}`);
    console.log('🎉 ================================================\n');

    // Email dispatch (1 single file attachment)
    const targetEmail = process.argv[3] || (process.argv[2] && process.argv[2].includes('@') ? process.argv[2] : null) || process.env.BACKUP_EMAIL;
    if (targetEmail) {
      console.log(`📧 Sending single backup file (${singleFileName}) to email: ${targetEmail}...`);
      try {
        if (process.env.RESEND_API_KEY) {
          const resendPayload = {
            from: process.env.RESEND_FROM_EMAIL || 'SahiJob Database <noreply@sahijob.com>',
            to: targetEmail,
            subject: `📦 SahiJob Database Backup (${singleFileName})`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #059669; margin-top: 0;">📦 SahiJob Database Backup</h2>
                <p>Hello Admin,</p>
                <p>Your complete single-file database backup is attached below.</p>
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>File Name:</strong> ${singleFileName}</p>
                  <p style="margin: 4px 0;"><strong>Date:</strong> ${now.toLocaleString('en-IN')}</p>
                  <p style="margin: 4px 0;"><strong>Collections:</strong> ${Object.keys(singleBackup.collections).length}</p>
                  <p style="margin: 4px 0;"><strong>Total Documents:</strong> ${totalDocs}</p>
                </div>
                <p style="font-size: 13px; color: #64748b;">You can restore this backup anytime by uploading this single file in <strong>Admin Panel &rarr; Overview &rarr; Database Backup</strong>.</p>
              </div>
            `,
            attachments: [
              {
                filename: singleFileName,
                content: Buffer.from(singleJsonString).toString('base64')
              }
            ]
          };

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify(resendPayload)
          });

          const resendData = await resendResponse.json();
          if (resendResponse.ok) {
            console.log(`✅ Single backup file successfully emailed to ${targetEmail}! (ID: ${resendData.id})`);
          } else {
            console.warn(`⚠️ Could not email backup via Resend:`, resendData.message || resendData);
          }
        }
      } catch (emailErr) {
        console.warn(`⚠️ Backup created locally, but email sending failed:`, emailErr.message);
      }
    }

    try {
      await mongoose.connection.close(false);
    } catch (_) {}
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup Failed:', error);
    process.exit(1);
  }
};

runBackup();
