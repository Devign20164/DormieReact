const express = require('express');
const router = express.Router();
const {
  loginStaff,
  logoutStaff,
  getStaffProfile,
  getAssignedForms,
  updateFormStatus,
  updateStaffPassword
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');

// Auth routes
router.post('/login', loginStaff);
router.post('/logout', protect, logoutStaff);
router.get('/profile', protect, getStaffProfile);

// Password management route
router.put('/update-password', protect, updateStaffPassword);

// Form management routes
router.get('/forms', protect, getAssignedForms);
router.put('/forms/:id/status', protect, updateFormStatus);

module.exports = router; 