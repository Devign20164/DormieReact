const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Staff = require('../models/staffModel');
const JobRequestForm = require('../models/requestFormModel');
const Notification = require('../models/notificationModel');
const asyncHandler = require('express-async-handler');
const config = require('../config/config');

// @desc    Auth staff & get token
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

    res.json({
      _id: staff._id,
      name: staff.name,
      role: 'staff',
      typeOfStaff: staff.typeOfStaff,
      status: staff.status
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
      typeOfStaff: staff.typeOfStaff,
      status: staff.status
    });
  } else {
    res.status(404);
    throw new Error('Staff not found');
  }
});

// @desc    Get staff assignments
// @route   GET /api/staff/assignments
// @access  Private
const getStaffAssignments = asyncHandler(async (req, res) => {
  try {
    console.log('Getting assignments for staff ID:', req.user.id);
    
    // Get the staff with populated assignedForms
    const staff = await Staff.findById(req.user.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    // Fetch the forms assigned to this staff member
    const assignments = await JobRequestForm.find({ 
      staff: req.user.id 
    })
    .populate('user', 'name studentDormNumber')
    .populate('room', 'roomNumber')
    .populate('building', 'name')
    .sort({ submissionDate: -1 });
    
    console.log(`Found ${assignments.length} assignments for staff member`);
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching staff assignments:', error);
    res.status(500).json({ 
      message: 'Error fetching assignments',
      error: error.message
    });
  }
});

// @desc    Update assignment status
// @route   PUT /api/staff/assignments/:formId/status
// @access  Private
const updateAssignmentStatus = asyncHandler(async (req, res) => {
  try {
    const { formId } = req.params;
    const { status } = req.body;
    
    console.log(`Updating assignment ${formId} status to ${status}`);
    
    // Validate the status
    const validStatuses = ['In Progress', 'Rescheduled', 'On Going'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find the form and verify it belongs to this staff
    const form = await JobRequestForm.findOne({ 
      _id: formId,
      staff: req.user.id
    });
    
    if (!form) {
      return res.status(404).json({ message: 'Assignment not found or not assigned to you' });
    }
    
    // Update the form status
    form.status = status;
    await form.save();
    
    // Create notification for the student
    const notification = await Notification.create({
      recipient: {
        id: form.user,
        model: 'User'
      },
      type: status === 'In Progress' ? 'FORM_STARTED' : 'FORM_RESCHEDULED',
      title: status === 'In Progress' ? 'Request Started' : 'Request Rescheduled',
      content: status === 'In Progress' 
        ? `Work on your ${form.requestType} request has started.`
        : `Your ${form.requestType} request has been rescheduled.`,
      relatedTo: {
        model: 'JobRequestForm',
        id: form._id
      }
    });
    
    // Get the updated form with populated data
    const updatedForm = await JobRequestForm.findById(formId)
      .populate('user', 'name studentDormNumber')
      .populate('room', 'roomNumber')
      .populate('building', 'name')
      .populate('staff', 'name typeOfStaff');
    
    // Emit socket events
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      // Send notification to the student
      if (form.user) {
        io.to(form.user.toString()).emit('newNotification', notification);
      }
      
      // Emit form update to all clients
      io.emit('formUpdate', {
        formId: form._id,
        status,
        updatedForm
      });
    }
    
    res.json({
      message: 'Form status updated successfully',
      form: updatedForm
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ 
      message: 'Error updating assignment status',
      error: error.message
    });
  }
});

// @desc    Complete an assignment
// @route   PUT /api/staff/assignments/:formId/complete
// @access  Private
const completeAssignment = asyncHandler(async (req, res) => {
  try {
    const { formId } = req.params;
    const { notes } = req.body;
    
    console.log(`Completing assignment ${formId}`);
    
    // Find the form and verify it belongs to this staff
    const form = await JobRequestForm.findOne({ 
      _id: formId,
      staff: req.user.id
    });
    
    if (!form) {
      return res.status(404).json({ message: 'Assignment not found or not assigned to you' });
    }
    
    // Update the form status to Completed
    form.status = 'Completed';
    if (notes) {
      form.completionNotes = notes;
    }
    form.completedDate = new Date();
    await form.save();
    
    // Update staff status if this was their only assignment
    const staff = await Staff.findById(req.user.id);
    const remainingAssignments = await JobRequestForm.countDocuments({
      staff: req.user.id,
      status: { $ne: 'Completed' }
    });
    
    if (remainingAssignments === 0 && staff.status === 'Occupied') {
      staff.status = 'Available';
      await staff.save();
    }
    
    // Create notification for the student
    const notification = await Notification.create({
      recipient: {
        id: form.user,
        model: 'User'
      },
      type: 'FORM_COMPLETED',
      title: 'Request Completed',
      content: `Your ${form.requestType} request has been completed.`,
      relatedTo: {
        model: 'JobRequestForm',
        id: form._id
      }
    });
    
    // Get the updated form with populated data
    const updatedForm = await JobRequestForm.findById(formId)
      .populate('user', 'name studentDormNumber')
      .populate('room', 'roomNumber')
      .populate('building', 'name')
      .populate('staff', 'name typeOfStaff');
    
    // Emit socket events
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      // Send notification to the student
      if (form.user) {
        io.to(form.user.toString()).emit('newNotification', notification);
      }
      
      // Emit form update to all clients
      io.emit('formUpdate', {
        formId: form._id,
        status: 'Completed',
        updatedForm
      });
    }
    
    res.json({
      message: 'Assignment completed successfully',
      form: updatedForm
    });
  } catch (error) {
    console.error('Error completing assignment:', error);
    res.status(500).json({ 
      message: 'Error completing assignment',
      error: error.message
    });
  }
});

module.exports = {
  loginStaff,
  logoutStaff,
  getStaffProfile,
  getStaffAssignments,
  updateAssignmentStatus,
  completeAssignment
}; 