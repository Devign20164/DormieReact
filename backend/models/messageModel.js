const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'sender.model'
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
  },
  recipient: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recipient.model'
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
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster querying
messageSchema.index({ 'sender.id': 1 });
messageSchema.index({ 'recipient.id': 1 });
messageSchema.index({ conversation: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 