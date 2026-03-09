const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },

    // Calendly Integration
    calendlyEventUri: {
        type: String,
        unique: true,
        sparse: true
    },
    calendlyEventId: String,
    calendlyEventUrl: String, // Public booking page

    // Meeting Details
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata'
    },
    location: {
        type: String, // 'zoom', 'google-meet', 'office', 'calendly', etc.
        default: 'zoom'
    },
    meetingLink: String, // Zoom/Meet/Calendly link

    // Organizer
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Role-based invitations
    invitedRoles: [{
        type: String,
        enum: ['ceo', 'manager', 'individual-developer', 'hr', 'head-of-sales', 'all']
    }],

    // Specific user invitations
    invitedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Attendees who confirmed/responded
    attendees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'tentative'],
            default: 'pending'
        },
        calendlyInviteeUri: String,
        respondedAt: Date
    }],

    // Notifications sent
    notificationsSent: {
        type: Boolean,
        default: false
    },
    notificationsSentAt: Date,
    notifiedUserIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Meeting Status
    status: {
        type: String,
        enum: ['scheduled', 'cancelled', 'completed', 'in-progress'],
        default: 'scheduled'
    },

    // Cancellation
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: String,
    cancelledAt: Date,

    // Additional metadata
    notes: String,
    recordingUrl: String,
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrencePattern: String // 'daily', 'weekly', 'monthly'

}, {
    timestamps: true
});

// Indexes for efficient queries
meetingSchema.index({ startTime: 1, status: 1 });
meetingSchema.index({ createdBy: 1 });
meetingSchema.index({ 'attendees.user': 1 });
meetingSchema.index({ calendlyEventUri: 1 });
meetingSchema.index({ invitedRoles: 1 });

// Virtual for duration in minutes
meetingSchema.virtual('duration').get(function () {
    if (this.startTime && this.endTime) {
        return Math.round((this.endTime - this.startTime) / 60000);
    }
    return 0;
});

// Method to check if user is invited
meetingSchema.methods.isUserInvited = async function (userId) {
    // Check if user is specifically invited
    if (this.invitedUsers.some(id => id.toString() === userId.toString())) {
        return true;
    }

    // Check if user's role is invited
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    if (user && this.invitedRoles.includes(user.role)) {
        return true;
    }

    // Check if 'all' is invited
    if (this.invitedRoles.includes('all')) {
        return true;
    }

    return false;
};

module.exports = mongoose.model('Meeting', meetingSchema);
