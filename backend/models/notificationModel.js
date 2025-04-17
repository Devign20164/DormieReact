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
      'FORM_STATUS_CHANGE',
      'FORM_ASSIGNED',
      'FORM_COMPLETED',
      'FORM_REJECTED',
      'FORM_PRIORITY_CHANGE',
      'FORM_DUE_SOON',
      'FORM_OVERDUE'
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

// Static method to create form status change notification
notificationSchema.statics.createFormStatusNotification = async function(form, previousStatus, recipientInfo) {
  const statusMessages = {
    'Submitted': 'Your form has been submitted successfully',
    'Approved': 'Your form has been approved by an administrator',
    'In Queue': 'Your form is now in the task queue awaiting assignment',
    'Assigned': 'Your form has been assigned to a staff member',
    'In Progress': 'Work on your request has started',
    'Completed': 'Your request has been completed',
    'Rejected': 'Your form has been rejected'
  };

  const statusTitles = {
    'Submitted': 'Form Submitted',
    'Approved': 'Form Approved',
    'In Queue': 'Form In Queue',
    'Assigned': 'Form Assigned',
    'In Progress': 'Work Started',
    'Completed': 'Request Completed',
    'Rejected': 'Form Rejected'
  };

  // Determine the correct notification type based on status
  let notificationType = 'FORM_STATUS_CHANGE';
  if (form.status === 'Assigned') notificationType = 'FORM_ASSIGNED';
  if (form.status === 'Completed') notificationType = 'FORM_COMPLETED';
  if (form.status === 'Rejected') notificationType = 'FORM_REJECTED';

  return this.create({
    recipient: recipientInfo,
    type: notificationType,
    title: statusTitles[form.status],
    content: statusMessages[form.status],
    relatedTo: {
      model: 'Form',
      id: form._id
    },
    metadata: {
      formTitle: form.title,
      previousStatus: previousStatus,
      currentStatus: form.status,
      assignedStaff: form.assignedStaff,
      priority: form.priority,
      category: form.category
    }
  });
};

// Static method to create form priority change notification
notificationSchema.statics.createPriorityChangeNotification = async function(form, previousPriority, recipientInfo) {
  return this.create({
    recipient: recipientInfo,
    type: 'FORM_PRIORITY_CHANGE',
    title: 'Form Priority Changed',
    content: `The priority of your request "${form.title}" has been changed from ${previousPriority} to ${form.priority}`,
    relatedTo: {
      model: 'Form',
      id: form._id
    },
    metadata: {
      formTitle: form.title,
      previousPriority: previousPriority,
      currentPriority: form.priority
    }
  });
};

// Static method to create form due soon notification
notificationSchema.statics.createDueSoonNotification = async function(form, recipientInfo) {
  return this.create({
    recipient: recipientInfo,
    type: 'FORM_DUE_SOON',
    title: 'Task Due Soon',
    content: `The task "${form.title}" is due soon`,
    relatedTo: {
      model: 'Form',
      id: form._id
    },
    metadata: {
      formTitle: form.title,
      dueDate: form.dueDate,
      priority: form.priority
    }
  });
};

// Static method to create form overdue notification
notificationSchema.statics.createOverdueNotification = async function(form, recipientInfo) {
  return this.create({
    recipient: recipientInfo,
    type: 'FORM_OVERDUE',
    title: 'Task Overdue',
    content: `The task "${form.title}" is now overdue`,
    relatedTo: {
      model: 'Form',
      id: form._id
    },
    metadata: {
      formTitle: form.title,
      dueDate: form.dueDate,
      priority: form.priority
    }
  });
};

// Static method to notify all relevant parties about a form status change
notificationSchema.statics.notifyFormStatusChange = async function(form, previousStatus) {
  const notifications = [];
  
  // Always notify the student
  if (form.student) {
    notifications.push(
      await this.createFormStatusNotification(form, previousStatus, {
        id: form.student,
        model: 'User'
      })
    );
  }
  
  // Notify the assigned staff if exists and status relevant
  if (form.assignedStaff && ['Assigned', 'In Queue', 'In Progress'].includes(form.status)) {
    notifications.push(
      await this.createFormStatusNotification(form, previousStatus, {
        id: form.assignedStaff,
        model: 'Staff'
      })
    );
  }
  
  // Notify admin for specific states
  if (['Submitted', 'In Queue', 'Overdue'].includes(form.status)) {
    // Get all admin users - this would depend on your implementation
    // This is a placeholder - you would need to implement the actual query
    const adminIds = await mongoose.model('User').find({ role: 'admin' }).select('_id');
    
    for (const adminId of adminIds) {
      notifications.push(
        await this.createFormStatusNotification(form, previousStatus, {
          id: adminId,
          model: 'User'
        })
      );
    }
  }
  
  return notifications;
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;