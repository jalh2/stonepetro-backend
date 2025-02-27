const User = require('../models/User');

const userController = {
    // Create a new user
    async create(req, res) {
        try {
            const { username, password, role } = req.body;

            // Check if username already exists
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            const user = new User({
                username,
                role
            });

            user.setPassword(password);
            await user.save();

            res.status(201).json({ message: 'User created successfully', user: user.toSafeObject() });
        } catch (error) {
            res.status(500).json({ message: 'Error creating user', error: error.message });
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
            res.status(500).json({ message: 'Error fetching profile', error: error.message });
        }
    },

    // Get user's password
    async getPassword(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ password: user.getDecryptedPassword() });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching password', error: error.message });
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
            res.status(500).json({ message: 'Error updating password', error: error.message });
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
            const allowedUpdates = ['role'];
            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    user[field] = req.body[field];
                }
            });

            // Update password if provided
            if (req.body.password) {
                user.setPassword(req.body.password);
            }

            await user.save();
            res.json({ message: 'User updated successfully', user: user.toSafeObject() });
        } catch (error) {
            res.status(500).json({ message: 'Error updating user', error: error.message });
        }
    },

    // Delete user
    async delete(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            await user.remove();
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting user', error: error.message });
        }
    }
};

module.exports = userController;
