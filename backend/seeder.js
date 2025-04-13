const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/adminModel');
const Staff = require('./models/staffModel');
const User = require('./models/userModel');
const config = require('./config/config');

dotenv.config();

// Sample Data
const adminData = [
    {
        name: 'admin',
        password: 'admin123',
        role: 'Admin'
    }
];

const staffData = [
    {
        name: 'John Cleaner',
        password: 'staff123',
        typeOfStaff: 'Cleaner',
        status: 'Available'
    },
    {
        name: 'Mike Maintenance',
        password: 'staff123',
        typeOfStaff: 'Maintenance',
        status: 'Available'
    },
    {
        name: 'Sam Security',
        password: 'staff123',
        typeOfStaff: 'Security',
        status: 'Available'
    }
];

const userData = [
    {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'student123',
        contactInfo: '1234567890',
        studentDormNumber: '101',
        courseYear: '3rd Year',
        address: '123 Student St',
        gender: 'Male',
        fatherName: 'James Doe',
        fatherContact: '9876543210',
        motherName: 'Jane Doe',
        motherContact: '9876543211',
        parentsAddress: '123 Parent St'
    },
    {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'student123',
        contactInfo: '0987654321',
        studentDormNumber: '102',
        courseYear: '2nd Year',
        address: '456 Student Ave',
        gender: 'Female',
        fatherName: 'John Smith',
        fatherContact: '9876543212',
        motherName: 'Mary Smith',
        motherContact: '9876543213',
        parentsAddress: '456 Parent Ave'
    }
];

// Import Data
const importData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Clear existing data
        await Admin.deleteMany();
        await Staff.deleteMany();
        await User.deleteMany();
        
        // Import new data
        await Admin.insertMany(adminData);
        await Staff.insertMany(staffData);
        await User.insertMany(userData);
        
        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

// Delete Data
const destroyData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Clear all data
        await Admin.deleteMany();
        await Staff.deleteMany();
        await User.deleteMany();
        
        console.log('Data Destroyed Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error destroying data:', error);
        process.exit(1);
    }
};

// Run script based on command line argument
if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
} 