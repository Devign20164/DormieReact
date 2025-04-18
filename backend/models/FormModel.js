const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
    // Basic Information
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    formType: {
        type: String,
        required: true,
        enum: ['Cleaning', 'Maintenance', 'Repair']
    },
    
    // Scheduling Information
    preferredStartTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    
    // File Attachments
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Status Tracking
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Approved', 'Rejected', 'Assigned', 'In Progress', 'In Review', 'Completed', 'Rescheduled'],
        default: 'Pending'
    },
    
    // Status History
    statusHistory: [{
        status: {
            type: String,
            required: true,
            enum: ['Pending', 'Approved', 'Rejected', 'Assigned', 'In Progress', 'In Review', 'Completed', 'Rescheduled']
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    
    // Previous status (for cases like rescheduling)
    previousStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Assigned', 'In Progress', 'In Review', 'Completed', 'Rescheduled']
    },
    
    // User References
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Review Information
    rejectionReason: {
        type: String,
        trim: true
    },
    studentReview: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        reviewDate: Date
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Calendar Integration
    calendarEventId: {
        type: String
    }
});

// Update the updatedAt timestamp before saving
formSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Form = mongoose.model('Form', formSchema);

module.exports = Form;
