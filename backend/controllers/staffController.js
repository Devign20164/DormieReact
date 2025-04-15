const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const Staff = require('../models/staffModel');
const Notification = require('../models/notificationModel');
const config = require('../config/config');

// @desc    Auth staff member & get token
// @route   POST /api/staff/login
// @access  Public
const loginStaff = asyncHandler(async (req, res) => {
  try {
    // Handle both 'identifier' from the login form and 'name' for direct API calls
    const { identifier, name, password } = req.body;
    const staffName = name || identifier;
    console.log('Login attempt for staff:', staffName);

    // Find staff by name
    const staff = await Staff.findOne({ name: staffName });
    console.log('Staff found:', staff ? 'Yes' : 'No');

    if (!staff) {
      console.log('Staff not found with name:', staffName);
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Use the model's matchPassword method to check password
    const isMatch = await staff.matchPassword(password);
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
        id: staff._id,
        role: 'staff',
        name: staff.name,
        typeOfStaff: staff.typeOfStaff
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
      _id: staff._id,
      name: staff.name,
      role: 'staff',
      typeOfStaff: staff.typeOfStaff,
      status: staff.status
    };

    // Return staff data along with socket initialization data
    res.json({
      ...responseData,
      socketInitRequired: true,
      socketUserId: staff._id.toString()
    });

    console.log('Staff login successful:', staff.name);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error logging in'
    });
  }
});

// @desc    Logout staff
// @route   POST /api/staff/logout
// @access  Private
const logoutStaff = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get staff profile
// @route   GET /api/staff/profile
// @access  Private
const getStaffProfile = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.user.id).select('-password');
  if (staff) {
    res.json({
      _id: staff._id,
      name: staff.name,
      role: 'staff',
      typeOfStaff: staff.typeOfStaff,
      status: staff.status
    });
  } else {
    res.status(404);
    throw new Error('Staff not found');
  }
});

module.exports = {
  loginStaff,
  logoutStaff,
  getStaffProfile
}; 