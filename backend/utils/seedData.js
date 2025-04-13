const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../config/config');
const Admin = require('../models/adminModel');
const Staff = require('../models/staffModel');
const User = require('../models/userModel');

const seedData = async () => {
    try {
        // Connect to MongoDB
        await config.connectDB();
        console.log('Connected to MongoDB...');

        // Clear existing data
        await Admin.deleteMany({});
        await Staff.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data...');

        // Create admin users
        const adminData = [
            {
                name: 'admin1',
                password: 'admin123',
                role: 'Admin'
            },
            {
                name: 'admin2',
                password: 'admin123',
                role: 'Admin'
            }
        ];

        // Create staff users
        const staffData = [
            {
                name: 'staff1',
                password: 'staff123',
                role: 'Staff'
            },
            {
                name: 'staff2',
                password: 'staff123',
                role: 'Staff'
            }
        ];

        // Create student users
        const userData = [
            {
                name: 'Student One',
                email: 'student1@example.com',
                password: 'student123',
                role: 'Student'
            },
            {
                name: 'Student Two',
                email: 'student2@example.com',
                password: 'student123',
                role: 'Student'
            }
        ];

        // Hash passwords and create users
        const hashedAdmins = await Promise.all(
            adminData.map(async (admin) => {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(admin.password, salt);
                return { ...admin, password: hashedPassword };
            })
        );

        const hashedStaff = await Promise.all(
            staffData.map(async (staff) => {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(staff.password, salt);
                return { ...staff, password: hashedPassword };
            })
        );

        const hashedUsers = await Promise.all(
            userData.map(async (user) => {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                return { ...user, password: hashedPassword };
            })
        );

        // Insert into database
        await Admin.insertMany(hashedAdmins);
        await Staff.insertMany(hashedStaff);
        await User.insertMany(hashedUsers);

        console.log('Data seeded successfully!');
        console.log('\nYou can now log in with these credentials:');
        console.log('\nAdmins:');
        adminData.forEach(admin => {
            console.log(`Username: ${admin.name}, Password: ${admin.password}`);
        });
        console.log('\nStaff:');
        staffData.forEach(staff => {
            console.log(`Username: ${staff.name}, Password: ${staff.password}`);
        });
        console.log('\nStudents:');
        userData.forEach(user => {
            console.log(`Email: ${user.email}, Password: ${user.password}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

// Run the seed function
seedData(); 