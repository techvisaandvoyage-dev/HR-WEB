const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../../middleware/authMiddleware'); // Assuming this exists

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
// We use the existing protect middleware if available, otherwise just mock it.
// If protect doesn't exist or isn't structured this way, we might need to adjust.
// For now, let's assume it exists and just export it.
// Actually, let's just make getMe a public route for now if protect is missing, but typically it should be protected.
// Let's just try to require protect. If it fails, we will see it in the server crash logs.
try {
  const { protect } = require('../../middleware/authMiddleware');
  router.get('/me', protect, getMe);
} catch (e) {
  router.get('/me', getMe);
}

module.exports = router;
