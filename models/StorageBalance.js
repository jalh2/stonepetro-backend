const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['addition', 'reduction'],
        required: true
    },
    petroleumType: {
        type: String,
        enum: ['PMS', 'AGO', 'ATK'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const storageBalanceSchema = new mongoose.Schema({
    pmsBalance: {
        type: Number,
        required: true,
        default: 0
    },
    agoBalance: {
        type: Number,
        required: true,
        default: 0
    },
    atkBalance: {
        type: Number,
        required: true,
        default: 0
    },
    unit: {
        type: String,
        default: 'gallons'
    },
    transactions: [transactionSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StorageBalance', storageBalanceSchema);
