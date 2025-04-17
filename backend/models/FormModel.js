const mongoose = require('mongoose');
const Notification = require('./notificationModel');

const formSchema = new mongoose.Schema({
  // Student information (populated from User)
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Student contact information for quick reference
  studentInfo: {
    name: String,
    contactNumber: String,
    email: String,
    dormNumber: String, // This is not the room number, but the student's dorm identifier
  },
  
  // Task details
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    buildingName: {
      type: String,
      required: true
    },
    roomNumber: {
      type: String,
      required: true
    },
    specificLocation: String
  },
  
  // Task categorization
  formType: {
    type: String,
    required: true,
    enum: ['Cleaning', 'Maintenance', 'Repair'],
    default: 'Maintenance'
  },
  
  // Appointment timing
  preferredTiming: {
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    }
  },
  actualTiming: {
    startTime: Date,
    endTime: Date,
    lateBy: Number // minutes late from preferred start time
  },
  
  // Assignment information
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['Submitted', 'Approved', 'Rejected', 'Rescheduled', 'Assigned', 'In Progress', 'Completed'],
    default: 'Submitted'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['Submitted', 'Approved', 'Rejected', 'Rescheduled', 'Assigned', 'In Progress', 'Completed']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      id: mongoose.Schema.Types.ObjectId,
      model: {
        type: String,
        enum: ['User', 'Admin', 'Staff', 'System']
      }
    },
    notes: String
  }],
  
  // Admin management
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'  // Admin user
    },
    reviewDate: Date,
    notes: String,
    rescheduleReason: String,
    rejectionReason: String
  },
  
  // Supporting materials
  attachments: [{
    filename: String,
    path: String,
    originalname: String, // Original file name from the user
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Feedback and resolution
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  resolutionNotes: String,
  
  // SLA tracking
  dueDate: Date,
  slaBreached: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Method to check if form is eligible for a specific staff based on type and staff type
formSchema.methods.isEligibleForStaff = function(staffType) {
  const formTypeToStaffMapping = {
    'Cleaning': 'Cleaner',
    'Maintenance': 'Maintenance',
    'Repair': 'Maintenance',
    'Security': 'Security',
    // Add other mappings as needed
  };
  
  return formTypeToStaffMapping[this.formType] === staffType;
};

// Method to check staff availability for the preferred timing
formSchema.statics.checkStaffAvailability = async function(formType, startTime, endTime) {
  const FormModel = this;
  const StaffModel = mongoose.model('Staff');
  
  // Get the appropriate staff type for this form type
  const formTypeToStaffMapping = {
    'Cleaning': 'Cleaner',
    'Maintenance': 'Maintenance',
    'Repair': 'Maintenance',
    'Security': 'Security',
    // Add other mappings as needed
  };
  const requiredStaffType = formTypeToStaffMapping[formType];
  
  // Find all staff of the required type
  const availableStaff = await StaffModel.find({
    typeOfStaff: requiredStaffType,
    status: 'Available'
  }).select('_id name');
  
  if (availableStaff.length === 0) {
    return { available: false, message: 'No staff of required type available' };
  }

  // Find all forms that have staff assigned during the requested time period
  const overlappingForms = await FormModel.find({
    'preferredTiming.startTime': { $lt: endTime },
    'preferredTiming.endTime': { $gt: startTime },
    status: { $in: ['Approved', 'Assigned', 'In Progress'] }
  }).select('assignedStaff');
  
  // Get IDs of staff who are already booked during this time
  const bookedStaffIds = overlappingForms.map(form => form.assignedStaff?.toString());
  
  // Filter available staff to only those not booked during this time
  const availableStaffForTime = availableStaff.filter(staff => 
    !bookedStaffIds.includes(staff._id.toString())
  );
  
  if (availableStaffForTime.length === 0) {
    // Suggest alternative times
    return { 
      available: false, 
      message: 'All staff of required type are booked at this time',
      suggestReschedule: true
    };
  }
  
  return { 
    available: true, 
    availableStaff: availableStaffForTime
  };
};

// Method to find next available slots for a specific form type
formSchema.statics.findNextAvailableSlots = async function(formType, fromDate = new Date(), numberOfSlots = 3) {
  const FormModel = this;
  const StaffModel = mongoose.model('Staff');
  
  // Map form type to staff type
  const formTypeToStaffMapping = {
    'Cleaning': 'Cleaner',
    'Maintenance': 'Maintenance',
    'Repair': 'Maintenance',
    'Security': 'Security',
    // Add other mappings as needed
  };
  const requiredStaffType = formTypeToStaffMapping[formType];
  
  // Get all staff of the required type
  const staffOfType = await StaffModel.find({
    typeOfStaff: requiredStaffType
  }).select('_id');
  
  if (staffOfType.length === 0) {
    return { error: 'No staff of required type available' };
  }
  
  // Get all booked slots for the next 7 days
  const nextWeek = new Date(fromDate);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const bookedForms = await FormModel.find({
    'preferredTiming.startTime': { $gte: fromDate, $lt: nextWeek },
    status: { $in: ['Approved', 'Assigned', 'In Progress'] }
  }).select('preferredTiming assignedStaff');
  
  // Simple algorithm to find available hour slots
  // Working hours 8AM to 5PM
  const availableSlots = [];
  const currentDate = new Date(fromDate);
  currentDate.setHours(8, 0, 0, 0); // Start at 8AM
  
  while (availableSlots.length < numberOfSlots && currentDate < nextWeek) {
    // Skip to next day if we're past working hours
    if (currentDate.getHours() >= 17) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(8, 0, 0, 0);
      continue;
    }
    
    // Create a potential 1-hour slot
    const slotStart = new Date(currentDate);
    const slotEnd = new Date(currentDate);
    slotEnd.setHours(slotEnd.getHours() + 1);
    
    // Check if any staff is available during this slot
    const bookedStaffIds = bookedForms
      .filter(form => {
        return (
          form.preferredTiming.startTime < slotEnd &&
          form.preferredTiming.endTime > slotStart
        );
      })
      .map(form => form.assignedStaff?.toString());
    
    // If there's at least one staff member available during this slot
    if (bookedStaffIds.length < staffOfType.length) {
      availableSlots.push({
        startTime: new Date(slotStart),
        endTime: new Date(slotEnd)
      });
    }
    
    // Move to next hour
    currentDate.setHours(currentDate.getHours() + 1);
  }
  
  return availableSlots;
};

// Method to automatically suggest priority based on description keywords
formSchema.methods.suggestPriority = function() {
  const urgentKeywords = ['urgent', 'emergency', 'leak', 'broken', 'danger', 'immediate'];
  const highKeywords = ['important', 'soon', 'electrical', 'not working'];
  const lowKeywords = ['when possible', 'sometime', 'minor'];
  
  const combinedText = `${this.title} ${this.description}`.toLowerCase();
  
  if (urgentKeywords.some(keyword => combinedText.includes(keyword))) {
    return 'Urgent';
  } else if (highKeywords.some(keyword => combinedText.includes(keyword))) {
    return 'High';
  } else if (lowKeywords.some(keyword => combinedText.includes(keyword))) {
    return 'Low';
  } else {
    return 'Medium';
  }
};

// Calculate SLA due date based on priority and form type
formSchema.methods.calculateDueDate = function() {
  const now = new Date();
  // Priority-based SLA
  let slaHours;
  
  switch(this.priority) {
    case 'Urgent':
      slaHours = 2; // 2 hours
      break;
    case 'High':
      slaHours = 24; // 24 hours
      break;
    case 'Medium':
      slaHours = 72; // 3 days
      break;
    case 'Low':
      slaHours = 168; // 7 days
      break;
    default:
      slaHours = 72; // Default: 3 days
  }
  
  // Form type adjustment
  if (this.formType === 'Cleaning') {
    slaHours = Math.min(slaHours, 48); // Max 48 hours for cleaning
  } else if (this.formType === 'Security') {
    slaHours = Math.min(slaHours, 24); // Max 24 hours for security
  }
  
  return new Date(now.getTime() + slaHours * 60 * 60 * 1000);
};

// Method to update status with history tracking
formSchema.methods.updateStatus = async function(newStatus, updatedBy, notes = '') {
  const oldStatus = this.status;
  
  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: updatedBy,
    notes: notes
  });
  
  // Update the current status
  this.status = newStatus;
  
  // Handle special status updates
  if (newStatus === 'In Progress') {
    this.actualTiming = this.actualTiming || {};
    this.actualTiming.startTime = new Date();
    
    // Calculate if service started late
    if (this.preferredTiming && this.preferredTiming.startTime) {
      const minutesLate = Math.floor((this.actualTiming.startTime - this.preferredTiming.startTime) / (1000 * 60));
      this.actualTiming.lateBy = minutesLate > 0 ? minutesLate : 0;
    }
  }
  
  if (newStatus === 'Completed' && this.actualTiming && this.actualTiming.startTime) {
    this.actualTiming.endTime = new Date();
  }
  
  // Save the form
  await this.save();
  
  // Create notifications
  await Notification.notifyFormStatusChange(this, oldStatus);
  
  return this;
};

// Method to reschedule form
formSchema.methods.reschedule = async function(newStartTime, newEndTime, updatedBy, reason = '') {
  // Store old timing for reference
  const oldStartTime = this.preferredTiming.startTime;
  const oldEndTime = this.preferredTiming.endTime;
  
  // Update timing
  this.preferredTiming = {
    startTime: newStartTime,
    endTime: newEndTime
  };
  
  // Update status and add to history
  await this.updateStatus('Rescheduled', updatedBy, 
    `Rescheduled from ${oldStartTime.toLocaleString()} to ${newStartTime.toLocaleString()}. Reason: ${reason}`
  );
  
  // Update admin review
  this.adminReview = this.adminReview || {};
  this.adminReview.reviewedBy = updatedBy.id;
  this.adminReview.reviewDate = new Date();
  this.adminReview.rescheduleReason = reason;
  
  // Save the form
  await this.save();
  
  // Create notifications for rescheduling
  await Notification.createRescheduleNotification(this, oldStartTime, oldEndTime, {
    id: this.student,
    model: 'User'
  });
  
  return this;
};

// Method to approve form
formSchema.methods.approve = async function(adminId) {
  // Update status
  await this.updateStatus('Approved', {
    id: adminId,
    model: 'Admin'
  }, 'Form approved by admin');
  
  // Update admin review
  this.adminReview = this.adminReview || {};
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewDate = new Date();
  
  // Save the form
  await this.save();
  
  return this;
};

// Method to reject form
formSchema.methods.reject = async function(adminId, reason = '') {
  // Update status
  await this.updateStatus('Rejected', {
    id: adminId,
    model: 'Admin'
  }, `Form rejected. Reason: ${reason}`);
  
  // Update admin review
  this.adminReview = this.adminReview || {};
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewDate = new Date();
  this.adminReview.rejectionReason = reason;
  
  // Save the form
  await this.save();
  
  return this;
};

// Method to assign staff to form
formSchema.methods.assignStaff = async function(staffId, assignedBy) {
  const StaffModel = mongoose.model('Staff');
  
  // First check if there is already a staff assigned
  if (this.assignedStaff) {
    // Update the previous staff's status
    await StaffModel.findByIdAndUpdate(this.assignedStaff, { status: 'Available' });
  }
  
  // Assign new staff
  this.assignedStaff = staffId;
  
  // Update the new staff's status
  await StaffModel.findByIdAndUpdate(staffId, { status: 'Occupied' });
  
  // Update status
  if (this.status === 'Approved') {
    await this.updateStatus('Assigned', assignedBy, `Assigned to staff ID: ${staffId}`);
  } else {
    // Just update the assignment without changing status
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: assignedBy,
      notes: `Reassigned to staff ID: ${staffId}`
    });
    
    await this.save();
    
    // Create notifications
    await Notification.createAssignmentNotification(this, {
      id: staffId,
      model: 'Staff'
    });
  }
  
  return this;
};

// Method to complete form by staff
formSchema.methods.complete = async function(staffId, resolutionNotes = '') {
  const StaffModel = mongoose.model('Staff');
  
  // End the task
  this.actualTiming = this.actualTiming || {};
  this.actualTiming.endTime = new Date();
  this.resolutionNotes = resolutionNotes;
  
  // Update status
  await this.updateStatus('Completed', {
    id: staffId,
    model: 'Staff'
  }, `Task completed. Notes: ${resolutionNotes}`);
  
  // Update staff status back to available
  await StaffModel.findByIdAndUpdate(staffId, { status: 'Available' });
  
  // Create completion notification for student
  await Notification.createCompletionNotification(this, {
    id: this.student,
    model: 'User'
  });
  
  return this;
};

// Pre-save hook to set initial values
formSchema.pre('save', async function(next) {
  // If this is a new form
  if (this.isNew) {
    // Auto-suggest priority if not already set
    if (!this.priority || this.priority === 'Medium') {
      this.priority = this.suggestPriority();
    }
    
    // Set due date based on priority
    if (!this.dueDate) {
      this.dueDate = this.calculateDueDate();
    }
    
    // Initialize status history if empty
    if (!this.statusHistory || this.statusHistory.length === 0) {
      this.statusHistory = [{
        status: 'Submitted',
        timestamp: new Date(),
        updatedBy: {
          id: this.student,
          model: 'User'
        },
        notes: 'Form initially submitted'
      }];
    }
  }
  
  next();
});

// Post-save hook to create notifications for new forms
formSchema.post('save', async function(doc, next) {
  try {
    // If this is a new form (first status is Submitted and was just created)
    if (doc.statusHistory && 
        doc.statusHistory.length === 1 && 
        doc.statusHistory[0].status === 'Submitted' &&
        doc.createdAt && 
        (new Date() - doc.createdAt) < 1000) {
      
      const Notification = mongoose.model('Notification');
      
      // Create notification for student
      await Notification.create({
        recipient: { 
          id: doc.student, 
          model: 'User' 
        },
        sender: { 
          id: doc.student, 
          model: 'User' 
        },
        type: 'SYSTEM',
        title: 'Form Submitted',
        content: `Your ${doc.formType.toLowerCase()} request "${doc.title}" has been submitted successfully.`,
        relatedTo: {
          model: 'Form',
          id: doc._id
        }
      });
      
      // Create notification for admin
      await Notification.create({
        recipient: { 
          model: 'Admin' // Notify all admins
        },
        sender: { 
          id: doc.student, 
          model: 'User' 
        },
        type: 'FORM_STATUS_CHANGE',
        title: 'New Form Submission',
        content: `${doc.studentInfo.name} has submitted a new ${doc.formType.toLowerCase()} request: "${doc.title}"`,
        relatedTo: {
          model: 'Form',
          id: doc._id
        }
      });
    }
  } catch (error) {
    console.error('Error creating form notification:', error);
    // Don't block the save operation if notification fails
  }
  
  next();
});

const Form = mongoose.model('Form', formSchema);
module.exports = Form;