const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
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
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getAllForms,
  getFormById,
  updateFormStatus,
  assignStaffToForm,
  createBill,
  getAllBills,
  getBillById,
  updateBillStatus,
  deleteBill,
  returnBillToStudent,
  getCurfews,
  getLatestCurfew,
  updateCurfew,
  downloadFile,
  createCurfew,
  deleteLatestCurfew,
  getLogs,
  excuseLateStatus,
  getAllOffenses,
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  toggleNewsPin,
  incrementNewsViews,
  uploadNewsImage,
  getNewsImage,
  getStudentAnalytics,
  getBuildingAnalytics,
  getOccupancyAnalytics,
  getFormAnalytics,
  getOffenseAnalytics,
  getCheckinAnalytics,
  getRecentActivity
} = require('../controllers/adminController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const { asyncHandler } = require('../middleware/asyncHandler');
const { Offense, Log, Room, User } = require('../models');

// Auth routes
router.post('/login', loginAdmin);
router.post('/logout', protect, logoutAdmin);
router.get('/profile', protect, getAdminProfile);
router.put('/update-profile', protect, updateAdminProfile);
router.post('/update-password', protect, updateAdminPassword);

// Student management routes
router.get('/students', protect, getAllStudents);
router.get('/students/:studentId/offenses', protect, getStudentOffenses);
router.post('/students/:studentId/offenses', protect, createStudentOffense);
router.get('/offenses', protect, getAllOffenses);

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

// Staff Management Routes
router.get('/staff', protect, getAllStaff);
router.post('/staff', protect, createStaff);
router.get('/staff/:id', protect, getStaffById);
router.put('/staff/:id', protect, updateStaff);
router.delete('/staff/:id', protect, deleteStaff);

// Form routes
router.get('/forms', protect, getAllForms);
router.get('/forms/:id', protect, getFormById);
router.put('/forms/:id/status', protect, updateFormStatus);
router.put('/forms/:id/assign', protect, assignStaffToForm);

// Bill routes
router.post('/bills', protect, upload.single('billFile'), createBill);
router.get('/bills', protect, getAllBills);
router.get('/bills/:id', protect, getBillById);
router.put('/bills/:id/status', protect, updateBillStatus);
router.post('/bills/:id/return', protect, returnBillToStudent);
router.delete('/bills/:id', protect, deleteBill);

// File download route
router.get('/files/download/:filename', protect, downloadFile);

// Curfew route
router.get('/curfews', protect, getCurfews);
router.get('/curfews/latest', protect, getLatestCurfew);
router.post('/curfews', protect, createCurfew);
router.delete('/curfews/latest', protect, deleteLatestCurfew);
router.put('/curfews/:id', protect, updateCurfew);

// Log routes
router.get('/logs/:date', protect, getLogs);
router.put('/logs/:logId/entries/:entryId/excuse', protect, excuseLateStatus);

// News Management Routes
router.get('/news', protect, getAllNews);
router.get('/news/:id', protect, getNewsById);
router.post('/news', protect, createNews);
router.put('/news/:id', protect, updateNews);
router.delete('/news/:id', protect, deleteNews);
router.put('/news/:id/toggle-pin', protect, toggleNewsPin);
router.put('/news/:id/view', protect, incrementNewsViews);
router.post('/news/upload-image', protect, upload.single('image'), uploadNewsImage);
router.get('/files/news/:filename', getNewsImage); // Public access for news images

// Analytics routes
router.get('/analytics/students', protect, getStudentAnalytics);
router.get('/analytics/buildings', protect, getBuildingAnalytics);
router.get('/analytics/occupancy', protect, getOccupancyAnalytics);
router.get('/analytics/forms', protect, getFormAnalytics);
router.get('/analytics/offenses', protect, getOffenseAnalytics);
router.get('/analytics/checkins', protect, getCheckinAnalytics);
router.get('/analytics/recent-activity', protect, getRecentActivity);

module.exports = router;