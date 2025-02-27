const express = require('express');
const router = express.Router();
const transferFormController = require('../controllers/transferFormController');

// Create new transfer form
router.post('/transfers', transferFormController.createTransferForm);

// Get all transfer forms
router.get('/transfers', transferFormController.getAllTransferForms);

// Get single transfer form
router.get('/transfers/:id', transferFormController.getTransferForm);

// Update transfer form status
router.patch('/transfers/:id/status', transferFormController.updateTransferFormStatus);

// Delete transfer form
router.delete('/transfers/:id', transferFormController.deleteTransferForm);

module.exports = router;
