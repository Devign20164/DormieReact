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
  getNewsImage
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

// Add the analytics routes
router.get('/analytics/offenses', protect, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Default to today if no dates provided
  const today = new Date();
  const todayStart = startDate 
    ? new Date(startDate) 
    : new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  const todayEnd = endDate 
    ? new Date(endDate) 
    : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  // Count offenses for today
  const todayOffenses = await Offense.countDocuments({
    dateOfOffense: { $gte: todayStart, $lte: todayEnd }
  });
  
  // Count offenses for yesterday
  const yesterdayOffenses = await Offense.countDocuments({
    dateOfOffense: { $gte: yesterdayStart, $lt: todayStart }
  });
  
  res.json({
    today: todayOffenses,
    yesterday: yesterdayOffenses
  });
}));

router.get('/analytics/logs', protect, asyncHandler(async (req, res) => {
  // Get today's date
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  // Aggregate logs to count check-in/check-out status
  const todayLogs = await Log.aggregate([
    {
      $match: {
        date: { $gte: todayStart, $lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) }
      }
    },
    {
      $unwind: '$entries'
    },
    {
      $group: {
        _id: '$entries.checkInStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Aggregate logs to count yesterday's check-in/check-out status
  const yesterdayLogs = await Log.aggregate([
    {
      $match: {
        date: { $gte: yesterdayStart, $lt: todayStart }
      }
    },
    {
      $unwind: '$entries'
    },
    {
      $group: {
        _id: '$entries.checkInStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Format the response
  const todayOnTime = todayLogs.find(item => item._id === 'OnTime')?.count || 0;
  const todayLate = todayLogs.find(item => item._id === 'Late')?.count || 0;
  const yesterdayOnTime = yesterdayLogs.find(item => item._id === 'OnTime')?.count || 0;
  const yesterdayLate = yesterdayLogs.find(item => item._id === 'Late')?.count || 0;
  
  res.json({
    onTime: todayOnTime,
    late: todayLate,
    yesterday: {
      onTime: yesterdayOnTime,
      late: yesterdayLate
    }
  });
}));

router.get('/analytics/occupancy', protect, asyncHandler(async (req, res) => {
  // Get room statistics
  const totalRooms = await Room.countDocuments();
  const occupiedRooms = await Room.countDocuments({ status: 'Occupied' });
  
  // Calculate rates
  const currentRate = Math.round((occupiedRooms / totalRooms) * 100);
  
  // Get historical data (from previous day or last record)
  // In a real implementation, you might want to store historical rates in a separate collection
  const previousRate = currentRate - Math.floor(Math.random() * 5) + 2; // Mock data for demo
  
  res.json({
    totalRooms,
    occupiedRooms,
    currentRate,
    previousRate
  });
}));

router.get('/analytics/recent-activity', protect, asyncHandler(async (req, res) => {
  // Get most recent check-ins
  const recentCheckIns = await Log.aggregate([
    {
      $unwind: '$entries'
    },
    {
      $sort: { 'entries.checkInTime': -1 }
    },
    {
      $limit: 5
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    {
      $project: {
        _id: 1,
        checkInTime: '$entries.checkInTime',
        status: '$entries.checkInStatus',
        studentName: { $arrayElemAt: ['$userDetails.name', 0] },
        studentId: { $arrayElemAt: ['$userDetails._id', 0] }
      }
    }
  ]);
  
  // Get recent offenses
  const recentOffenses = await Offense.find()
    .sort({ dateOfOffense: -1 })
    .limit(3)
    .populate('student', 'name')
    .populate('recordedBy', 'name')
    .lean();
    
  // Format the offenses for display
  const formattedOffenses = recentOffenses.map(offense => ({
    _id: offense._id,
    title: offense.offenseReason,
    student: offense.student?.name || 'Unknown Student',
    date: offense.dateOfOffense,
    type: offense.typeOfOffense,
    recordedBy: offense.recordedBy?.name || 'Unknown Admin'
  }));
  
  res.json({
    checkIns: recentCheckIns,
    maintenanceRequests: formattedOffenses
  });
}));

router.get('/analytics/students', protect, asyncHandler(async (req, res) => {
  try {
    // Count total students from userModel
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    // Count active students (those assigned to rooms)
    const activeStudents = await User.countDocuments({ 
      role: 'student',
      'room': { $exists: true, $ne: null } 
    });
    
    // Get previous week's count for comparison
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // This is a simplified approach - in a real app you might store historical data
    // For demo, we'll use a slight variation to simulate change
    const previousTotal = totalStudents - Math.floor(Math.random() * 5);
    
    // Calculate percentage change
    const percentChange = previousTotal > 0 
      ? Math.round(((totalStudents - previousTotal) / previousTotal) * 100) 
      : 0;
    
    res.json({
      totalStudents,
      activeStudents,
      previousTotal,
      percentChange
    });
  } catch (error) {
    console.error('Error getting student analytics:', error);
    res.status(500).json({ message: 'Error retrieving student data' });
  }
}));

module.exports = router;