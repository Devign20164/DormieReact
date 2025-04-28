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
      required: true,
    },
    profilePicture: {
      type: String,
      default: "default-profile.png",
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
