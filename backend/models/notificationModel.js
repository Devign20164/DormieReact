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
      'MESSAGE', 
      'MESSAGE_SEEN',
      'CONVERSATION_SEEN',
      'SYSTEM', 
      'ALERT', 
      'NEW_FORM', 
      'FORM_APPROVED', 
      'FORM_DECLINED',
      'FORM_ASSIGNED',
      'FORM_COMPLETED',
      'FORM_RESCHEDULED',
      'NEW_ASSIGNMENT',
      'FORM_STARTED',
      'STAFF_ASSIGNMENT'
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
      enum: ['Message', 'Conversation', 'User', 'Admin', 'Staff', 'JobRequestForm']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for faster querying
notificationSchema.index({ 'recipient.id': 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ 'relatedTo.id': 1, 'relatedTo.model': 1 });

// Instance method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return this.save();
};

// Static method to create message notification
notificationSchema.statics.createMessageNotification = async function(recipient, sender, message, conversation) {
  return this.create({
    recipient: {
      id: recipient.id,
      model: recipient.model
    },
    type: 'MESSAGE',
    title: `New message from ${sender.name}`,
    content: message.content.length > 30 ? message.content.substring(0, 30) + '...' : message.content,
    relatedTo: {
      model: 'Conversation',
      id: conversation._id
    },
    metadata: {
      senderId: sender.id,
      senderModel: sender.model,
      messageId: message._id
    }
  });
};

// Static method to create form update notification
notificationSchema.statics.createFormNotification = async function(recipientId, recipientModel, type, title, content, formId) {
  return this.create({
    recipient: {
      id: recipientId,
      model: recipientModel
    },
    type,
    title,
    content,
    relatedTo: {
      model: 'JobRequestForm',
      id: formId
    }
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 