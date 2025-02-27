const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Get all balances
router.get('/balances', settingsController.getBalances);

// Update balances
router.post('/balances', settingsController.updateBalance);

module.exports = router;
