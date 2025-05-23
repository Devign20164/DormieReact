const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const {
  loginStudent,
  logoutStudent,
  getStudentProfile,
  checkInStudent,
  checkOutStudent,
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
  rescheduleForm,
  getStudentBills,
  submitBillPayment,
  getStudentLogs,
  verifyStudentPassword,
  getStudentNews,
  getStudentNewsById,
  updateStudentPassword,
  getStudentOffenses,
  getStudentById,
  createApplication
} = require('../controllers/studentController');
const Form = require('../models/FormModel');
const path = require('path');
const fs = require('fs');

// Auth routes
router.post('/login', loginStudent);
router.post('/logout', logoutStudent);
router.get('/profile', protect, getStudentProfile);
router.put('/update-password', protect, updateStudentPassword);

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

// News routes
router.get('/news', protect, getStudentNews);
router.get('/news/:id', protect, getStudentNewsById);

// Form routes
router.post('/forms', protect, upload.array('files'), createForm);
router.get('/forms', protect, getStudentForms);
router.post('/forms/:id/review', protect, submitFormReview);
router.put('/forms/:id/reschedule', protect, rescheduleForm);

// Offenses route
router.get('/offenses', protect, getStudentOffenses);

// Student management routes (put these after all specific routes)
router.get('/', protect, getAllStudents);
router.post('/', protect, createStudent);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, updateStudent);
router.delete('/:id', protect, deleteStudent);

// Check-in/Check-out routes
router.post('/:id/check-in', protect, checkInStudent);
router.post('/:id/check-out', protect, checkOutStudent);

// Password verification route
router.post('/:id/verify-password', protect, verifyStudentPassword);

// Get student bills
router.get('/:studentId/bills', protect, getStudentBills);

// Bill payment route
router.post('/bills/:id/pay', protect, upload.single('receiptFile'), submitBillPayment);

// File download route
router.get('/files/download/:filename', protect, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Log the request
    console.log(`File download request for: ${filename}`);
    console.log(`Looking for file at: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Send the file
    console.log(`Sending file: ${filePath}`);
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(`Error sending file: ${err.message}`);
        // If headers already sent, can't send error response
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error(`File download error: ${error.message}`);
    res.status(500).json({ message: 'Server error while downloading file' });
  }
});

// Application routes
router.post('/apply', upload.single('profilePicture'), createApplication);

module.exports = router; 