const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['transfer', 'distribution'],
        required: true
    },
    product: {
        type: String,
        enum: ['PMS', 'AGO', 'ATK'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const salesFloorSchema = new mongoose.Schema({
    pmsAmount: {
        type: Number,
        required: true,
        default: 0
    },
    agoAmount: {
        type: Number,
        required: true,
        default: 0
    },
    atkAmount: {
        type: Number,
        required: true,
        default: 0
    },
    history: {
        type: [historySchema],
        default: []
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamps on save
salesFloorSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('SalesFloor', salesFloorSchema);
