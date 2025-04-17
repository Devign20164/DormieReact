const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema for tracking staff schedules/availability
const scheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  timeSlots: [{
    startTime: {
      type: String, // Format: "HH:00" in 24-hour format (e.g., "13:00")
      required: true
    },
    endTime: {
      type: String, // Format: "HH:00" in 24-hour format (e.g., "14:00")
      required: true
    },
    isBooked: {
      type: Boolean,
      default: false
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form'
    }
  }]
});

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    contactNumber: {
        type: String
    },
    role: {
        type: String,
        default: 'staff',
        immutable: true // This field cannot be modified after creation
    },
    typeOfStaff: {
        type: String,
        required: true,
        enum: ['Cleaner', 'Maintenance', 'Security'],
        default: 'Cleaner'
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'On Leave'],
        default: 'Available'
    },
    // Tasks currently assigned to this staff
    assignedTasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form'
    }],
    // Schedule to track hourly availability
    schedule: [scheduleSchema],
    // Metrics for performance tracking
    completedTasks: {
        type: Number,
        default: 0
    },
    averageTaskTime: {
        type: Number, // in minutes
        default: 0
    },
    workingHours: {
        startHour: {
            type: Number,
            default: 8 // 8 AM
        },
        endHour: {
            type: Number,
            default: 17 // 5 PM
        },
        workDays: {
            type: [String],
            default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
staffSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
staffSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if staff is available for a specific time slot
staffSchema.methods.isAvailableForTimeSlot = function(date, startTime, endTime) {
    // Convert date to YYYY-MM-DD format for comparison
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    // Find the schedule for the given date
    const daySchedule = this.schedule.find(s => 
        new Date(s.date).setHours(0, 0, 0, 0) === formattedDate.getTime()
    );
    
    // If no schedule exists for that day yet, staff is available
    if (!daySchedule) {
        return true;
    }
    
    // Check if the time slots are already booked
    return !daySchedule.timeSlots.some(slot => 
        (slot.startTime <= startTime && slot.endTime > startTime) || 
        (slot.startTime < endTime && slot.endTime >= endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime) &&
        slot.isBooked
    );
};

// Method to book a time slot for a staff member
staffSchema.methods.bookTimeSlot = async function(date, startTime, endTime, formId) {
    // Format date to midnight for comparison
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    // Check if available first
    if (!this.isAvailableForTimeSlot(date, startTime, endTime)) {
        throw new Error('This time slot is already booked');
    }
    
    // Find the schedule for the given date
    let daySchedule = this.schedule.find(s => 
        new Date(s.date).setHours(0, 0, 0, 0) === formattedDate.getTime()
    );
    
    // If no schedule exists for this day yet, create one
    if (!daySchedule) {
        this.schedule.push({
            date: formattedDate,
            timeSlots: []
        });
        daySchedule = this.schedule[this.schedule.length - 1];
    }
    
    // Add the time slot
    daySchedule.timeSlots.push({
        startTime,
        endTime,
        isBooked: true,
        formId
    });
    
    // Add to assigned tasks
    if (!this.assignedTasks.includes(formId)) {
        this.assignedTasks.push(formId);
    }
    
    // Update status if needed
    if (this.assignedTasks.length > 0) {
        this.status = 'Occupied';
    }
    
    // Save changes
    await this.save();
    return true;
};

// Method to release a time slot when task is completed
staffSchema.methods.releaseTimeSlot = async function(formId) {
    let slotReleased = false;
    
    // Find and remove the time slot
    for (const day of this.schedule) {
        const slotIndex = day.timeSlots.findIndex(slot => 
            slot.formId && slot.formId.toString() === formId.toString()
        );
        
        if (slotIndex !== -1) {
            day.timeSlots.splice(slotIndex, 1);
            slotReleased = true;
            break;
        }
    }
    
    // Remove from assigned tasks
    const taskIndex = this.assignedTasks.findIndex(id => id.toString() === formId.toString());
    if (taskIndex !== -1) {
        this.assignedTasks.splice(taskIndex, 1);
    }
    
    // Update status if no more tasks
    if (this.assignedTasks.length === 0) {
        this.status = 'Available';
    }
    
    // Save changes if slot was released
    if (slotReleased) {
        await this.save();
    }
    
    return slotReleased;
};

// Static method to find available staff for a specific time slot and task type
staffSchema.statics.findAvailableStaff = async function(date, startTime, endTime, formType) {
    // Map form type to staff type
    const staffTypeMapping = {
        'Repair': 'Maintenance',
        'Maintenance': 'Maintenance',
        'Cleaning': 'Cleaner'
    };
    
    const requiredStaffType = staffTypeMapping[formType];
    
    // Format date to midnight for comparison
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    // Find all staff of required type
    const staff = await this.find({ typeOfStaff: requiredStaffType });
    
    // Filter available staff
    const availableStaff = [];
    
    for (const s of staff) {
        if (s.isAvailableForTimeSlot(date, startTime, endTime)) {
            availableStaff.push(s);
        }
    }
    
    return availableStaff;
};

// Track task completion metrics
staffSchema.methods.completeTask = async function(formId, taskDuration) {
    // Increase completed tasks count
    this.completedTasks += 1;
    
    // Update average task time
    if (taskDuration) {
        this.averageTaskTime = 
            ((this.averageTaskTime * (this.completedTasks - 1)) + taskDuration) / this.completedTasks;
    }
    
    // Release time slot for this task
    await this.releaseTimeSlot(formId);
    
    return this;
};

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;