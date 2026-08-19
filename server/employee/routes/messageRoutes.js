const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage } = require('../controllers/messageController');
const { protectEmployee } = require('../../middleware/authMiddleware');

router.use(protectEmployee);

router.get('/unread-count', require('../controllers/messageController').getUnreadCount);
router.get('/conversations', getConversations);
router.route('/applications/:applicationId')
  .get(getMessages)
  .post(sendMessage);

module.exports = router;
