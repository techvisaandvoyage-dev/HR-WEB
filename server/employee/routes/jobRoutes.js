const express = require('express');
const { getAllJobs, applyForJob, getMyApplications } = require('../controllers/jobController');
const { protectEmployee } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllJobs); // Can be public or protected, leaving public for now so anyone can view jobs

// Protected routes
router.use(protectEmployee);
router.post('/:id/apply', applyForJob);
router.get('/my-applications', getMyApplications);

module.exports = router;
