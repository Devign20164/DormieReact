/**
 * Enhanced Socket.IO handler for real-time messaging 
 * Implements reliable message delivery between students and admins
 */

const setupSocketHandlers = (io, connectedUsers, userActiveStatus) => {
  // Store admin sockets for direct messaging
  const adminSockets = new Set();
  
  // Track conversations and their members
  const conversationMembers = new Map();
  
  // Track message delivery status
  const messageDeliveryStatus = new Map();
  
  // Debug logging - log all socket events in development
  const isDebug = process.env.NODE_ENV !== 'production';
  
  const debugLog = (...args) => {
    if (isDebug) {
      console.log(...args);
    }
  };

  // Set up socket handlers
  io.on('connection', (socket) => {
    debugLog('User connected with socket ID:', socket.id);
    
    // Respond to ping with pong to keep connection alive
    socket.on('ping', () => {
      debugLog('Ping received from', socket.id);
      socket.emit('pong');
    });
    
    // Handle user joining by user type
    socket.on('joinUserType', (userType) => {
      if (!userType) return;
      
      debugLog(`User ${socket.userId} joining as ${userType}`);
      
      if (userType === 'admin') {
        adminSockets.add(socket.id);
        socket.join('admins');
        debugLog(`Admin ${socket.userId} added to admin room`);
      } else if (userType === 'student') {
        socket.join('students');
        debugLog(`Student ${socket.userId} added to student room`);
      }
    });
    
    // Special handler for admin registration
    socket.on('registerAdminForMessages', () => {
      if (!socket.userId) {
        debugLog('Admin tried to register without userId');
        return;
      }
      
      adminSockets.add(socket.id);
      socket.join('admins');
      
      debugLog(`Admin ${socket.userId} registered for messages`);
      
      // Send confirmation
      socket.emit('adminRegistered', { status: 'success' });
    });
    
    // Handle explicitly registering for notifications
    socket.on('registerAdminForNotifications', () => {
      if (!socket.userId) {
        debugLog('Admin tried to register for notifications without userId');
        return;
      }
      
      socket.join('adminNotifications');
      debugLog(`Admin ${socket.userId} registered for notifications`);
    });
    
    // Handle user joining with their ID (standard join)
    socket.on('join', (userId) => {
      if (!userId) {
        debugLog('User attempted to join without ID');
        return;
      }
      
      debugLog(`User ${userId} joined with socket ${socket.id}`);
      
      // Store user ID in socket for reference
      socket.userId = userId.toString();
      
      // Map user ID to socket ID for direct messaging
      connectedUsers.set(userId.toString(), socket.id);
      userActiveStatus.set(userId.toString(), true);
      
      // Join room for this specific user
      socket.join(`user_${userId}`);
      
      // Notify others that user is online
      socket.broadcast.emit('userStatus', {
        userId: userId.toString(),
        status: 'online'
      });
      
      // Acknowledge successful join
      socket.emit('joinAcknowledged', {
        status: 'success',
        userId: userId.toString(),
        socketId: socket.id
      });
    });
    
    // Handle joining a specific conversation
    socket.on('joinConversation', ({ conversationId }) => {
      if (!conversationId || !socket.userId) {
        debugLog('Invalid attempt to join conversation');
        return;
      }
      
      debugLog(`User ${socket.userId} joining conversation ${conversationId}`);
      
      // Join the conversation room
      socket.join(`conversation_${conversationId}`);
      
      // Track members in this conversation
      if (!conversationMembers.has(conversationId)) {
        conversationMembers.set(conversationId, new Set());
      }
      
      // Add user to conversation members
      conversationMembers.get(conversationId).add(socket.userId);
      
      // Send acknowledgment
      socket.emit('conversationJoined', { conversationId });
    });
    
    // Handle explicit request to listen to a conversation
    socket.on('listenToConversation', ({ conversationId }) => {
      if (!conversationId) return;
      
      debugLog(`User ${socket.userId} explicitly listening to conversation ${conversationId}`);
      
      // Join the conversation room
      socket.join(`conversation_${conversationId}`);
      
      // Send acknowledgment
      socket.emit('listeningToConversation', { conversationId });
    });
    
    // Handle new messages
    socket.on('newMessage', ({ message, conversationId, recipientId }) => {
      if (!message || !conversationId) {
        debugLog('Invalid message data received');
        return;
      }
      
      debugLog(`New message received from ${socket.userId} for conversation ${conversationId}`);
      
      // Store delivery attempt
      const messageId = message._id.toString();
      messageDeliveryStatus.set(messageId, {
        attempts: 1,
        delivered: false,
        timestamp: new Date()
      });
      
      // Emit to specific conversation room
      socket.to(`conversation_${conversationId}`).emit('newMessage', {
        message,
        conversation: conversationId
      });
      
      // Also emit to specific recipient if provided
      if (recipientId) {
        const recipientSocketId = connectedUsers.get(recipientId);
        if (recipientSocketId) {
          debugLog(`Emitting direct message to recipient ${recipientId}`);
          io.to(`user_${recipientId}`).emit('newMessage', {
            message,
            conversation: conversationId
          });
        }
      }
      
      // Special case for student-to-admin messages
      if (recipientId && 
          message.sender && 
          message.sender.role !== 'admin' && 
          message.recipient && 
          message.recipient.role === 'admin') {
        debugLog('Student-to-admin message detected, broadcasting to all admins');
        
        // Broadcast to all admins
        socket.to('admins').emit('studentMessageToAdmin', {
          message,
          conversation: conversationId
        });
        
        // Also notify admins via the notification channel
        socket.to('adminNotifications').emit('adminNotification', {
          type: 'newMessage',
          data: {
            conversationId,
            messageId: message._id,
            senderId: message.sender.id,
            senderName: message.sender.name
          }
        });
      }
      
      // Mark as delivered in our tracking
      messageDeliveryStatus.set(messageId, {
        ...messageDeliveryStatus.get(messageId),
        delivered: true
      });
      
      // Acknowledge to sender
      socket.emit('messageDelivered', {
        messageId: message._id,
        status: 'delivered'
      });
    });
    
    // Special handler for student messages to admin
    socket.on('studentMessageToAdmin', ({ message, conversationId, recipientId }) => {
      if (!message || !conversationId) {
        debugLog('Invalid student message data');
        return;
      }
      
      debugLog(`Student message to admin from ${socket.userId} for conversation ${conversationId}`);
      
      // Broadcast to all admins
      socket.to('admins').emit('studentMessageToAdmin', {
        message,
        conversation: conversationId
      });
      
      // Also emit to specific admin if provided
      if (recipientId) {
        debugLog(`Emitting direct student message to admin ${recipientId}`);
        io.to(`user_${recipientId}`).emit('studentMessageToAdmin', {
          message,
          conversation: conversationId
        });
      }
      
      // Acknowledge receipt
      socket.emit('studentMessageDelivered', {
        messageId: message._id,
        status: 'delivered to admin channel'
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        debugLog(`User ${socket.userId} disconnected`);
        
        // Remove from connected users
        connectedUsers.delete(socket.userId);
        userActiveStatus.set(socket.userId, false);
        
        // Remove from admin sockets if applicable
        adminSockets.delete(socket.id);
        
        // Remove from conversation tracking
        for (const [convId, members] of conversationMembers.entries()) {
          if (members.has(socket.userId)) {
            members.delete(socket.userId);
          }
        }
        
        // Notify others of status change
        socket.broadcast.emit('userStatus', {
          userId: socket.userId,
          status: 'offline'
        });
      }
    });
  });
  
  // Return public methods
  return {
    getActiveAdmins: () => Array.from(adminSockets),
    getConversationMembers: (conversationId) => 
      Array.from(conversationMembers.get(conversationId) || []),
    broadcastToAdmins: (event, data) => {
      io.to('admins').emit(event, data);
    }
  };
};

module.exports = setupSocketHandlers; 