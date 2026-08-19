const Message = require('../../models/Message');
const Application = require('../../models/Application');

// @desc    Get total unread message count for employee
// @route   GET /api/employee/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const count = await Message.countDocuments({ 
      employeeId, 
      senderModel: 'Employer', 
      isRead: false 
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all conversations for the logged-in employee
// @route   GET /api/employee/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const employeeId = req.employee.id;

    // 1. Get all applications for this employee
    const applications = await Application.find({ employeeId })
      .populate('employerId', 'companyName')
      .populate('jobId', 'title location jobType')
      .sort({ appliedDate: -1 });

    const conversations = [];

    // 2. For each application, get the latest message and unread count
    for (let app of applications) {
      const messages = await Message.find({ applicationId: app._id }).sort({ createdAt: -1 });
      
      // Only include conversations where the employer has initiated the chat
      if (messages.length === 0) continue;

      let lastMessage = messages[0].content;
      let lastMessageTime = messages[0].createdAt;
      let unreadCount = messages.filter(m => m.senderModel === 'Employer' && !m.isRead).length;

      conversations.push({
        applicationId: app._id,
        companyName: app.employerId?.companyName || 'Unknown Company',
        jobTitle: app.jobId?.title || 'Unknown Job',
        location: app.jobId?.location || '',
        jobType: app.jobId?.jobType || [],
        lastMessage,
        lastMessageTime,
        unreadCount
      });
    }

    // Sort by last message time
    conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

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
// @route   GET /api/employee/messages/applications/:applicationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const applicationId = req.params.applicationId;

    const messages = await Message.find({
      employeeId,
      applicationId
    }).sort({ createdAt: 1 }); // Oldest first for chat history

    // Mark messages from employer as read
    await Message.updateMany(
      { employeeId, applicationId, senderModel: 'Employer', isRead: false },
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
// @route   POST /api/employee/messages/applications/:applicationId
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const applicationId = req.params.applicationId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Please provide message content' });
    }

    // Get the application to verify and get employerId and jobId
    const application = await Application.findOne({ _id: applicationId, employeeId });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    const newMessage = await Message.create({
      applicationId,
      employerId: application.employerId,
      employeeId,
      jobId: application.jobId,
      senderModel: 'Employee',
      content
    });

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
