const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
 
// Middleware
app.use(cors());
app.use(express.json());

// Routes
const storageRoutes = require('./routes/storageRoutes');
const importerAgreementRoutes = require('./routes/importerAgreementRoutes');
const salesFloorRoutes = require('./routes/salesFloorRoutes');
const transferFormRoutes = require('./routes/transferFormRoutes');
const distributionRoutes = require('./routes/distributionRoutes');
const distributionRecordRoutes = require('./routes/distributionRecordRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/storage', storageRoutes);
app.use('/api/importer', importerAgreementRoutes);
app.use('/api/sales-floor', salesFloorRoutes);
app.use('/api/transfer', transferFormRoutes);
app.use('/api/distribution', distributionRoutes);
app.use('/api/distribution-record', distributionRecordRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
