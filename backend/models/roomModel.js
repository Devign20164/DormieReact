const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Single', 'Double']
  },
  price: {
    type: Number,
    required: true
  },
  occupants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['Available', 'Occupied'],
    default: 'Available'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if room is fully occupied
roomSchema.virtual('isFullyOccupied').get(function() {
  const maxOccupants = this.type === 'Single' ? 1 : 2;
  return (this.occupants || []).length >= maxOccupants;
});

// Virtual for calculating available spots
roomSchema.virtual('availableSpots').get(function() {
  const maxOccupants = this.type === 'Single' ? 1 : 2;
  return Math.max(0, maxOccupants - (this.occupants || []).length);
});

// Update status based on occupants
roomSchema.pre('save', function(next) {
  // Determine maximum occupancy based on room type
  const maxOccupants = this.type === 'Single' ? 1 : 2;
  
  // Skip automatic status calculation if status is explicitly set (e.g., from API)
  // and this is not a new document (prevents overriding API-set status)
  if (this.isModified('status') && !this.isNew) {
    return next();
  }
  
  // For new documents or when occupants/type changes, calculate the status
  if (this.isNew || this.isModified('occupants') || this.isModified('type')) {
    // If occupants array doesn't exist or isn't initialized, ensure it's an empty array
    if (!this.occupants) {
      this.occupants = [];
    }
    
    // Room is considered fully occupied when occupant count equals max capacity
    // Status is "Occupied" when a room reaches full capacity
    // Status is "Available" when a room has any open spots
    if ((this.occupants || []).length >= maxOccupants) {
      this.status = 'Occupied';
    } else {
      this.status = 'Available';
    }
    
    // Log for debugging purposes
    console.log(`Room ${this.roomNumber} status set to ${this.status} (${(this.occupants || []).length}/${maxOccupants} occupants)`);
  }
  
  next();
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;