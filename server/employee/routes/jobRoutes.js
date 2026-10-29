const express = require('express');
const {
  getAllJobs,
  getJobById,
  applyForJob,
  getMyApplications,
  incrementJobViews,
  recordJobVisitAction,
  checkIfApplied
} = require('../controllers/jobController');
const { protectEmployee } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllJobs); // Public - list all active jobs

// IMPORTANT: /my-applications MUST be declared BEFORE /:id wildcard
// Otherwise Express matches 'my-applications' as a job ID param
router.get('/my-applications', protectEmployee, getMyApplications);

// Check if current employee already applied for this job
router.get('/:id/check-applied', protectEmployee, checkIfApplied);

// Public routes with :id param
router.get('/:id', getJobById);
router.post('/:id/view', incrementJobViews);
router.post('/:id/visit', recordJobVisitAction);

// Apply for a job (protected)
router.post('/:id/apply', protectEmployee, applyForJob);

module.exports = router;
