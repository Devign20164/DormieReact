const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import routes
const studentRoutes = require('./routes/studentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // Any route that is not an API route will be redirected to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  // Basic route for development
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Dormie API' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Store connected users and their active status
const connectedUsers = new Map();
const userActiveStatus = new Map();

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await config.connectDB();
    console.log('MongoDB connection established successfully');
    
    // Import Message model after MongoDB connection is established
    const Message = require('./models/messageModel');
    const Notification = require('./models/notificationModel');
    const Conversation = require('./models/conversationModel');
    
    // Make io and connectedUsers available to routes
    app.set('io', io);
    app.set('connectedUsers', connectedUsers);
    app.set('userActiveStatus', userActiveStatus);

    // Helper function to emit notifications with de-duplication
    const emitNotification = (notification) => {
      if (!notification || !notification.recipient || !notification.recipient.id) {
        console.error('Invalid notification data:', notification);
        return;
      }

      // Generate a unique key for this notification to prevent duplicates
      const notificationKey = `${notification._id}`;
      const recipientId = notification.recipient.id.toString();
      
      // Check for duplicates - store in a global Map to track notifications by user
      const userNotifications = io.userNotifications = io.userNotifications || new Map();
      
      // Get or create set for this user
      const userProcessed = userNotifications.get(recipientId) || new Set();
      
      // If we've already sent this notification, don't send again
      if (userProcessed.has(notificationKey)) {
        console.log(`Skipping duplicate notification ${notificationKey} for user ${recipientId}`);
        return;
      }
      
      // Mark as processed
      userProcessed.add(notificationKey);
      userNotifications.set(recipientId, userProcessed);
      
      console.log(`Emitting notification ${notificationKey} to user: ${recipientId} (Total processed: ${userProcessed.size})`);

      // Add a timestamp to track when this was emitted
      notification.emittedAt = new Date().toISOString();
      
      // Emit to user's room - only need to emit to one place, not multiple
      io.to(`user_${recipientId}`).emit('newNotification', notification);
      
      // Log completion
      console.log('Notification emitted successfully to room:', `user_${recipientId}`);
    };

    // Make emitNotification available to routes
    app.set('emitNotification', emitNotification);

    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log('A user connected', socket.id);

      // Debug socket events
      socket.onAny((eventName, ...args) => {
        console.log(`[Socket ${socket.id}] Event: ${eventName}`, args);
      });

      // Store processed notification IDs to prevent duplicates
      const processedNotifications = new Set();

      // Handle user joining with their ID
      socket.on('join', (userId) => {
        if (!userId) {
          console.log('User attempted to join without ID');
          return;
        }
        
        console.log('User joined:', userId, 'Socket ID:', socket.id);
        socket.userId = userId;
        connectedUsers.set(userId.toString(), socket.id);
        userActiveStatus.set(userId.toString(), true);

        // Join a room specific to this user
        socket.join(`user_${userId}`);

        // Notify other users that this user is online
        socket.broadcast.emit('userStatus', {
          userId: userId,
          status: 'online'
        });
        
        // Send acknowledgment back to client
        socket.emit('joinAcknowledged', {
          status: 'success',
          userId: userId,
          socketId: socket.id
        });

        // Send any pending notifications
        Notification.find({
          'recipient.id': userId,
          isRead: false
        })
        .sort('-createdAt')
        .then(notifications => {
          if (notifications.length > 0) {
            socket.emit('pendingNotifications', notifications);
          }
        })
        .catch(err => console.error('Error fetching pending notifications:', err));
      });

      // Handle notification read
      socket.on('notificationRead', async ({ notificationId, userId }) => {
        try {
          // Update notification in database
          const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
          );

          if (notification) {
            // Broadcast to all connected clients except sender
            socket.broadcast.emit('notificationUpdate', {
              type: 'read',
              notificationId
            });
          }
        } catch (error) {
          console.error('Error handling notification read:', error);
        }
      });

      // Handle all notifications read
      socket.on('allNotificationsRead', async ({ userId }) => {
        try {
          // Update all notifications in database
          await Notification.updateMany(
            { 'recipient.id': userId, isRead: false },
            { isRead: true }
          );

          // Broadcast to all connected clients except sender
          socket.broadcast.emit('notificationUpdate', {
            type: 'readAll',
            userId
          });
        } catch (error) {
          console.error('Error handling all notifications read:', error);
        }
      });

      // Handle notification delete
      socket.on('notificationDelete', async ({ notificationId, userId }) => {
        try {
          // Delete notification from database
          await Notification.findByIdAndDelete(notificationId);

          // Broadcast to all connected clients except sender
          socket.broadcast.emit('notificationUpdate', {
            type: 'delete',
            notificationId
          });
        } catch (error) {
          console.error('Error handling notification delete:', error);
        }
      });

      // Handle all notifications deleted
      socket.on('allNotificationsDeleted', async ({ userId }) => {
        try {
          // Delete all notifications for this user
          await Notification.deleteMany({
            'recipient.id': userId
          });

          // Broadcast to all connected clients except sender
          socket.broadcast.emit('notificationUpdate', {
            type: 'deleteAll',
            userId
          });
        } catch (error) {
          console.error('Error handling all notifications delete:', error);
        }
      });

      // Handle new message
      socket.on('newMessage', async ({ message, conversationId, recipientId }) => {
        try {
          console.log('New message received:', message._id, 'for conversation:', conversationId);
          
          if (!message || !conversationId) {
            console.error('Invalid message data:', { message, conversationId });
            return;
          }
          
          // 1. Emit to conversation room for anyone viewing this conversation
          console.log(`Emitting to conversation_${conversationId} room`);
          io.to(`conversation_${conversationId}`).emit('newMessage', {
            message,
            conversation: conversationId
          });
          
          // 2. Also emit to recipient's user room for reliability
          if (recipientId) {
            console.log(`Emitting to user_${recipientId} room`);
            io.to(`user_${recipientId}`).emit('newMessage', {
              message,
              conversation: conversationId
            });
            
            // 3. Also emit directly to recipient's socket if they're connected
            const recipientSocketId = connectedUsers.get(recipientId);
            if (recipientSocketId) {
              console.log(`Emitting directly to recipient socket: ${recipientSocketId}`);
              io.to(recipientSocketId).emit('newMessage', {
                message,
                conversation: conversationId
              });
            }
            
            // 4. Update message as delivered in database if recipient is connected
            if (recipientSocketId || io.sockets.adapter.rooms.get(`user_${recipientId}`)) {
              const updatedMessage = await Message.findByIdAndUpdate(
                message._id,
                { delivered: true, deliveredAt: new Date() },
                { new: true }
              );
              
              // 5. Notify sender about delivery status
              const senderSocketId = connectedUsers.get(message.sender.id);
              if (senderSocketId) {
                io.to(senderSocketId).emit('messageDelivered', {
                  messageId: message._id,
                  conversationId,
                  deliveredAt: updatedMessage.deliveredAt
                });
              }
            }
          }
        } catch (error) {
          console.error('Error handling new message:', error);
        }
      });

      // Handle joining a conversation room
      socket.on('joinConversation', ({ conversationId }) => {
        if (!socket.userId) {
          console.log('User not identified, cannot join conversation');
          return;
        }
        
        console.log(`User ${socket.userId} joining conversation room: conversation_${conversationId}`);
        socket.join(`conversation_${conversationId}`);
        
        // Mark user as active in this conversation
        userActiveStatus.set(socket.userId, true);
        
        // Get conversation participants and notify them that this user is viewing the conversation
        Conversation.findById(conversationId)
          .then(conversation => {
            if (!conversation) return;
            
            // Emit to the conversation room that this user is now active
            io.to(`conversation_${conversationId}`).emit('userConversationStatus', {
              userId: socket.userId,
              conversationId,
              status: 'active'
            });
          })
          .catch(err => console.error('Error getting conversation participants:', err));
      });
      
      // Handle leaving a conversation room
      socket.on('leaveConversation', ({ conversationId }) => {
        if (!socket.userId) return;
        
        console.log(`User ${socket.userId} leaving conversation room: conversation_${conversationId}`);
        socket.leave(`conversation_${conversationId}`);
        
        // Notify participants that user has left the conversation view
        io.to(`conversation_${conversationId}`).emit('userConversationStatus', {
          userId: socket.userId,
          conversationId,
          status: 'inactive'
        });
      });
      
      // Handle typing indicator
      socket.on('typing', ({ conversationId, isTyping }) => {
        if (!socket.userId || !conversationId) return;
        
        console.log(`User ${socket.userId} ${isTyping ? 'is typing' : 'stopped typing'} in conversation ${conversationId}`);
        
        // Emit to the conversation room
        io.to(`conversation_${conversationId}`).emit('typing', {
          userId: socket.userId,
          conversationId,
          isTyping
        });
      });
      
      // Handle marking entire conversation as seen
      socket.on('markConversationSeen', async ({ conversationId }) => {
        if (!socket.userId || !conversationId) return;
        
        try {
          console.log(`Marking conversation ${conversationId} as seen by user ${socket.userId}`);
          
          // Update all unread messages in this conversation
          const unreadMessages = await Message.find({
            conversation: conversationId,
            'recipient.id': socket.userId,
            isRead: false
          });
          
          // Mark all as read
          const now = new Date();
          await Message.updateMany(
            {
              conversation: conversationId,
              'recipient.id': socket.userId,
              isRead: false
            },
            { 
              isRead: true,
              readAt: now 
            }
          );
          
          // Update conversation unread count
          await Conversation.findByIdAndUpdate(
            conversationId,
            { $set: { [`unreadCount.${socket.userId}`]: 0 } },
            { new: true }
          );
          
          // Get conversation to find other participants
          const conversation = await Conversation.findById(conversationId);
          if (!conversation) return;
          
          // Notify other participants that messages have been seen
          conversation.participants.forEach(participant => {
            if (participant.id.toString() === socket.userId.toString()) return;
            
            const participantId = participant.id.toString();
            // Emit to their user room
            io.to(`user_${participantId}`).emit('conversationSeen', {
              conversationId,
              seenBy: socket.userId,
              seenAt: now
            });
            
            // Emit to the conversation room
            io.to(`conversation_${conversationId}`).emit('conversationSeen', {
              conversationId,
              seenBy: socket.userId,
              seenAt: now
            });
            
            // Also emit directly if connected
            const participantSocketId = connectedUsers.get(participantId);
            if (participantSocketId) {
              io.to(participantSocketId).emit('conversationSeen', {
                conversationId,
                seenBy: socket.userId,
                seenAt: now
              });
            }
          });
        } catch (error) {
          console.error('Error marking conversation as seen:', error);
        }
      });

      // Handle message seen
      socket.on('markMessageSeen', async ({ messageId, conversationId }) => {
        console.log('Message seen:', messageId, 'in conversation:', conversationId);
        
        try {
          // Update message with seen status
          const message = await Message.findByIdAndUpdate(
            messageId,
            { 
              isRead: true, 
              readAt: new Date() 
            },
            { new: true }
          );

          if (message) {
            // Emit to conversation room for anyone in this conversation
            io.to(`conversation_${conversationId}`).emit('messageSeen', {
              messageId,
              conversationId,
              readAt: message.readAt,
              readBy: socket.userId
            });
            
            // Also emit to the sender specifically
            const senderSocketId = connectedUsers.get(message.sender.id);
            if (senderSocketId) {
              io.to(senderSocketId).emit('messageSeen', {
                messageId,
                conversationId,
                readAt: message.readAt,
                readBy: socket.userId
              });
            }
            
            // Also emit to the sender's user room for reliability
            io.to(`user_${message.sender.id}`).emit('messageSeen', {
              messageId,
              conversationId,
              readAt: message.readAt,
              readBy: socket.userId
            });
          }
        } catch (error) {
          console.error('Error marking message as seen:', error);
        }
      });

      // Handle user active in conversation
      socket.on('activeInConversation', ({ conversationId }) => {
        if (socket.userId) {
          userActiveStatus.set(socket.userId, true);
        }
      });

      // Handle user inactive in conversation
      socket.on('inactiveInConversation', ({ conversationId }) => {
        if (socket.userId) {
          userActiveStatus.set(socket.userId, false);
        }
      });

      // Handle form submission
      socket.on('formSubmitted', async (formData) => {
        try {
          // Emit to all admin sockets
          io.emit('newForm', formData);
          console.log('New form submitted:', formData._id);
        } catch (error) {
          console.error('Error handling form submission:', error);
        }
      });

      // Handle form status updates
      socket.on('formStatusUpdated', async ({ formId, status, message }) => {
        try {
          console.log('Form status update received:', { formId, status });
          
          // Extract student ID from form
          const Form = require('./models/formModel');
          const updatedForm = await Form.findById(formId)
            .populate('user', 'name studentDormNumber')
            .populate({
              path: 'room',
              select: 'roomNumber building',
              populate: {
                path: 'building',
                select: 'name'
              }
            });
          
          if (!updatedForm) {
            console.error('Form not found:', formId);
            return;
          }
          
          const studentId = updatedForm.user && updatedForm.user._id ? updatedForm.user._id : updatedForm.user;
          
          console.log('Student ID extracted:', studentId);
          
          const studentSocketId = connectedUsers.get(studentId.toString());
          console.log('Student socket ID:', studentSocketId);
          console.log('All connected users:', Array.from(connectedUsers.entries()));
          
          // Emit to all connected clients for real-time updates
          console.log('Emitting formUpdate to all clients');
          io.emit('formUpdate', { 
            formId, 
            status, 
            type: updatedForm.requestType,
            updatedForm 
          });
          
          // User-specific approach for reliable delivery:
          // 1. Emit to user's room (most reliable)
          // 2. Emit directly to socket if connected
          // 3. Save notification for when they reconnect
          
          // Emit to the specific user's room
          console.log(`Emitting to user_${studentId} room`);
          io.to(`user_${studentId}`).emit('formStatusUpdate', {
            formId,
            status,
            type: updatedForm.requestType,
            updatedAt: new Date()
          });
          
          // If student is connected, also emit directly to their socket
          if (studentSocketId) {
            console.log('Emitting formStatusUpdate directly to student:', studentId);
            console.log('Using socket ID:', studentSocketId);
            
            // Also emit a notification directly to this student
            console.log('Also sending direct notification to student');
            io.to(studentSocketId).emit('newNotification', {
              type: status === 'Approved' ? 'FORM_APPROVED' : 'FORM_DECLINED',
              title: `Form ${status}`,
              content: `Your ${updatedForm.requestType} request has been ${status.toLowerCase()}.`,
              recipient: {
                id: studentId,
                model: 'User'
              },
              createdAt: new Date(),
              isRead: false
            });
          } else {
            console.log('Student not connected, notification will be stored in database only');
          }
          
          console.log('Form status update processing complete');
        } catch (error) {
          console.error('Error handling form status update:', error);
        }
      });
      
      // Handle form assignment to staff
      socket.on('formAssigned', async ({ formId, staffId, updatedForm }) => {
        try {
          console.log('Form assignment received:', { formId, staffId });
          
          if (!formId || !staffId || !updatedForm) {
            console.error('Invalid form assignment data:', { formId, staffId });
            return;
          }

          // Get student ID from the form
          const studentId = updatedForm.user && updatedForm.user._id ? 
            updatedForm.user._id.toString() : 
            updatedForm.user ? updatedForm.user.toString() : null;
          
          if (!studentId) {
            console.error('Student ID not found in form:', formId);
            return;
          }
          
          console.log('Student ID extracted:', studentId);
          console.log('Staff ID:', staffId);
          
          // Emit to all connected clients for real-time updates
          console.log('Emitting formAssigned to all clients');
          io.emit('formAssigned', { 
            formId, 
            staffId, 
            status: 'Assigned',
            updatedForm 
          });
          
          // Emit to the specific student's room
          console.log(`Emitting to user_${studentId} room`);
          io.to(`user_${studentId}`).emit('formAssigned', {
            formId,
            staffId,
            status: 'Assigned',
            updatedForm
          });
          
          // Emit to the specific staff's room
          console.log(`Emitting to user_${staffId} room`);
          io.to(`user_${staffId}`).emit('formAssigned', {
            formId,
            staffId,
            status: 'Assigned',
            updatedForm
          });
          
          // If student is connected, also emit a notification
          const studentSocketId = connectedUsers.get(studentId);
          if (studentSocketId) {
            console.log('Sending direct notification to student');
            io.to(studentSocketId).emit('newNotification', {
              type: 'FORM_ASSIGNED',
              title: 'Form Assigned',
              content: `Your ${updatedForm.requestType} request has been assigned to ${updatedForm.staff.name}.`,
              recipient: {
                id: studentId,
                model: 'User'
              },
              createdAt: new Date(),
              isRead: false
            });
          }
          
          // If staff is connected, also emit a notification
          const staffSocketId = connectedUsers.get(staffId);
          if (staffSocketId) {
            console.log('Sending direct notification to staff');
            io.to(staffSocketId).emit('newNotification', {
              type: 'NEW_ASSIGNMENT',
              title: 'New Assignment',
              content: `You've been assigned to a ${updatedForm.requestType} request in room ${updatedForm.roomNumber}.`,
              recipient: {
                id: staffId,
                model: 'Staff'
              },
              createdAt: new Date(),
              isRead: false
            });
          }
          
          console.log('Form assignment processing complete');
        } catch (error) {
          console.error('Error handling form assignment:', error);
        }
      });

      // Handle form deletion
      socket.on('formDelete', async ({ formId }) => {
        try {
          // Broadcast to all connected clients except sender
          socket.broadcast.emit('formUpdate', {
            type: 'delete',
            formId
          });
        } catch (error) {
          console.error('Error handling form deletion:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          console.log('User disconnected:', socket.userId);
          connectedUsers.delete(socket.userId.toString());
          userActiveStatus.set(socket.userId.toString(), false);
          
          // Notify other users that this user is offline
          socket.broadcast.emit('userStatus', {
            userId: socket.userId,
            status: 'offline'
          });
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Handle new room created, updated, or deleted
      socket.on('roomChange', (data) => {
        console.log('Room change:', data);
        
        // Broadcast to all clients
        io.emit('roomUpdate', data);
      });
    });

    // Start server
    server.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 