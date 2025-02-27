const User = require('../models/User');

const userController = {
    // Create a new user
    async create(req, res) {
        try {
            console.log('Creating new user:', req.body.username);
            const user = new User({
                username: req.body.username,
                role: req.body.role
            });

            // Set and encrypt the password
            console.log('Setting password for new user');
            user.setPassword(req.body.password);

            await user.save();
            console.log('User created successfully');
            
            // Return user data without sensitive information
            res.status(201).json({ 
                message: 'User created successfully',
                user: user.toSafeObject()
            });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ 
                message: 'Error creating user', 
                error: error.message 
            });
        }
    },

    // User login
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            const user = await User.findOne({ username });
            if (!user || !user.verifyPassword(password)) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            res.json({
                user: user.toSafeObject()
            });
        } catch (error) {
            res.status(500).json({ message: 'Error during login', error: error.message });
        }
    },

    // Get all users
    async getAll(req, res) {
        try {
            const users = await User.find({});
            res.json(users.map(user => user.toSafeObject()));
        } catch (error) {
            res.status(500).json({ message: 'Error fetching users', error: error.message });
        }
    },

    // Get user profile
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user.toSafeObject());
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving user profile' });
        }
    },

    // Get user's password
    async getPassword(req, res) {
        try {
            console.log('Getting password for user ID:', req.params.id);
            const user = await User.findById(req.params.id);
            if (!user) {
                console.log('User not found');
                return res.status(404).json({ message: 'User not found' });
            }
            
            console.log('User found:', user.username);
            try {
                const decryptedPassword = user.getDecryptedPassword();
                console.log('Password decrypted successfully');
                res.json({ password: decryptedPassword });
            } catch (decryptError) {
                console.error('Error decrypting password:', decryptError);
                res.status(500).json({ message: 'Error decrypting password', error: decryptError.message });
            }
        } catch (error) {
            console.error('Error in getPassword:', error);
            res.status(500).json({ message: 'Error retrieving password', error: error.message });
        }
    },

    // Update user's password
    async updatePassword(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ message: 'Password is required' });
            }

            user.setPassword(password);
            await user.save();

            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating password' });
        }
    },

    // Reset user's password
    async resetPassword(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const tempPassword = 'password123'; // You can generate a random password here
            user.setPassword(tempPassword);
            await user.save();

            res.json({ 
                message: 'Password reset successfully',
                tempPassword: tempPassword // In production, send this via email
            });
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(500).json({ 
                message: 'Error resetting password',
                error: error.message
            });
        }
    },

    // Update user
    async update(req, res) {
        try {
            const userId = req.params.id;
            
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Update allowed fields
            if (req.body.username) user.username = req.body.username;
            if (req.body.role) user.role = req.body.role;
            
            await user.save();
            res.json({ message: 'User updated successfully', user: user.toSafeObject() });
        } catch (error) {
            res.status(500).json({ message: 'Error updating user' });
        }
    },

    // Delete user
    async delete(req, res) {
        try {
            console.log('Attempting to delete user:', req.params.id);
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Use deleteOne instead of remove
            await User.deleteOne({ _id: req.params.id });
            console.log('User deleted successfully');
            
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ 
                message: 'Error deleting user', 
                error: error.message 
            });
        }
    }
};

module.exports = userController;
