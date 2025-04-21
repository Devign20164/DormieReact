const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const path = require('path');
const fs = require('fs');
const setupSocketHandlers = require('./utils/socketHandler');

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
    origin: ["http://localhost:3000", "http://localhost:5000"],
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
  origin: ["http://localhost:3000", "http://localhost:5000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Add more debug middleware for requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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

// Set up enhanced socket handlers
const socketHandlers = setupSocketHandlers(io, connectedUsers, userActiveStatus);
app.set('socketHandlers', socketHandlers);

// Enable debug mode for Socket.IO in development
if (process.env.NODE_ENV !== 'production') {
  io.on('connection', (socket) => {
    console.log(`[DEBUG] Socket ${socket.id} connected`);
    
    socket.onAny((event, ...args) => {
      console.log(`[DEBUG] Socket ${socket.id} event: ${event}`, JSON.stringify(args));
    });
  });
}

// Handle pending notifications during socket connection
io.on('connection', (socket) => {
  // This will be called first, before our enhanced handler
  socket.on('join', async (userId) => {
    if (!userId) return;
    
    try {
      // Fetch pending notifications
      const Notification = require('./models/notificationModel');
      const notifications = await Notification.find({
        'recipient.id': userId,
        isRead: false
      }).sort('-createdAt');
      
      if (notifications.length > 0) {
        socket.emit('pendingNotifications', notifications);
      }
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
    }
  });
});

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
    
    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log('A user connected', socket.id);

      // Debug socket events
      socket.onAny((eventName, ...args) => {
        console.log(`[Socket ${socket.id}] Event: ${eventName}`, args);
      });

      // Handle message seen status - keep for backward compatibility 
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
            
            // Also broadcast to conversation room
            if (message.conversationId) {
              io.to(`conversation_${message.conversationId}`).emit('messageSeen', { 
                messageId,
                conversationId: message.conversationId
              });
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