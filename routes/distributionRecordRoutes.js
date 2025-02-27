const express = require('express');
const router = express.Router();
const distributionRecordController = require('../controllers/distributionRecordController');

// Create new distribution record
router.post('/records', distributionRecordController.createDistributionRecord);

// Get all distribution records
router.get('/records', distributionRecordController.getAllDistributionRecords);

// Get distribution summary
router.get('/records/summary', distributionRecordController.getDistributionSummary);

// Get single distribution record
router.get('/records/:id', distributionRecordController.getDistributionRecord);

// Update distribution record
router.patch('/records/:id', distributionRecordController.updateDistributionRecord);

// Delete distribution record
router.delete('/records/:id', distributionRecordController.deleteDistributionRecord);

module.exports = router;
