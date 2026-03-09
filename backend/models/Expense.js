const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Office Supplies', 'AI Services', 'Software Licenses', 'Infrastructure', 'Communication', 'Marketing', 'Travel', 'Other']
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending'],
        default: 'Paid'
    },
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'Bank Transfer', 'Cash', 'Invoice'],
        default: 'Credit Card'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for faster queries
expenseSchema.index({ date: -1, company: 1 });
expenseSchema.index({ category: 1, company: 1 });
expenseSchema.index({ status: 1, company: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
