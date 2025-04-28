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
});

const logSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      enum: ["OnTime", "Late", "Excused", "Pending"],
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
    },
    excuseReason: {
      type: String,
      enum: [
        "ParentApproval",
        "MedicalEmergency",
        "SchoolEvent",
        "TransportationIssue",
        "Other",
        null,
      ],
      default: null,
    },
    excuseDetails: {
      type: String,
    },
    excuseDocumentation: {
      type: String,
    },
    excuseSubmissionTime: {
      type: Date,
    },
    excuseReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    excuseReviewTime: {
      type: Date,
    },
    excuseNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add middleware to automatically populate user and curfewTime on find queries
logSchema.pre('find', function(next) {
  this.populate({ path: 'user', select: 'name studentDormNumber' });
  this.populate('curfewTime');
  // Also populate the user in each entry
  this.populate('entries.user', 'name studentDormNumber');
  next();
});

logSchema.pre('findOne', function(next) {
  this.populate({ path: 'user', select: 'name studentDormNumber' });
  this.populate('curfewTime');
  // Also populate the user in each entry
  this.populate('entries.user', 'name studentDormNumber');
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

// Add a method to mark as excused
logSchema.methods.markAsExcused = function (reason, details, reviewerId) {
  this.status = "Excused";
  this.excuseReason = reason;
  this.excuseDetails = details;
  this.excuseReviewedBy = reviewerId;
  this.excuseReviewTime = new Date();
  return this.save();
};

// Add a method to reject excuse
logSchema.methods.rejectExcuse = function (notes, reviewerId) {
  this.status = "Late";
  this.excuseNotes = notes;
  this.excuseReviewedBy = reviewerId;
  this.excuseReviewTime = new Date();
  return this.save();
};

const Log = mongoose.model("Log", logSchema);

module.exports = Log;
