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
  deleteNotification
} = require('../controllers/studentController');

// Auth routes
router.post('/login', loginStudent);
router.post('/logout', protect, logoutStudent);
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

// Messaging routes
router.get('/admins', protect, getAdmins);
router.get('/others', protect, getOtherStudents);
router.post('/conversations', protect, startConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:conversationId/messages', protect, getMessages);
router.post('/messages', protect, sendMessage);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.get('/notifications/unread/count', protect, getUnreadNotificationCount);
router.delete('/notifications/delete-all', protect, deleteAllNotifications);
router.put('/notifications/:notificationId/read', protect, markNotificationRead);
router.put('/notifications/mark-all-read', protect, markAllNotificationsRead);
router.delete('/notifications/:notificationId', protect, deleteNotification);

module.exports = router; 