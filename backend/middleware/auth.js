const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Staff = require('../models/staffModel');
const Admin = require('../models/adminModel');
const config = require('../config/config');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Read JWT from the 'jwt' cookie
    token = req.cookies.jwt;

    if (token) {
        try {
            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret);

            // Based on the role in the token, fetch the appropriate user
            switch (decoded.role) {
                case 'student':
                    req.user = await User.findById(decoded.id).select('-password');
                    break;
                case 'staff':
                    req.user = await Staff.findById(decoded.id).select('-password');
                    break;
                case 'admin':
                    req.user = await Admin.findById(decoded.id).select('-password');
                    break;
                default:
                    res.status(401);
                    throw new Error('Not authorized, invalid role');
            }

            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// Middleware to check if user is admin
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Not authorized as admin'
        });
    }
};

// Middleware to check if user is staff
const staff = (req, res, next) => {
    if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Not authorized as staff'
        });
    }
};

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: '30d' // Token expires in 30 days
    });
};

module.exports = {
    protect,
    admin,
    staff,
    generateToken
}; 