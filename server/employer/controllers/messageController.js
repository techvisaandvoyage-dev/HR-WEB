const Message = require('../../models/Message');
const Employee = require('../../employee/models/Employee');
const Job = require('../../models/Job');
const Application = require('../../models/Application');

// @desc    Get total unread message count for employer
// @route   GET /api/employer/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const employerId = req.user.id;
    const count = await Message.countDocuments({ 
      employerId, 
      senderModel: 'Employee', 
      isRead: false 
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// @desc    Get all conversations for the logged-in employer
// @route   GET /api/employer/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const employerId = req.user.id;

    // Find all messages involving this employer
    const messages = await Message.find({ employerId }).sort({ createdAt: -1 });

    const conversationsMap = {};

    for (let msg of messages) {
      if (!msg.applicationId) continue; // Skip legacy messages without an applicationId

      const appId = msg.applicationId.toString();
      if (!conversationsMap[appId]) {
        conversationsMap[appId] = {
          applicationId: appId,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: (msg.senderModel === 'Employee' && !msg.isRead) ? 1 : 0
        };
      } else {
        if (msg.senderModel === 'Employee' && !msg.isRead) {
          conversationsMap[appId].unreadCount += 1;
        }
      }
    }

    const conversations = Object.values(conversationsMap).sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get messages for a specific conversation
// @route   GET /api/employer/messages/applications/:applicationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const employerId = req.user.id;
    const applicationId = req.params.applicationId;

    const messages = await Message.find({
      employerId,
      applicationId
    }).sort({ createdAt: 1 }); // Oldest first for chat history

    // Mark messages from employee as read
    await Message.updateMany(
      { employerId, applicationId, senderModel: 'Employee', isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Send a message
// @route   POST /api/employer/messages/applications/:applicationId
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const employerId = req.user.id;
    const applicationId = req.params.applicationId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Please provide message content' });
    }

    // Get the application to populate employeeId and jobId
    const application = await Application.findOne({ _id: applicationId, employerId });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    const newMessage = await Message.create({
      applicationId,
      employerId,
      employeeId: application.employeeId,
      jobId: application.jobId,
      senderModel: 'Employer',
      content
    });

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error("SEND_MESSAGE_ERROR:", error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};
