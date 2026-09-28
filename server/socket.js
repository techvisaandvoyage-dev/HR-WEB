const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // Join a specific application conversation room
    socket.on('join_chat', (applicationId) => {
      if (applicationId) {
        socket.join(`chat_${applicationId}`);
      }
    });

    // Leave a conversation room
    socket.on('leave_chat', (applicationId) => {
      if (applicationId) {
        socket.leave(`chat_${applicationId}`);
      }
    });

    // Handle real-time typing indicators
    socket.on('typing', ({ applicationId, senderModel, senderName }) => {
      if (applicationId) {
        socket.to(`chat_${applicationId}`).emit('user_typing', {
          applicationId,
          senderModel,
          senderName
        });
      }
    });

    socket.on('stop_typing', ({ applicationId, senderModel }) => {
      if (applicationId) {
        socket.to(`chat_${applicationId}`).emit('user_stop_typing', {
          applicationId,
          senderModel
        });
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

module.exports = { initSocket, getIO };
