const express = require('express');
const router = express.Router();
const {
  getAllProblems,
  createProblem,
  updateProblem,
  toggleProblemActive,
  moveProblem,
  deleteProblem,
  getSupportRequests,
  resolveSupportRequest,
  reopenSupportRequest,
  deleteSupportRequest,
  adminReply,
  getRequestMessages,
  getAllQuickReplies,
  createQuickReply,
  updateQuickReply,
  toggleQuickReplyActive,
  moveQuickReply,
  deleteQuickReply,
} = require('../controllers/adminSupportController');

// Support Problems Admin Routes
router.get('/problems', getAllProblems);
router.post('/problems', createProblem);
router.put('/problems/:id', updateProblem);
router.patch('/problems/:id/toggle', toggleProblemActive);
router.patch('/problems/:id/move', moveProblem);
router.delete('/problems/:id', deleteProblem);

// Support Quick Replies Admin Routes (Send a quick update texts)
router.get('/quick-replies', getAllQuickReplies);
router.post('/quick-replies', createQuickReply);
router.put('/quick-replies/:id', updateQuickReply);
router.patch('/quick-replies/:id/toggle', toggleQuickReplyActive);
router.patch('/quick-replies/:id/move', moveQuickReply);
router.delete('/quick-replies/:id', deleteQuickReply);

// Support Requests Admin Routes
router.get('/requests', getSupportRequests);
router.get('/requests/:id/messages', getRequestMessages);
router.post('/requests/:id/reply', adminReply);
router.patch('/requests/:id/resolve', resolveSupportRequest);
router.patch('/requests/:id/reopen', reopenSupportRequest);
router.delete('/requests/:id', deleteSupportRequest);

module.exports = router;
