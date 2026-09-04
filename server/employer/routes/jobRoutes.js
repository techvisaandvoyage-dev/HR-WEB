const express = require('express');
const { createJob, getEmployerJobs, updateJob, toggleJobStatus, getApplicationsForEmployer, updateApplicationStatus } = require('../controllers/jobController');
const { protectEmployer } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(protectEmployer); // All routes here require employer auth

router.route('/')
  .post(createJob)
  .get(getEmployerJobs);

router.route('/:id')
  .put(updateJob);

router.route('/:id/status')
  .put(toggleJobStatus);

router.route('/applications')
  .get(getApplicationsForEmployer);

router.route('/applications/:id/status')
  .put(updateApplicationStatus);

module.exports = router;
