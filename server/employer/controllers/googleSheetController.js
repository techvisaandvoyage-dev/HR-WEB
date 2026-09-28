const Employer = require('../models/Employer');
const Application = require('../../models/Application');
const googleSheetService = require('../../services/googleSheetService');

// @desc    Connect or create live Google Sheet for Employer
// @route   POST /api/employer/sheets/connect
// @access  Private (Employer)
exports.connectOrCreateSheet = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id);
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const { sheetUrl } = req.body || {};

    // Fetch all existing applications for this employer with employee and job details
    const applications = await Application.find({ employerId: req.user.id })
      .populate('employeeId', '-password')
      .populate('jobId')
      .sort({ createdAt: 1 });

    // Assign sequential display application numbers if not already set
    applications.forEach((app, idx) => {
      if (!app.applicationNumber) {
        app.applicationNumber = 500101 + idx;
      }
    });

    let result;
    if (sheetUrl && sheetUrl.trim()) {
      // Connect existing sheet
      result = await googleSheetService.connectExistingSpreadsheet(sheetUrl, applications);
    } else {
      // Create new sheet
      result = await googleSheetService.createEmployerSpreadsheet(employer, applications);
    }

    employer.googleSheetId = result.spreadsheetId;
    employer.googleSheetUrl = result.spreadsheetUrl;
    employer.autoSyncGoogleSheet = true;
    await employer.save();

    res.status(200).json({
      success: true,
      data: {
        googleSheetId: result.spreadsheetId,
        googleSheetUrl: result.spreadsheetUrl,
        title: result.title,
        syncedApplicationsCount: applications.length
      },
      message: 'Live Google Sheet connected & synced successfully!'
    });
  } catch (error) {
    console.error('Error connecting Google Sheet:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect Google Sheet.'
    });
  }
};

// @desc    Re-sync all applications to Google Sheet
// @route   POST /api/employer/sheets/sync
// @access  Private (Employer)
exports.syncAllToSheet = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id);
    if (!employer || !employer.googleSheetId) {
      return res.status(400).json({ success: false, message: 'No Google Sheet connected. Please connect a sheet first.' });
    }

    const applications = await Application.find({ employerId: req.user.id })
      .populate('employeeId', '-password')
      .populate('jobId')
      .sort({ createdAt: 1 });

    applications.forEach((app, idx) => {
      if (!app.applicationNumber) {
        app.applicationNumber = 500101 + idx;
      }
    });

    await googleSheetService.syncAllApplicationsToSpreadsheet(employer.googleSheetId, applications);

    res.status(200).json({
      success: true,
      data: {
        googleSheetId: employer.googleSheetId,
        googleSheetUrl: employer.googleSheetUrl,
        syncedCount: applications.length
      },
      message: `Successfully synced ${applications.length} applications to Google Sheet!`
    });
  } catch (error) {
    console.error('Error syncing to Google Sheet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Google Sheet connection status
// @route   GET /api/employer/sheets/status
// @access  Private (Employer)
exports.getSheetStatus = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id).select('googleSheetId googleSheetUrl autoSyncGoogleSheet companyName email');
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        isConnected: Boolean(employer.googleSheetId),
        googleSheetId: employer.googleSheetId || '',
        googleSheetUrl: employer.googleSheetUrl || '',
        autoSyncGoogleSheet: employer.autoSyncGoogleSheet ?? true,
        serviceAccountEmail: process.env.FIREBASE_CLIENT_EMAIL || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
