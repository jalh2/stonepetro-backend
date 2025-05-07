const mongoose = require('mongoose');

const transferFormSchema = new mongoose.Schema({
    formNumber: {
        type: String,
        default: 'SPI-00012',
        required: true
    },
    distributor: {
        type: String,
        
    },
    petroleumType: {
        type: String,
        enum: ['PMS', 'AGO', 'KERO'],
       
    },
    usGallons: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending'
    },
    approvedBy: {
        type: String
    },
    approvedAt: {
        type: Date
    },
    managerName: {
        type: String,
        default: ""
    },
    managerTitle: {
        type: String,
        default: ""
    },
    managerSection: {
        type: String,
        default: ""
    },
    managerCompany: {
        type: String,
        default: ""
    },
    createdBy: {
        type: String,
       
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
transferFormSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const TransferForm = mongoose.model('TransferForm', transferFormSchema);

module.exports = TransferForm;
