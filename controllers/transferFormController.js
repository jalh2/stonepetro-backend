const TransferForm = require('../models/TransferForm');
const StorageBalance = require('../models/StorageBalance');
const SalesFloor = require('../models/SalesFloor');

const STORAGE_BALANCE_ID = '67b8a4c0895a5347a5f8924a';
const SALES_FLOOR_ID = '67b8c6def48741f3a9c9cddd';

// Create new transfer form
exports.createTransferForm = async (req, res) => {
    try {
        const transferForm = new TransferForm(req.body);
        await transferForm.save();
        res.status(201).json(transferForm);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all transfer forms
exports.getAllTransferForms = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get total count
        const total = await TransferForm.countDocuments();

        // Get paginated forms
        const transferForms = await TransferForm.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(total / limit);

        res.json({
            transfers: transferForms,
            page,
            totalPages,
            total,
            hasMore: page < totalPages,
            startIndex: skip + 1,
            endIndex: Math.min(skip + limit, total)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single transfer form
exports.getTransferForm = async (req, res) => {
    try {
        const transferForm = await TransferForm.findById(req.params.id);
        if (!transferForm) {
            return res.status(404).json({ message: 'Transfer form not found' });
        }
        res.json(transferForm);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update transfer form status and process balance updates
exports.updateTransferFormStatus = async (req, res) => {
    try {
        const { status, approvedBy } = req.body;
        if (!status || !['pending', 'approved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const transferForm = await TransferForm.findById(req.params.id);
        if (!transferForm) {
            return res.status(404).json({ message: 'Transfer form not found' });
        }

        // If status is being changed to approved
        if (status === 'approved' && transferForm.status !== 'approved') {
            if (!approvedBy) {
                return res.status(400).json({ message: 'Approval signature required' });
            }

            // 1. Get the storage balance
            const storageBalance = await StorageBalance.findById(STORAGE_BALANCE_ID);
            if (!storageBalance) {
                return res.status(404).json({ message: 'Storage balance not found' });
            }

            // 2. Get the sales floor
            const salesFloor = await SalesFloor.findById(SALES_FLOOR_ID);
            if (!salesFloor) {
                return res.status(404).json({ message: 'Sales floor not found' });
            }

            // 3. Check if there's enough balance in storage
            let storageField, salesFloorField, normalizedPetroleumType;
            switch (transferForm.petroleumType) {
                case 'PMS':
                    storageField = 'pmsBalance';
                    salesFloorField = 'pmsAmount';
                    normalizedPetroleumType = 'PMS';
                    if (storageBalance.pmsBalance < transferForm.quantity) {
                        return res.status(400).json({ message: 'Insufficient PMS balance in storage' });
                    }
                    break;
                case 'AGO':
                    storageField = 'agoBalance';
                    salesFloorField = 'agoAmount';
                    normalizedPetroleumType = 'AGO';
                    if (storageBalance.agoBalance < transferForm.quantity) {
                        return res.status(400).json({ message: 'Insufficient AGO balance in storage' });
                    }
                    break;
                case 'ATK':
                case 'KERO':
                    storageField = 'atkBalance';
                    salesFloorField = 'atkAmount';
                    normalizedPetroleumType = 'ATK';
                    if (storageBalance.atkBalance < transferForm.quantity) {
                        return res.status(400).json({ message: 'Insufficient ATK balance in storage' });
                    }
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid petroleum type. Must be PMS, AGO, or ATK' });
            }

            // 4. Update storage balance (subtract)
            storageBalance[storageField] -= transferForm.quantity;
            storageBalance.transactions.push({
                amount: transferForm.quantity,
                type: 'reduction',
                petroleumType: normalizedPetroleumType,
                date: new Date(),
                description: `Transfer #${transferForm.formNumber} - Moved to sales floor`
            });
            await storageBalance.save();

            // 5. Update sales floor (add)
            salesFloor[salesFloorField] += transferForm.quantity;
            salesFloor.history.push({
                type: 'transfer',
                product: normalizedPetroleumType,
                amount: transferForm.quantity,
                reference: `Transfer #${transferForm.formNumber}`,
                date: new Date()
            });
            await salesFloor.save();

            // 6. Update transfer form
            transferForm.status = status;
            transferForm.approvedBy = approvedBy;
            transferForm.approvedAt = new Date();
        }

        await transferForm.save();
        res.json(transferForm);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete transfer form (only if pending)
exports.deleteTransferForm = async (req, res) => {
    try {
        const transferForm = await TransferForm.findById(req.params.id);
        if (!transferForm) {
            return res.status(404).json({ message: 'Transfer form not found' });
        }

        if (transferForm.status === 'approved') {
            return res.status(400).json({ message: 'Cannot delete approved transfer' });
        }

        await transferForm.remove();
        res.json({ message: 'Transfer form deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
