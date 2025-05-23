const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/adminModel');
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const config = require('../config/config');
const Building = require('../models/buildingModel');
const Room = require('../models/roomModel');
const Offense = require('../models/offenseModel');
const Staff = require('../models/staffModel');
const Form = require('../models/FormModel');
const Bill = require('../models/billModel');
const Curfew = require('../models/CurfewModel');
const Log = require('../models/logModel');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const News = require('../models/NewsModel');
const { sendApplicationConfirmationEmail } = require('../utils/emailService');

// Telegram bot token from environment
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  console.log('Login attempt for admin:', identifier);

  const admin = await Admin.findOne({ name: identifier });
  console.log('Admin found:', admin ? 'Yes' : 'No');

  if (!admin) {
    console.log('Admin not found with name:', identifier);
    return res.status(401).json({
      message: 'Invalid credentials'
    });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  console.log('Password match:', isMatch ? 'Yes' : 'No');

  if (!isMatch) {
    console.log('Password does not match');
    return res.status(401).json({
      message: 'Invalid credentials'
    });
  }

  try {
    // Generate JWT Token
    const token = jwt.sign(
      {
        id: admin._id,
        role: 'admin',
        name: admin.name,
      },
      config.jwtSecret,
      {
        expiresIn: '1d',
      }
    );

    // Set JWT as HTTP-Only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Get Socket.io instance
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    // Prepare response data
    const responseData = {
      _id: admin._id,
      name: admin.name,
      role: 'admin',
    };

    // Return admin data along with socket initialization data
    res.json({
      ...responseData,
      socketInitRequired: true,
      socketUserId: admin._id.toString()
    });

    console.log('Admin login successful:', admin.name);
  } catch (error) {
    console.error('JWT Error:', error);
    res.status(500).json({
      message: 'Error creating authentication token'
    });
  }
});

// @desc    Logout admin
// @route   POST /api/admin/logout
// @access  Private
const logoutAdmin = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private
const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.user.id).select('-password');
  if (admin) {
    res.json({
      _id: admin._id,
      name: admin.name,
      role: 'admin',
    });
  } else {
    res.status(404);
    throw new Error('Admin not found');
  }
});

// @desc    Update admin profile
// @route   PUT /api/admin/update-profile
// @access  Private
const updateAdminProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;

  try {
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    if (name) {
      // Check if name is already in use by another admin
      const nameExists = await Admin.findOne({ name, _id: { $ne: req.user.id } });
      if (nameExists) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      admin.name = name;
    }
    
    await admin.save();
    
    res.json({
      _id: admin._id,
      name: admin.name,
      role: 'admin',
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// @desc    Update admin password
// @route   POST /api/admin/update-password
// @access  Private
const updateAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  try {
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Set new password - the hashing will be handled by the pre-save middleware in the model
    admin.password = newPassword;
    await admin.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating admin password:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// @desc    Start or get a conversation with a student
// @route   POST /api/admin/conversations
// @access  Private/Admin
const startConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body;
  
  try {
    // Get student details
    const student = await User.findById(participantId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants': {
        $all: [
          { $elemMatch: { id: req.user.id, model: 'Admin' } },
          { $elemMatch: { id: participantId, model: 'User' } }
        ]
      }
    });

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [
          { id: req.user.id, model: 'Admin', name: req.user.name },
          { id: participantId, model: 'User', name: student.name }
        ],
        subject: 'New Conversation'
      });

      // Update both users' conversation lists
      await Admin.findByIdAndUpdate(req.user.id, {
        $push: { conversations: conversation._id }
      });
      await User.findByIdAndUpdate(participantId, {
        $push: { conversations: conversation._id }
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ message: 'Error starting conversation' });
  }
});

// @desc    Send a message
// @route   POST /api/admin/messages
// @access  Private/Admin
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, content, attachments } = req.body;
  
  try {
    console.log('Request body:', req.body);
    console.log('User info:', req.user);

    console.log('Finding conversation:', conversationId);
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log('Conversation not found');
      return res.status(404).json({ message: 'Conversation not found' });
    }

    console.log('Conversation found:', conversation);
    console.log('Finding recipient from participants:', conversation.participants);
    const recipient = conversation.participants.find(
      p => p.id.toString() !== req.user.id.toString()
    );

    if (!recipient) {
      console.log('Recipient not found in participants');
      return res.status(400).json({ message: 'Recipient not found in conversation' });
    }

    console.log('Creating message with recipient:', recipient);
    // Create the message
    const message = await Message.create({
      sender: {
        id: req.user.id,
        model: 'Admin',
        name: req.user.name
      },
      recipient: recipient,
      content,
      attachments: attachments || [],
      conversation: conversationId
    });

    console.log('Message created:', message);

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();
    console.log('Conversation updated with last message');

    // Update recipient's unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      $inc: { [`unreadCount.${recipient.id}`]: 1 }
    });
    console.log('Unread count updated');

    // Create notification for recipient
    const notification = await Notification.create({
      recipient: {
        id: recipient.id,
        model: 'User'
      },
      type: 'MESSAGE',
      title: `New message from ${req.user ? req.user.name : 'Admin'}`,
      content: content.length > 30 ? content.substring(0, 30) + '...' : content,
      relatedTo: {
        model: 'Conversation',
        id: conversation._id
      }
    });
    console.log('Notification created:', notification._id);

    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      // Send the message event for the chat interface
      req.app.get('io').to(recipient.id.toString()).emit('newMessage', {
        message,
        conversation: conversationId
      });
      
      // Add debug information
      console.log(`Admin sending notification for message ${message._id} to ${recipient.id}`);
      
      // Use the emitNotification helper function for notification
      const emitNotification = req.app.get('emitNotification');
      if (emitNotification) {
        // Prevent potential duplicates by ensuring this notification hasn't been sent before
        notification._adminSentAt = new Date().toISOString();
        
        // Use the emitNotification helper, which will handle the emitting
        emitNotification(notification);
        console.log(`Admin used emitNotification helper for message ${message._id}`);
      } else {
        console.log('emitNotification function not available');
      }
    } else {
      console.log('Socket.io not initialized');
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', {
      error: error.message,
      stack: error.stack,
      conversationId,
      userId: req.user.id
    });
    res.status(500).json({ 
      message: 'Error sending message',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Get admin's conversations
// @route   GET /api/admin/conversations
// @access  Private/Admin
const getConversations = asyncHandler(async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants': {
        $elemMatch: { id: req.user.id, model: 'Admin' }
      }
    })
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// @desc    Get messages from a conversation
// @route   GET /api/admin/conversations/:conversationId/messages
// @access  Private/Admin
const getMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({
      conversation: req.params.conversationId
    })
    .sort({ createdAt: -1 })
    .limit(50);  // Limit to last 50 messages

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        'recipient.id': req.user.id,
        isRead: false
      },
      { isRead: true }
    );

    // Reset unread count for this conversation
    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      $set: { [`unreadCount.${req.user.id}`]: 0 }
    });

    res.json(messages.reverse());  // Return in chronological order
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
const getAllStudents = asyncHandler(async (req, res) => {
  try {
    const students = await User.find({}).select('-password');
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      message: 'Error fetching students',
      error: error.message 
    });
  }
});

// Get all notifications for an admin
const getNotifications = async (req, res) => {
  try {
    // Query notifications that are either:
    // 1. Specific to this admin (has recipient.id matching this admin's ID)
    // 2. OR meant for all admins (has recipient.model='Admin' but no recipient.id)
    const notifications = await Notification.find({
      $or: [
        // Admin-specific notifications
        {
          'recipient.id': req.user._id,
          'recipient.model': 'Admin'
        },
        // Role-based notifications for all admins
        {
          'recipient.model': 'Admin',
          'recipient.id': { $exists: false }
        }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50);  // Limit to most recent 50 notifications

    console.log(`Found ${notifications.length} notifications for admin ${req.user._id}`);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        'recipient.id': req.user._id,
        'recipient.model': 'Admin'
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

// Mark all notifications as read
const markAllNotificationsRead = async (req, res) => {
  try {
    // Mark both specific and role-based admin notifications as read
    const result = await Notification.updateMany(
      {
        $or: [
          // Admin-specific notifications
          {
            'recipient.id': req.user._id,
            'recipient.model': 'Admin',
            isRead: false
          },
          // Role-based notifications for all admins
          {
            'recipient.model': 'Admin',
            'recipient.id': { $exists: false },
            isRead: false
          }
        ]
      },
      { isRead: true }
    );

    console.log(`Marked ${result.modifiedCount} notifications as read for admin ${req.user._id}`);
    res.json({ 
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
};

// Get unread notification count
const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      $or: [
        // Admin-specific notifications
        {
          'recipient.id': req.user._id,
          'recipient.model': 'Admin',
          isRead: false
        },
        // Role-based notifications for all admins
        {
          'recipient.model': 'Admin',
          'recipient.id': { $exists: false },
          isRead: false
        }
      ]
    });

    console.log(`Found ${count} unread notifications for admin ${req.user._id}`);
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'Error counting notifications' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      'recipient.id': req.user._id,
      'recipient.model': 'Admin'
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Delete all notifications
const deleteAllNotifications = asyncHandler(async (req, res) => {
  try {
    console.log('Deleting notifications for admin:', req.user._id);
    
    if (!req.user._id) {
      console.log('User ID missing in request');
      return res.status(400).json({ 
        message: 'User ID is required'
      });
    }

    // Delete both specific and role-based admin notifications
    const result = await Notification.deleteMany({
      $or: [
        // Admin-specific notifications
        {
          'recipient.id': req.user._id,
          'recipient.model': 'Admin'
        },
        // Role-based notifications for all admins
        {
          'recipient.model': 'Admin',
          'recipient.id': { $exists: false }
        }
      ]
    });

    console.log('Delete result:', result);

    res.json({ 
      message: 'All notifications deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error in deleteAllNotifications:', error);
    res.status(500).json({ 
      message: 'Error deleting notifications',
      error: error.message 
    });
  }
});

// Get all buildings
const getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.find().populate('rooms');
    res.json(buildings);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({ message: 'Error fetching buildings' });
  }
};

// Create a new building
const createBuilding = async (req, res) => {
  try {
    const { name, type } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    // Check if building name already exists
    const existingBuilding = await Building.findOne({ name });
    if (existingBuilding) {
      return res.status(400).json({ message: 'Building with this name already exists' });
    }

    // Create new building
    const building = new Building({
      name,
      type
    });

    const savedBuilding = await building.save();
    res.status(201).json(savedBuilding);
  } catch (error) {
    console.error('Error creating building:', error);
    res.status(500).json({ message: 'Error creating building' });
  }
};

// Update a building
const updateBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { name, type } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    // Check if building exists
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    // Check if new name already exists (excluding current building)
    if (name !== building.name) {
      const existingBuilding = await Building.findOne({ name });
      if (existingBuilding) {
        return res.status(400).json({ message: 'Building with this name already exists' });
      }
    }

    // Update building
    const updatedBuilding = await Building.findByIdAndUpdate(
      buildingId,
      { name, type },
      { new: true, runValidators: true }
    ).populate('rooms');

    res.json(updatedBuilding);
  } catch (error) {
    console.error('Error updating building:', error);
    res.status(500).json({ message: 'Error updating building' });
  }
};

// Delete a building
const deleteBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;

    // Check if building exists
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    // Check if building has rooms
    if (building.rooms.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete building with existing rooms. Please delete all rooms first.' 
      });
    }

    // Delete building
    await Building.findByIdAndDelete(buildingId);
    res.json({ message: 'Building deleted successfully' });
  } catch (error) {
    console.error('Error deleting building:', error);
    res.status(500).json({ message: 'Error deleting building' });
  }
};

// Get building by ID
const getBuildingById = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const building = await Building.findById(buildingId).populate('rooms');
    
    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    res.json(building);
  } catch (error) {
    console.error('Error fetching building:', error);
    res.status(500).json({ message: 'Error fetching building' });
  }
};

// Get all rooms in a building
const getRoomsByBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const rooms = await Room.find({ building: buildingId }).populate('occupants');
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
};

// Create a new room
const createRoom = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { roomNumber, type, price } = req.body;

    // Validate required fields
    if (!roomNumber || !type || !price) {
      return res.status(400).json({ message: 'Room number, type, and price are required' });
    }

    // Check if building exists
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    // Check if room number already exists in the building
    const existingRoom = await Room.findOne({ building: buildingId, roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists in this building' });
    }

    // Create new room
    const room = new Room({
      roomNumber,
      type,
      price,
      building: buildingId,
      status: 'Available', // Default to Available since it's a new room
      occupants: []
    });

    const savedRoom = await room.save();
    
    // Update the building's rooms array to include the new room
    await Building.findByIdAndUpdate(
      buildingId,
      { $push: { rooms: savedRoom._id } },
      { new: true }
    );
    
    // Populate the occupants field
    const populatedRoom = await Room.findById(savedRoom._id).populate('occupants');
    
    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').emit('roomUpdate', {
        action: 'create',
        room: populatedRoom,
        buildingId
      });
    }
    
    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
};

// Update a room
const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { roomNumber, type } = req.body;

    // Validate required fields
    if (!roomNumber || !type) {
      return res.status(400).json({ message: 'Room number and type are required' });
    }

    // Set price based on room type
    const price = type === 'Single' ? 8000 : 12000;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if new room number already exists (excluding current room)
    if (roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ 
        building: room.building, 
        roomNumber,
        _id: { $ne: roomId }
      });
      if (existingRoom) {
        return res.status(400).json({ message: 'Room number already exists in this building' });
      }
    }

    // Update room
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { roomNumber, type, price },
      { new: true, runValidators: true }
    ).populate('occupants');

    // Update status based on occupants
    const hasOccupants = updatedRoom.occupants && updatedRoom.occupants.length > 0;
    const maxOccupants = updatedRoom.type === 'Single' ? 1 : 2;
    const isFull = updatedRoom.occupants.length >= maxOccupants;

    // Set room status based on occupancy
    let newStatus;
    if (hasOccupants) {
      newStatus = isFull ? 'Occupied' : 'Available';
    } else {
      newStatus = 'Available';
    }

    // Only update if status needs to change
    if (updatedRoom.status !== newStatus) {
      updatedRoom.status = newStatus;
      await updatedRoom.save();
    }

    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').emit('roomUpdate', {
        action: 'update',
        room: updatedRoom,
        buildingId: updatedRoom.building
      });
    }

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Error updating room' });
  }
};

// Delete a room
const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room has occupants
    if (room.occupants.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete room with existing occupants. Please remove all occupants first.' 
      });
    }

    // Store the building ID for socket event
    const buildingId = room.building;

    // Delete room
    await Room.findByIdAndDelete(roomId);
    
    // Remove the room from the building's rooms array
    await Building.findByIdAndUpdate(
      room.building,
      { $pull: { rooms: roomId } }
    );
    
    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').emit('roomUpdate', {
        action: 'delete',
        roomId,
        buildingId
      });
    }
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Error deleting room' });
  }
};

// Get a single room by ID
const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Check if room exists and populate occupants
    const room = await Room.findById(roomId).populate('occupants');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Error fetching room details' });
  }
};

// Get a student's offense history
const getStudentOffenses = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find all offenses for this student, sorted by date (newest first)
    const offenses = await Offense.find({ student: studentId })
      .sort({ dateOfOffense: -1 })
      .populate({
        path: 'recordedBy',
        select: 'name'
      });
    
    res.json(offenses);
  } catch (error) {
    console.error('Error fetching student offenses:', error);
    res.status(500).json({ message: 'Error fetching student offense history' });
  }
};

// Get all offenses for all students
const getAllOffenses = async (req, res) => {
  try {
    // Find all offenses, sorted by date (newest first)
    const offenses = await Offense.find({})
      .sort({ dateOfOffense: -1 })
      .populate({
        path: 'recordedBy',
        select: 'name'
      })
      .populate({
        path: 'student',
        select: 'name roomNumber'
      });
    
    res.json(offenses);
  } catch (error) {
    console.error('Error fetching all offenses:', error);
    res.status(500).json({ message: 'Error fetching offense history' });
  }
};

// Create a new offense for a student
const createStudentOffense = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { offenseReason, typeOfOffense } = req.body;
    
    // Validate required fields
    if (!offenseReason || !typeOfOffense) {
      return res.status(400).json({ message: 'Offense reason and type are required' });
    }
    
    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create the offense
    const offense = new Offense({
      student: studentId,
      offenseReason,
      typeOfOffense,
      recordedBy: req.user.id,
      dateOfOffense: new Date()
    });

    // Save the offense
    const savedOffense = await offense.save();
    
    // Add offense to student's offenseHistory
    await User.findByIdAndUpdate(
      studentId,
      { $push: { offenseHistory: savedOffense._id } }
    );

    // Create a notification for the student about the new offense
    const notification = await Notification.create({
      recipient: { id: studentId, model: 'User' },
      type: 'SYSTEM',
      title: 'New Offense Recorded',
      content: offenseReason,
      relatedTo: { model: 'Offense', id: savedOffense._id },
      metadata: { adminId: req.user.id }
    });
    // Emit the notification via Socket.IO to the student's room
    const io = req.app.get('io');
    if (io) {
      io.to(studentId.toString()).emit('newNotification', notification);
    }

    // Return the saved offense with admin details
    const populatedOffense = await Offense.findById(savedOffense._id).populate({
      path: 'recordedBy',
      select: 'name'
    });

    res.status(201).json(populatedOffense);
  } catch (error) {
    console.error('Error creating offense:', error);
    res.status(500).json({ message: 'Error recording offense' });
  }
};

// @desc    Get all staff members
// @route   GET /api/admin/staff
// @access  Private/Admin
const getAllStaff = asyncHandler(async (req, res) => {
  try {
    const staff = await Staff.find({}).select('-password').sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Error fetching staff members' });
  }
});

// @desc    Create a new staff member
// @route   POST /api/admin/staff
// @access  Private/Admin
const createStaff = asyncHandler(async (req, res) => {
  try {
    const { name, email, contactNumber, typeOfStaff } = req.body;
    const password = req.body.password || 'staffPassword'; // Set default password if not provided

    // Check if staff with the same email already exists
    const staffExists = await Staff.findOne({ email });
    if (staffExists) {
      return res.status(400).json({ message: 'Staff member with this email already exists' });
    }

    const newStaff = await Staff.create({
      name,
      email,
      contactNumber,
      password,
      typeOfStaff,
      status: 'Available'
    });

    // Return created staff without password
    const staffResponse = {
      _id: newStaff._id,
      name: newStaff.name,
      email: newStaff.email,
      contactNumber: newStaff.contactNumber,
      typeOfStaff: newStaff.typeOfStaff,
      status: newStaff.status,
      createdAt: newStaff.createdAt,
      assignedForms: []
    };

    res.status(201).json(staffResponse);
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ message: 'Error creating staff member' });
  }
});

// @desc    Get staff by ID
// @route   GET /api/admin/staff/:id
// @access  Private/Admin
const getStaffById = asyncHandler(async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-password');
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ message: 'Error fetching staff member details' });
  }
});

// @desc    Update staff member
// @route   PUT /api/admin/staff/:id
// @access  Private/Admin
const updateStaff = asyncHandler(async (req, res) => {
  try {
    const { name, typeOfStaff } = req.body;
    
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Check if updating to a name that already exists (except this staff member)
    if (name !== staff.name) {
      const nameExists = await Staff.findOne({ name, _id: { $ne: req.params.id } });
      if (nameExists) {
        return res.status(400).json({ message: 'Staff member with this name already exists' });
      }
    }
    
    staff.name = name || staff.name;
    staff.typeOfStaff = typeOfStaff || staff.typeOfStaff;
    
    const updatedStaff = await staff.save();
    
    res.json({
      _id: updatedStaff._id,
      name: updatedStaff.name,
      typeOfStaff: updatedStaff.typeOfStaff,
      status: updatedStaff.status,
      createdAt: updatedStaff.createdAt,
      assignedForms: updatedStaff.assignedForms || []
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ message: 'Error updating staff member' });
  }
});

// @desc    Delete staff member
// @route   DELETE /api/admin/staff/:id
// @access  Private/Admin
const deleteStaff = asyncHandler(async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Check if staff has assigned forms
    if (staff.assignedForms && staff.assignedForms.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete staff member with assigned forms. Please reassign forms first.' 
      });
    }
    
    await Staff.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ message: 'Error deleting staff member' });
  }
});

// @desc    Get all maintenance forms
// @route   GET /api/admin/forms
// @access  Private/Admin
const getAllForms = asyncHandler(async (req, res) => {
  try {
    // Get query parameters for filtering
    const { 
      status, 
      formType, 
      startDate, 
      endDate, 
      studentId,
      staffId,
      sort = '-createdAt' // Default sort by newest first
    } = req.query;
    
    // Build query object
    const query = {};
    
    // Add filters if provided
    if (status) query.status = status;
    if (formType) query.formType = formType;
    if (studentId) query.student = studentId;
    if (staffId) query.staff = staffId;
    
    // Date range filter for preferredStartTime
    if (startDate || endDate) {
      query.preferredStartTime = {};
      if (startDate) query.preferredStartTime.$gte = new Date(startDate);
      if (endDate) query.preferredStartTime.$lte = new Date(endDate);
    }
    
    // Fetch forms with populated references
    const forms = await Form.find(query)
      .populate('student', 'name email studentDormNumber room')
      .populate({
        path: 'student',
        populate: {
          path: 'room',
          select: 'roomNumber building',
          populate: {
            path: 'building',
            select: 'name'
          }
        }
      })
      .populate('staff', 'name email typeOfStaff status')
      .populate('admin', 'name')
      .sort(sort);
    
    // Calculate some stats for admin dashboard
    const formStats = {
      total: forms.length,
      pending: forms.filter(form => form.status === 'Pending').length,
      assigned: forms.filter(form => form.status === 'Assigned').length,
      inProgress: forms.filter(form => form.status === 'In Progress').length,
      completed: forms.filter(form => form.status === 'Completed').length,
      rejected: forms.filter(form => form.status === 'Rejected').length
    };
    
    res.json({
      forms,
      stats: formStats,
      count: forms.length
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ 
      message: 'Error fetching maintenance forms',
      error: error.message 
    });
  }
});

// @desc    Get form by ID
// @route   GET /api/admin/forms/:id
// @access  Private/Admin
const getFormById = asyncHandler(async (req, res) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate('student', 'name email studentDormNumber room')
      .populate({
        path: 'student',
        populate: {
          path: 'room',
          select: 'roomNumber building',
          populate: {
            path: 'building',
            select: 'name'
          }
        }
      })
      .populate('staff', 'name email typeOfStaff status')
      .populate('admin', 'name');
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    res.json(form);
  } catch (error) {
    console.error('Error fetching form details:', error);
    res.status(500).json({ 
      message: 'Error fetching form details',
      error: error.message 
    });
  }
});

// @desc    Update form status
// @route   PUT /api/admin/forms/:id/status
// @access  Private/Admin
const updateFormStatus = asyncHandler(async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Admins are not allowed to set forms to 'In Progress' or 'Completed' status
    // These actions are reserved for staff
    if (status === 'In Progress' || status === 'Completed') {
      return res.status(403).json({ 
        message: `Admins cannot change a form's status to ${status}. This action is reserved for staff.` 
      });
    }
    
    // Find the form
    const form = await Form.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Validate status transitions
    const validTransitions = {
      'Pending': ['Approved', 'Rejected'],
      'Approved': ['Assigned', 'Rejected'],
      'Rejected': [],
      'Assigned': ['Rejected'],
      'In Progress': [],  // Admins can't change from In Progress
      'Completed': []    // Admins can't change from Completed
    };
    
    if (!validTransitions[form.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${form.status} to ${status}. Valid next statuses are: ${validTransitions[form.status].join(', ')}` 
      });
    }
    
    // Update status and admin reference
    form.status = status;
    form.admin = req.user.id;
    
    // Initialize statusHistory array if it doesn't exist
    if (!form.statusHistory) {
      form.statusHistory = [];
    }
    
    // Add status history entry with notes
    form.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: notes || `Status changed to ${status} by admin`
    });
    
    // If changing to Rejected status, record the rejection reason
    if (status === 'Rejected' && notes) {
      form.rejectionReason = notes;
    }
    
    // Save the updated form
    const updatedForm = await form.save();
    
    // Create a notification for the student
    const notificationContent = getNotificationContentForStatus(form.formType, status);
    
    await Notification.create({
      recipient: {
        id: form.student,
        model: 'User'
      },
      type: 'SYSTEM',
      title: 'Form Status Updated',
      content: notificationContent,
      relatedTo: {
        model: 'Form',
        id: form._id
      },
      metadata: {
        formType: form.formType,
        status,
        formId: form._id
      }
    });
    
    // If there's a staff assigned, create notification for them too
    if (form.staff) {
      await Notification.create({
        recipient: {
          id: form.staff,
          model: 'Staff'
        },
        type: 'SYSTEM',
        title: 'Form Status Updated',
        content: `A ${form.formType} request assigned to you has been ${status.toLowerCase()}.`,
        relatedTo: {
          model: 'Form',
          id: form._id
        },
        metadata: {
          formType: form.formType,
          status,
          formId: form._id
        }
      });
    }
    
    // Emit socket events for real-time updates if available
    if (req.app && req.app.get('io')) {
      try {
        // Notify student about status change
        req.app.get('io').to(form.student.toString()).emit('formStatusChanged', {
          formId: form._id,
          status,
          message: notificationContent
        });
        
        // If staff is assigned, notify them as well
        if (form.staff) {
          req.app.get('io').to(form.staff.toString()).emit('formStatusChanged', {
            formId: form._id,
            status,
            message: `A ${form.formType} request has been ${status.toLowerCase()}.`
          });
        }
        
        // Broadcast to admins
        req.app.get('io').to('admins').emit('formStatusChanged', {
          formId: form._id,
          status,
          updatedAt: new Date().toISOString(),
          updatedBy: req.user.name || 'Admin'
        });
      } catch (socketError) {
        console.error('Socket error:', socketError);
        // Don't let socket errors affect the API response
      }
    }
    
    // Return fully populated form
    const populatedForm = await Form.findById(updatedForm._id)
      .populate('student', 'name email studentDormNumber room')
      .populate({
        path: 'student',
        populate: {
          path: 'room',
          populate: {
            path: 'building',
            select: 'name'
          }
        }
      })
      .populate('staff', 'name email typeOfStaff status')
      .populate('admin', 'name');
    
    res.json(populatedForm);
  } catch (error) {
    console.error('Error updating form status:', error);
    res.status(500).json({ 
      message: 'Error updating form status',
      error: error.message
    });
  }
});

// Helper function to get appropriate notification content based on status
const getNotificationContentForStatus = (formType, status) => {
  switch (status) {
    case 'Approved':
      return `Your ${formType} request has been approved and is awaiting staff assignment.`;
    case 'Rejected':
      return `Your ${formType} request has been rejected. Please check for details.`;
    case 'Assigned':
      return `Your ${formType} request has been assigned to a staff member.`;
    case 'In Progress':
      return `Work on your ${formType} request has started.`;
    case 'Completed':
      return `Your ${formType} request has been completed. Please leave a review.`;
    default:
      return `Your ${formType} request status has been updated to ${status}.`;
  }
};

// @desc    Assign staff to form
// @route   PUT /api/admin/forms/:id/assign
// @access  Private/Admin
const assignStaffToForm = asyncHandler(async (req, res) => {
  try {
    const { staffId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }
    
    // Find the form
    const form = await Form.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Check if form is in appropriate status for staff assignment
    if (form.status !== 'Approved' && form.status !== 'Pending') {
      return res.status(400).json({ 
        message: `Cannot assign staff to form with status ${form.status}. Form must be Approved or Pending.` 
      });
    }
    
    // Find the staff member
    const staff = await Staff.findById(staffId);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Check if staff is available
    if (staff.status === 'Unavailable' || staff.status === 'On Leave') {
      return res.status(400).json({ message: 'The selected staff member is currently unavailable' });
    }
    
    // Map form types to required staff types
    const staffTypeMapping = {
      'Repair': 'Maintenance',
      'Maintenance': 'Maintenance',
      'Cleaning': 'Cleaner'
    };
    
    const requiredStaffType = staffTypeMapping[form.formType];
    
    // Validate that staff type matches the required type for the form
    if (staff.typeOfStaff !== requiredStaffType) {
      return res.status(400).json({ 
        message: `This form requires a ${requiredStaffType} staff member. Selected staff member is ${staff.typeOfStaff}.` 
      });
    }
    
    // Update form with staff assignment and change status to 'Assigned'
    form.staff = staffId;
    form.status = 'Assigned';
    form.admin = req.user.id;
    form.statusHistory.push({
      status: 'Assigned',
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: `Assigned to ${staff.name}`
    });
    
    // Save the updated form
    const updatedForm = await form.save();
    
    // Update staff member's assigned forms
    await Staff.findByIdAndUpdate(staffId, {
      $push: { assignedForms: form._id }
    });
    
    // Create notification for the student
    await Notification.create({
      recipient: {
        id: form.student,
        model: 'User'
      },
      type: 'FORM_ASSIGNED',
      title: 'Staff Assigned to Your Request',
      content: `${staff.name} has been assigned to your ${form.formType} request.`,
      relatedTo: {
        model: 'Form',
        id: form._id
      },
      metadata: {
        formType: form.formType,
        staffId: staffId,
        staffName: staff.name,
        formId: form._id
      }
    });
    
    // Create notification for the staff
    await Notification.create({
      recipient: {
        id: staffId,
        model: 'Staff'
      },
      type: 'FORM_ASSIGNED',
      title: 'New Task Assignment',
      content: `You have been assigned to a ${form.formType} request.`,
      relatedTo: {
        model: 'Form',
        id: form._id
      },
      metadata: {
        formType: form.formType,
        formId: form._id
      }
    });
    
    // Emit socket events
    if (req.app.get('io')) {
      // Notify student
      req.app.get('io').to(form.student.toString()).emit('newNotification', {
        type: 'FORM_ASSIGNED',
        content: `${staff.name} has been assigned to your ${form.formType} request.`,
        formId: form._id,
        staffName: staff.name
      });
      
      // Notify staff
      req.app.get('io').to(staffId.toString()).emit('newNotification', {
        type: 'NEW_ASSIGNMENT',
        content: `You have been assigned to a ${form.formType} request.`,
        formId: form._id
      });
      
      // Broadcast assignment to all admins
      req.app.get('io').to('admins').emit('formAssigned', {
        formId: form._id,
        staffId,
        staffName: staff.name,
        updatedAt: new Date().toISOString(),
        assignedBy: req.user.id
      });
    }
    
    // Return populated form
    const populatedForm = await Form.findById(form._id)
      .populate('student', 'name email studentDormNumber room')
      .populate({
        path: 'student',
        populate: {
          path: 'room',
          populate: {
            path: 'building',
            select: 'name'
          }
        }
      })
      .populate('staff', 'name email typeOfStaff status')
      .populate('admin', 'name');
    
    res.json(populatedForm);
  } catch (error) {
    console.error('Error assigning staff to form:', error);
    res.status(500).json({ 
      message: 'Error assigning staff to form',
      error: error.message 
    });
  }
});

// @desc    Create a new bill
// @route   POST /api/admin/bills
// @access  Private/Admin
const createBill = asyncHandler(async (req, res) => {
  try {
    // Get file path if a file was uploaded
    const billFilePath = req.file ? req.file.path : '';
    
    // Parse other fees from string to object if it comes from form-data
    let parsedOtherFees = req.body.otherFees;
    if (typeof parsedOtherFees === 'string') {
      try {
        parsedOtherFees = JSON.parse(parsedOtherFees);
      } catch (error) {
        console.error('Error parsing otherFees:', error);
        parsedOtherFees = [];
      }
    }

    const {
      student,
      room,
      roomNumber,
      rentalFee,
      waterFee,
      electricityFee,
      billingPeriodStart,
      billingPeriodEnd,
      dueDate,
      notes
    } = req.body;

    // Validate student exists
    const studentExists = await User.findById(student);
    if (!studentExists) {
      return res.status(400).json({ message: 'Student not found' });
    }

    // Calculate billingPeriodEnd if not provided
    let calculatedBillingPeriodEnd = billingPeriodEnd;
    if (!calculatedBillingPeriodEnd && billingPeriodStart) {
      // Default to 1 month after start date
      const startDate = new Date(billingPeriodStart);
      calculatedBillingPeriodEnd = new Date(startDate);
      calculatedBillingPeriodEnd.setMonth(startDate.getMonth() + 1);
      calculatedBillingPeriodEnd.setDate(startDate.getDate() - 1); // End on day before next month's same date
    }

    // Create the bill - always set status to pending
    const bill = await Bill.create({
      student,
      room,
      roomNumber,
      rentalFee,
      waterFee,
      electricityFee,
      billingPeriodStart,
      billingPeriodEnd: calculatedBillingPeriodEnd,
      dueDate,
      notes,
      otherFees: parsedOtherFees,
      status: 'pending', // Always set status to pending for new bills
      billFile: billFilePath
    });

    // Calculate total amount for notification
    let totalAmount = parseFloat(rentalFee || 0) + parseFloat(waterFee || 0) + parseFloat(electricityFee || 0);
    if (parsedOtherFees && parsedOtherFees.length > 0) {
      parsedOtherFees.forEach(fee => {
        totalAmount += parseFloat(fee.amount || 0);
      });
    }

    // Format the due date for notification
    const formattedDueDate = new Date(dueDate).toLocaleDateString();

    // Create notification for the student
    await Notification.create({
      recipient: {
        id: student,
        model: 'User'
      },
      type: 'SYSTEM',
      title: 'New Bill Received',
      content: `You have received a new bill of $${totalAmount.toFixed(2)} due on ${formattedDueDate}`,
      relatedTo: {
        model: 'Form',
        id: bill._id
      },
      metadata: {
        billId: bill._id,
        amount: totalAmount,
        dueDate: dueDate,
        hasAttachment: !!billFilePath
      }
    });

    res.status(201).json(bill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: 'Error creating bill', error: error.message });
  }
});

// @desc    Get all bills
// @route   GET /api/admin/bills
// @access  Private/Admin
const getAllBills = asyncHandler(async (req, res) => {
  try {
    const bills = await Bill.find({})
      .populate('student', 'name email studentDormNumber')
      .populate('room', 'roomNumber building')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Error fetching bills', error: error.message });
  }
});

// @desc    Get bill by ID
// @route   GET /api/admin/bills/:id
// @access  Private/Admin
const getBillById = asyncHandler(async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('student', 'name email studentDormNumber')
      .populate('room', 'roomNumber building');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ message: 'Error fetching bill details', error: error.message });
  }
});

// @desc    Update bill status
// @route   PUT /api/admin/bills/:id/status
// @access  Private/Admin
const updateBillStatus = asyncHandler(async (req, res) => {
  try {
    const { status, paidAmount, paidDate } = req.body;
    
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    bill.status = status;
    
    if (status === 'paid') {
      bill.paidAmount = paidAmount || bill.totalAmount;
      bill.paidDate = paidDate || new Date();
    }
    
    await bill.save();
    
    // Create notification for the student
    await Notification.create({
      recipient: {
        id: bill.student,
        model: 'User'
      },
      type: 'SYSTEM',
      title: 'Bill Status Updated',
      content: `Your bill status has been updated to ${status}`,
      relatedTo: {
        model: 'Form',  // Using 'Form' instead of 'Bill' as valid enum
        id: bill._id
      },
      metadata: {
        billId: bill._id,
        status: status,
        updatedAt: new Date()
      }
    });
    
    res.json(bill);
  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(500).json({ message: 'Error updating bill status', error: error.message });
  }
});

// @desc    Delete bill
// @route   DELETE /api/admin/bills/:id
// @access  Private/Admin
const deleteBill = asyncHandler(async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    await bill.deleteOne();
    
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ message: 'Error deleting bill', error: error.message });
  }
});

// @desc    Return bill to student (reject payment)
// @route   POST /api/admin/bills/:id/return
// @access  Private/Admin
const returnBillToStudent = asyncHandler(async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Get student information
    const student = await User.findById(bill.student);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Store previous status for notification
    const previousStatus = bill.status;
    const previousPaymentStatus = bill.paymentStatus;
    const previousAmountPaid = bill.amountPaid;
    
    // Reset payment information
    bill.status = 'pending';
    bill.paymentStatus = previousStatus === 'paid' ? 'Incomplete Payment' : 'Unpaid';
    bill.amountPaid = 0;
    bill.payments = [];  // Clear all payments
    
    // If there was a receipt file, we keep it for reference
    // But add a note about the returned payment
    bill.notes = bill.notes 
      ? `${bill.notes}\n\nPayment returned on ${new Date().toLocaleString()}.` 
      : `Payment returned on ${new Date().toLocaleString()}.`;
    
    await bill.save();
    
    // Create notification for the student
    await Notification.create({
      recipient: {
        id: bill.student,
        model: 'User'
      },
      type: 'SYSTEM',
      title: 'Bill Payment Rejected',
      content: `Your payment of $${previousAmountPaid.toFixed(2)} for bill #${bill._id.toString().substring(0, 8)} has been returned. Please contact administration for details.`,
      relatedTo: {
        model: 'Form',  // Using 'Form' instead of 'Bill' as valid enum
        id: bill._id
      },
      metadata: {
        billId: bill._id,
        previousStatus,
        previousPaymentStatus,
        previousAmountPaid,
        returnedAt: new Date()
      }
    });
    
    res.json({ 
      message: 'Bill returned to student successfully',
      bill: {
        _id: bill._id,
        status: bill.status,
        paymentStatus: bill.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error returning bill to student:', error);
    res.status(500).json({ message: 'Error returning bill', error: error.message });
  }
});

// @desc    Download file from uploads directory
// @route   GET /api/admin/files/download/:filename
// @access  Private/Admin
const downloadFile = asyncHandler(async (req, res) => {
  try {
    let filename = req.params.filename;
    console.log('Download file request received for:', filename);
    
    // Normalize filename - replace any backslashes with forward slashes
    filename = filename.replace(/\\/g, '/');
    console.log('Normalized filename (backslashes to forward slashes):', filename);
    
    // Clean up filename - remove 'uploads/' prefix if somehow still present
    if (filename.startsWith('uploads/')) {
      filename = filename.substring('uploads/'.length);
      console.log(`Cleaned up filename, removed 'uploads/' prefix: ${filename}`);
    }
    
    // Get just the base filename without any path
    const baseFilename = filename.includes('/') ? filename.split('/').pop() : filename;
    console.log('Base filename (without any path):', baseFilename);
    
    // Define all possible paths where the file might be
    const uploadsDirPath = path.join(__dirname, '../uploads', baseFilename);
    const rootDirPath = path.join(__dirname, '..', baseFilename);
    const uploadsWithPrefixPath = path.join(__dirname, '../uploads/uploads', baseFilename);
    
    console.log('Checking these paths:');
    console.log(`1. Uploads dir path: ${uploadsDirPath}`);
    console.log(`2. Root dir path: ${rootDirPath}`);
    console.log(`3. Uploads with prefix path: ${uploadsWithPrefixPath}`);
    
    // Try all potential file paths
    let filePath = null;
    
    if (fs.existsSync(uploadsDirPath)) {
      console.log(`✓ File found at uploads dir path: ${uploadsDirPath}`);
      filePath = uploadsDirPath;
    } else if (fs.existsSync(rootDirPath)) {
      console.log(`✓ File found at root dir path: ${rootDirPath}`);
      filePath = rootDirPath;
    } else if (fs.existsSync(uploadsWithPrefixPath)) {
      console.log(`✓ File found at uploads with prefix path: ${uploadsWithPrefixPath}`);
      filePath = uploadsWithPrefixPath;
    } else {
      console.log('❌ File not found in any of the checked locations');
      
      // Last attempt - list all files in the uploads directory and look for a match
      const uploadsDir = path.join(__dirname, '../uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        console.log(`Files in uploads directory (${files.length} files):`);
        
        // Check for exact or partial filename matches
        const possibleMatches = files.filter(file => 
          file === baseFilename || 
          file.includes(baseFilename) ||
          (baseFilename.includes('-') && file.includes(baseFilename.split('-').pop()))
        );
        
        if (possibleMatches.length > 0) {
          console.log(`Found possible matches: ${possibleMatches.join(', ')}`);
          filePath = path.join(uploadsDir, possibleMatches[0]);
          console.log(`Using first match: ${filePath}`);
        } else {
          console.log('No matching files found');
        }
      } else {
        console.log('Uploads directory does not exist');
      }
    }
    
    // If we found a file path, send the file
    if (filePath) {
      console.log(`Sending file: ${filePath}`);
      return res.download(filePath, baseFilename, (err) => {
        if (err) {
          console.error(`Error sending file: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error downloading file' });
          }
        }
      });
    }
    
    // If we get here, no file was found
    return res.status(404).json({ message: 'File not found' });
  } catch (error) {
    console.error(`File download error: ${error.message}`);
    res.status(500).json({ message: 'Server error while downloading file' });
  }
});

// @desc    Get all curfews
// @route   GET /api/admin/curfews
// @access  Private/Admin
const getCurfews = asyncHandler(async (req, res) => {
  const curfews = await Curfew.find({}).sort({ createdAt: -1 });
  res.json(curfews);
});

// @desc    Get latest curfew entry
// @route   GET /api/admin/curfews/latest
// @access  Private/Admin
const getLatestCurfew = asyncHandler(async (req, res) => {
  const latest = await Curfew.findOne({}).sort({ createdAt: -1 });
  if (!latest) {
    res.status(404);
    throw new Error('No curfew entries found');
  }
  res.json(latest);
});

// @desc    Create a new curfew entry
// @route   POST /api/admin/curfews
// @access  Private/Admin
const createCurfew = asyncHandler(async (req, res) => {
  const { date, curfewTime } = req.body;
  if (!date || !curfewTime) {
    res.status(400);
    throw new Error('Date and curfewTime are required');
  }
  const existing = await Curfew.findOne({ date });
  if (existing) {
    res.status(400);
    throw new Error('Curfew for this date already exists');
  }
  const newCurfew = await Curfew.create({ date, curfewTime });
  res.status(201).json(newCurfew);
});

// @desc    Delete the latest curfew entry
// @route   DELETE /api/admin/curfews/latest
// @access  Private/Admin
const deleteLatestCurfew = asyncHandler(async (req, res) => {
  const latest = await Curfew.findOne({}).sort({ createdAt: -1 });
  if (!latest) {
    res.status(404);
    throw new Error('No curfew entries to delete');
  }
  await latest.deleteOne();
  res.json({ message: 'Latest curfew deleted successfully', deletedCurfew: latest });
});

// @desc    Update a curfew entry
// @route   PUT /api/admin/curfews/:id
// @access  Private/Admin
const updateCurfew = asyncHandler(async (req, res) => {
  const { date, curfewTime } = req.body;
  const curfew = await Curfew.findById(req.params.id);
  if (!curfew) {
    res.status(404);
    throw new Error('Curfew not found');
  }
  if (date) curfew.date = date;
  if (curfewTime) curfew.curfewTime = curfewTime;
  const updated = await curfew.save();
  res.json(updated);
});

// @desc    Get logs for a specific date
// @route   GET /api/admin/logs/:date
// @access  Private/Admin
const getLogs = asyncHandler(async (req, res) => {
  try {
    const dateStr = req.params.date; // Format: YYYY-MM-DD
    
    // Create date range for the specified date (start of day to end of day)
    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);
    
    // Find logs for the specified date
    const logs = await Log.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('user', 'name studentDormNumber')
    .populate({
      path: 'room',
      select: 'roomNumber',
      populate: {
        path: 'building',
        select: 'name'
      }
    })
    .sort({ 'entries.checkInTime': -1 });
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ 
      message: 'Error fetching logs',
      error: error.message 
    });
  }
});

// @desc    Excuse late check-in/check-out
// @route   PUT /api/admin/logs/:logId/entries/:entryId/excuse
// @access  Private/Admin
const excuseLateStatus = asyncHandler(async (req, res) => {
  try {
    const { logId, entryId } = req.params;
    const { type } = req.body; // 'checkIn' or 'checkOut'

    // Find the log
    const log = await Log.findById(logId);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    // Find the entry
    const entryIndex = log.entries.findIndex(entry => entry._id.toString() === entryId);
    if (entryIndex === -1) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const entry = log.entries[entryIndex];

    // Validate the type and current status
    if (type === 'checkIn') {
      if (entry.checkInStatus !== 'Late') {
        return res.status(400).json({ message: 'Only late check-ins can be excused' });
      }
      await log.updateCheckInStatus(entryIndex, 'Excused');
    } else if (type === 'checkOut') {
      if (entry.checkOutStatus !== 'Late') {
        return res.status(400).json({ message: 'Only late check-outs can be excused' });
      }
      await log.updateCheckOutStatus(entryIndex, 'Excused');
    } else {
      return res.status(400).json({ message: 'Invalid type specified' });
    }

    // Create a notification for the student
    const notification = await Notification.create({
      recipient: {
        id: log.user._id,
        model: 'User'
      },
      type: 'SYSTEM',
      title: 'Late Status Excused',
      content: `Your late ${type === 'checkIn' ? 'check-in' : 'check-out'} has been excused by an administrator.`,
      metadata: {
        logId: log._id,
        entryId: entry._id,
        type: type
      }
    });

    // If socket.io is available, emit the notification
    if (req.app.get('io')) {
      req.app.get('io').to(log.user._id.toString()).emit('newNotification', notification);
    }

    res.json({
      message: `Late ${type === 'checkIn' ? 'check-in' : 'check-out'} excused successfully`,
      entry: log.entries[entryIndex]
    });
  } catch (error) {
    console.error('Error excusing late status:', error);
    res.status(500).json({ 
      message: 'Error excusing late status',
      error: error.message 
    });
  }
});

// @desc    Get all news items
// @route   GET /api/admin/news
// @access  Private/Admin
const getAllNews = asyncHandler(async (req, res) => {
  try {
    // Get query parameters for filtering
    const { 
      category, 
      isActive, 
      pinned, 
      search, 
      limit = 10, 
      page = 1,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = req.query;

    // Build the filter object
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (isActive === 'true') {
      filter.isActive = true;
    } else if (isActive === 'false') {
      filter.isActive = false;
    }
    
    if (pinned === 'true') {
      filter.pinned = true;
    } else if (pinned === 'false') {
      filter.pinned = false;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Calculate pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Query the database
    const totalCount = await News.countDocuments(filter);
    const news = await News.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name');
    
    // Calculate if there are more pages
    const hasMore = skip + news.length < totalCount;
    
    // Return the response
    res.json({
      news,
      pagination: {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({ message: 'Error getting news items' });
  }
});

// @desc    Get a single news item by ID
// @route   GET /api/admin/news/:id
// @access  Private/Admin
const getNewsById = asyncHandler(async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate('author', 'name');
    
    if (!news) {
      return res.status(404).json({ message: 'News item not found' });
    }
    
    res.json(news);
  } catch (error) {
    console.error('Error getting news by ID:', error);
    res.status(500).json({ message: 'Error retrieving news item' });
  }
});

// @desc    Create a new news item
// @route   POST /api/admin/news
// @access  Private/Admin
const createNews = asyncHandler(async (req, res) => {
  try {
    const { 
      title, 
      content, 
      category, 
      publishDate, 
      expiryDate, 
      tags, 
      pinned, 
      image, 
      imageCaption 
    } = req.body;
    
    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Please provide title, content and category' });
    }
    
    // Create the news item
    const newsItem = await News.create({
      title,
      content,
      category,
      publishDate: publishDate || new Date(),
      expiryDate: expiryDate || null,
      isActive: true,
      author: req.user.id,
      pinned: pinned || false,
      tags: tags || [],
      image: image || null,
      imageCaption: imageCaption || ''
    });
    
    // Create notification for all students about new news
    const notificationTitle = `New ${category}: ${title}`;
    const notificationContent = `A new ${category.toLowerCase()} has been posted.`;
    
    // Create notification in the database - target all users
    await Notification.create({
      recipient: {
        model: 'User' // This is for all users, so no specific ID
      },
      type: 'SYSTEM', // Using SYSTEM as the type since NEWS is not in the enum
      title: notificationTitle,
      content: notificationContent,
      relatedTo: {
        model: 'Form', // Using Form as the model since News is not in the enum
        id: newsItem._id
      },
      metadata: {
        newsId: newsItem._id,
        category,
        isNews: true // Custom flag to identify this as news in the frontend
      }
    });
    
    // Get the io instance
    const io = req.app.get('io');
    if (io) {
      // Broadcast to all connected users
      io.to('students').emit('notification', {
        type: 'SYSTEM',
        title: notificationTitle,
        content: notificationContent,
        data: {
          newsId: newsItem._id,
          category,
          isNews: true
        }
      });
    }
    
    res.status(201).json(newsItem);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ message: 'Error creating news item' });
  }
});

// @desc    Update a news item
// @route   PUT /api/admin/news/:id
// @access  Private/Admin
const updateNews = asyncHandler(async (req, res) => {
  try {
    const { 
      title, 
      content, 
      category, 
      publishDate, 
      expiryDate, 
      isActive, 
      pinned, 
      tags, 
      image, 
      imageCaption 
    } = req.body;
    
    const newsId = req.params.id;
    
    // Find the news item
    const newsItem = await News.findById(newsId);
    
    if (!newsItem) {
      return res.status(404).json({ message: 'News item not found' });
    }
    
    // Update fields
    if (title) newsItem.title = title;
    if (content) newsItem.content = content;
    if (category) newsItem.category = category;
    if (publishDate) newsItem.publishDate = publishDate;
    if (expiryDate !== undefined) newsItem.expiryDate = expiryDate;
    if (isActive !== undefined) newsItem.isActive = isActive;
    if (pinned !== undefined) newsItem.pinned = pinned;
    if (tags) newsItem.tags = tags;
    if (image !== undefined) newsItem.image = image;
    if (imageCaption !== undefined) newsItem.imageCaption = imageCaption;
    
    // Save the updated news item
    const updatedNews = await newsItem.save();
    
    res.json(updatedNews);
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ message: 'Error updating news item' });
  }
});

// @desc    Delete a news item
// @route   DELETE /api/admin/news/:id
// @access  Private/Admin
const deleteNews = asyncHandler(async (req, res) => {
  try {
    const newsId = req.params.id;
    
    // Find and delete the news item
    const deletedNews = await News.findByIdAndDelete(newsId);
    
    if (!deletedNews) {
      return res.status(404).json({ message: 'News item not found' });
    }
    
    // Delete any related notifications
    await Notification.deleteMany({
      linkId: newsId,
      linkType: 'News'
    });
    
    res.json({ message: 'News item deleted successfully', deletedNews });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ message: 'Error deleting news item' });
  }
});

// @desc    Toggle pin status of a news item
// @route   PUT /api/admin/news/:id/toggle-pin
// @access  Private/Admin
const toggleNewsPin = asyncHandler(async (req, res) => {
  try {
    const newsId = req.params.id;
    
    // Find the news item
    const newsItem = await News.findById(newsId);
    
    if (!newsItem) {
      return res.status(404).json({ message: 'News item not found' });
    }
    
    // Toggle the pinned status
    newsItem.pinned = !newsItem.pinned;
    
    // Save the updated news item
    const updatedNews = await newsItem.save();
    
    res.json({
      message: `News item ${updatedNews.pinned ? 'pinned' : 'unpinned'} successfully`,
      news: updatedNews
    });
  } catch (error) {
    console.error('Error toggling news pin status:', error);
    res.status(500).json({ message: 'Error updating news pin status' });
  }
});

// @desc    Increment view count for a news item
// @route   PUT /api/admin/news/:id/view
// @access  Private
const incrementNewsViews = asyncHandler(async (req, res) => {
  try {
    const newsId = req.params.id;
    
    // Find the news item
    const newsItem = await News.findById(newsId);
    
    if (!newsItem) {
      return res.status(404).json({ message: 'News item not found' });
    }
    
    // Increment view count
    newsItem.viewCount += 1;
    
    // Save the updated news item
    await newsItem.save();
    
    res.json({ success: true, viewCount: newsItem.viewCount });
  } catch (error) {
    console.error('Error incrementing news views:', error);
    res.status(500).json({ message: 'Error updating news view count' });
  }
});

// @desc    Upload image for news
// @route   POST /api/admin/news/upload-image
// @access  Private/Admin
const uploadNewsImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const originalExtension = path.extname(req.file.originalname);
    const filename = `news_${timestamp}${originalExtension}`;
    
    // Define target path
    const uploadPath = path.join(__dirname, '../uploads/news');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    // Get the source path of the uploaded file (from multer diskStorage)
    const sourcePath = req.file.path;
    
    // Define the destination path
    const destinationPath = path.join(uploadPath, filename);
    
    // Copy the file from the temporary location to our news directory
    fs.copyFileSync(sourcePath, destinationPath);
    
    // Generate URL for the file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/api/admin/files/news/${filename}`;
    
    res.status(201).json({
      message: 'Image uploaded successfully',
      filename,
      fileUrl
    });
  } catch (error) {
    console.error('Error uploading news image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// @desc    Get news image file
// @route   GET /api/admin/files/news/:filename
// @access  Public
const getNewsImage = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/news', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error getting news image:', error);
    res.status(500).json({ message: 'Error retrieving image' });
  }
});

// @desc    Get analytics data for students
// @route   GET /api/admin/analytics/students
// @access  Private/Admin
const getStudentAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get total students
    const totalStudents = await User.countDocuments();
    
    // Get active students (those who have logged in within the last week)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const activeStudents = await User.countDocuments({
      lastLogin: { $gte: lastWeek }
    });
    
    // Get percentage change in students (compared to a month ago)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const studentsLastMonth = await User.countDocuments({
      createdAt: { $lte: lastMonth }
    });
    
    let percentChange = 0;
    if (studentsLastMonth > 0) {
      percentChange = Math.round(((totalStudents - studentsLastMonth) / studentsLastMonth) * 100);
    } else if (totalStudents > 0) {
      percentChange = 100; // If no students last month, but we have students now
    }
    
    res.json({
      totalStudents,
      activeStudents,
      percentChange,
      previousCount: studentsLastMonth
    });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({ message: 'Failed to fetch student analytics' });
  }
});

// @desc    Get analytics data for buildings
// @route   GET /api/admin/analytics/buildings
// @access  Private/Admin
const getBuildingAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get total buildings
    const totalBuildings = await Building.countDocuments();
    
    // Get percentage change in buildings (compared to a month ago)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const buildingsLastMonth = await Building.countDocuments({
      createdAt: { $lte: lastMonth }
    });
    
    let percentChange = 0;
    if (buildingsLastMonth > 0) {
      percentChange = Math.round(((totalBuildings - buildingsLastMonth) / buildingsLastMonth) * 100);
    } else if (totalBuildings > 0) {
      percentChange = 100; // If no buildings last month, but we have buildings now
    }
    
    res.json({
      totalBuildings,
      percentChange
    });
  } catch (error) {
    console.error('Error fetching building analytics:', error);
    res.status(500).json({ message: 'Failed to fetch building analytics' });
  }
});

// @desc    Get analytics data for room occupancy
// @route   GET /api/admin/analytics/occupancy
// @access  Private/Admin
const getOccupancyAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get total rooms
    const totalRooms = await Room.countDocuments();
    
    // Get occupied rooms
    const occupiedRooms = await Room.countDocuments({ 
      status: 'Occupied'
    });
    
    // Calculate current occupancy rate
    const currentRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    
    // Get occupancy rate from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // For simplicity, we'll use a fake previous rate for now
    // In a real implementation, this would require historical data
    const previousRate = currentRate > 0 ? currentRate - (Math.random() * 10) : 0;
    
    res.json({
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms,
      currentRate,
      previousRate
    });
  } catch (error) {
    console.error('Error fetching occupancy analytics:', error);
    res.status(500).json({ message: 'Failed to fetch occupancy analytics' });
  }
});

// @desc    Get analytics data for forms
// @route   GET /api/admin/analytics/forms
// @access  Private/Admin
const getFormAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get total forms
    const total = await Form.countDocuments();
    
    // Get pending forms
    const pending = await Form.countDocuments({ 
      status: 'Pending'
    });
    
    // Get completed forms
    const completed = await Form.countDocuments({
      status: 'Approved'
    });
    
    // Get percentage change in forms (compared to a month ago)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const formsLastMonth = await Form.countDocuments({
      createdAt: { $lte: lastMonth }
    });
    
    let percentChange = 0;
    if (formsLastMonth > 0) {
      percentChange = Math.round(((total - formsLastMonth) / formsLastMonth) * 100);
    } else if (total > 0) {
      percentChange = 100; // If no forms last month, but we have forms now
    }
    
    res.json({
      total,
      pending,
      completed,
      percentChange
    });
  } catch (error) {
    console.error('Error fetching form analytics:', error);
    res.status(500).json({ message: 'Failed to fetch form analytics' });
  }
});

// @desc    Get analytics data for offenses
// @route   GET /api/admin/analytics/offenses
// @access  Private/Admin
const getOffenseAnalytics = asyncHandler(async (req, res) => {
  try {
    const thisMonth = new Date();
    thisMonth.setDate(1); // First day of current month
    thisMonth.setHours(0, 0, 0, 0);
    
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Get total offenses for current month
    const total = await Offense.countDocuments({
      dateOfOffense: { $gte: thisMonth }
    });
    
    // Get total offenses for last month
    const lastMonthCount = await Offense.countDocuments({
      dateOfOffense: { 
        $gte: lastMonth,
        $lt: thisMonth
      }
    });
    
    // Calculate percent change
    let percentChange = 0;
    if (lastMonthCount > 0) {
      percentChange = Math.round(((total - lastMonthCount) / lastMonthCount) * 100);
    } else if (total > 0) {
      percentChange = 100;
    }
    
    res.json({
      total,
      lastMonth: lastMonthCount,
      percentChange
    });
  } catch (error) {
    console.error('Error fetching offense analytics:', error);
    res.status(500).json({ message: 'Failed to fetch offense analytics' });
  }
});

// @desc    Get analytics data for check-ins/check-outs
// @route   GET /api/admin/analytics/checkins
// @access  Private/Admin
const getCheckinAnalytics = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get check-in count
    const checkIn = await Log.countDocuments({
      date: { $gte: today },
      'entries.status': 'CheckIn'
    });
    
    // Get check-out count
    const checkOut = await Log.countDocuments({
      date: { $gte: today },
      'entries.status': 'CheckOut'
    });
    
    res.json({
      checkIn,
      checkOut,
      total: checkIn + checkOut
    });
  } catch (error) {
    console.error('Error fetching check-in analytics:', error);
    res.status(500).json({ message: 'Failed to fetch check-in analytics' });
  }
});

// @desc    Get recent activity data
// @route   GET /api/admin/analytics/recent-activity
// @access  Private/Admin
const getRecentActivity = asyncHandler(async (req, res) => {
  try {
    // Get recent check-ins
    const checkIns = await Log.aggregate([
      // Unwind the entries array
      { $unwind: '$entries' },
      // Match entries with CheckIn status from the last 24 hours
      {
        $match: {
          'entries.status': 'CheckIn',
          'entries.timestamp': {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      },
      // Sort by timestamp (descending)
      { $sort: { 'entries.timestamp': -1 } },
      // Limit to 10 most recent
      { $limit: 10 },
      // Project the fields we need
      {
        $project: {
          _id: '$_id',
          studentId: '$student',
          studentName: '$studentName',
          checkInTime: '$entries.timestamp',
          status: { 
            $cond: {
              if: { $gt: ['$entries.lateMinutes', 0] },
              then: 'Late',
              else: 'OnTime'
            }
          }
        }
      }
    ]);
    
    // Get recent offenses
    const maintenanceRequests = await Offense.find()
      .sort({ dateOfOffense: -1 })
      .limit(10)
      .populate('student', 'name')
      .select('student offenseReason typeOfOffense dateOfOffense');
    
    const formattedOffenses = maintenanceRequests.map(offense => ({
      _id: offense._id,
      title: offense.offenseReason,
      student: offense.student ? offense.student.name : 'Unknown Student',
      type: offense.typeOfOffense,
      date: offense.dateOfOffense
    }));
    
    res.json({
      checkIns,
      maintenanceRequests: formattedOffenses
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
});

// @desc    Get all applicants
// @route   GET /api/admin/applicants
// @access  Private/Admin
const getApplicants = asyncHandler(async (req, res) => {
  try {
    // Get status from query params and split into array
    const statusFilter = req.query.status ? req.query.status.split(',') : ['Pending', 'Rejected'];

    const applicants = await User.find({ 
      approvalStatus: { $in: statusFilter },
      role: 'student'
    })
    .select('name email contactInfo studentDormNumber courseYear preferences approvalStatus emergencyContact height weight age address citizenshipStatus religion medicalHistory fatherName fatherContact motherName motherContact parentsAddress gender')
    .populate('room')
    .lean();

    res.json(applicants);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ 
      message: 'Error fetching applicants',
      error: error.message 
    });
  }
});

// @desc    Get buildings by type
// @route   GET /api/admin/buildings
// @access  Private/Admin
const getBuildings = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const query = type ? { type } : {};
  const buildings = await Building.find(query);
  res.json(buildings);
});

// @desc    Get available rooms by building and type
// @route   GET /api/admin/rooms
// @access  Private/Admin
const getRooms = asyncHandler(async (req, res) => {
  const { buildingId, type, status } = req.query;
  
  // Build query object
  const query = {
    building: buildingId,
    type,
    status: 'Available', // Only get available rooms
    $or: [
      { occupants: { $exists: false } },
      { occupants: { $size: 0 } },
      { 
        $and: [
          { type: 'Double' },
          { 'occupants.1': { $exists: false } } // For double rooms, allow if there's only one occupant
        ]
      }
    ]
  };
  
  const rooms = await Room.find(query)
    .populate('building')
    .lean();
    
  res.json(rooms);
});

// @desc    Approve applicant
// @route   POST /api/admin/applicants/:id/approve
// @access  Private/Admin
const approveApplicant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { buildingId, roomId, password } = req.body;

  const applicant = await User.findById(id);
  if (!applicant) {
    res.status(404);
    throw new Error('Applicant not found');
  }

  // Update applicant status and assign room
  // Let the model middleware handle password hashing
  applicant.approvalStatus = 'Approved';
  applicant.room = roomId;
  applicant.password = password; // The model's pre-save middleware will hash this
  await applicant.save();

  // Update room status and add occupant
  const room = await Room.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  room.occupants.push(applicant._id);
  await room.save();

  // Send approval email
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2E8B57;">Application Approved!</h2>
      <p>Dear ${applicant.name},</p>
      <p>We are pleased to inform you that your dormitory application has been approved!</p>
      <p>You can now log in to your account using the following credentials:</p>
      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p><strong>Email:</strong> ${applicant.email}</p>
        <p><strong>Password:</strong> Password123</p>
      </div>
      <p>Please change your password after your first login for security purposes.</p>
      <p>Welcome to our dormitory community!</p>
      <br>
      <p>Best regards,</p>
      <p>The Dormie Team</p>
    </div>
  `;

  await sendApplicationConfirmationEmail(applicant.email, applicant.name, emailHtml);

  res.json({ message: 'Applicant approved successfully' });
});

// @desc    Decline applicant
// @route   POST /api/admin/applicants/:id/decline
// @access  Private/Admin
const declineApplicant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const applicant = await User.findById(id);
  if (!applicant) {
    res.status(404);
    throw new Error('Applicant not found');
  }

  // Update applicant status
  applicant.approvalStatus = 'Declined';
  await applicant.save();

  // Send decline email
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DC3545;">Application Status Update</h2>
      <p>Dear ${applicant.name},</p>
      <p>We regret to inform you that your dormitory application has been declined.</p>
      <p><strong>Reason:</strong></p>
      <p style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">${reason}</p>
      <p>We understand this may be disappointing news. If you would like to discuss this decision or have any questions, please don't hesitate to contact us.</p>
      <p>We wish you the best in your future endeavors.</p>
      <br>
      <p>Best regards,</p>
      <p>The Dormie Team</p>
    </div>
  `;

  await sendApplicationConfirmationEmail(applicant.email, applicant.name, emailHtml);

  res.json({ message: 'Applicant declined successfully' });
});

// Update student status
const updateStudentStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { studentStatus } = req.body;

    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student status
    student.studentStatus = studentStatus;
    await student.save();

    // Create notification for the student
    await Notification.create({
      recipient: {
        id: student._id,
        model: 'User'
      },
      type: 'SYSTEM',
      title: 'Status Update',
      content: `Your student status has been updated to ${studentStatus}`,
      relatedTo: {
        model: 'User',
        id: student._id
      },
      metadata: {
        studentId: student._id,
        status: studentStatus,
        updatedAt: new Date()
      }
    });

    // If socket.io is available, emit real-time notification
    if (req.app && req.app.get('io')) {
      req.app.get('io').to(student._id.toString()).emit('statusUpdate', {
        type: 'studentStatus',
        status: studentStatus,
        message: `Your student status has been updated to ${studentStatus}`
      });
    }

    res.json({ 
      message: 'Student status updated successfully', 
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentStatus: student.studentStatus
      }
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    res.status(500).json({ 
      message: 'Error updating student status',
      error: error.message 
    });
  }
});

// Export all functions
module.exports = {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  startConversation,
  sendMessage,
  getConversations,
  getMessages,
  getAllStudents,
  updateStudentStatus, // Add this to exports
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getAllBuildings,
  createBuilding,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
  getRoomsByBuilding,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
  getStudentOffenses,
  createStudentOffense,
  getAllOffenses,
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getAllForms,
  getFormById,
  updateFormStatus,
  assignStaffToForm,
  createBill,
  getAllBills,
  getBillById,
  updateBillStatus,
  deleteBill,
  returnBillToStudent,
  getCurfews,
  getLatestCurfew,
  createCurfew,
  deleteLatestCurfew,
  updateCurfew,
  downloadFile,
  getLogs,
  excuseLateStatus,
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  toggleNewsPin,
  incrementNewsViews,
  uploadNewsImage,
  getNewsImage,
  getStudentAnalytics,
  getBuildingAnalytics,
  getOccupancyAnalytics,
  getFormAnalytics,
  getOffenseAnalytics,
  getCheckinAnalytics,
  getRecentActivity,
  getApplicants,
  getBuildings,
  getRooms,
  approveApplicant,
  declineApplicant
};