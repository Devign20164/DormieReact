const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'Staff',
        immutable: true // This field cannot be modified after creation
    },
    typeOfStaff: {
        type: String,
        required: true,
        enum: ['Cleaner', 'Maintenance', 'Security'],
        default: 'Cleaner'
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Available', 'Occupied'],
        default: 'Available'
    }
}, {
    timestamps: true
});

// Hash password before saving
staffSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
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
staffSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff; 