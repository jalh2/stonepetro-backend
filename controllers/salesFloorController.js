const SalesFloor = require('../models/SalesFloor');
const TransferForm = require('../models/TransferForm');

const SALES_FLOOR_ID = '67b8c6def48741f3a9c9cddd';

// Get the current sales floor state
const getSalesFloor = async (req, res) => {
    try {
        let salesFloor = await SalesFloor.findById(SALES_FLOOR_ID);
        
        if (!salesFloor) {
            return res.status(404).json({ message: 'Sales floor not found' });
        }

        res.json(salesFloor);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving sales floor data', error: error.message });
    }
};

// Get transaction history
const getTransactionHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const salesFloor = await SalesFloor.findOne();
        if (!salesFloor) {
            return res.json({
                transactions: [],
                page: 1,
                totalPages: 0,
                total: 0,
                hasMore: false
            });
        }

        // Sort history by date in descending order (newest first)
        const history = [...salesFloor.history].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Apply pagination
        const paginatedHistory = history.slice(skip, skip + limit);
        const total = history.length;
        const totalPages = Math.ceil(total / limit);

        // Format history entries
        const formattedTransactions = paginatedHistory.map(entry => ({
            id: entry._id.toString(),
            type: entry.type,
            product: entry.product,
            amount: Math.abs(entry.amount),
            action: entry.amount > 0 ? 'addition' : 'reduction',
            reference: entry.reference || 'N/A',
            date: entry.date
        }));

        res.json({
            transactions: formattedTransactions,
            page,
            limit,
            totalPages,
            total,
            hasMore: page < totalPages,
            startIndex: skip + 1,
            endIndex: Math.min(skip + limit, total)
        });
    } catch (error) {
        console.error('Error getting history:', error);
        res.status(500).json({ message: 'Error loading sales floor history' });
    }
};

// Update petroleum amounts and record transaction
const updatePetroleumAmount = async (req, res) => {
    try {
        const { petroleumType, amount, transferId, description } = req.body;
        
        if (!petroleumType || !amount || !transferId || !description) {
            return res.status(400).json({ 
                message: 'Missing required fields. Please provide petroleumType, amount, transferId, and description' 
            });
        }

        // Validate transfer exists and get its details
        const transfer = await TransferForm.findById(transferId);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }

        // Validate petroleum type matches the transfer
        if (transfer.petroleumType !== petroleumType.toUpperCase()) {
            return res.status(400).json({ 
                message: `Petroleum type mismatch. Transfer is for ${transfer.petroleumType} but received ${petroleumType.toUpperCase()}` 
            });
        }

        // Find the existing sales floor document
        let salesFloor = await SalesFloor.findById(SALES_FLOOR_ID);
        if (!salesFloor) {
            return res.status(404).json({ message: 'Sales floor not found' });
        }

        // Create transaction record
        const transaction = {
            amount: Math.abs(amount),
            type: amount > 0 ? 'addition' : 'reduction',
            petroleumType: petroleumType.toUpperCase(),
            description,
            transferId,
            date: new Date()
        };

        // Update the appropriate amount based on petroleum type
        const upperPetroleumType = petroleumType.toUpperCase();
        switch (upperPetroleumType) {
            case 'PMS':
                const newPmsAmount = salesFloor.pmsAmount + amount;
                if (newPmsAmount < 0) {
                    return res.status(400).json({ message: 'Insufficient PMS amount in sales floor' });
                }
                salesFloor.pmsAmount = newPmsAmount;
                break;

            case 'AGO':
                const newAgoAmount = salesFloor.agoAmount + amount;
                if (newAgoAmount < 0) {
                    return res.status(400).json({ message: 'Insufficient AGO amount in sales floor' });
                }
                salesFloor.agoAmount = newAgoAmount;
                break;

            case 'KERO':
                const newAtkAmount = salesFloor.atkAmount + amount;
                if (newAtkAmount < 0) {
                    return res.status(400).json({ message: 'Insufficient ATK/KERO amount in sales floor' });
                }
                salesFloor.atkAmount = newAtkAmount;
                break;

            default:
                return res.status(400).json({ message: 'Invalid petroleum type. Must be PMS, AGO, or KERO' });
        }

        // Add transaction to history
        salesFloor.history.push(transaction);

        // Save the updated document
        await salesFloor.save();
        
        // Return the updated document with populated transaction
        const updatedSalesFloor = await SalesFloor.findById(SALES_FLOOR_ID);

        res.json(updatedSalesFloor);
    } catch (error) {
        res.status(500).json({ message: 'Error updating petroleum amount', error: error.message });
    }
};

module.exports = {
    getSalesFloor,
    updatePetroleumAmount,
    getTransactionHistory
};
