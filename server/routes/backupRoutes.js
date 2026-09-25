const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Determine backup directory
const getBackupsDir = () => {
  const hostingerPublicHtmlBackups = path.join(__dirname, '..', '..', 'public_html', 'backups');
  if (fs.existsSync(path.join(__dirname, '..', '..', 'public_html'))) {
    if (!fs.existsSync(hostingerPublicHtmlBackups)) {
      fs.mkdirSync(hostingerPublicHtmlBackups, { recursive: true });
    }
    return hostingerPublicHtmlBackups;
  }
  
  const standardDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(standardDir)) {
    fs.mkdirSync(standardDir, { recursive: true });
  }
  return standardDir;
};

// GET all backups list
router.get('/list', async (req, res) => {
  try {
    const backupsDir = getBackupsDir();
    if (!fs.existsSync(backupsDir)) {
      return res.json({ success: true, data: [] });
    }

    const entries = fs.readdirSync(backupsDir);
    const backupsList = [];

    for (const item of entries) {
      const fullPath = path.join(backupsDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        let metadata = null;
        const metaPath = path.join(fullPath, '_metadata.json');
        if (fs.existsSync(metaPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          } catch (_) {}
        }
        const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json') && f !== '_metadata.json');
        backupsList.push({
          name: item,
          type: 'folder',
          createdAt: metadata?.timestamp || stat.mtime,
          collectionsCount: files.length,
          collections: metadata?.collections || files.map(f => ({ name: path.basename(f, '.json') }))
        });
      } else if (item.endsWith('.json')) {
        try {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(raw);
          const colKeys = Object.keys(parsed.collections || {});
          backupsList.push({
            name: item,
            type: 'single_file',
            createdAt: parsed.timestamp || stat.mtime,
            collectionsCount: colKeys.length,
            collections: colKeys.map(k => ({ name: k, count: Array.isArray(parsed.collections[k]) ? parsed.collections[k].length : 0 }))
          });
        } catch (_) {}
      }
    }

    backupsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: backupsList, location: backupsDir });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET direct download instant single JSON backup
router.get('/download-instant', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
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

    for (const col of collections) {
      const colName = col.name;
      if (colName.startsWith('system.')) continue;
      const collection = db.collection(colName);
      const docs = await collection.find({}).toArray();
      singleBackup.collections[colName] = docs;
    }

    const fileName = `sahijob_backup_${dateStr}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(JSON.stringify(singleBackup, null, 2));
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST send single backup JSON to email
router.post('/email-single', async (req, res) => {
  try {
    const targetEmail = req.body.email || process.env.BACKUP_EMAIL || 'sonic16t@gmail.com';
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
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

    if (!process.env.RESEND_API_KEY) {
      return res.status(400).json({ success: false, message: 'RESEND_API_KEY is not configured in .env' });
    }

    const resendPayload = {
      from: process.env.RESEND_FROM_EMAIL || 'SahiJob Database <noreply@sahijob.com>',
      to: targetEmail,
      subject: `📦 SahiJob Complete Database Backup (${dateStr})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #059669; margin-top: 0;">📦 SahiJob Database Single Backup</h2>
          <p>Hi Admin,</p>
          <p>Here is your complete single-file database backup for <strong>sahijob.com</strong>.</p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>File Name:</strong> ${fileName}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${now.toLocaleString('en-IN')}</p>
            <p style="margin: 4px 0;"><strong>Collections:</strong> ${Object.keys(singleBackup.collections).length}</p>
            <p style="margin: 4px 0;"><strong>Total Documents:</strong> ${totalDocs}</p>
          </div>
          <p style="font-size: 13px; color: #475569;">You can restore this backup anytime by uploading the attached <code>.json</code> file in your <strong>Admin Panel &rarr; Overview &rarr; Database Backup & Restore</strong>.</p>
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
      return res.json({ success: true, message: `Backup single file sent to ${targetEmail}`, emailId: resendData.id });
    } else {
      return res.status(400).json({ success: false, message: resendData.message || 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error emailing backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper: recursively convert 24-hex string IDs to mongoose.Types.ObjectId and ISO dates to Date
const sanitizeDocForRestore = (data) => {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDocForRestore(item));
  }
  if (typeof data === 'object') {
    const result = {};
    for (const [key, val] of Object.entries(data)) {
      if (key === '_id' && typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
        result[key] = new mongoose.Types.ObjectId(val);
      } else if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val) && (key.endsWith('Id') || key === 'employer' || key === 'employee' || key === 'job')) {
        result[key] = new mongoose.Types.ObjectId(val);
      } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        const d = new Date(val);
        result[key] = isNaN(d.getTime()) ? val : d;
      } else if (typeof val === 'object' && val !== null) {
        result[key] = sanitizeDocForRestore(val);
      } else {
        result[key] = val;
      }
    }
    return result;
  }
  return data;
};

// POST upload & restore single JSON backup
router.post('/upload-restore', async (req, res) => {
  try {
    let backupData = req.body.backupData;
    if (typeof backupData === 'string') {
      backupData = JSON.parse(backupData);
    }

    if (!backupData || !backupData.collections) {
      return res.status(400).json({ success: false, message: 'Invalid backup file format. Expected a valid SahiJob backup JSON.' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const collectionNames = Object.keys(backupData.collections);
    let totalRestored = 0;
    const restoredSummary = [];

    for (const colName of collectionNames) {
      const docs = backupData.collections[colName];
      if (!Array.isArray(docs)) continue;

      const collection = db.collection(colName);
      // Clean existing records in this collection
      await collection.deleteMany({});

      if (docs.length > 0) {
        const sanitizedDocs = docs.map(doc => sanitizeDocForRestore(doc));
        await collection.insertMany(sanitizedDocs);
      }
      totalRestored += docs.length;
      restoredSummary.push({ name: colName, count: docs.length });
    }

    res.json({
      success: true,
      message: `Database successfully restored (${collectionNames.length} collections, ${totalRestored} total records)!`,
      summary: restoredSummary
    });
  } catch (error) {
    console.error('Error during upload restore:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
