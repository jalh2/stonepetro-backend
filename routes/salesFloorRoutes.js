const express = require('express');
const router = express.Router();
const { 
    updatePetroleumAmount,
    getSalesFloor,
    getTransactionHistory
} = require('../controllers/salesFloorController');
const SalesFloor = require('../models/SalesFloor');

// Get current sales floor state
router.get('/', getSalesFloor);

// Get transaction history
router.get('/transactions', getTransactionHistory);

// Update petroleum amounts
router.post('/', updatePetroleumAmount);

// Get current balance
router.get('/balance', async (req, res) => {
    try {
        const salesFloor = await SalesFloor.findOne();
        if (!salesFloor) {
            return res.json({
                pmsAmount: 0,
                agoAmount: 0,
                atkAmount: 0
            });
        }
        res.json({
            pmsAmount: salesFloor.pmsAmount,
            agoAmount: salesFloor.agoAmount,
            atkAmount: salesFloor.atkAmount
        });
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get transaction history
router.get('/history', async (req, res) => {
    try {
        const salesFloor = await SalesFloor.findOne();
        if (!salesFloor) {
            return res.json({ history: [] });
        }

        // Sort history by date in descending order (newest first)
        const history = [...salesFloor.history].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Format history entries
        const formattedHistory = history.map(entry => ({
            id: entry._id.toString(),
            type: entry.type,
            product: entry.product,
            amount: Math.abs(entry.amount),
            action: entry.amount > 0 ? 'addition' : 'reduction',
            reference: entry.reference || 'N/A',
            date: entry.date
        }));

        res.json({ history: formattedHistory });
    } catch (error) {
        console.error('Error getting history:', error);
        res.status(500).json({ message: 'Error loading sales floor history' });
    }
});

module.exports = router;
