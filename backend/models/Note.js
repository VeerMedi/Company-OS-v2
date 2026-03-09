const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        trim: true,
        default: ''
    },
    content: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'quick'
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    deadline: {
        type: Date,
        default: null
    },
    tags: [{
        type: String,
        trim: true
    }],
    color: {
        type: String,
        default: 'yellow'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isStarred: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient querying by user and other common filters
noteSchema.index({ userId: 1, isArchived: 1 });
noteSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Note', noteSchema);
