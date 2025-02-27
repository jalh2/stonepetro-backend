const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption key and IV - in production these should be in environment variables
const ENCRYPTION_KEY = crypto.scryptSync('your-password', 'salt', 32); // 32 bytes = 256 bits
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
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(password, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        this.password = iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Error encrypting password:', error);
        throw new Error('Failed to encrypt password');
    }
};

// Decrypt password
userSchema.methods.getDecryptedPassword = function() {
    try {
        if (!this.password) {
            throw new Error('No password set');
        }
        
        const parts = this.password.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid password format');
        }

        const [ivHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        
        if (iv.length !== IV_LENGTH) {
            throw new Error('Invalid IV length');
        }

        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt password: ' + error.message);
    }
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
