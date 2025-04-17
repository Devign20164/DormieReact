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
  // Form related controllers
  submitForm,
  getStudentForms,
  getFormById,
  cancelForm
} = require('../controllers/studentController');

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
router.post('/forms', protect, upload.single('file'), submitForm);
router.get('/forms', protect, getStudentForms);
router.get('/forms/:id', protect, getFormById);
router.delete('/forms/:id', protect, cancelForm);

module.exports = router; 