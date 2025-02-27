const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');

// Get current balance
router.get('/balance', storageController.getBalance);

// Get transaction history
router.get('/transactions', storageController.getTransactionHistory);

module.exports = router;
