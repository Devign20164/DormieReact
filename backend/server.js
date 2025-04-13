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
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true
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
    
    // Make io and connectedUsers available to routes
    app.set('io', io);
    app.set('connectedUsers', connectedUsers);
    app.set('userActiveStatus', userActiveStatus);

    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log('A user connected', socket.id);

      // Handle user joining with their ID
      socket.on('join', (userId) => {
        console.log('User joined:', userId);
        socket.userId = userId;
        connectedUsers.set(userId, socket.id);
        userActiveStatus.set(userId, true);

        // Notify other users that this user is online
        socket.broadcast.emit('userStatus', {
          userId: userId,
          status: 'online'
        });
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
      socket.on('newMessage', async ({ message, conversationId }) => {
        console.log('New message:', message, 'for conversation:', conversationId);
        
        try {
          // Find recipient's socket ID
          const recipientId = message.recipient.id;
          const recipientSocketId = connectedUsers.get(recipientId);
          
          // Update message with delivered status
          const updatedMessage = await Message.findByIdAndUpdate(
            message._id,
            { delivered: true, deliveredAt: new Date() },
            { new: true }
          );
          
          // Emit delivery status to sender
          socket.emit('messageDelivered', {
            messageId: message._id,
            conversationId,
            deliveredAt: updatedMessage.deliveredAt
          });

          // If recipient is connected, emit the message to them
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('newMessage', {
              message: updatedMessage,
              conversationId
            });
          }
        } catch (error) {
          console.error('Error handling new message:', error);
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
            const senderSocketId = connectedUsers.get(message.sender.id);
            if (senderSocketId) {
              // Emit seen status to sender
              io.to(senderSocketId).emit('messageSeen', {
                messageId,
                conversationId,
                readAt: message.readAt
              });
            }
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

      // Handle form status update
      socket.on('formStatusUpdated', async ({ formId, status, updatedForm, type }) => {
        try {
          console.log('Form status update event received:', { formId, status, type });
          console.log('User ID from updated form:', updatedForm.user);
          
          // Find student's socket ID
          let studentId;
          if (typeof updatedForm.user === 'object' && updatedForm.user !== null) {
            studentId = updatedForm.user._id;
          } else {
            studentId = updatedForm.user;
          }
          
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
          
          // If student is connected, emit the status update to them directly
          if (studentSocketId) {
            console.log('Emitting formStatusUpdate to student:', studentId);
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
            
            // Emit the form status update
            io.to(studentSocketId).emit('formStatusUpdate', {
              formId,
              status,
              type: updatedForm.requestType
            });
            console.log('Emit complete');
          } else {
            console.log('Student not connected, no direct emit');
          }
          
          console.log('Form status update processing complete');
        } catch (error) {
          console.error('Error handling form status update:', error);
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

      // Handle user disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
        if (socket.userId) {
          connectedUsers.delete(socket.userId);
          userActiveStatus.delete(socket.userId);
          
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