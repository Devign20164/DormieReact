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
const JobRequestForm = require('../models/requestFormModel');
const Staff = require('../models/staffModel');

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

    res.json({
      _id: admin._id,
      name: admin.name,
      role: 'admin',
    });
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
      type: 'message',
      title: 'New Message',
      content: `New message from ${req.user.name}`,
      relatedTo: {
        model: 'Message',
        id: message._id
      }
    });
    console.log('Notification created:', notification);

    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').to(recipient.id.toString()).emit('newMessage', {
        message,
        conversation: conversationId
      });
      console.log('Socket event emitted');
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
    const notifications = await Notification.find({
      'recipient.id': req.user._id,
      'recipient.model': 'Admin'
    })
    .sort({ createdAt: -1 })
    .limit(50);  // Limit to most recent 50 notifications

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
    await Notification.updateMany(
      {
        'recipient.id': req.user._id,
        'recipient.model': 'Admin',
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
};

// Get unread notification count
const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      'recipient.id': req.user._id,
      'recipient.model': 'Admin',
      isRead: false
    });

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
    console.log('Deleting notifications for user:', req.user._id);
    
    if (!req.user._id) {
      console.log('User ID missing in request');
      return res.status(400).json({ 
        message: 'User ID is required'
      });
    }

    const result = await Notification.deleteMany({
      'recipient.id': req.user._id,
      'recipient.model': 'Admin'
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

// @desc    Get all forms
// @route   GET /api/admin/forms
// @access  Private/Admin
const getAllForms = asyncHandler(async (req, res) => {
  try {
    const forms = await JobRequestForm.find()
      .sort({ submissionDate: -1 })
      .populate('user', 'name studentDormNumber')
      .populate('room', 'roomNumber')
      .populate('building', 'name')
      .populate('staff', 'name')
      .select('requestType description status submissionDate scheduledDate actualStartTime actualEndTime filePath userName studentDormNumber roomNumber buildingName');

    console.log('Forms data from backend:', forms.map(form => ({
      id: form._id,
      actualStartTime: form.actualStartTime,
      scheduledDate: form.scheduledDate
    })));

    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ 
      message: 'Error fetching forms',
      error: error.message 
    });
  }
});

// @desc    Update form status
// @route   PUT /api/admin/forms/:formId/status
// @access  Private/Admin
const updateFormStatus = asyncHandler(async (req, res) => {
  try {
    const { formId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Approved', 'Declined', 'Completed', 'In Progress'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const form = await JobRequestForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Update form status
    form.status = status;
    await form.save();

    // Populate the updated form
    const updatedForm = await JobRequestForm.findById(formId)
      .populate('user', 'name studentDormNumber')
      .populate('room', 'roomNumber')
      .populate('building', 'name')
      .populate('staff', 'name')
      .select('requestType description status submissionDate scheduledDate actualStartTime actualEndTime filePath userName studentDormNumber roomNumber buildingName');

    try {
      // If form is approved, create a notification for the student
      if (status === 'Approved') {
        await Notification.create({
          recipient: {
            id: form.user,
            model: 'User'
          },
          type: 'FORM_APPROVED',
          title: 'Form Approved',
          content: `Your ${form.requestType} request has been approved.`,
          relatedTo: {
            model: 'JobRequestForm',
            id: form._id
          }
        });
      }

      // If form is declined, create a notification for the student
      if (status === 'Declined') {
        await Notification.create({
          recipient: {
            id: form.user,
            model: 'User'
          },
          type: 'FORM_DECLINED',
          title: 'Form Declined',
          content: `Your ${form.requestType} request has been declined.`,
          relatedTo: {
            model: 'JobRequestForm',
            id: form._id
          }
        });
      }

      // Emit socket events
      if (req.app.get('io')) {
        const io = req.app.get('io');
        console.log('Emitting socket events...');
        
        // Emit formAssigned event to all clients
        io.emit('formAssigned', {
          formId: form._id,
          staffId: form.staff,
          status: 'Assigned',
          updatedForm: updatedForm
        });
        
        // Emit a direct formStatusUpdate event to the student who created the form
        if (form.user) {
          io.to(form.user.toString()).emit('formStatusUpdate', {
            formId: form._id,
            status: 'Assigned',
            type: form.requestType,
            staffName: staff.name
          });
        }
        
        // Emit notification events
        if (form.user) {
          io.to(form.user.toString()).emit('newNotification', studentNotification);
        }
        io.to(form.staff.toString()).emit('newNotification', staffNotification);
        console.log('Socket events emitted');
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue execution even if notification creation fails
    }

    res.json({
      message: 'Form status updated successfully',
      form: updatedForm
    });
  } catch (error) {
    console.error('Error updating form status:', error);
    res.status(500).json({ 
      message: 'Error updating form status',
      error: error.message 
    });
  }
});

// @desc    Get form details
// @route   GET /api/admin/forms/:formId
// @access  Private/Admin
const getFormDetails = asyncHandler(async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await JobRequestForm.findById(formId)
      .populate('user', 'name studentDormNumber')
      .populate('room', 'roomNumber')
      .populate('building', 'name')
      .populate('staff', 'name')
      .select('requestType description status submissionDate scheduledDate actualStartTime actualEndTime filePath userName studentDormNumber roomNumber buildingName');

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

// @desc    Delete form
// @route   DELETE /api/admin/forms/:formId
// @access  Private/Admin
const deleteForm = asyncHandler(async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await JobRequestForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    await form.remove();

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ 
      message: 'Error deleting form',
      error: error.message 
    });
  }
});

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
    const { name, typeOfStaff } = req.body;

    // Check if staff with the same name already exists
    const staffExists = await Staff.findOne({ name });
    if (staffExists) {
      return res.status(400).json({ message: 'Staff member with this name already exists' });
    }

    const newStaff = await Staff.create({
      name,
      typeOfStaff,
      password: 'staffPassword', // Explicitly set password to trigger the pre-save middleware
      status: 'Available'
    });

    // Return created staff without password
    const staffResponse = {
      _id: newStaff._id,
      name: newStaff.name,
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

// @desc    Assign staff to a form
// @route   POST /api/admin/forms/:formId/assign
// @access  Private/Admin
const assignStaffToForm = asyncHandler(async (req, res) => {
  try {
    console.log('Starting assignStaffToForm function');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    // Verify that models are available
    console.log('JobRequestForm model available:', !!JobRequestForm);
    console.log('Staff model available:', !!Staff);
    console.log('Notification model available:', !!Notification);
    
    const { formId } = req.params;
    const { staffId } = req.body;

    console.log('Form ID:', formId);
    console.log('Staff ID:', staffId);

    // Validate inputs
    if (!formId || !staffId) {
      return res.status(400).json({ message: 'Form ID and Staff ID are required' });
    }

    try {
      // Find the form - use a direct approach
      const form = await JobRequestForm.findById(formId);
      console.log('Form found:', !!form);
      
      if (!form) {
        return res.status(404).json({ message: 'Form not found' });
      }

      // Find the staff member
      const staff = await Staff.findById(staffId);
      console.log('Staff found:', !!staff);
      
      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      // Improved mapping of staff types to request types (more comprehensive)
      const staffTypeToRequestType = {
        'Cleaner': ['cleaning', 'clean'],
        'Maintenance': ['maintenance', 'repair', 'fix', 'installation'], 
        'Security': ['security', 'safety', 'guard']
      };

      console.log('Staff type:', staff.typeOfStaff);
      console.log('Request type:', form.requestType);
      
      // Convert to lowercase for case-insensitive comparison
      const staffTypeLower = staff.typeOfStaff ? staff.typeOfStaff.trim() : '';
      const requestTypeLower = form.requestType ? form.requestType.toLowerCase().trim() : '';
      
      console.log('Normalized staff type:', staffTypeLower);
      console.log('Normalized request type:', requestTypeLower);
      
      // Get valid request types for this staff type
      const validRequestTypes = staffTypeToRequestType[staffTypeLower] || [];
      console.log('Valid request types for this staff:', validRequestTypes);
      
      // Check if this staff can handle this request
      let canHandleRequest = false;
      
      // Check exact match first
      if (validRequestTypes.includes(requestTypeLower)) {
        canHandleRequest = true;
      } else {
        // If no exact match, check if any valid request type is a substring of the request type
        // or if the request type is a substring of any valid request type
        canHandleRequest = validRequestTypes.some(validType => 
          requestTypeLower.includes(validType) || validType.includes(requestTypeLower)
        );
      }
      
      console.log('Can handle request:', canHandleRequest);

      if (!canHandleRequest) {
        return res.status(400).json({ 
          message: `This staff member (${staff.typeOfStaff}) cannot handle ${form.requestType} requests` 
        });
      }

      // Update form with staff assignment directly using findByIdAndUpdate
      console.log('Updating form...');
      const updatedFormData = await JobRequestForm.findByIdAndUpdate(
        formId,
        { 
          staff: staffId,
          status: 'Assigned'
        },
        { new: true }
      );
      console.log('Form updated successfully:', !!updatedFormData);

      // Add the form to staff's assigned forms
      console.log('Updating staff...');
      if (!staff.assignedForms.includes(formId)) {
        staff.assignedForms.push(formId);
        
        // Update staff status to 'Occupied' if needed
        if (staff.status === 'Available') {
          staff.status = 'Occupied';
        }
        await staff.save();
        console.log('Staff updated successfully');
      }

      // Create notifications and populate the response
      console.log('Creating notifications...');
      
      // Create notification for the student manually
      const studentNotification = await Notification.create({
        recipient: {
          id: form.user,
          model: 'User'
        },
        type: 'FORM_ASSIGNED',
        title: 'Request Assigned',
        content: `Your ${form.requestType} request has been assigned to ${staff.name}.`,
        relatedTo: {
          model: 'JobRequestForm',
          id: form._id
        }
      });
      console.log('Student notification created:', !!studentNotification);

      // Create notification for the staff member
      const staffNotification = await Notification.create({
        recipient: {
          id: staff._id,
          model: 'Staff'
        },
        type: 'NEW_ASSIGNMENT',
        title: 'New Assignment',
        content: `You've been assigned to a ${form.requestType} request in room ${form.roomNumber}.`,
        relatedTo: {
          model: 'JobRequestForm',
          id: form._id
        }
      });
      console.log('Staff notification created:', !!staffNotification);

      // Populate the updated form for response
      console.log('Populating updated form...');
      const updatedForm = await JobRequestForm.findById(formId)
        .populate('user', 'name studentDormNumber')
        .populate('room', 'roomNumber')
        .populate('building', 'name')
        .populate('staff', 'name typeOfStaff')
        .select('requestType description status submissionDate scheduledDate actualStartTime actualEndTime filePath userName studentDormNumber roomNumber buildingName staff');
      console.log('Updated form populated:', !!updatedForm);

      // Emit socket events
      if (req.app.get('io')) {
        const io = req.app.get('io');
        console.log('Emitting socket events...');
        
        // Emit formAssigned event to all clients
        io.emit('formAssigned', {
          formId: form._id,
          staffId: staff._id,
          status: 'Assigned',
          updatedForm: updatedForm
        });
        
        // Emit a direct formStatusUpdate event to the student who created the form
        if (form.user) {
          io.to(form.user.toString()).emit('formStatusUpdate', {
            formId: form._id,
            status: 'Assigned',
            type: form.requestType,
            staffName: staff.name
          });
        }
        
        // Emit notification events
        if (form.user) {
          io.to(form.user.toString()).emit('newNotification', studentNotification);
        }
        io.to(staff._id.toString()).emit('newNotification', staffNotification);
        console.log('Socket events emitted');
      }

      console.log('Sending success response...');
      res.json({
        message: 'Staff assigned to form successfully',
        form: updatedForm
      });
      console.log('Response sent successfully');
    } catch (innerError) {
      console.error('Inner error details:', innerError);
      console.error('Inner error stack:', innerError.stack);
      throw new Error(`Failed to update form or staff: ${innerError.message}`);
    }
  } catch (error) {
    console.error('Error assigning staff to form:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error assigning staff to form',
      error: error.message 
    });
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
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  deleteNotification,
  deleteAllNotifications,
  getAllBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getBuildingById,
  getRoomsByBuilding,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
  getStudentOffenses,
  createStudentOffense,
  getAllForms,
  updateFormStatus,
  getFormDetails,
  deleteForm,
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  assignStaffToForm
}; 