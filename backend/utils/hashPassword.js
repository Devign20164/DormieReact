const bcrypt = require('bcryptjs');

async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Original password:', password);
        console.log('Hashed password:', hashedPassword);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

// Hash 'admin123'
hashPassword('admin123').then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Error:', error);
    process.exit(1);
}); 