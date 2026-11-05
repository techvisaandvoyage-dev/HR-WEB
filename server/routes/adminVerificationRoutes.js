const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminVerificationController = require('../controllers/adminVerificationController');

// All admin verification routes require adminAuth
router.use(adminAuth);

router.get('/', adminVerificationController.getAdminVerifications);
router.get('/:userId', adminVerificationController.getAdminVerificationDetails);
router.patch('/:userId/approve', adminVerificationController.approveVerification);
router.patch('/:userId/reject', adminVerificationController.rejectVerification);
router.patch('/:userId/unverify', adminVerificationController.unverifyVerification);
router.get('/:userId/documents/:docId/file', adminVerificationController.streamAdminDocumentFile);

module.exports = router;
