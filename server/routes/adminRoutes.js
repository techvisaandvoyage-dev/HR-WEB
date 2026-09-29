const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllEmployees,
  getEmployeeById,
  getAllEmployers,
  getEmployerById,
  updateJobStatusAdmin,
  updateEmployerControls,
  getSiteSettings,
  updateSiteSettings,
  getSheetsStatus,
  syncCandidatesSheetAdmin,
  syncEmployersSheetAdmin
} = require('../controllers/adminController');

router.get('/stats', getDashboardStats);
router.get('/employees', getAllEmployees);
router.get('/employees/:id', getEmployeeById);
router.get('/employers', getAllEmployers);
router.get('/employers/:id', getEmployerById);
router.put('/employers/:id/controls', updateEmployerControls);
router.get('/site-settings', getSiteSettings);
router.put('/site-settings', updateSiteSettings);
router.put('/jobs/:id/status', updateJobStatusAdmin);

// Google Sheets Live Sync Routes
router.get('/sheets/status', getSheetsStatus);
router.post('/sheets/candidates/sync', syncCandidatesSheetAdmin);
router.post('/sheets/employers/sync', syncEmployersSheetAdmin);

module.exports = router;

