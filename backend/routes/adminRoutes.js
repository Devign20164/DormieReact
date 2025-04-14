const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  startConversation,
  sendMessage,
  getConversations,
  getMessages,
  getAllStudents,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getAllBuildings,
  createBuilding,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
  getRoomsByBuilding,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
  getStudentOffenses,
  createStudentOffense,
  getAllForms,
  getFormDetails,
  updateFormStatus,
  deleteForm,
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  assignStaffToForm
} = require('../controllers/adminController');

const { protect } = require('../middleware/auth');

// Auth routes
router.post('/login', loginAdmin);
router.post('/logout', protect, logoutAdmin);
router.get('/profile', protect, getAdminProfile);

// Student management routes
router.get('/students', protect, getAllStudents);
router.get('/students/:studentId/offenses', protect, getStudentOffenses);
router.post('/students/:studentId/offenses', protect, createStudentOffense);

// Messaging routes
router.post('/conversations', protect, startConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:conversationId/messages', protect, getMessages);
router.post('/messages', protect, sendMessage);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.get('/notifications/unread/count', protect, getUnreadNotificationCount);
router.delete('/notifications/delete-all', protect, deleteAllNotifications);
router.delete('/notifications/:notificationId', protect, deleteNotification);
router.put('/notifications/:notificationId/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);

// Building Management Routes
router.get('/buildings', protect, getAllBuildings);
router.post('/buildings', protect, createBuilding);
router.get('/buildings/:buildingId', protect, getBuildingById);
router.put('/buildings/:buildingId', protect, updateBuilding);
router.delete('/buildings/:buildingId', protect, deleteBuilding);

// Room Management Routes
router.get('/buildings/:buildingId/rooms', protect, getRoomsByBuilding);
router.post('/buildings/:buildingId/rooms', protect, createRoom);
router.get('/rooms/:roomId', protect, getRoomById);
router.put('/rooms/:roomId', protect, updateRoom);
router.delete('/rooms/:roomId', protect, deleteRoom);

// Form Management Routes
router.get('/forms', protect, getAllForms);
router.get('/forms/:formId', protect, getFormDetails);
router.put('/forms/:formId/status', protect, updateFormStatus);
router.delete('/forms/:formId', protect, deleteForm);
router.post('/forms/:formId/assign', protect, assignStaffToForm);

// Staff Management Routes
router.get('/staff', protect, getAllStaff);
router.post('/staff', protect, createStaff);
router.get('/staff/:id', protect, getStaffById);
router.put('/staff/:id', protect, updateStaff);
router.delete('/staff/:id', protect, deleteStaff);

module.exports = router; 