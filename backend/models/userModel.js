const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Physical Attributes
    height: {
      type: Number, // in centimeters
      required: true,
    },
    weight: {
      type: Number, // in kilograms
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: [16, 'Age must be at least 16 years old'],
      max: [100, 'Age cannot exceed 100 years']
    },
    // Citizenship and Religion
    citizenshipStatus: {
      type: String,
      required: true
    },
    religion: {
      type: String,
      required: true
    },
    // Medical Information
    medicalHistory: {
      type: String,
      required: false // Optional field
    },
    // Emergency Contact
    emergencyContact: {
      name: {
        type: String,
        required: true
      },
      number: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^\+?[\d\s-]{10,}$/.test(v);
          },
          message: props => `${props.value} is not a valid phone number!`
        }
      }
    },
    // Application Information
    dateOfApplication: {
      type: Date,
      default: null
    },
    // Dormitory Preferences
    preferences: {
      buildingPreference: {
        type: String,
        required: true,
        enum: ['Male Building', 'Female Building']
      },
      occupancyPreference: {
        type: String,
        required: true,
        enum: ['Single Occupancy', 'Double Occupancy']
      }
    },
    studentStatus: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    approvalStatus: {
      type: String,
      enum: ['Approved', 'Declined', 'Pending'],
      default: 'Pending'
    },
    contactInfo: {
      type: String,
    },
    studentDormNumber: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\d+$/.test(v);
        },
        message: (props) =>
          `${props.value} must contain only numeric characters!`,
      },
    },
    courseYear: {
      type: String,
    },
    address: {
      type: String,
    },
    gender: {
      type: String,
    },
    fatherName: {
      type: String,
    },
    fatherContact: {
      type: String,
    },
    motherName: {
      type: String,
    },
    motherContact: {
      type: String,
    },
    // Telegram chat IDs captured via /start handshake
    fatherChatId: {
      type: String,
    },
    motherChatId: {
      type: String,
    },
    parentsAddress: {
      type: String,
    },
    password: {
      type: String,
      required: false,
      default: 'Password123' // Default password for new applications
    },
    profilePicture: {
      type: String,
    },
    role: {
      type: String,
      default: "student",
      immutable: true, // This ensures the role cannot be changed after creation
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    offenseHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offense",
      },
    ],
    conversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
    unreadNotifications: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in', 'out'],
      default: 'out'
    },
    lastAction: {
      type: String,
      enum: ['check-in', 'check-out'],
      default: 'check-out'
    },
    lastCheckIn: {
      type: Date
    },
    lastCheckOut: {
      type: Date
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
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
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
