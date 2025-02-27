const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'cashier', 'salesperson', 'assistant'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Hash password
userSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.password = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex');
};

// Verify password
userSchema.methods.verifyPassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex');
    return this.password === hash;
};

// Method to return user data without sensitive information
userSchema.methods.toSafeObject = function() {
    return {
        id: this._id,
        username: this.username,
        role: this.role,
        createdAt: this.createdAt,
        lastLogin: this.lastLogin
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
