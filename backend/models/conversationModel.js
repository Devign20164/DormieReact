const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'participants.model'
    },
    model: {
      type: String,
      required: true,
      enum: ['User', 'Admin']
    },
    name: {
      type: String,
      required: true
    }
  }],
  subject: {
    type: String,
    default: 'No Subject'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for faster querying
conversationSchema.index({ 'participants.id': 1 });
conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation; 