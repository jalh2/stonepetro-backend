const mongoose = require('mongoose');

const distributionRecordSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    deliveryOrderNumber: {
        type: String,
        required: true,
        unique: true
    },
    truckNumber: {
        type: String,
        required: true
    },
    pmsAmount: {
        type: Number,
        default: 0
    },
    agoAmount: {
        type: Number,
        default: 0
    },
    customerName: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true
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
distributionRecordSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Validate that at least one product amount is specified
distributionRecordSchema.pre('save', function(next) {
    if (this.pmsAmount === 0 && this.agoAmount === 0) {
        next(new Error('At least one product amount (PMS or AGO) must be specified'));
    }
    next();
});

module.exports = mongoose.model('DistributionRecord', distributionRecordSchema);
