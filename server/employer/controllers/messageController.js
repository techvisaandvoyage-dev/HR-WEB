const Message = require('../../models/Message');
const Employee = require('../../employee/models/Employee');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const { getIO } = require('../../socket');

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

    const appIds = Object.keys(conversationsMap);
    if (appIds.length > 0) {
      const apps = await Application.find({ _id: { $in: appIds } }).select('_id isBlocked blockedBy blockedAt');
      const appMap = {};
      apps.forEach(a => {
        appMap[a._id.toString()] = a;
      });
      appIds.forEach(id => {
        if (appMap[id]) {
          conversationsMap[id].isBlocked = appMap[id].isBlocked || false;
          conversationsMap[id].blockedBy = appMap[id].blockedBy || null;
          conversationsMap[id].blockedAt = appMap[id].blockedAt || null;
        }
      });
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

    const application = await Application.findOne({ _id: applicationId, employerId });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const messages = await Message.find({
      employerId,
      applicationId
    }).sort({ createdAt: 1 }); // Oldest first for chat history

    // Mark messages from employee as read
    const updateResult = await Message.updateMany(
      { employerId, applicationId, senderModel: 'Employee', isRead: false },
      { $set: { isRead: true } }
    );

    if (updateResult.modifiedCount > 0) {
      const io = getIO();
      if (io) {
        io.to(`chat_${applicationId}`).emit('messages_marked_read', {
          applicationId,
          readBy: 'Employer'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: messages,
      application: {
        isBlocked: application.isBlocked || false,
        blockedBy: application.blockedBy || null,
        blockedAt: application.blockedAt || null
      }
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

    if (application.isBlocked) {
      return res.status(403).json({
        success: false,
        message: application.blockedBy === 'Employer'
          ? 'You have blocked this candidate. Unblock to send messages.'
          : 'This conversation has been blocked by the candidate.'
      });
    }

    const newMessage = await Message.create({
      applicationId,
      employerId,
      employeeId: application.employeeId,
      jobId: application.jobId,
      senderModel: 'Employer',
      content
    });

    // Broadcast via socket.io
    const io = getIO();
    if (io) {
      io.to(`chat_${applicationId}`).emit('receive_message', newMessage);
      io.emit('conversation_updated', {
        applicationId,
        lastMessage: newMessage.content,
        lastMessageTime: newMessage.createdAt,
        senderModel: 'Employer',
        employerId,
        employeeId: application.employeeId
      });
    }

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error("SEND_MESSAGE_ERROR:", error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// @desc    Toggle block/unblock conversation by employer
// @route   POST /api/employer/messages/applications/:applicationId/toggle-block
// @access  Private
exports.toggleBlock = async (req, res) => {
  try {
    const employerId = req.user.id;
    const applicationId = req.params.applicationId;

    const application = await Application.findOne({ _id: applicationId, employerId });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    if (application.isBlocked) {
      if (application.blockedBy !== 'Employer') {
        return res.status(403).json({
          success: false,
          message: 'Cannot unblock conversation blocked by the candidate.'
        });
      }
      application.isBlocked = false;
      application.blockedBy = null;
      application.blockedAt = null;
    } else {
      application.isBlocked = true;
      application.blockedBy = 'Employer';
      application.blockedAt = new Date();
    }

    await application.save();

    const io = getIO();
    if (io) {
      io.to(`chat_${applicationId}`).emit('conversation_block_toggled', {
        applicationId,
        isBlocked: application.isBlocked,
        blockedBy: application.blockedBy,
        blockedAt: application.blockedAt
      });
      io.emit('conversation_block_toggled', {
        applicationId,
        isBlocked: application.isBlocked,
        blockedBy: application.blockedBy,
        blockedAt: application.blockedAt
      });
    }

    res.status(200).json({
      success: true,
      data: {
        applicationId,
        isBlocked: application.isBlocked,
        blockedBy: application.blockedBy,
        blockedAt: application.blockedAt
      }
    });
  } catch (error) {
    console.error("TOGGLE_BLOCK_EMPLOYER_ERROR:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

