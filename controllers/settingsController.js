const StorageBalance = require('../models/StorageBalance');
const SalesFloor = require('../models/SalesFloor');

// Get current balances from both storage and sales floor
exports.getBalances = async (req, res) => {
    try {
        const storage = await StorageBalance.findOne() || { pmsBalance: 0, agoBalance: 0, atkBalance: 0 };
        const salesFloor = await SalesFloor.findOne() || { pmsAmount: 0, agoAmount: 0, atkAmount: 0 };

        res.json({
            storage: {
                pms: storage.pmsBalance,
                ago: storage.agoBalance,
                atk: storage.atkBalance
            },
            salesFloor: {
                pms: salesFloor.pmsAmount,
                ago: salesFloor.agoAmount,
                atk: salesFloor.atkAmount
            }
        });
    } catch (error) {
        console.error('Error in getBalances:', error);
        res.status(500).json({ message: 'Error fetching balances' });
    }
};

// Update balances for either storage or sales floor
exports.updateBalance = async (req, res) => {
    try {
        const { type, pms, ago, atk } = req.body;

        if (!['storage', 'salesFloor'].includes(type)) {
            return res.status(400).json({ message: 'Invalid type specified' });
        }

        if (type === 'storage') {
            let storage = await StorageBalance.findOne();
            if (!storage) {
                storage = new StorageBalance();
            }

            storage.pmsBalance = Number(pms);
            storage.agoBalance = Number(ago);
            storage.atkBalance = Number(atk);

            storage.transactions.push({
                type: 'addition',
                petroleumType: 'PMS',
                amount: Number(pms),
                description: 'Manual balance adjustment via settings',
                date: new Date()
            });

            await storage.save();
        } else {
            let salesFloor = await SalesFloor.findOne();
            if (!salesFloor) {
                salesFloor = new SalesFloor({
                    pmsAmount: 0,
                    agoAmount: 0,
                    atkAmount: 0,
                    history: []
                });
            }

            salesFloor.pmsAmount = Number(pms);
            salesFloor.agoAmount = Number(ago);
            salesFloor.atkAmount = Number(atk);

            // Add separate history entries for each product that changed
            salesFloor.history.push({
                type: 'transfer',
                product: 'PMS',
                amount: Number(pms),
                reference: 'Manual balance adjustment via settings',
                date: new Date()
            });

            salesFloor.history.push({
                type: 'transfer',
                product: 'AGO',
                amount: Number(ago),
                reference: 'Manual balance adjustment via settings',
                date: new Date()
            });

            salesFloor.history.push({
                type: 'transfer',
                product: 'ATK',
                amount: Number(atk),
                reference: 'Manual balance adjustment via settings',
                date: new Date()
            });

            await salesFloor.save();
        }

        res.json({ message: `${type} balances updated successfully` });
    } catch (error) {
        console.error('Error in updateBalance:', error);
        res.status(500).json({ message: error.message || 'Error updating balances' });
    }
};
