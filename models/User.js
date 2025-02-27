const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption key and IV - in production these should be in environment variables
const ENCRYPTION_KEY = crypto.randomBytes(32); // 256 bit key
const IV_LENGTH = 16;

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
        required: false
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

// Encrypt password
userSchema.methods.setPassword = function(password) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    this.password = iv.toString('hex') + ':' + encrypted;
};

// Decrypt password
userSchema.methods.getDecryptedPassword = function() {
    const [ivHex, encryptedHex] = this.password.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

// Verify password
userSchema.methods.verifyPassword = function(password) {
    return this.getDecryptedPassword() === password;
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
