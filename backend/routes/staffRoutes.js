const express = require('express');
const router = express.Router();
const {
  loginStaff,
  logoutStaff,
  getStaffProfile
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');

// Auth routes
router.post('/login', loginStaff);
router.post('/logout', protect, logoutStaff);
router.get('/profile', protect, getStaffProfile);

module.exports = router; 