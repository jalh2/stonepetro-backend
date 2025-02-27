const StorageBalance = require('../models/StorageBalance');

// Get current storage balance
exports.getBalance = async (req, res) => {
    try {
        let storage = await StorageBalance.findOne();
        if (!storage) {
            storage = await StorageBalance.create({
                pmsBalance: 0,
                agoBalance: 0,
                atkBalance: 0,
                unit: 'gallons',
                transactions: []
            });
        }
        res.json({
            pmsBalance: storage.pmsBalance,
            agoBalance: storage.agoBalance,
            atkBalance: storage.atkBalance
        });
    } catch (error) {
        console.error('Error in getBalance:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update storage balance
exports.updateBalance = async (req, res) => {
    try {
        const { amount, type, description, petroleumType } = req.body;

        if (!amount || !type || !description || !petroleumType) {
            return res.status(400).json({ message: 'Amount, type, description, and petroleumType are required' });
        }

        let balance = await StorageBalance.findOne();
        if (!balance) {
            balance = await StorageBalance.create({
                pmsBalance: 0,
                agoBalance: 0,
                atkBalance: 0,
                unit: 'gallons',
                transactions: []
            });
        }

        // Calculate new balance
        let newBalance;
        if (petroleumType === 'pms') {
            newBalance = type === 'addition' 
                ? balance.pmsBalance + amount 
                : balance.pmsBalance - amount;
        } else if (petroleumType === 'ago') {
            newBalance = type === 'addition' 
                ? balance.agoBalance + amount 
                : balance.agoBalance - amount;
        } else if (petroleumType === 'atk') {
            newBalance = type === 'addition' 
                ? balance.atkBalance + amount 
                : balance.atkBalance - amount;
        }

        // Prevent negative balance
        if (newBalance < 0) {
            return res.status(400).json({ message: 'Insufficient balance for this transaction' });
        }

        // Update balance
        if (petroleumType === 'pms') {
            balance.pmsBalance = newBalance;
        } else if (petroleumType === 'ago') {
            balance.agoBalance = newBalance;
        } else if (petroleumType === 'atk') {
            balance.atkBalance = newBalance;
        }

        // Add transaction to history
        balance.transactions.push({
            amount,
            type,
            petroleumType,
            description,
            date: new Date()
        });

        await balance.save();
        res.json(balance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
    try {
        const storage = await StorageBalance.findOne();
        if (!storage) {
            return res.json([]);
        }

        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Sort transactions by date in descending order (newest first)
        const sortedTransactions = storage.transactions.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        // Apply pagination
        const paginatedTransactions = sortedTransactions.slice(skip, skip + limit);
        const total = sortedTransactions.length;
        const totalPages = Math.ceil(total / limit);

        res.json({
            transactions: paginatedTransactions,
            page,
            totalPages,
            total,
            hasMore: page < totalPages
        });
    } catch (error) {
        console.error('Error in getTransactionHistory:', error);
        res.status(500).json({ message: error.message });
    }
};
