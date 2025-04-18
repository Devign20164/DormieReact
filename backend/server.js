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
        .catch(error => {
          console.error('Error fetching pending notifications:', error);
        });
      });

      // Handle message seen status
      socket.on('messageSeen', async ({ messageId }) => {
        try {
          const message = await Message.findById(messageId);
          if (message) {
            message.isRead = true;
            await message.save();
            
            // Emit to sender that their message was seen
            const senderSocketId = connectedUsers.get(message.sender.id.toString());
            if (senderSocketId) {
              io.to(senderSocketId).emit('messageSeen', { messageId });
            }
          }
        } catch (error) {
          console.error('Error marking message as seen:', error);
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