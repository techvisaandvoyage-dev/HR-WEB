const express = require('express');
const { connectOrCreateSheet, syncAllToSheet, getSheetStatus } = require('../controllers/googleSheetController');
const { protectEmployer } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(protectEmployer);

router.post('/connect', connectOrCreateSheet);
router.post('/sync', syncAllToSheet);
router.get('/status', getSheetStatus);

module.exports = router;
