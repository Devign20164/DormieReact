const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'participants.userModel'
        },
        userModel: {
            type: String,
            enum: ['Admin', 'Student']
        },
        unreadCount: {
            type: Number,
            default: 0
        }
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient participant lookups
conversationSchema.index({ 'participants.user': 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation; 