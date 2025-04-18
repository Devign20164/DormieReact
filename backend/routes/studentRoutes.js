const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const {
  loginStudent,
  logoutStudent,
  getStudentProfile,
  checkEmailExists,
  checkDormNumberExists,
  checkPhoneExists,
  createStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
  startConversation,
  sendMessage,
  getConversations,
  getMessages,
  getAdmins,
  getOtherStudents,
  deleteAllNotifications,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  deleteNotification,
  createForm,
  getStudentForms,
  submitFormReview,
} = require('../controllers/studentController');
const Form = require('../models/FormModel');

// Auth routes
router.post('/login', loginStudent);
router.get('/profile', protect, getStudentProfile);

// Student management routes
router.get('/', protect, getAllStudents);
router.post('/', protect, createStudent);
router.put('/:id', protect, updateStudent);
router.delete('/:id', protect, deleteStudent);

// Validation routes
router.get('/check-email/:email', checkEmailExists);
router.get('/check-dorm/:dormNumber', checkDormNumberExists);
router.get('/check-phone/:phone', checkPhoneExists);

// Chat routes
router.post('/conversations', protect, startConversation);
router.post('/messages', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/messages/:conversationId', protect, getMessages);
router.get('/admins', protect, getAdmins);
router.get('/others', protect, getOtherStudents);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.get('/notifications/unread-count', protect, getUnreadNotificationCount);
router.delete('/notifications/:id', protect, deleteNotification);
router.delete('/notifications', protect, deleteAllNotifications);

// Form routes
router.post('/forms', protect, createForm);
router.get('/forms', protect, getStudentForms);
// Route to get a single form by ID
router.get('/forms/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id.toString();
    
    // Find the form
    const form = await Form.findById(id);
    
    // Check if form exists
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Check if form belongs to this student
    if (form.student.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only view your own forms' });
    }
    
    res.json(form);
  } catch (error) {
    console.error('Error fetching form by ID:', error);
    res.status(500).json({ message: 'Error fetching form details', error: error.message });
  }
});
router.post('/forms/:id/review', protect, submitFormReview);

module.exports = router; 