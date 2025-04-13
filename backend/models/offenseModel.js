const mongoose = require('mongoose');

const offenseSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offenseReason: {
    type: String,
    required: true
  },
  dateOfOffense: {
    type: Date,
    default: Date.now,
    required: true
  },
  typeOfOffense: {
    type: String,
    required: true,
    enum: ['1st Offense', '2nd Offense', '3rd Offense', '4th Offense', 'Minor Offense', 'Major Offense']
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',   // Now references the Admin model instead of User
    required: true
  }
}, {
  timestamps: true
});

// Add a virtual to get the name of the admin who recorded the offense
offenseSchema.virtual('recordedByName', {
  ref: 'Admin',
  localField: 'recordedBy',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name' }
});

const Offense = mongoose.model('Offense', offenseSchema);

module.exports = Offense;