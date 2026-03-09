const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const Note = require('../models/Note');

// Get all notes for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const filters = { userId: req.user.id, isArchived: false };

        // Optional query params for filtering
        if (req.query.isArchived === 'true') {
            filters.isArchived = true;
        }
        if (req.query.category && req.query.category !== 'all') {
            filters.category = req.query.category;
        }
        if (req.query.status) {
            filters.status = req.query.status;
        }

        const notes = await Note.find(filters).sort({ isPinned: -1, updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new note
router.post('/', authenticateToken, async (req, res) => {
    try {
        const note = new Note({
            userId: req.user.id,
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            tags: req.body.tags,
            color: req.body.color,
            isPinned: req.body.isPinned,
            isStarred: req.body.isStarred,
            deadline: req.body.deadline,
            status: req.body.status
        });

        const newNote = await note.save();
        res.status(201).json(newNote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a note
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Update fields
        if (req.body.title !== undefined) note.title = req.body.title;
        if (req.body.content !== undefined) note.content = req.body.content;
        if (req.body.category !== undefined) note.category = req.body.category;
        if (req.body.tags !== undefined) note.tags = req.body.tags;
        if (req.body.color !== undefined) note.color = req.body.color;
        if (req.body.isPinned !== undefined) note.isPinned = req.body.isPinned;
        if (req.body.isStarred !== undefined) note.isStarred = req.body.isStarred;
        if (req.body.isArchived !== undefined) note.isArchived = req.body.isArchived;
        if (req.body.deadline !== undefined) note.deadline = req.body.deadline;
        if (req.body.status !== undefined) note.status = req.body.status;

        const updatedNote = await note.save();
        res.json(updatedNote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a note
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
