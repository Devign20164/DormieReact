const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipient.model'
    },
    model: {
      type: String,
      required: true,
      enum: ['User', 'Admin', 'Staff']
    }
  },
  type: {
    type: String,
    required: true,
    enum: [
      'message', 
      'system', 
      'alert', 
      'NEW_FORM', 
      'FORM_APPROVED', 
      'FORM_DECLINED',
      'FORM_ASSIGNED',
      'FORM_COMPLETED',
      'FORM_RESCHEDULED',
      'NEW_ASSIGNMENT',
      'FORM_STARTED'
    ]
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Message', 'Conversation', 'User', 'Admin', 'JobRequestForm']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  }
}, {
  timestamps: true
});

// Indexes for faster querying
notificationSchema.index({ 'recipient.id': 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 