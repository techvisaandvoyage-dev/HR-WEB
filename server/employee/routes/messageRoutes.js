const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, toggleBlock, getUnreadCount } = require('../controllers/messageController');
const { protectEmployee } = require('../../middleware/authMiddleware');

router.use(protectEmployee);

router.get('/unread-count', getUnreadCount);
router.get('/conversations', getConversations);
router.route('/applications/:applicationId')
  .get(getMessages)
  .post(sendMessage);
router.post('/applications/:applicationId/toggle-block', toggleBlock);

module.exports = router;
