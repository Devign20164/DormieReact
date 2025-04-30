const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const config = require('../config/config');
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const Notification = require('../models/notificationModel');
const Admin = require('../models/adminModel');
const fs = require('fs');
const path = require('path');
const Bill = require('../models/billModel');
const Log = require('../models/logModel');
const axios = require('axios');
const Curfew = require('../models/CurfewModel');
const News = require('../models/NewsModel');

// Helper to format date/time for messages
const formatDate = (date) => new Date(date).toLocaleString();

// @desc    Auth student & get token
// @route   POST /api/students/login
// @access  Public
const loginStudent = asyncHandler(async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('Login attempt for student:', identifier);

    // Find student by email
    const student = await Student.findOne({ email: identifier })
      .populate({
        path: 'room',
        populate: {
          path: 'building',
          select: 'name'
        }
      });
    console.log('Student found:', student ? 'Yes' : 'No');

    if (!student) {
      console.log('Student not found with email:', identifier);
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');

    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: student._id,
        role: 'student',
        name: student.name,
        email: student.email,
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
      _id: student._id,
      name: student.name,
      email: student.email,
      studentDormNumber: student.studentDormNumber,
      fatherContact: student.fatherContact,
      motherContact: student.motherContact,
      room: student.room ? {
        roomNumber: student.room.roomNumber,
        building: student.room.building?.name || 'Unassigned'
      } : null,
      role: 'student'
    };

    // Return student data along with socket initialization data
    res.json({
      ...responseData,
      socketInitRequired: true,
      socketUserId: student._id.toString()
    });

    console.log('Student login successful:', student.name);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error logging in'
    });
  }
});

// @desc    Logout student
// @route   POST /api/students/logout
// @access  Private
const logoutStudent = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private
const getStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.id)
    .select('-password')
    .populate({
      path: 'room',
      populate: {
        path: 'building',
        select: 'name'
      }
    });

  if (student) {
    res.json({
      _id: student._id,
      name: student.name,
      email: student.email,
      studentDormNumber: student.studentDormNumber,
      fatherContact: student.fatherContact,
      motherContact: student.motherContact,
      room: student.room ? {
        roomNumber: student.room.roomNumber,
        building: student.room.building?.name || 'Unassigned'
      } : null,
      role: 'student'
    });
  } else {
    res.status(404);
    throw new Error('Student not found');
  }
});

// Add these new controller functions
const checkEmailExists = async (req, res) => {
  try {
    const email = req.params.email;
    const student = await Student.findOne({ email: email.toLowerCase() });
    res.json({ exists: !!student });
  } catch (error) {
    res.status(500).json({ message: 'Error checking email', error: error.message });
  }
};

const checkDormNumberExists = async (req, res) => {
  try {
    const dormNumber = req.params.dormNumber;
    const student = await Student.findOne({ studentDormNumber: dormNumber });
    res.json({ exists: !!student });
  } catch (error) {
    res.status(500).json({ message: 'Error checking dorm number', error: error.message });
  }
};

const checkPhoneExists = async (req, res) => {
  try {
    const phone = req.params.phone;
    const student = await Student.findOne({ 
      $or: [
        { contactInfo: phone },
        { fatherContact: phone },
        { motherContact: phone }
      ]
    });
    res.json({ exists: !!student });
  } catch (error) {
    res.status(500).json({ message: 'Error checking phone number', error: error.message });
  }
};

// Add a new controller to verify student password
const verifyStudentPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const student = await Student.findById(req.params.id).select('password name studentDormNumber');
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  const isMatch = await bcrypt.compare(password, student.password);
  if (isMatch) {
    res.json({ 
      verified: true, 
      name: student.name,
      studentDormNumber: student.studentDormNumber
    });
  } else {
    res.status(401).json({ verified: false, message: 'Invalid password' });
  }
});

// @desc    Create a new student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      contactInfo,
      studentDormNumber,
      courseYear,
      address,
      gender,
      fatherName,
      fatherContact,
      motherName,
      motherContact,
      parentsAddress,
      password,
      building,
      room
    } = req.body;

    // Check if student already exists
    const studentExists = await Student.findOne({ email: email.toLowerCase() });
    if (studentExists) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    // Check if student ID is already taken
    const idExists = await Student.findOne({ studentDormNumber });
    if (idExists) {
      return res.status(400).json({ message: 'Student ID is already assigned' });
    }

    // Check if phone number is taken
    const phoneExists = await Student.findOne({
      $or: [
        { contactInfo },
        { fatherContact: contactInfo },
        { motherContact: contactInfo }
      ]
    });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number is already registered' });
    }

    // Check if room exists and is available
    if (room) {
      const Room = require('../models/roomModel');
      const selectedRoom = await Room.findById(room);
      
      if (!selectedRoom) {
        return res.status(400).json({ message: 'Selected room does not exist' });
      }

      // Check if room belongs to the selected building
      if (building && selectedRoom.building.toString() !== building) {
        return res.status(400).json({ message: 'Room does not belong to the selected building' });
      }

      // Check if room has capacity
      if (selectedRoom.isFullyOccupied) {
        return res.status(400).json({ message: 'Selected room is already fully occupied' });
      }

      // Check if room gender matches student gender
      const Building = require('../models/buildingModel');
      const selectedBuilding = await Building.findById(selectedRoom.building);
      
      if (selectedBuilding && selectedBuilding.type !== gender) {
        return res.status(400).json({ 
          message: `This room is in a ${selectedBuilding.type} building and cannot be assigned to a ${gender} student` 
        });
      }
    }

    // Create student with default password if none provided
    const student = await Student.create({
      name,
      email: email.toLowerCase(),
      contactInfo,
      studentDormNumber,
      courseYear,
      address,
      gender,
      fatherName,
      fatherContact,
      motherName,
      motherContact,
      parentsAddress,
      password: password || 'Password123',  // Let the model middleware handle hashing
      room: room || null, // Set room reference if provided
    });

    // Update the room's occupants list if room was assigned
    if (room && student) {
      const Room = require('../models/roomModel');
      
      // Add student to room's occupants list
      const updatedRoom = await Room.findByIdAndUpdate(
        room,
        { $push: { occupants: student._id } },
        { new: true }
      ).populate('occupants');
      
      // Check if room is now fully occupied and update status
      const maxOccupants = updatedRoom.type === 'Single' ? 1 : 2;
      if (updatedRoom.occupants.length >= maxOccupants) {
        updatedRoom.status = 'Occupied';
        await updatedRoom.save();
      }
    }

    if (student) {
      res.status(201).json({
        _id: student._id,
        name: student.name,
        email: student.email,
        studentDormNumber: student.studentDormNumber,
        courseYear: student.courseYear,
        room: student.room
      });
    } else {
      res.status(400).json({ message: 'Invalid student data' });
    }
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ 
      message: 'Error creating student',
      error: error.message 
    });
  }
});

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
const getAllStudents = asyncHandler(async (req, res) => {
  try {
    const students = await Student.find({})
      .select('-password')
      .populate({ path: 'room', populate: { path: 'building' } });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      message: 'Error fetching students',
      error: error.message 
    });
  }
});

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      contactInfo,
      studentDormNumber,
      courseYear,
      address,
      gender,
      fatherName,
      fatherContact,
      motherName,
      motherContact,
      parentsAddress,
      room
    } = req.body;

    // Find student by ID
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email.toLowerCase() !== student.email) {
      const emailExists = await Student.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Check if dorm number is being changed and if it's already taken
    if (studentDormNumber && studentDormNumber !== student.studentDormNumber) {
      const dormExists = await Student.findOne({ 
        studentDormNumber,
        _id: { $ne: req.params.id } 
      });
      if (dormExists) {
        return res.status(400).json({ message: 'Dorm number is already assigned' });
      }
    }

    // Check if phone number is being changed and if it's already taken
    if (contactInfo && contactInfo !== student.contactInfo) {
      const phoneExists = await Student.findOne({
        $or: [
          { contactInfo },
          { fatherContact: contactInfo },
          { motherContact: contactInfo }
        ],
        _id: { $ne: req.params.id }
      });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number is already registered' });
      }
    }

    // Handle room change if specified
    if (room && (!student.room || room !== student.room.toString())) {
      const Room = require('../models/roomModel');
      
      // Check if new room exists and has capacity
      const newRoom = await Room.findById(room);
      if (!newRoom) {
        return res.status(400).json({ message: 'Selected room does not exist' });
      }

      if (newRoom.isFullyOccupied) {
        return res.status(400).json({ message: 'Selected room is already fully occupied' });
      }

      // Check if room gender matches student gender
      const Building = require('../models/buildingModel');
      const selectedBuilding = await Building.findById(newRoom.building);
      
      const studentGender = gender || student.gender;
      if (selectedBuilding && selectedBuilding.type !== studentGender) {
        return res.status(400).json({ 
          message: `This room is in a ${selectedBuilding.type} building and cannot be assigned to a ${studentGender} student` 
        });
      }

      // If student was previously assigned to a room, remove from old room
      if (student.room) {
        await Room.findByIdAndUpdate(student.room, {
          $pull: { occupants: student._id }
        });
      }

      // Add student to new room
      const updatedRoom = await Room.findByIdAndUpdate(
        room,
        { $push: { occupants: student._id } },
        { new: true }
      ).populate('occupants');

      // Check if room is now fully occupied and update status
      const maxOccupants = updatedRoom.type === 'Single' ? 1 : 2;
      if (updatedRoom.occupants.length >= maxOccupants) {
        updatedRoom.status = 'Occupied';
        await updatedRoom.save();
      } else {
        updatedRoom.status = 'Available';
        await updatedRoom.save();
      }
    }

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name: name || student.name,
        email: email ? email.toLowerCase() : student.email,
        contactInfo: contactInfo || student.contactInfo,
        studentDormNumber: studentDormNumber || student.studentDormNumber,
        courseYear: courseYear || student.courseYear,
        address: address || student.address,
        gender: gender || student.gender,
        fatherName: fatherName || student.fatherName,
        fatherContact: fatherContact || student.fatherContact,
        motherName: motherName || student.motherName,
        motherContact: motherContact || student.motherContact,
        parentsAddress: parentsAddress || student.parentsAddress,
        room: room || student.room
      },
      { new: true }
    ).select('-password');

    if (updatedStudent) {
      res.json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ 
      message: 'Error updating student',
      error: error.message 
    });
  }
});

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // If student is assigned to a room, remove them from the room's occupants
    if (student.room) {
      const Room = require('../models/roomModel');
      const updatedRoom = await Room.findByIdAndUpdate(
        student.room,
        { $pull: { occupants: student._id } },
        { new: true }
      );
      
      // Update room status to Available if there are no more occupants
      if (updatedRoom.occupants.length === 0) {
        updatedRoom.status = 'Available';
        await updatedRoom.save();
      } else {
        // If room was fully occupied and now has space, update status
        const maxOccupants = updatedRoom.type === 'Single' ? 1 : 2;
        if (updatedRoom.occupants.length < maxOccupants) {
          updatedRoom.status = 'Available';
          await updatedRoom.save();
        }
      }
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ 
      message: 'Error deleting student',
      error: error.message 
    });
  }
});

// @desc    Start or get a conversation with an admin
// @route   POST /api/students/conversations
// @access  Private/Student
const startConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body;
  
  try {
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants': {
        $all: [
          { $elemMatch: { id: req.user.id, model: 'User' } },
          { $elemMatch: { id: participantId } }
        ]
      }
    });

    if (!conversation) {
      // Find the participant (either admin or student)
      let participant;
      let participantModel;
      
      // Try to find admin first
      participant = await Admin.findById(participantId);
      if (participant) {
        participantModel = 'Admin';
      } else {
        // If not admin, try to find student
        participant = await Student.findById(participantId);
        participantModel = 'User';
      }

      if (!participant) {
        return res.status(404).json({ message: 'Participant not found' });
      }

      // Create new conversation
      conversation = await Conversation.create({
        participants: [
          { id: req.user.id, model: 'User', name: req.user.name },
          { id: participantId, model: participantModel, name: participant.name }
        ],
        subject: 'New Conversation'
      });

      // Update both users' conversation lists
      await Student.findByIdAndUpdate(req.user.id, {
        $push: { conversations: conversation._id }
      });

      if (participantModel === 'Admin') {
        await Admin.findByIdAndUpdate(participantId, {
          $push: { conversations: conversation._id }
        });
      } else {
        await Student.findByIdAndUpdate(participantId, {
          $push: { conversations: conversation._id }
        });
      }
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ message: 'Error starting conversation', error: error.message });
  }
});

// @desc    Send a message
// @route   POST /api/students/messages
// @access  Private/Student
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, content, attachments } = req.body;
  
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Find recipient from conversation participants
    const recipient = conversation.participants.find(
      p => p.id.toString() !== req.user.id.toString()
    );

    if (!recipient) {
      return res.status(400).json({ message: 'Recipient not found in conversation' });
    }

    // Create the message
    const message = await Message.create({
      sender: {
        id: req.user.id,
        model: 'User',
        name: req.user.name
      },
      recipient: {
        id: recipient.id,
        model: recipient.model,
        name: recipient.name
      },
      content,
      attachments: attachments || [],
      conversation: conversationId
    });

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Update recipient's unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      $inc: { [`unreadCount.${recipient.id}`]: 1 }
    });

    // Create notification for recipient
    const notification = await Notification.create({
      recipient: {
        id: recipient.id,
        model: recipient.model
      },
      type: 'MESSAGE',
      title: `New message from ${req.user.name}`,
      content: content.length > 30 ? content.substring(0, 30) + '...' : content,
      relatedTo: {
        model: 'Conversation',
        id: conversation._id
      }
    });
    console.log('Notification created:', notification._id);

    // Get the populated message to send in response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name')
      .populate('recipient', 'name');

    // Try-catch block for socket emission to prevent errors from breaking the response
    try {
      if (req.app.get('io')) {
        // Send the message event for the chat interface
        req.app.get('io').to(recipient.id.toString()).emit('newMessage', {
          message: populatedMessage,
          conversation: conversationId
        });
        
        // Add debug information
        console.log(`Student sending notification for message ${message._id} to ${recipient.id}`);
        
        // Use the emitNotification helper function for notification
        const emitNotification = req.app.get('emitNotification');
        if (emitNotification) {
          // Prevent potential duplicates by ensuring this notification hasn't been sent before
          notification._studentSentAt = new Date().toISOString();
          
          // Use the emitNotification helper, which will handle the emitting
          emitNotification(notification);
          console.log(`Student used emitNotification helper for message ${message._id}`);
        } else {
          console.log('emitNotification function not available');
        }
      }
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
      // Don't throw the error, just log it
    }

    // Send the populated message in response
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      message: 'Error sending message', 
      error: error.message 
    });
  }
});

// @desc    Get student's conversations
// @route   GET /api/students/conversations
// @access  Private/Student
const getConversations = asyncHandler(async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants': {
        $elemMatch: { id: req.user.id, model: 'User' }
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
// @route   GET /api/students/conversations/:conversationId/messages
// @access  Private/Student
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

// @desc    Get all admins
// @route   GET /api/students/admins
// @access  Private/Student
const getAdmins = asyncHandler(async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-password');
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ 
      message: 'Error fetching admins',
      error: error.message 
    });
  }
});

// @desc    Get other students
// @route   GET /api/students/others
// @access  Private/Student
const getOtherStudents = asyncHandler(async (req, res) => {
  try {
    // Find all students except the current user
    const students = await Student.find({ _id: { $ne: req.user.id } }).select('-password');
    res.json(students);
  } catch (error) {
    console.error('Error fetching other students:', error);
    res.status(500).json({ 
      message: 'Error fetching other students',
      error: error.message 
    });
  }
});

// Get all notifications for a student
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      'recipient.id': req.user._id,
      'recipient.model': 'User'
    })
    .sort({ createdAt: -1 })
    .limit(50);  // Limit to most recent 50 notifications

    // If socket.io is available, update the client's notification status
    if (req.app.get('io')) {
      const userSocketId = req.app.get('connectedUsers').get(req.user._id.toString());
      
      if (userSocketId) {
        // Emit event to client with notification refresh timestamp
        req.app.get('io').to(userSocketId).emit('notificationsRefreshed', {
          count: notifications.length,
          timestamp: new Date().toISOString()
        });
      }
    }

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
        _id: req.params.id,
        'recipient.id': req.user._id,
        'recipient.model': 'User'
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // If socket.io is available, emit the updated notification status
    if (req.app.get('io')) {
      try {
        const connectedUsers = req.app.get('connectedUsers');
        let userSocketId = null;
        
        // Safely get socket ID if connectedUsers exists and has a valid get method
        if (connectedUsers && typeof connectedUsers.get === 'function') {
          userSocketId = connectedUsers.get(req.user._id.toString());
        }
        
        // Emit to the user's socket to update their UI
        if (userSocketId) {
          req.app.get('io').to(userSocketId).emit('notificationRead', {
            notificationId: notification._id,
            updatedAt: new Date().toISOString()
          });
        }
        
        // Also broadcast to all admin sockets for their dashboard updates
        req.app.get('io').emit('notificationUpdate', {
          type: 'read',
          notificationId: notification._id,
          userId: req.user._id,
          updatedAt: new Date().toISOString()
        });
      } catch (socketError) {
        // Log but don't fail if socket emission has an error
        console.error('Error emitting socket events:', socketError);
      }
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
    // Find all unread notifications first to get their IDs
    const unreadNotifications = await Notification.find({
      'recipient.id': req.user._id,
      'recipient.model': 'User',
      isRead: false
    }).select('_id');
    
    const unreadIds = unreadNotifications.map(n => n._id);
    
    // Update them all to read
    await Notification.updateMany(
      {
        'recipient.id': req.user._id,
        'recipient.model': 'User',
        isRead: false
      },
      { isRead: true }
    );

    // If socket.io is available, emit the mass read status update
    if (req.app.get('io') && unreadIds.length > 0) {
      try {
        const connectedUsers = req.app.get('connectedUsers');
        let userSocketId = null;
        
        // Safely get socket ID if connectedUsers exists and has a valid get method
        if (connectedUsers && typeof connectedUsers.get === 'function') {
          userSocketId = connectedUsers.get(req.user._id.toString());
        }
        
        // Emit to the user's socket
        if (userSocketId) {
          req.app.get('io').to(userSocketId).emit('allNotificationsRead', {
            userId: req.user._id,
            count: unreadIds.length,
            updatedAt: new Date().toISOString()
          });
        }
        
        // Also broadcast to all clients for dashboard updates
        req.app.get('io').emit('notificationBulkUpdate', {
          type: 'readAll',
          userId: req.user._id,
          notificationIds: unreadIds,
          updatedAt: new Date().toISOString()
        });
      } catch (socketError) {
        // Log but don't fail if socket emission has an error
        console.error('Error emitting socket events:', socketError);
      }
    }

    res.json({ 
      message: 'All notifications marked as read',
      count: unreadIds.length
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
      'recipient.id': req.user._id,
      'recipient.model': 'User',
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
      _id: req.params.id,
      'recipient.id': req.user._id,
      'recipient.model': 'User'
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // If socket.io is available, emit the deleted notification status
    if (req.app.get('io')) {
      try {
        const connectedUsers = req.app.get('connectedUsers');
        let userSocketId = null;
        
        // Safely get socket ID if connectedUsers exists and has a valid get method
        if (connectedUsers && typeof connectedUsers.get === 'function') {
          userSocketId = connectedUsers.get(req.user._id.toString());
        }
        
        // Emit to the user's socket to update their UI
        if (userSocketId) {
          req.app.get('io').to(userSocketId).emit('notificationDeleted', {
            notificationId: notification._id,
            deletedAt: new Date().toISOString()
          });
        }
        
        // Also broadcast to all clients for dashboard updates
        req.app.get('io').emit('notificationUpdate', {
          type: 'delete',
          notificationId: notification._id,
          userId: req.user._id,
          deletedAt: new Date().toISOString()
        });
      } catch (socketError) {
        // Log but don't fail if socket emission has an error
        console.error('Error emitting socket events:', socketError);
      }
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Delete all notifications
const deleteAllNotifications = async (req, res) => {
  try {
    console.log('Attempting to delete notifications for user:', req.user._id);
    
    // First, find all notifications to get their IDs
    const notificationsToDelete = await Notification.find({
      'recipient.id': req.user._id,
      'recipient.model': 'User'
    }).select('_id');
    
    const deletedIds = notificationsToDelete.map(n => n._id);
    
    // Then delete them
    const result = await Notification.deleteMany({
      'recipient.id': req.user._id,
      'recipient.model': 'User'
    });

    console.log('Delete result:', result);

    // If socket.io is available, emit the mass deletion event
    if (req.app.get('io') && deletedIds.length > 0) {
      try {
        const connectedUsers = req.app.get('connectedUsers');
        let userSocketId = null;
        
        // Safely get socket ID if connectedUsers exists and has a valid get method
        if (connectedUsers && typeof connectedUsers.get === 'function') {
          userSocketId = connectedUsers.get(req.user._id.toString());
        }
        
        // Emit to the user's socket to update their UI
        if (userSocketId) {
          req.app.get('io').to(userSocketId).emit('allNotificationsDeleted', {
            userId: req.user._id,
            count: deletedIds.length,
            deletedAt: new Date().toISOString()
          });
        }
        
        // Also broadcast to all clients for dashboard updates
        req.app.get('io').emit('notificationBulkUpdate', {
          type: 'deleteAll',
          userId: req.user._id,
          notificationIds: deletedIds,
          deletedAt: new Date().toISOString()
        });
      } catch (socketError) {
        // Log but don't fail if socket emission has an error
        console.error('Error emitting socket events:', socketError);
      }
    }

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
};

// @desc    Create a new form
// @route   POST /api/students/forms
// @access  Private/Student
const createForm = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      formType,
      preferredStartTime,
      endTime
    } = req.body;

    // Get the student details from the authenticated user
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Process uploaded files if any
    const fileAttachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fileAttachments.push({
          fileName: file.originalname,
          fileType: file.mimetype,
          fileUrl: `/uploads/${file.filename}`,
          uploadDate: new Date()
        });
      });
    }

    // Create the form
    const Form = require('../models/FormModel');
    const newForm = await Form.create({
      title,
      description,
      formType,
      preferredStartTime,
      endTime,
      student: student._id,
      status: 'Pending',
      attachments: fileAttachments
    });

    // Get the admin users to notify
    const adminUsers = await Admin.find({}).select('_id');

    // Create notifications for admins
    const formattedStudentName = student.name || 'Unknown Student';
    
    // Create admin notifications (one per admin)
    for (const admin of adminUsers) {
      const adminNotification = await Notification.create({
        recipient: {
          id: admin._id,
          model: 'Admin'
        },
        type: 'FORM_SUBMITTED',
        title: 'New Form Submission',
        content: `New ${formType} request submitted by ${formattedStudentName}`,
        relatedTo: {
          model: 'Form',
          id: newForm._id
        },
        metadata: {
          formType,
          studentId: student._id,
          preferredStartTime,
          studentName: formattedStudentName
        }
      });

      // Emit socket event to notify admins in real-time
      const io = req.app.get('io');
      if (io) {
        io.to(admin._id.toString()).emit('newNotification', adminNotification);
      }
    }

    // Create a notification for the student (confirmation)
    const studentNotification = await Notification.create({
      recipient: {
        id: student._id,
        model: 'User'
      },
      type: 'FORM_SUBMITTED',
      title: 'Form Submitted Successfully',
      content: `Your ${formType} request has been submitted and is pending review.`,
      relatedTo: {
        model: 'Form',
        id: newForm._id
      },
      metadata: {
        formType,
        status: 'Pending',
        preferredStartTime
      }
    });

    // Emit socket event to notify the student in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(student._id.toString()).emit('newNotification', studentNotification);
      
      // Also broadcast to admins that a new form has been created
      io.to('admins').emit('newForm', {
        _id: newForm._id,
        title: newForm.title,
        formType: newForm.formType,
        studentName: formattedStudentName,
        status: newForm.status,
        submittedAt: newForm.createdAt
      });
    }

    // Return the created form
    res.status(201).json({
      _id: newForm._id,
      title: newForm.title,
      description: newForm.description,
      formType: newForm.formType,
      preferredStartTime: newForm.preferredStartTime,
      endTime: newForm.endTime,
      status: newForm.status,
      createdAt: newForm.createdAt,
      message: 'Form submitted successfully'
    });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({
      message: 'Error creating form',
      error: error.message
    });
  }
});

// @desc    Get forms submitted by student
// @route   GET /api/students/forms
// @access  Private/Student
const getStudentForms = asyncHandler(async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50, sort = '-createdAt' } = req.query;
    
    // Base query - find forms submitted by this student
    let query = {
      student: req.user.id
    };
    
    // Add filters if provided
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.preferredStartTime = {};
      
      if (startDate) {
        query.preferredStartTime.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.preferredStartTime.$lte = new Date(endDate);
      }
    }
    
    // Find forms
    const Form = require('../models/FormModel');
    const forms = await Form.find(query)
      .sort(sort)
      .limit(Number(limit))
      .populate('staff', 'name role')
      .populate('admin', 'name');
    
    // Calculate duration for each form (for calendar display)
    const formsWithDuration = forms.map(form => {
      const formObj = form.toObject();
      
      // Calculate duration in hours
      if (form.preferredStartTime && form.endTime) {
        const startTime = new Date(form.preferredStartTime);
        const endTime = new Date(form.endTime);
        const durationMs = endTime - startTime;
        formObj.duration = durationMs / (1000 * 60 * 60); // Convert ms to hours
      } else {
        // Default duration if end time not specified
        formObj.duration = 1;
      }
      
      return formObj;
    });
    
    res.json(formsWithDuration);
  } catch (error) {
    console.error('Error fetching student forms:', error);
    res.status(500).json({
      message: 'Error fetching forms',
      error: error.message
    });
  }
});

// @desc    Submit a review for a completed form
// @route   POST /api/students/forms/:id/review
// @access  Private/Student
const submitFormReview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    // Log for debugging
    console.log('Review submission attempt:', {
      formId: id,
      userId: req.user?.id || req.user?._id?.toString(),
      rating,
      hasComment: !!comment
    });
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Find the form
    const Form = require('../models/FormModel');
    const form = await Form.findById(id);
    
    // Verify form exists
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Get user ID that works with both req.user.id and req.user._id
    const userId = req.user.id || req.user._id.toString();
    const formStudentId = form.student.toString();
    
    console.log('Comparing IDs:', { userId, formStudentId });
    
    // Verify the form belongs to this student
    if (formStudentId !== userId) {
      return res.status(403).json({ 
        message: 'You can only review your own forms',
        debug: { userId, formStudentId, match: formStudentId === userId }
      });
    }
    
    // Log detailed information about the form
    console.log('Form object details:', {
      id: form._id,
      status: form.status,
      hasStudentReview: !!form.studentReview,
      studentReviewType: typeof form.studentReview,
      studentReviewContents: JSON.stringify(form.studentReview)
    });
    
    // Verify form is completed
    if (form.status !== 'Completed') {
      return res.status(400).json({ message: 'Only completed forms can be reviewed' });
    }
    
    // Check if the form already has a review - more careful check for nested properties
    let hasExistingReview = false;
    
    if (form.studentReview) {
      if (typeof form.studentReview === 'object') {
        // Check if it has a valid rating property
        if (form.studentReview.rating && form.studentReview.rating > 0) {
          hasExistingReview = true;
          console.log('Review already exists with rating:', form.studentReview.rating);
        } else {
          console.log('Form has studentReview object but no valid rating:', form.studentReview);
        }
      } else {
        console.log('studentReview exists but is not an object:', typeof form.studentReview);
      }
    }
    
    if (hasExistingReview) {
      return res.status(400).json({ message: 'You have already reviewed this form' });
    }
    
    console.log('No existing review found, proceeding to create one');
    
    // Update the form with the review
    form.studentReview = {
      rating,
      comment: comment || '',
      reviewDate: new Date()
    };
    
    // Save the updated form
    const updatedForm = await form.save();
    console.log('Review saved successfully for form:', id);
    
    // Create notifications for staff and admin
    try {
      await Notification.createFormReviewedNotification(form, rating);
      console.log('Review notifications created successfully');
    } catch (notificationError) {
      console.error('Error creating review notification:', notificationError);
      // Continue processing even if notification creation fails
      // The review itself is already saved
    }
    
    // Emit socket events if available
    if (req.app.get('io')) {
      // Notify staff if assigned
      if (form.staff) {
        req.app.get('io').to(form.staff.toString()).emit('newNotification', {
          type: 'FORM_REVIEWED',
          content: `A student has left a ${rating}-star review for your service.`,
          formId: form._id
        });
      }
      
      // Broadcast to admins
      req.app.get('io').to('admins').emit('newNotification', {
        type: 'FORM_REVIEWED',
        content: `A student has left a ${rating}-star review for a ${form.formType} request.`,
        formId: form._id,
        rating
      });
    }
    
    res.json({
      message: 'Review submitted successfully',
      review: form.studentReview
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ 
      message: 'Error submitting review',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// @desc    Reschedule a form
// @route   PUT /api/students/forms/:id/reschedule
// @access  Private/Student
const rescheduleForm = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { preferredStartTime, endTime, description } = req.body;
    
    // Validate required fields
    if (!preferredStartTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required for rescheduling' });
    }
    
    // Parse dates
    const startDate = new Date(preferredStartTime);
    const endDate = new Date(endTime);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Validate that start time is before end time
    if (startDate >= endDate) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }
    
    // Validate that start time is in the future
    if (startDate <= new Date()) {
      return res.status(400).json({ message: 'Start time must be in the future' });
    }
    
    // Find the original form
    const Form = require('../models/FormModel');
    const originalForm = await Form.findById(id);
    
    // Verify form exists
    if (!originalForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Get user ID
    const userId = req.user.id || req.user._id.toString();
    
    // Verify the form belongs to this student
    if (originalForm.student.toString() !== userId) {
      return res.status(403).json({ message: 'You can only reschedule your own forms' });
    }
    
    // Create a new form with the updated scheduling information
    const newForm = await Form.create({
      title: originalForm.title,
      description: description || originalForm.description,
      formType: originalForm.formType,
      preferredStartTime: startDate,
      endTime: endDate,
      student: userId,
      status: 'Pending',
      previousStatus: originalForm.status,
      attachments: originalForm.attachments
    });
    
    // Add status history entry
    newForm.statusHistory.push({
      status: 'Pending',
      changedBy: userId,
      changedAt: new Date(),
      notes: `Rescheduled from previous form (${originalForm._id})`
    });
    
    await newForm.save();
    
    // Delete the original form after creating the new one
    await Form.findByIdAndDelete(id);
    
    // Get admin users to notify
    const adminUsers = await Admin.find({}).select('_id');
    
    // Create notifications for admins
    const student = await Student.findById(userId);
    const formattedStudentName = student.name || 'Unknown Student';
    
    // Create admin notifications (one per admin)
    for (const admin of adminUsers) {
      const adminNotification = await Notification.create({
        recipient: {
          id: admin._id,
          model: 'Admin'
        },
        type: 'SYSTEM',
        title: 'Form Rescheduled',
        content: `${formattedStudentName} has rescheduled a ${newForm.formType} request`,
        relatedTo: {
          model: 'Form',
          id: newForm._id
        },
        metadata: {
          formType: newForm.formType,
          studentId: userId,
          preferredStartTime: startDate,
          studentName: formattedStudentName,
          isRescheduled: true,
          originalFormId: originalForm._id.toString()
        }
      });
      
      // Emit socket event to notify admins in real-time
      const io = req.app.get('io');
      if (io) {
        io.to(admin._id.toString()).emit('newNotification', adminNotification);
      }
    }
    
    // Create a notification for the student (confirmation)
    const studentNotification = await Notification.create({
      recipient: {
        id: userId,
        model: 'User'
      },
      type: 'SYSTEM',
      title: 'Form Rescheduled Successfully',
      content: `Your ${newForm.formType} request has been rescheduled and is pending review.`,
      relatedTo: {
        model: 'Form',
        id: newForm._id
      },
      metadata: {
        formType: newForm.formType,
        status: 'Pending',
        preferredStartTime: startDate,
        isRescheduled: true,
        originalFormId: originalForm._id.toString()
      }
    });
    
    // Emit socket event to notify the student in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('newNotification', studentNotification);
      
      // Also broadcast to admins that a form has been rescheduled
      io.to('admins').emit('formRescheduled', {
        _id: newForm._id,
        title: newForm.title,
        formType: newForm.formType,
        studentName: formattedStudentName,
        status: newForm.status,
        submittedAt: newForm.createdAt,
        isRescheduled: true,
        originalFormWasDeleted: true
      });
    }
    
    // Return the created form
    res.status(201).json({
      _id: newForm._id,
      title: newForm.title,
      description: newForm.description,
      formType: newForm.formType,
      preferredStartTime: newForm.preferredStartTime,
      endTime: newForm.endTime,
      status: newForm.status,
      createdAt: newForm.createdAt,
      message: 'Form rescheduled successfully. Original form has been removed.'
    });
  } catch (error) {
    console.error('Error rescheduling form:', error);
    res.status(500).json({
      message: 'Error rescheduling form',
      error: error.message
    });
  }
});

// Get bills for a specific student
const getStudentBills = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Find all bills for the student
    const bills = await Bill.find({ student: studentId })
      .populate('room', 'roomNumber building')
      // Include all necessary fields, explicitly listing them for clarity
      .select('_id rentalFee waterFee electricityFee otherFees dueDate status billFile amount paymentStatus amountPaid payments billingPeriodStart billingPeriodEnd')
      .sort({ dueDate: -1 });

    // Format bill files to just return the filename
    const formattedBills = bills.map(bill => {
      const billObj = bill.toObject();
      
      // Extract just the filename for billFile if it exists
      if (billObj.billFile && billObj.billFile.trim() !== '') {
        // Extract just the filename from any path
        const fileNameMatch = billObj.billFile.match(/[^\/\\]+$/);
        if (fileNameMatch) {
          const fileName = fileNameMatch[0];
          console.log(`Original path: ${billObj.billFile}, simplified to: ${fileName}`);
          billObj.billFile = fileName;
        }
      }
      
      return billObj;
    });

    console.log('Simplified file paths for client usage');
    
    res.status(200).json(formattedBills);
  } catch (error) {
    console.error('Error fetching student bills:', error);
    res.status(500).json({ message: 'Error fetching student bills' });
  }
};

// Submit payment for a bill
const submitBillPayment = async (req, res) => {
  try {
    const { id } = req.params; // bill ID
    const { amount, paymentMethod } = req.body;
    const studentId = req.user.id; // Get student ID from authenticated user
    
    // Find the bill
    const bill = await Bill.findById(id);
    
    // Check if bill exists
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Verify that this bill belongs to the authenticated student
    if (bill.student.toString() !== studentId) {
      return res.status(403).json({ 
        message: 'Access denied: You can only make payments for your own bills' 
      });
    }
    
    // Validate payment amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }
    
    // Get the receipt file path (if uploaded)
    const receiptFilePath = req.file ? req.file.path : '';
    
    // Create payment data
    const paymentData = {
      amount: paymentAmount,
      paymentDate: new Date(),
      notes: `Payment made via ${paymentMethod || 'online payment'}`,
      transactionId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    
    // Add the payment to the bill
    await bill.addPayment(paymentData);
    
    // Calculate total bill amount
    const totalAmount = bill.rentalFee + bill.waterFee + bill.electricityFee +
      (bill.otherFees || []).reduce((sum, fee) => sum + fee.amount, 0);
    
    // Calculate remaining balance
    const remainingBalance = totalAmount - bill.amountPaid;
    
    // Update payment status - using only valid enum values (pending, paid, overdue)
    if (bill.amountPaid >= totalAmount) {
      bill.status = 'paid';
      bill.paymentStatus = 'Paid';
    } else if (bill.amountPaid > 0) {
      // For partial payments, keep status as 'pending' but update paymentStatus field
      bill.status = 'pending';  // Using valid enum 'pending' instead of 'partially_paid'
      bill.paymentStatus = 'Partially Paid';
    }
    
    // Save receipt file path if provided
    if (receiptFilePath) {
      bill.receiptFile = receiptFilePath;
    }
    
    await bill.save();
    
    // Create a notification for the admin with payment details
    const paymentMessage = remainingBalance > 0 
      ? `Student ${req.user.name} made a partial payment of $${paymentAmount.toFixed(2)}. Remaining balance: $${remainingBalance.toFixed(2)}`
      : `Student ${req.user.name} paid the full amount of $${totalAmount.toFixed(2)}`;
      
    await Notification.create({
      recipient: {
        model: 'Admin',  // Send to all admins
        id: null
      },
      type: 'SYSTEM',
      title: 'New Bill Payment',
      content: paymentMessage,
      relatedTo: {
        model: 'Form',  // Using 'Form' instead of 'Bill' as it appears to be a valid enum value
        id: bill._id
      },
      metadata: {
        billId: bill._id,
        studentId: studentId,
        amount: paymentAmount,
        remainingBalance: remainingBalance,
        paymentDate: new Date()
      }
    });
    
    // Send success response with remaining balance information
    res.status(200).json({
      message: 'Payment submitted successfully',
      payment: paymentData,
      bill: {
        _id: bill._id,
        status: bill.status,
        paymentStatus: bill.paymentStatus,
        amountPaid: bill.amountPaid,
        totalAmount: totalAmount,
        remainingBalance: remainingBalance,
        isFullyPaid: remainingBalance <= 0
      }
    });
    
  } catch (error) {
    console.error('Error submitting bill payment:', error);
    res.status(500).json({ 
      message: 'Error processing payment',
      error: error.message
    });
  }
};

// @desc    Check in a student
// @route   POST /api/students/:id/check-in
// @access  Private/Staff
const checkInStudent = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('room')
      .populate('room.building');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.room) {
      return res.status(400).json({ message: 'Student is not assigned to a room' });
    }

    // Get current date at midnight for log entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's log
    let log = await Log.findOne({
      user: student._id,
      date: today
    });

    if (!log) {
      log = await Log.create({
        user: student._id,
        room: student.room._id,
        building: student.room.building._id,
        date: today,
        entries: []
      });
    }

    // Check if student can check in
    if (!log.canCheckIn()) {
      return res.status(400).json({ message: 'Student has already checked in twice today' });
    }

    // Get current time for check-in
    const checkInTime = new Date();

    // Get latest curfew time
    const curfew = await Curfew.findOne().sort({ date: -1 });

    if (!curfew) {
      return res.status(400).json({ message: 'No curfew time has been set' });
    }

    // Create new log entry with initial status
    const newEntry = {
      user: student._id,
      checkInTime: checkInTime,
      checkInStatus: 'Pending'
    };

    // Add entry to log
    log.entries.push(newEntry);
    await log.save();

    // Update student status
    student.status = 'in';
    student.lastCheckIn = checkInTime;
    await student.save();

    // Parse curfew time
    const [curfewHours, curfewMinutes] = curfew.curfewTime.split(':');
    const curfewDateTime = new Date(today);
    curfewDateTime.setHours(parseInt(curfewHours), parseInt(curfewMinutes), 0, 0);

    // Compare check-in time with curfew time
    if (checkInTime > curfewDateTime) {
      // Update log entry status to Late
      await log.updateCheckInStatus(log.entries.length - 1, 'Late');
      
      // Create a notification for late check-in
      await Notification.create({
        recipient: {
          model: 'Admin'
        },
        type: 'SYSTEM',
        title: 'Late Check-in Alert',
        content: `${student.name} has checked in late to room ${student.room.roomNumber}`,
        metadata: {
          studentId: student._id,
          studentName: student.name,
          roomNumber: student.room.roomNumber,
          checkInTime: checkInTime,
          curfewTime: curfew.curfewTime
        }
      });
    } else {
      // Update log entry status to OnTime
      await log.updateCheckInStatus(log.entries.length - 1, 'OnTime');
    }

    res.json({
      message: 'Student checked in successfully',
      log: log,
      status: checkInTime > curfewDateTime ? 'Late' : 'OnTime'
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Error checking in student', error: error.message });
  }
});

// @desc    Check out a student
// @route   POST /api/students/:id/check-out
// @access  Private/Staff
const checkOutStudent = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('room')
      .populate('room.building');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.room) {
      return res.status(400).json({ message: 'Student is not assigned to a room' });
    }

    // Get current date at midnight for log entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's log
    let log = await Log.findOne({
      user: student._id,
      date: today
    });

    if (!log) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }

    // Check if student can check out
    if (!log.canCheckOut()) {
      return res.status(400).json({ message: 'Student has not checked in today or has already checked out' });
    }

    // Get current time for check-out
    const checkOutTime = new Date();

    // Get latest curfew time
    const curfew = await Curfew.findOne().sort({ date: -1 });

    if (!curfew) {
      return res.status(400).json({ message: 'No curfew time has been set' });
    }

    // Update the last entry's check-out time and status
    const lastEntryIndex = log.entries.length - 1;
    log.entries[lastEntryIndex].checkOutTime = checkOutTime;
    log.entries[lastEntryIndex].checkOutStatus = 'Pending';

    await log.save();

    // Update student status
    student.status = 'out';
    student.lastCheckOut = checkOutTime;
    await student.save();

    // Parse curfew time
    const [curfewHours, curfewMinutes] = curfew.curfewTime.split(':');
    const curfewDateTime = new Date(today);
    curfewDateTime.setHours(parseInt(curfewHours), parseInt(curfewMinutes), 0, 0);

    // Compare check-out time with curfew time
    if (checkOutTime > curfewDateTime) {
      // Update log entry status to Late
      await log.updateCheckOutStatus(lastEntryIndex, 'Late');
      
      // Create a notification for late check-out
      await Notification.create({
        recipient: {
          model: 'Admin'
        },
        type: 'SYSTEM',
        title: 'Late Check-out Alert',
        content: `${student.name} has checked out late from room ${student.room.roomNumber}`,
        metadata: {
          studentId: student._id,
          studentName: student.name,
          roomNumber: student.room.roomNumber,
          checkOutTime: checkOutTime,
          curfewTime: curfew.curfewTime
        }
      });
    } else {
      // Update log entry status to OnTime
      await log.updateCheckOutStatus(lastEntryIndex, 'OnTime');
    }

    res.json({
      message: 'Student checked out successfully',
      log: log,
      status: checkOutTime > curfewDateTime ? 'Late' : 'OnTime'
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Error checking out student', error: error.message });
  }
});

// @desc    Get news for students
// @route   GET /api/student/news
// @access  Private/Student
const getStudentNews = asyncHandler(async (req, res) => {
  try {
    // Get query parameters for filtering
    const { 
      category, 
      search, 
      limit = 10, 
      page = 1,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = req.query;

    // Build the filter object - only show active news that are not expired
    const filter = {
      isActive: true,
      $or: [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: null }
      ],
      publishDate: { $lte: new Date() }
    };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$and = [{
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      }];
    }
    
    // Calculate pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Always sort pinned items to top
    if (sortBy !== 'pinned') {
      sort.pinned = -1;
    }
    
    // Query the database
    const totalCount = await News.countDocuments(filter);
    const news = await News.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name');
    
    // Calculate if there are more pages
    const hasMore = skip + news.length < totalCount;
    
    // Increment view count for these news items
    // This is done asynchronously and doesn't affect the response
    news.forEach(newsItem => {
      News.findByIdAndUpdate(newsItem._id, { $inc: { viewCount: 1 } }).exec();
    });
    
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
    console.error('Error getting news for student:', error);
    res.status(500).json({ message: 'Error retrieving news' });
  }
});

// @desc    Get a single news item for a student
// @route   GET /api/student/news/:id
// @access  Private/Student
const getStudentNewsById = asyncHandler(async (req, res) => {
  try {
    const newsId = req.params.id;
    
    // Find the news item
    const newsItem = await News.findById(newsId)
      .populate('author', 'name');
    
    if (!newsItem) {
      return res.status(404).json({ message: 'News item not found' });
    }
    
    // Check if news is active and not expired
    const isActive = newsItem.isActive;
    const isExpired = newsItem.expiryDate && new Date(newsItem.expiryDate) < new Date();
    const isFuturePublish = new Date(newsItem.publishDate) > new Date();
    
    if (!isActive || isExpired || isFuturePublish) {
      return res.status(403).json({ message: 'This news item is not available' });
    }
    
    // Increment view count
    newsItem.viewCount += 1;
    await newsItem.save();
    
    res.json(newsItem);
  } catch (error) {
    console.error('Error getting news item for student:', error);
    res.status(500).json({ message: 'Error retrieving news item' });
  }
});

// Export all controllers
module.exports = {
  loginStudent,
  logoutStudent,
  getStudentProfile,
  createStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
  checkEmailExists,
  checkDormNumberExists,
  checkPhoneExists,
  startConversation,
  sendMessage,
  getConversations,
  getMessages,
  getAdmins,
  getOtherStudents,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  deleteNotification,
  deleteAllNotifications,
  createForm,
  getStudentForms,
  submitFormReview,
  rescheduleForm,
  getStudentBills,
  submitBillPayment,
  verifyStudentPassword,
  checkInStudent,
  checkOutStudent,
  getStudentNews,
  getStudentNewsById
}; 