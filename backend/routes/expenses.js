const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { authenticateToken } = require('../middleware/auth');

// Get all expenses
router.get('/', authenticateToken, async (req, res) => {
    try {
        const expenses = await Expense.find()
            .sort({ date: -1 })
            .limit(100)
            .lean();

        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Error fetching expenses', error: error.message });
    }
});

// Get expenses by category
router.get('/category/:category', authenticateToken, async (req, res) => {
    try {
        const expenses = await Expense.find({ category: req.params.category })
            .sort({ date: -1 })
            .lean();

        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses by category:', error);
        res.status(500).json({ message: 'Error fetching expenses', error: error.message });
    }
});

// Get expense stats/summary
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const expenses = await Expense.find().lean();

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const paidExpenses = expenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
        const pendingExpenses = expenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

        // Category breakdown
        const categoryData = expenses.reduce((acc, curr) => {
            const existing = acc.find(item => item.name === curr.category);
            if (existing) {
                existing.value += curr.amount;
            } else {
                acc.push({ name: curr.category, value: curr.amount });
            }
            return acc;
        }, []);

        res.json({
            totalExpenses,
            paidExpenses,
            pendingExpenses,
            categoryData,
            count: expenses.length
        });
    } catch (error) {
        console.error('Error fetching expense stats:', error);
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});

// Create new expense
router.post('/', authenticateToken, async (req, res) => {
    try {
        const expense = new Expense({
            ...req.body,
            createdBy: req.user.id
        });

        await expense.save();
        res.status(201).json(expense);
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(400).json({ message: 'Error creating expense', error: error.message });
    }
});

// Update expense
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(expense);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(400).json({ message: 'Error updating expense', error: error.message });
    }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense', error: error.message });
    }
});

module.exports = router;
