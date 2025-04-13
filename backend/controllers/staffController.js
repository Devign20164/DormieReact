const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Staff = require('../models/staffModel');
const asyncHandler = require('express-async-handler');
const config = require('../config/config');

// @desc    Auth staff & get token
// @route   POST /api/staff/login
// @access  Public
const loginStaff = asyncHandler(async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('Login attempt for staff:', identifier);

    const staff = await Staff.findOne({ name: identifier });
    console.log('Staff found:', staff ? 'Yes' : 'No');

    if (!staff) {
      console.log('Staff not found with name:', identifier);
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, staff.password);
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
      _id: staff._id,
      name: staff.name,
      role: 'staff',
    });
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
    });
  } else {
    res.status(404);
    throw new Error('Staff not found');
  }
});

module.exports = {
  loginStaff,
  logoutStaff,
  getStaffProfile,
}; 