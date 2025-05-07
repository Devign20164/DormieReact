const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const Staff = require('../models/staffModel');
const Notification = require('../models/notificationModel');
const Form = require('../models/FormModel');
const config = require('../config/config');

// @desc    Auth staff member & get token
// @route   POST /api/staff/login
// @access  Public
const loginStaff = asyncHandler(async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('Login attempt for staff:', identifier);

    // Find staff by name
    const staff = await Staff.findOne({ name: identifier });
    console.log('Staff found:', staff ? 'Yes' : 'No');

    if (!staff) {
      console.log('Staff not found with name:', identifier);
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

// @desc    Get forms assigned to staff member
// @route   GET /api/staff/forms
// @access  Private/Staff
const getAssignedForms = asyncHandler(async (req, res) => {
  try {
    // Get query parameters for filtering
    const { 
      status,
      startDate, 
      endDate, 
      sort = '-createdAt' // Default sort by newest first
    } = req.query;
    
    // Build query object - always filter by staff ID
    const query = {
      staff: req.user.id
    };
    
    // Add additional filters if provided
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.preferredStartTime = {};
      if (startDate) query.preferredStartTime.$gte = new Date(startDate);
      if (endDate) query.preferredStartTime.$lte = new Date(endDate);
    }

    console.log('Fetching forms for staff:', req.user.id);
    console.log('Query:', query);
    
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
      .populate('admin', 'name')
      .sort(sort);
    
    console.log(`Found ${forms.length} forms assigned to staff ${req.user.name}`);
    
    // Calculate some stats
    const formStats = {
      total: forms.length,
      assigned: forms.filter(form => form.status === 'Assigned').length,
      inProgress: forms.filter(form => form.status === 'In Progress').length,
      completed: forms.filter(form => form.status === 'Completed').length
    };
    
    res.json({
      forms,
      stats: formStats,
      count: forms.length
    });
  } catch (error) {
    console.error('Error fetching assigned forms:', error);
    res.status(500).json({ 
      message: 'Error fetching assigned forms',
      error: error.message 
    });
  }
});

// @desc    Update form status by staff
// @route   PUT /api/staff/forms/:id/status
// @access  Private/Staff
const updateFormStatus = asyncHandler(async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Staff can only set forms to 'In Progress' or 'Completed' status
    if (status !== 'In Progress' && status !== 'Completed') {
      return res.status(403).json({ 
        message: `Staff can only change a form's status to 'In Progress' or 'Completed'. Received: ${status}` 
      });
    }
    
    // Find the form and verify it's assigned to this staff member
    const form = await Form.findOne({
      _id: req.params.id,
      staff: req.user.id
    });
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found or not assigned to you' });
    }
    
    // Validate status transitions
    const validTransitions = {
      'Assigned': ['In Progress'],
      'In Progress': ['Completed'],
      'Completed': []  // Once completed, can't change status
    };
    
    if (!validTransitions[form.status]?.includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${form.status} to ${status}. Valid next statuses are: ${validTransitions[form.status]?.join(', ') || 'none'}` 
      });
    }
    
    // Update status
    form.status = status;
    
    // Initialize statusHistory array if it doesn't exist
    if (!form.statusHistory) {
      form.statusHistory = [];
    }
    
    // Add status history entry with notes
    form.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: notes || `Status changed to ${status} by staff`
    });
    
    // Save the updated form
    const updatedForm = await form.save();
    
    // Create notifications for the student
    const notificationContent = status === 'In Progress' 
      ? `Work on your ${form.formType} request has started.`
      : `Your ${form.formType} request has been completed. Please leave a review.`;
    
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
    
    // Notify admin as well
    if (form.admin) {
      await Notification.create({
        recipient: {
          id: form.admin,
          model: 'Admin'
        },
        type: 'SYSTEM',
        title: 'Form Status Updated by Staff',
        content: `A ${form.formType} request has been ${status.toLowerCase()} by ${req.user.name}.`,
        relatedTo: {
          model: 'Form',
          id: form._id
        },
        metadata: {
          formType: form.formType,
          status,
          staffName: req.user.name,
          formId: form._id
        }
      });
    }
    
    // Emit socket events for real-time updates if available
    if (req.app && req.app.get('io')) {
      // Notify student
      req.app.get('io').to(form.student.toString()).emit('formStatusChanged', {
        formId: form._id,
        status,
        message: notificationContent
      });
      
      // Notify admin
      if (form.admin) {
        req.app.get('io').to(form.admin.toString()).emit('formStatusChanged', {
          formId: form._id,
          status,
          message: `A ${form.formType} request has been ${status.toLowerCase()} by ${req.user.name}.`
        });
      }
      
      // Broadcast to admins room
      req.app.get('io').to('admins').emit('formStatusChanged', {
        formId: form._id,
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.name
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

// @desc    Update staff password
// @route   PUT /api/staff/update-password
// @access  Private/Staff
const updateStaffPassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Get staff with password
    const staff = await Staff.findById(req.user.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, staff.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    staff.password = newPassword;
    await staff.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating staff password:', error);
    res.status(500).json({ 
      message: 'Error updating password',
      error: error.message 
    });
  }
});

// Export all controllers
module.exports = {
  loginStaff,
  logoutStaff,
  getStaffProfile,
  getAssignedForms,
  updateFormStatus,
  updateStaffPassword
}; 