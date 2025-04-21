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
      'FORM_SUBMITTED',
      'FORM_STATUS_CHANGED',
      'FORM_ASSIGNED',
      'FORM_REJECTED',
      'FORM_IN_PROGRESS',
      'FORM_COMPLETED',
      'FORM_REVIEW_NEEDED',
      'FORM_REVIEWED'
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
      enum: ['Message', 'Conversation', 'User', 'Admin', 'Staff', 'Form']
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

// Static method to create form submission notification
notificationSchema.statics.createFormSubmittedNotification = async function(form, student) {
  return this.create({
    recipient: {
      id: form.admin,
      model: 'Admin'
    },
    type: 'FORM_SUBMITTED',
    title: 'New Form Submission',
    content: `New ${form.formType} request submitted by ${student.name}`,
    relatedTo: {
      model: 'Form',
      id: form._id
    },
    metadata: {
      formType: form.formType,
      studentId: student._id,
      preferredStartTime: form.preferredStartTime
    }
  });
};

// Static method to create form status change notification
notificationSchema.statics.createFormStatusNotification = async function(form, newStatus, actor) {
  const statusMessages = {
    'Approved': 'Your form has been approved',
    'Rejected': 'Your form has been rejected',
    'Assigned': 'Your form has been assigned to staff',
    'In Progress': 'Staff has started working on your request',
    'In Review': 'Your form is ready for review',
    'Completed': 'Your form has been completed'
  };

  const recipients = [
    { id: form.student, model: 'User' }
  ];

  // If form is assigned, notify the staff member
  if (newStatus === 'Assigned' && form.staff) {
    recipients.push({ id: form.staff, model: 'Staff' });
  }

  const notifications = recipients.map(recipient => ({
    recipient,
    type: 'FORM_STATUS_CHANGED',
    title: 'Form Status Update',
    content: statusMessages[newStatus] || `Form status changed to ${newStatus}`,
    relatedTo: {
      model: 'Form',
      id: form._id
    },
    metadata: {
      newStatus,
      actorId: actor._id,
      actorModel: actor.model
    }
  }));

  return this.create(notifications);
};

// Static method to create form rejection notification
notificationSchema.statics.createFormRejectionNotification = async function(form, admin, reason) {
  return this.create({
    recipient: {
      id: form.student,
      model: 'User'
    },
    type: 'FORM_REJECTED',
    title: 'Form Rejected',
    content: `Your form has been rejected: ${reason}`,
    relatedTo: {
      model: 'Form',
      id: form._id
    },
    metadata: {
      rejectionReason: reason,
      adminId: admin._id
    }
  });
};

// Static method to create form review needed notification
notificationSchema.statics.createFormReviewNotification = async function(form) {
  return this.create({
    recipient: {
      id: form.student,
      model: 'User'
    },
    type: 'FORM_REVIEW_NEEDED',
    title: 'Form Review Required',
    content: 'Please review your completed form',
    relatedTo: {
      model: 'Form',
      id: form._id
    },
    metadata: {
      formType: form.formType,
      staffId: form.staff
    }
  });
};

// Static method to create notification when a form is reviewed
notificationSchema.statics.createFormReviewedNotification = async function(form, rating) {
  // Create notification for staff
  const notifications = [];
  
  // Notify staff if assigned
  if (form.staff) {
    notifications.push({
      recipient: {
        id: form.staff,
        model: 'Staff'
      },
      type: 'FORM_REVIEWED',
      title: 'New Review Received',
      content: `A student has left a ${rating}-star review for your service.`,
      relatedTo: {
        model: 'Form',
        id: form._id
      },
      metadata: {
        formType: form.formType,
        rating,
        formId: form._id
      }
    });
  }
  
  // Notify admin
  notifications.push({
    recipient: {
      model: 'Admin'
    },
    type: 'FORM_REVIEWED',
    title: 'New Form Review',
    content: `A student has left a ${rating}-star review for a ${form.formType} request.`,
    relatedTo: {
      model: 'Form',
      id: form._id
    },
    metadata: {
      formType: form.formType,
      rating,
      formId: form._id
    }
  });
  
  return this.create(notifications);
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;