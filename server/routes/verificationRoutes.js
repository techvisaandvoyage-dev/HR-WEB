const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protectEmployer } = require('../middleware/authMiddleware');
const verificationController = require('../controllers/verificationController');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads/verification_docs');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const employerId = req.user?.id || 'emp';
    const cleanExt = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, cleanExt).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const uniqueName = `verif_${employerId}_${Date.now()}_${cleanBase}${cleanExt}`;
    cb(null, uniqueName);
  }
});

// File filter (PDF, JPG, PNG, WEBP only)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeValid = allowedMimeTypes.includes(file.mimetype.toLowerCase());
  const isExtValid = allowedExtensions.includes(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, JPG, PNG, and WEBP documents (max 5MB) are supported.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter
});

// Wrapper to handle Multer errors gracefully (skips multer if request is JSON with Firebase URL)
const handleUpload = (req, res, next) => {
  if (req.is('json') || req.headers['content-type']?.includes('application/json')) {
    return next();
  }
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Document size exceeds maximum allowed limit of 5MB' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// All verification routes require authenticated Employer or Consultant
router.use(protectEmployer);

router.get('/status', verificationController.getVerificationStatus);
router.post('/upload', handleUpload, verificationController.uploadVerificationDocument);
router.delete('/document/:docId', verificationController.deleteVerificationDocument);
router.post('/submit', verificationController.submitVerification);
router.get('/document/:docId/file', verificationController.streamDocumentFile);

module.exports = router;
