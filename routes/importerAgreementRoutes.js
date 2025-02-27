const express = require('express');
const router = express.Router();
const importerAgreementController = require('../controllers/importerAgreementController');

// Create new agreement
router.post('/agreements', importerAgreementController.createAgreement);

// Get all agreements
router.get('/agreements', importerAgreementController.getAllAgreements);

// Get single agreement
router.get('/agreements/:id', importerAgreementController.getAgreement);

// Update agreement status
router.patch('/agreements/:id/status', importerAgreementController.updateAgreementStatus);

// Delete agreement
router.delete('/agreements/:id', importerAgreementController.deleteAgreement);

module.exports = router;
