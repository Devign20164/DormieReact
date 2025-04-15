const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const config = require('../config/config');
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const Notification = require('../models/notificationModel');
const Admin = require('../models/adminModel');

// @desc    Auth student & get token
// @route   POST /api/students/login
// @access  Public
const loginStudent = asyncHandler(async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('Login attempt for student:', identifier);

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
    const students = await Student.find({}).select('-password');
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
        _id: req.params.notificationId,
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
      const userSocketId = req.app.get('connectedUsers').get(req.user._id.toString());
      
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
      const userSocketId = req.app.get('connectedUsers').get(req.user._id.toString());
      
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
      _id: req.params.notificationId,
      'recipient.id': req.user._id,
      'recipient.model': 'User'
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // If socket.io is available, emit the deleted notification status
    if (req.app.get('io')) {
      const userSocketId = req.app.get('connectedUsers').get(req.user._id.toString());
      
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
      const userSocketId = req.app.get('connectedUsers').get(req.user._id.toString());
      
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
  deleteAllNotifications
}; 