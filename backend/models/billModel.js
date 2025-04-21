const mongoose = require('mongoose');

// Create the bills schema
const billSchema = new mongoose.Schema({
  // Student information (reference to User model)
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Room information (reference to Room model)
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  
  // Building information will be accessible through the Room model's building field
  
  // Bill amounts
  rentalFee: {
    type: Number,
    required: true
  },
  waterFee: {
    type: Number,
    default: 0
  },
  electricityFee: {
    type: Number,
    default: 0
  },
  otherFees: [{
    description: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  
  // Bill dates
  billingPeriodStart: {
    type: Date,
    required: true
  },
  billingPeriodEnd: {
    type: Date
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Overdue'],
    default: 'Unpaid'
  },
  
  // Payment tracking
  amountPaid: {
    type: Number,
    default: 0
  },
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    transactionId: {
      type: String
    },
    notes: {
      type: String
    }
  }],
  
  // Bill and Receipt files
  billFile: {
    type: String,  // Path to the bill file
    default: ''
  },
  receiptFile: {
    type: String,  // Path to the receipt file
    default: ''
  },
  
  // Notes or special instructions
  notes: {
    type: String
  },

  roomNumber: {
    type: String,
  },

  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  },

  paidAmount: {
    type: Number,
    default: 0,
  },

  paidDate: {
    type: Date,
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculating total bill amount
billSchema.virtual('totalAmount').get(function() {
  let total = this.rentalFee + this.waterFee + this.electricityFee;
  
  // Add other fees
  if (this.otherFees && this.otherFees.length > 0) {
    this.otherFees.forEach(fee => {
      total += fee.amount;
    });
  }
  
  return total;
});

// Virtual for calculating balance due
billSchema.virtual('balanceDue').get(function() {
  return this.totalAmount - this.amountPaid;
});

// Method to check if bill is overdue
billSchema.methods.isOverdue = function() {
  return this.dueDate < new Date() && this.paymentStatus !== 'Paid';
};

// Pre-save hook to update payment status
billSchema.pre('save', function(next) {
  // Skip status calculation if status is already explicitly set
  // This ensures new bills created with status 'pending' remain pending
  if (this.isNew && this.status) {
    return next();
  }
  
  // Calculate total amount
  const totalAmount = this.rentalFee + this.waterFee + this.electricityFee +
    (this.otherFees || []).reduce((sum, fee) => sum + fee.amount, 0);
  
  // Determine payment status - only if status wasn't set manually
  if (this.status === 'paid' || this.amountPaid >= totalAmount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partially_paid';
  } else if (this.dueDate < new Date() && !this.isNew) {
    // Only set overdue for existing bills, not new ones
    this.status = 'overdue';
  } else if (!this.status) {
    // Default to pending only if status isn't set
    this.status = 'pending';
  }
  
  next();
});

// Method to add a payment
billSchema.methods.addPayment = async function(paymentData) {
  this.payments.push(paymentData);
  this.amountPaid += paymentData.amount;
  await this.save();
  return this;
};

// Static method to find unpaid bills for a student
billSchema.statics.findUnpaidBillsByStudent = function(studentId) {
  return this.find({
    student: studentId,
    paymentStatus: { $in: ['Unpaid', 'Partially Paid', 'Overdue'] }
  })
  .populate('student', 'name email contactInfo')
  .populate({
    path: 'room',
    select: 'roomNumber price',
    populate: {
      path: 'building',
      select: 'name'
    }
  })
  .sort({ dueDate: 1 });
};

// Static method to generate monthly bills for all active rooms
billSchema.statics.generateMonthlyBills = async function(billingMonth, dueDate) {
  const Room = mongoose.model('Room');
  
  // Find all occupied rooms
  const occupiedRooms = await Room.find({ status: 'Occupied' })
    .populate('occupants')
    .populate('building');
  
  const bills = [];
  
  // Calculate billing period
  const billingPeriodStart = new Date(billingMonth);
  const billingPeriodEnd = new Date(billingMonth);
  billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
  billingPeriodEnd.setDate(billingPeriodEnd.getDate() - 1);
  
  // Create a bill for each occupant in each room
  for (const room of occupiedRooms) {
    for (const occupant of room.occupants) {
      // Calculate per-person rental fee
      const rentalFee = room.price / room.occupants.length;
      
      // Create a new bill
      const bill = new this({
        student: occupant._id,
        room: room._id,
        rentalFee: rentalFee,
        waterFee: 50, // Default water fee - can be adjusted as needed
        electricityFee: 100, // Default electricity fee - can be adjusted as needed
        billingPeriodStart,
        billingPeriodEnd,
        dueDate: dueDate || new Date(billingPeriodEnd.getTime() + 7 * 24 * 60 * 60 * 1000) // Default due date is 7 days after billing period end
      });
      
      await bill.save();
      bills.push(bill);
    }
  }
  
  return bills;
};

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;