const ImporterAgreement = require('../models/ImporterAgreement');
const StorageBalance = require('../models/StorageBalance');

// Create new agreement
exports.createAgreement = async (req, res) => {
    try {
        const agreement = new ImporterAgreement(req.body);
        await agreement.save();
        res.status(201).json(agreement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all agreements
exports.getAllAgreements = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [agreements, total] = await Promise.all([
            ImporterAgreement.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ImporterAgreement.countDocuments()
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            agreements,
            page,
            totalPages,
            total,
            hasMore: page < totalPages
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single agreement
exports.getAgreement = async (req, res) => {
    try {
        const agreement = await ImporterAgreement.findById(req.params.id);
        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }
        res.json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update agreement status
exports.updateAgreementStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['pending', 'approved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const agreement = await ImporterAgreement.findById(req.params.id);
        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }

        // If status is being changed to approved
        if (status === 'approved' && agreement.status !== 'approved') {
            // Update storage balance
            const storageBalance = await StorageBalance.findOne();
            if (!storageBalance) {
                return res.status(404).json({ message: 'Storage balance not found' });
            }

            // Add the quantity from the agreement to the appropriate storage type
            let balanceField;
            switch (agreement.petroleumType) {
                case 'PMS':
                    balanceField = 'pmsBalance';
                    break;
                case 'AGO':
                    balanceField = 'agoBalance';
                    break;
                case 'ATK':
                    balanceField = 'atkBalance';
                    break;
            }

            storageBalance[balanceField] += agreement.quantityNumber;
            
            // Update storage balance and add transaction
            storageBalance.transactions.push({
                amount: agreement.quantityNumber,
                type: 'addition',
                petroleumType: agreement.petroleumType,
                description: `Transfer #${agreement.transferNumber} approved - Importer Agreement`,
                date: new Date()
            });

            await storageBalance.save();
        }

        // Update agreement status
        agreement.status = status;
        await agreement.save();

        res.json(agreement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete agreement (only if pending)
exports.deleteAgreement = async (req, res) => {
    try {
        const agreement = await ImporterAgreement.findById(req.params.id);
        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }

        if (agreement.status === 'approved') {
            return res.status(400).json({ message: 'Cannot delete approved agreement' });
        }

        await agreement.remove();
        res.json({ message: 'Agreement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
