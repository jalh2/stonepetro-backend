const Distribution = require('../models/Distribution');
const SalesFloor = require('../models/SalesFloor');

// Create new distribution order
exports.createDistribution = async (req, res) => {
    try {
        const {
            customerName,
            address,
            product,
            quantityWords,
            gallons,
            unitPrice,
            productAmount,
            totalAmount,
            payments,
            lpoNumber,
            truckNumber,
            driverSignature,
            customerSignature,
            createdBy
        } = req.body;

        const distribution = new Distribution({
            customerName,
            address,
            product,
            quantityWords,
            gallons,
            unitPrice,
            productAmount,
            totalAmount,
            payments,
            lpoNumber,
            truckNumber,
            driverSignature,
            customerSignature,
            createdBy
        });

        await distribution.save();
        res.status(201).json(distribution);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all distribution orders
exports.getAllDistributions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count
        const total = await Distribution.countDocuments();

        // Get paginated distributions
        const distributions = await Distribution.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(total / limit);

        res.json({
            distributions,
            page,
            totalPages,
            total,
            hasMore: page < totalPages
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single distribution order
exports.getDistribution = async (req, res) => {
    try {
        const distribution = await Distribution.findById(req.params.id);
        if (!distribution) {
            return res.status(404).json({ message: 'Distribution order not found' });
        }
        res.json(distribution);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update distribution status
exports.updateDistributionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['pending', 'issued', 'lifting', 'approved', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const distribution = await Distribution.findById(req.params.id);
        if (!distribution) {
            return res.status(404).json({ message: 'Distribution order not found' });
        }

        // For lifting status, we don't need to check sales floor balance
        if (status === 'lifting') {
            distribution.status = status;
            await distribution.save();
            return res.json(distribution);
        }

        // If status is being changed to approved
        if (status === 'approved' && distribution.status !== 'approved') {
            try {
                // Get the sales floor object
                const salesFloor = await SalesFloor.findOne();
                if (!salesFloor) {
                    return res.status(404).json({ message: 'Sales floor not found' });
                }

                // Use gallons directly - no conversion needed
                const gallons = distribution.gallons;

                // Check and update the appropriate product balance
                let currentBalance = 0;
                switch (distribution.product) {
                    case 'PMS':
                        currentBalance = salesFloor.pmsAmount;
                        if (gallons > currentBalance) {
                            return res.status(400).json({ 
                                message: `Insufficient PMS balance in sales floor. Available: ${currentBalance.toFixed(2)} gallons, Required: ${gallons.toFixed(2)} gallons` 
                            });
                        }
                        salesFloor.pmsAmount -= gallons;
                        // Add to history
                        salesFloor.history.push({
                            type: 'distribution',
                            product: 'PMS',
                            amount: -gallons,
                            reference: distribution.deliveryOrder,
                            date: new Date()
                        });
                        break;

                    case 'AGO':
                        currentBalance = salesFloor.agoAmount;
                        if (gallons > currentBalance) {
                            return res.status(400).json({ 
                                message: `Insufficient AGO balance in sales floor. Available: ${currentBalance.toFixed(2)} gallons, Required: ${gallons.toFixed(2)} gallons` 
                            });
                        }
                        salesFloor.agoAmount -= gallons;
                        // Add to history
                        salesFloor.history.push({
                            type: 'distribution',
                            product: 'AGO',
                            amount: -gallons,
                            reference: distribution.deliveryOrder,
                            date: new Date()
                        });
                        break;

                    case 'ATK':
                        currentBalance = salesFloor.atkAmount;
                        if (gallons > currentBalance) {
                            return res.status(400).json({ 
                                message: `Insufficient ATK balance in sales floor. Available: ${currentBalance.toFixed(2)} gallons, Required: ${gallons.toFixed(2)} gallons` 
                            });
                        }
                        salesFloor.atkAmount -= gallons;
                        // Add to history
                        salesFloor.history.push({
                            type: 'distribution',
                            product: 'ATK',
                            amount: -gallons,
                            reference: distribution.deliveryOrder,
                            date: new Date()
                        });
                        break;
                }

                // Save the updated sales floor balance
                await salesFloor.save();

                // Update distribution with approval info
                distribution.approvedBy = req.user ? req.user.username : 'System';
                distribution.approvedAt = new Date();
                distribution.status = status;

                await distribution.save();
                res.json(distribution);
            } catch (error) {
                return res.status(500).json({ 
                    message: 'Error updating sales floor balance: ' + error.message 
                });
            }
        } else {
            // For other status changes that don't affect inventory
            distribution.status = status;
            await distribution.save();
            res.json(distribution);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Add payment to distribution order
exports.addPayment = async (req, res) => {
    try {
        const { amount, type, description } = req.body;
        if (!amount || !type) {
            return res.status(400).json({ message: 'Amount and payment type are required' });
        }

        const distribution = await Distribution.findById(req.params.id);
        if (!distribution) {
            return res.status(404).json({ message: 'Distribution order not found' });
        }

        // Add new payment
        distribution.payments.push({
            amount: Number(amount),
            type,
            description,
            date: new Date()
        });

        // Save will trigger the pre-save middleware to update totals and status
        await distribution.save();
        res.json(distribution);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete distribution (only if pending)
exports.deleteDistribution = async (req, res) => {
    try {
        const distribution = await Distribution.findById(req.params.id);
        if (!distribution) {
            return res.status(404).json({ message: 'Distribution order not found' });
        }

        if (distribution.status !== 'pending') {
            return res.status(400).json({ message: 'Can only delete pending distribution orders' });
        }

        await distribution.remove();
        res.json({ message: 'Distribution order deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
