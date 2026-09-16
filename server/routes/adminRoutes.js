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
  updateSiteSettings
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

module.exports = router;

