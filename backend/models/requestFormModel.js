const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobRequestFormSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room'
  },
  building: {
    type: Schema.Types.ObjectId,
    ref: 'Building'
  },
  userName: {
    type: String,
    required: true
  },
  studentDormNumber: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  buildingName: {
    type: String,
    required: true
  },
  requestType: {
    type: String,
    enum: ['Cleaning', 'Maintenance', 'Repair'],
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  scheduledDate: {
    type: Date
  },
  actualStartTime: {
    type: String
  },
  actualEndTime: {
    type: String
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Received', 'Approved', 'Assigned', 'Declined', 'Completed', 'Rescheduled', 'On Going'],
    default: 'Pending'
  },
  filePath: {
    type: String
  },
  staff: {
    type: Schema.Types.ObjectId,
    ref: 'Staff'
  },
  jobDate: {
    type: Date
  },
  taskStartTime: {
    type: Date
  },
  taskEndTime: {
    type: Date
  }
}, { timestamps: true });

// Pre-save hook to validate user exists and update their request forms array
JobRequestFormSchema.pre('save', async function(next) {
  try {
    if (this.isNew && this.user) {
      const User = mongoose.model('User');
      const user = await User.findById(this.user);
      
      if (!user) {
        throw new Error('User does not exist');
      }
      
      // Add this request form to the user's submittedRequestForms array
      await user.addRequestForm(this._id);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find requests by user
JobRequestFormSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).populate('room').populate('building').populate('staff');
};
// Add this to your JobRequestFormSchema
JobRequestFormSchema.pre('save', async function(next) {
  try {
    // If this is an existing document and the status has changed
    if (!this.isNew && this.isModified('status')) {
      const Notification = mongoose.model('Notification');
      const oldStatus = this._originalStatus; // You'll need to set this value
      
      // Determine notification type based on new status
      let notificationType;
      let notificationTitle;
      let notificationContent;
      
      switch(this.status) {
        case 'Approved':
          notificationType = 'FORM_APPROVED';
          notificationTitle = 'Request Approved';
          notificationContent = `Your ${this.requestType} request has been approved.`;
          break;
        case 'Declined':
          notificationType = 'FORM_DECLINED';
          notificationTitle = 'Request Declined';
          notificationContent = `Your ${this.requestType} request has been declined.`;
          break;
        case 'Assigned':
          notificationType = 'FORM_ASSIGNED';
          notificationTitle = 'Request Assigned';
          notificationContent = `Your ${this.requestType} request has been assigned to staff.`;
          break;
        case 'Completed':
          notificationType = 'FORM_COMPLETED';
          notificationTitle = 'Request Completed';
          notificationContent = `Your ${this.requestType} request has been completed.`;
          break;
        // Add other cases as needed
      }
      
      if (notificationType) {
        // Create notification for the user
        await Notification.create({
          recipient: {
            id: this.user,
            model: 'User'
          },
          type: notificationType,
          title: notificationTitle,
          content: notificationContent,
          relatedTo: {
            model: 'JobRequestForm',
            id: this._id
          }
        });
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Need to capture the original status before it changes
JobRequestFormSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified('status')) {
    this._originalStatus = this.getChanges().$set.status;
  }
  next();
});
const JobRequestForm = mongoose.model('JobRequestForm', JobRequestFormSchema);
module.exports = JobRequestForm;