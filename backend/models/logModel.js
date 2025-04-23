const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkInTime: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: Date
  },
  curfewTime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curfew',
    required: false // Not every log may have it set initially
  },
  status: {
    type: String,
    enum: ['OnTime', 'Late', 'Excused', 'Pending'],
    default: 'Pending'
  },
  isCurfewViolated: {
    type: Boolean,
    default: false
  },
  notifiedParents: {
    type: Boolean,
    default: false
  },
  responseFromParent: {
    type: String,
    enum: ['Yes', 'No', null],
    default: null
  }
}, {
  timestamps: true
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
