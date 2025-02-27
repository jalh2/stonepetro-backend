const DistributionRecord = require('../models/DistributionRecord');

// Create new distribution record
exports.createDistributionRecord = async (req, res) => {
    try {
        const distributionRecord = new DistributionRecord(req.body);
        await distributionRecord.save();
        res.status(201).json(distributionRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all distribution records
exports.getAllDistributionRecords = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        // Add date range filter if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const distributionRecords = await DistributionRecord.find(query)
            .sort({ date: -1 });
        res.json(distributionRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single distribution record
exports.getDistributionRecord = async (req, res) => {
    try {
        const distributionRecord = await DistributionRecord.findById(req.params.id);
        if (!distributionRecord) {
            return res.status(404).json({ message: 'Distribution record not found' });
        }
        res.json(distributionRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update distribution record
exports.updateDistributionRecord = async (req, res) => {
    try {
        const distributionRecord = await DistributionRecord.findById(req.params.id);
        if (!distributionRecord) {
            return res.status(404).json({ message: 'Distribution record not found' });
        }

        // Update allowed fields
        const allowedUpdates = [
            'date',
            'truckNumber',
            'pmsAmount',
            'agoAmount',
            'customerName',
            'company'
        ];

        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                distributionRecord[update] = req.body[update];
            }
        });

        await distributionRecord.save();
        res.json(distributionRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete distribution record
exports.deleteDistributionRecord = async (req, res) => {
    try {
        const distributionRecord = await DistributionRecord.findById(req.params.id);
        if (!distributionRecord) {
            return res.status(404).json({ message: 'Distribution record not found' });
        }

        await distributionRecord.remove();
        res.json({ message: 'Distribution record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get distribution summary by date range
exports.getDistributionSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const summary = await DistributionRecord.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPMS: { $sum: '$pmsAmount' },
                    totalAGO: { $sum: '$agoAmount' },
                    recordCount: { $sum: 1 },
                    uniqueCustomers: { $addToSet: '$customerName' },
                    uniqueCompanies: { $addToSet: '$company' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalPMS: 1,
                    totalAGO: 1,
                    recordCount: 1,
                    uniqueCustomerCount: { $size: '$uniqueCustomers' },
                    uniqueCompanyCount: { $size: '$uniqueCompanies' }
                }
            }
        ]);

        res.json(summary[0] || {
            totalPMS: 0,
            totalAGO: 0,
            recordCount: 0,
            uniqueCustomerCount: 0,
            uniqueCompanyCount: 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
