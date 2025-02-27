const express = require('express');
const router = express.Router();
const distributionController = require('../controllers/distributionController');

// Create a new distribution order
router.post('/orders', distributionController.createDistribution);

// Get all distribution orders
router.get('/orders', distributionController.getAllDistributions);

// Get a single distribution order
router.get('/orders/:id', distributionController.getDistribution);

// Update distribution status
router.patch('/orders/:id/status', distributionController.updateDistributionStatus);

// Add payment to distribution order
router.patch('/orders/:id/payment', distributionController.addPayment);

// Delete a distribution order
router.delete('/orders/:id', distributionController.deleteDistribution);

module.exports = router;
