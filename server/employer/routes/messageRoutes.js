const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, toggleBlock, getUnreadCount, initiateConversation } = require('../controllers/messageController');
const { protectEmployer } = require('../../middleware/authMiddleware');

router.use(protectEmployer);

router.get('/unread-count', getUnreadCount);
router.get('/conversations', getConversations);
router.post('/initiate/:employeeId', initiateConversation);
router.route('/applications/:applicationId')
  .get(getMessages)
  .post(sendMessage);
router.post('/applications/:applicationId/toggle-block', toggleBlock);

module.exports = router;
