const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['cash', 'onbill'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    }
});

const distributionSchema = new mongoose.Schema({
    deliveryOrder: {
        type: String,
        unique: false,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'issued', 'lifting', 'approved', 'completed'],
        default: 'pending'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    customerName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    product: {
        type: String,
        enum: ['PMS', 'AGO', 'ATK'],
        required: true
    },
    quantityWords: {
        type: String,
        required: true
    },
    gallons: {
        type: Number,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    productAmount: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    payments: [paymentSchema],
    totalPaid: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    lpoNumber: {
        type: String,
        required: false
    },
    driverSignature: {
        name: String,
        date: Date
    },
    truckNumber: {
        type: String,
        required: false
    },
    customerSignature: {
        name: String,
        date: Date
    },
    createdBy: {
        type: String,
        required: true
    },
    approvedBy: {
        type: String
    },
    approvedAt: {
        type: Date
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

// Pre-save middleware to generate delivery order number
distributionSchema.pre('save', async function(next) {
    if (!this.deliveryOrder) {
        try {
            // Get the current year
            const currentYear = new Date().getFullYear();
            
            // Find the highest delivery order number for the current year
            const highestOrder = await this.constructor.findOne({
                deliveryOrder: new RegExp(`^${currentYear}`)
            }).sort({ deliveryOrder: -1 });

            let nextNumber = 1;
            if (highestOrder && highestOrder.deliveryOrder) {
                // Extract the number from the existing delivery order
                const currentNumber = parseInt(highestOrder.deliveryOrder.split('-')[1]);
                nextNumber = currentNumber + 1;
            }

            // Format: YYYY-XXXXXX (e.g., 2025-000001)
            this.deliveryOrder = `${currentYear}-${String(nextNumber).padStart(6, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Pre-save middleware to update payment totals and balance
distributionSchema.pre('save', function(next) {
    // Calculate total paid from all payments
    this.totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate remaining balance
    this.balance = this.totalAmount - this.totalPaid;

    // Update status to completed if fully paid
    if (this.balance <= 0 && this.status === 'approved') {
        this.status = 'completed';
    }

    next();
});

// Pre-save middleware to calculate product amount
distributionSchema.pre('save', function(next) {
    this.productAmount = this.gallons * this.unitPrice;
    this.totalAmount = this.productAmount;
    next();
});

// Update timestamps on save
distributionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Distribution', distributionSchema);
