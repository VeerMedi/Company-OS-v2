const mongoose = require('mongoose');

const FinancialDataSchema = new mongoose.Schema({
    type: {
        type: String,
        default: 'cofounder-dashboard',
        unique: true
    },
    data: {
        currentFunds: { type: Number },
        totalRevenue: { type: Number },
        targetRevenue: { type: Number },
        totalAchieved: { type: Number },
        // We can extend this as needed
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FinancialData', FinancialDataSchema);
