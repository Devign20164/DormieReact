const mongoose = require("mongoose");

const logEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  checkInTime: {
    type: Date,
    required: true,
  },
  checkOutTime: {
    type: Date,
  },
  isCurfewViolated: {
    type: Boolean,
    default: false,
  },
  checkInStatus: {
    type: String,
    enum: ["OnTime", "Late", "Pending", "Excused"],
    default: "Pending",
  },
  checkOutStatus: {
    type: String,
    enum: ["OnTime", "Late", "Pending", "Excused"],
    default: "Pending",
  }
});

const logSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    building:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    entries: [logEntrySchema],
    curfewTime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Curfew",
      required: false,
    },
    status: {
      type: String,
      enum: ["OnTime", "Late", "Pending"],
      default: "Pending",
    },
    notifiedParents: {
      type: Boolean,
      default: false,
    },
    responseFromParent: {
      type: String,
      enum: ["Yes", "No", null],
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

// Add middleware to automatically populate user and curfewTime on find queries
logSchema.pre('find', function(next) {
  this.populate({ path: 'user', select: 'name studentDormNumber email contactInfo gender fatherName fatherContact motherName motherContact fatherChatId motherChatId' });
  this.populate('curfewTime');
  // Properly populate the user in each entry
  this.populate({ path: 'entries.user', select: 'name studentDormNumber' });
  next();
});

logSchema.pre('findOne', function(next) {
  this.populate({ path: 'user', select: 'name studentDormNumber email contactInfo gender fatherName fatherContact motherName motherContact fatherChatId motherChatId' });
  this.populate('curfewTime');
  // Properly populate the user in each entry
  this.populate({ path: 'entries.user', select: 'name studentDormNumber' });
  next();
});

// Add method to check if user can check in
logSchema.methods.canCheckIn = function () {
  return this.entries.length < 2;
};

// Add method to check if user can check out
logSchema.methods.canCheckOut = function () {
  return (
    this.entries.length > 0 &&
    this.entries[this.entries.length - 1].checkOutTime === undefined
  );
};

// Method to update check-in status
logSchema.methods.updateCheckInStatus = function(entryIndex, status) {
  if (entryIndex >= 0 && entryIndex < this.entries.length) {
    this.entries[entryIndex].checkInStatus = status;
    return this.save();
  }
  return Promise.reject(new Error('Invalid entry index'));
};

// Method to update check-out status
logSchema.methods.updateCheckOutStatus = function(entryIndex, status) {
  if (entryIndex >= 0 && entryIndex < this.entries.length) {
    this.entries[entryIndex].checkOutStatus = status;
    return this.save();
  }
  return Promise.reject(new Error('Invalid entry index'));
};

const Log = mongoose.model("Log", logSchema);

module.exports = Log;