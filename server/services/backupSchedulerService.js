const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');

/**
 * Perform single-file database backup and email it via Resend
 */
async function performAutomatedBackup() {
  try {
    const settings = await SiteSettings.findOne();
    const targetEmail = settings?.backupEmail || process.env.BACKUP_EMAIL || 'sonic16t@gmail.com';

    const db = mongoose.connection.db;
    if (!db) {
      console.warn('[BACKUP SCHEDULER] Database not connected. Skipping backup run.');
      return false;
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('[BACKUP SCHEDULER] RESEND_API_KEY is not configured in .env. Cannot email backup.');
      return false;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const collections = await db.listCollections().toArray();

    const singleBackup = {
      version: '1.0',
      database: db.databaseName,
      timestamp: now.toISOString(),
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
    }

    const fileName = `sahijob_backup_${dateStr}.json`;
    const jsonContent = JSON.stringify(singleBackup, null, 2);

    const resendPayload = {
      from: process.env.RESEND_FROM_EMAIL || 'SahiJob Database <noreply@sahijob.com>',
      to: targetEmail,
      subject: `📦 SahiJob Automated 15-Day Database Backup (${dateStr})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #059669; margin-top: 0;">📦 SahiJob Automated Database Backup</h2>
          <p>Hi Admin,</p>
          <p>Here is your scheduled 15-day complete single-file database backup for <strong>sahijob.com</strong>.</p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>File Name:</strong> ${fileName}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${now.toLocaleString('en-IN')}</p>
            <p style="margin: 4px 0;"><strong>Collections:</strong> ${Object.keys(singleBackup.collections).length}</p>
            <p style="margin: 4px 0;"><strong>Total Documents:</strong> ${totalDocs}</p>
          </div>
          <p style="font-size: 13px; color: #475569;">You can restore this backup anytime by uploading the attached <code>.json</code> file in your <strong>Admin Panel &rarr; Backup &rarr; Upload & Restore Database</strong>.</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(jsonContent).toString('base64')
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
      await SiteSettings.findOneAndUpdate({}, { lastBackupSentAt: now }, { upsert: true });
      console.log(`[BACKUP SCHEDULER] ✅ Automated backup emailed successfully to ${targetEmail}! (ID: ${resendData.id})`);
      return true;
    } else {
      console.warn(`[BACKUP SCHEDULER] ⚠️ Failed to email backup via Resend:`, resendData.message || resendData);
      return false;
    }
  } catch (error) {
    console.error('[BACKUP SCHEDULER] ❌ Error executing automated backup:', error);
    return false;
  }
}

/**
 * Check if the 15-day interval has passed since the last backup
 */
async function checkAndRunScheduledBackup() {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({
        backupEmail: 'sonic16t@gmail.com',
        lastBackupSentAt: new Date('2026-09-25T14:06:31.000Z'),
        backupFrequencyDays: 15
      });
    }

    const freqDays = settings.backupFrequencyDays || 15;
    // Fall back to Sep 25 if lastBackupSentAt was never set
    const lastSent = settings.lastBackupSentAt 
      ? new Date(settings.lastBackupSentAt) 
      : new Date('2026-09-25T14:06:31.000Z');

    const now = new Date();
    const msPassed = now.getTime() - lastSent.getTime();
    const daysPassed = msPassed / (1000 * 60 * 60 * 24);

    if (daysPassed >= freqDays) {
      console.log(`[BACKUP SCHEDULER] ⏰ Scheduled backup is due (${daysPassed.toFixed(1)} days passed since ${lastSent.toISOString().slice(0, 10)}). Triggering automated backup now...`);
      await performAutomatedBackup();
    } else {
      const remainingDays = (freqDays - daysPassed).toFixed(1);
      console.log(`[BACKUP SCHEDULER] ℹ️ Backup up-to-date. Next automated backup due in ~${remainingDays} days.`);
    }
  } catch (error) {
    console.error('[BACKUP SCHEDULER] ❌ Error checking scheduled backup status:', error.message);
  }
}

/**
 * Initialize background scheduler (checks every hour)
 */
function initBackupScheduler() {
  console.log('[BACKUP SCHEDULER] 🚀 Initializing automated 15-day database backup scheduler...');
  
  // Initial check after 10 seconds of server startup
  setTimeout(() => {
    checkAndRunScheduledBackup();
  }, 10000);

  // Check every 1 hour
  setInterval(() => {
    checkAndRunScheduledBackup();
  }, 60 * 60 * 1000);
}

module.exports = {
  initBackupScheduler,
  checkAndRunScheduledBackup,
  performAutomatedBackup
};
