const express = require('express');
const router = express.Router();
const {
  loginStaff,
  logoutStaff,
  getStaffProfile,
  getStaffAssignments,
  updateAssignmentStatus,
  completeAssignment
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');

// Auth routes
router.post('/login', loginStaff);
router.post('/logout', protect, logoutStaff);
router.get('/profile', protect, getStaffProfile);

// Assignment routes
router.get('/assignments', protect, getStaffAssignments);
router.put('/assignments/:formId/status', protect, updateAssignmentStatus);
router.put('/assignments/:formId/complete', protect, completeAssignment);

module.exports = router; 