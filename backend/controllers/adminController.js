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
const path = require('path');
const fs = require('fs');

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
    const { roomNumber, type, price } = req.body;

    // Validate required fields
    if (!roomNumber || !type || !price) {
      return res.status(400).json({ message: 'Room number, type, and price are required' });
    }

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
      type: 'FORM_STATUS_CHANGED',
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
        type: 'FORM_STATUS_CHANGED',
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
        model: 'Form',
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

module.exports = {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  startConversation,
  sendMessage,
  getConversations,
  getMessages,
  getAllStudents,
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
  downloadFile
}; 