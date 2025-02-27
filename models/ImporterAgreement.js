const mongoose = require('mongoose');

const importerAgreementSchema = new mongoose.Schema({
    transferNumber: {
        type: String,
        required: true,
        unique: true
    },
    petroleumType: {
        type: String,
        enum: ['PMS', 'AGO', 'ATK'],
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    buyingImporter: {
        type: String,
        required: true
    },
    quantityWords: {
        type: String,
        required: true
    },
    quantityNumber: {
        type: Number,
        required: true
    },
    sellingImporter: {
        type: String,
        required: true
    },
    locatedAt: {
        type: String,
        required: true
    },
    stockInTank: {
        type: Number,
        required: true
    },
    sellingImportersRepresentative: {
        type: String,
        required: true
    },
    operationsManager: {
        type: String,
        required: true
    },
    managingDirector: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamps on save
importerAgreementSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('ImporterAgreement', importerAgreementSchema);
