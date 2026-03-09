# 🗓️ Calendly API Integration - Complete Implementation Guide

## Overview
Integrate Calendly for team meeting management with role-based notifications.

---

## 📋 Requirements

### User Story:
- **Manager creates meeting** → All team members get notification
- **Developer meeting** → All developers get notification  
- **HR meeting** → All HR team gets notification
- Real-time notifications via WebSocket/Email
- Calendar sync with Calendly

---

## 🔧 Step 1: Calendly API Setup

### 1.1 Create Calendly Account & Get API Key

1. Go to https://calendly.com/
2. Sign up for **Professional/Teams** plan (needed for API access)
3. Navigate to **Integrations** → **API & Webhooks**
4. Generate **Personal Access Token**
5. Copy your **Organization URI** (format: `https://api.calendly.com/organizations/XXXXX`)

### 1.2 Environment Variables

Add to `backend/.env`:
```env
CALENDLY_API_KEY=your_personal_access_token_here
CALENDLY_ORGANIZATION_URI=https://api.calendly.com/organizations/YOUR_ORG_ID
CALENDLY_WEBHOOK_SECRET=your_webhook_signing_key
CALENDLY_USER_URI=https://api.calendly.com/users/YOUR_USER_ID
```

Add to `frontend/.env`:
```env
VITE_CALENDLY_EMBED_URL=https://calendly.com/your-username
```

---

## 🏗️ Step 2: Backend Implementation

### 2.1 Install Required Packages

```bash
cd backend
npm install axios node-cron
```

### 2.2 Create Calendly Service

**File**: `backend/services/calendlyService.js`

```javascript
const axios = require('axios');

class CalendlyService {
    constructor() {
        this.apiKey = process.env.CALENDLY_API_KEY;
        this.baseURL = 'https://api.calendly.com';
        this.organizationUri = process.env.CALENDLY_ORGANIZATION_URI;
    }

    // Get Calendly API client
    getClient() {
        return axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    // Get all scheduled events
    async getScheduledEvents() {
        const client = this.getClient();
        const response = await client.get('/scheduled_events', {
            params: {
                organization: this.organizationUri,
                status: 'active'
            }
        });
        return response.data.collection;
    }

    // Get event details
    async getEventDetails(eventUri) {
        const client = this.getClient();
        const response = await client.get(eventUri);
        return response.data.resource;
    }

    // Get event invitees
    async getEventInvitees(eventUri) {
        const client = this.getClient();
        const response = await client.get(`${eventUri}/invitees`);
        return response.data.collection;
    }

    // Create webhook subscription
    async createWebhook(webhookUrl, events) {
        const client = this.getClient();
        const response = await client.post('/webhook_subscriptions', {
            url: webhookUrl,
            organization: this.organizationUri,
            events: events, // ['invitee.created', 'invitee.canceled']
            scope: 'organization'
        });
        return response.data.resource;
    }

    // List all webhooks
    async listWebhooks() {
        const client = this.getClient();
        const response = await client.get('/webhook_subscriptions', {
            params: {
                organization: this.organizationUri,
                scope: 'organization'
            }
        });
        return response.data.collection;
    }
}

module.exports = new CalendlyService();
```

### 2.3 Create Meeting Model

**File**: `backend/models/Meeting.js`

```javascript
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    
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
        type: String, // 'zoom', 'google-meet', 'office', etc.
        default: 'zoom'
    },
    meetingLink: String, // Zoom/Meet link
    
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
    
    // Attendees who confirmed
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
    cancelledAt: Date

}, {
    timestamps: true
});

// Index for efficient queries
meetingSchema.index({ startTime: 1, status: 1 });
meetingSchema.index({ createdBy: 1 });
meetingSchema.index({ 'attendees.user': 1 });
meetingSchema.index({ calendlyEventUri: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
```

### 2.4 Create Meeting Controller

**File**: `backend/controllers/meetingController.js`

```javascript
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const calendlyService = require('../services/calendlyService');
const { sendMeetingNotification } = require('../utils/emailService');

// Create meeting and send notifications
exports.createMeeting = async (req, res) => {
    try {
        const { title, description, startTime, endTime, invitedRoles, invitedUsers, location } = req.body;

        // Create meeting
        const meeting = new Meeting({
            title,
            description,
            startTime,
            endTime,
            invitedRoles: invitedRoles || [],
            invitedUsers: invitedUsers || [],
            location,
            createdBy: req.user.id,
            status: 'scheduled'
        });

        await meeting.save();
        await meeting.populate('createdBy invitedUsers', 'firstName lastName email');

        // Get all users who should be notified
        const usersToNotify = await getNotificationRecipients(meeting);

        // Send notifications to all recipients
        await sendNotificationsToUsers(meeting, usersToNotify);

        meeting.notificationsSent = true;
        meeting.notificationsSentAt = new Date();
        await meeting.save();

        res.status(201).json({
            success: true,
            message: `Meeting created and ${usersToNotify.length} notifications sent`,
            data: meeting,
            notificationCount: usersToNotify.length
        });

    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get notification recipients based on roles and specific users
async function getNotificationRecipients(meeting) {
    let recipients = [];

    // If 'all' role is selected, get all active users
    if (meeting.invitedRoles.includes('all')) {
        recipients = await User.find({ isActive: true });
    } else {
        // Get users by specific roles
        if (meeting.invitedRoles.length > 0) {
            const roleUsers = await User.find({ 
                role: { $in: meeting.invitedRoles },
                isActive: true 
            });
            recipients.push(...roleUsers);
        }

        // Get specific invited users
        if (meeting.invitedUsers.length > 0) {
            const specificUsers = await User.find({
                _id: { $in: meeting.invitedUsers },
                isActive: true
            });
            recipients.push(...specificUsers);
        }
    }

    // Remove duplicates
    const uniqueRecipients = Array.from(new Map(recipients.map(u => [u._id.toString(), u])).values());
    
    // Exclude the meeting creator from notifications (optional)
    return uniqueRecipients.filter(u => u._id.toString() !== meeting.createdBy._id.toString());
}

// Send email notifications
async function sendNotificationsToUsers(meeting, users) {
    const emailPromises = users.map(user => 
        sendMeetingNotification({
            recipientEmail: user.email,
            recipientName: `${user.firstName} ${user.lastName}`,
            meetingTitle: meeting.title,
            meetingDescription: meeting.description,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            organizerName: `${meeting.createdBy.firstName} ${meeting.createdBy.lastName}`,
            meetingLink: meeting.meetingLink || '#'
        })
    );

    await Promise.allSettled(emailPromises);
}

// Get all meetings
exports.getAllMeetings = async (req, res) => {
    try {
        const { status, upcoming } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (upcoming === 'true') {
            filter.startTime = { $gte: new Date() };
        }

        const meetings = await Meeting.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .populate('invitedUsers', 'firstName lastName email')
            .populate('attendees.user', 'firstName lastName email')
            .sort({ startTime: 1 });

        res.json({
            success: true,
            count: meetings.length,
            data: meetings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get my meetings (where I'm invited or creator)
exports.getMyMeetings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        const meetings = await Meeting.find({
            $or: [
                { createdBy: req.user.id },
                { invitedUsers: req.user.id },
                { invitedRoles: user.role },
                { invitedRoles: 'all' }
            ],
            startTime: { $gte: new Date() },
            status: 'scheduled'
        })
        .populate('createdBy', 'firstName lastName email')
        .sort({ startTime: 1 });

        res.json({
            success: true,
            count: meetings.length,
            data: meetings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Respond to meeting invitation
exports.respondToMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { status } = req.body; // 'accepted', 'declined', 'tentative'

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        // Find or create attendee entry
        const attendeeIndex = meeting.attendees.findIndex(
            a => a.user.toString() === req.user.id
        );

        if (attendeeIndex >= 0) {
            meeting.attendees[attendeeIndex].status = status;
            meeting.attendees[attendeeIndex].respondedAt = new Date();
        } else {
            meeting.attendees.push({
                user: req.user.id,
                status,
                respondedAt: new Date()
            });
        }

        await meeting.save();
        await meeting.populate('attendees.user', 'firstName lastName email');

        res.json({
            success: true,
            message: `Meeting invitation ${status}`,
            data: meeting
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Sync with Calendly (fetch events)
exports.syncCalendlyEvents = async (req, res) => {
    try {
        const events = await calendlyService.getScheduledEvents();
        
        let syncedCount = 0;
        for (const event of events) {
            // Check if event already exists
            const existing = await Meeting.findOne({ calendlyEventUri: event.uri });
            if (!existing) {
                // Create new meeting from Calendly event
                await Meeting.create({
                    title: event.name,
                    calendlyEventUri: event.uri,
                    calendlyEventId: event.uri.split('/').pop(),
                    calendlyEventUrl: event.scheduling_url,
                    startTime: event.start_time,
                    endTime: event.end_time,
                    location: event.location?.type || 'online',
                    meetingLink: event.location?.join_url,
                    createdBy: req.user.id,
                    status: event.status === 'active' ? 'scheduled' : 'cancelled'
                });
                syncedCount++;
            }
        }

        res.json({
            success: true,
            message: `Synced ${syncedCount} new events from Calendly`,
            totalEvents: events.length,
            newEvents: syncedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = exports;
```

---

## 📧 Step 3: Email Notification Service

**File**: `backend/utils/emailService.js` (add this function)

```javascript
exports.sendMeetingNotification = async ({
    recipientEmail,
    recipientName,
    meetingTitle,
    meetingDescription,
    startTime,
    endTime,
    organizerName,
    meetingLink
}) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: recipientEmail,
        subject: `📅 Meeting Invitation: ${meetingTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Meeting Invitation</h2>
                <p>Hi ${recipientName},</p>
                <p><strong>${organizerName}</strong> has invited you to a meeting:</p>
                
                <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${meetingTitle}</h3>
                    <p>${meetingDescription || 'No description provided'}</p>
                    <p><strong>📅 When:</strong> ${new Date(startTime).toLocaleString('en-IN')}</p>
                    <p><strong>⏱️ Duration:</strong> ${Math.round((new Date(endTime) - new Date(startTime)) / 60000)} minutes</p>
                    ${meetingLink ? `<p><strong>🔗 Join Link:</strong> <a href="${meetingLink}">Click here to join</a></p>` : ''}
                </div>

                <div style="margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL}/meetings" 
                       style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        View in Dashboard
                    </a>
                </div>

                <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
                    This is an automated notification from The Hustle System.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, recipient: recipientEmail };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};
```

---

## 🛣️ Step 4: API Routes

**File**: `backend/routes/meetings.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');

// All routes require authentication
router.use(authenticateToken);

// Create meeting
router.post('/', meetingController.createMeeting);

// Get all meetings (for admins/managers)
router.get('/', meetingController.getAllMeetings);

// Get my meetings
router.get('/my-meetings', meetingController.getMyMeetings);

// Respond to meeting invitation
router.post('/:meetingId/respond', meetingController.respondToMeeting);

// Sync with Calendly
router.post('/sync-calendly', meetingController.syncCalendlyEvents);

module.exports = router;
```

**Add to** `backend/server.js` or `app.js`:
```javascript
const meetingRoutes = require('./routes/meetings');
app.use('/api/meetings', meetingRoutes);
```

---

## 🎨 Step 5: Frontend - Meeting Management UI

**File**: `frontend/src/components/MeetingManagement.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Video } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MeetingManagement = () => {
    const [meetings, setMeetings] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        invitedRoles: [],
        location: 'zoom'
    });

    const roleOptions = [
        { value: 'all', label: 'All Team Members' },
        { value: 'manager', label: 'All Managers' },
        { value: 'individual-developer', label: 'All Developers' },
        { value: 'hr', label: 'HR Team' },
        { value: 'head-of-sales', label: 'Sales Team' }
    ];

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const response = await api.get('/meetings/my-meetings');
            setMeetings(response.data.data);
        } catch (error) {
            toast.error('Failed to load meetings');
        }
    };

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/meetings', formData);
            toast.success(`Meeting created! ${response.data.notificationCount} notifications sent`);
            setShowCreateModal(false);
            fetchMeetings();
            setFormData({
                title: '',
                description: '',
                startTime: '',
                endTime: '',
                invitedRoles: [],
                location: 'zoom'
            });
        } catch (error) {
            toast.error('Failed to create meeting');
        }
    };

    const handleRoleToggle = (role) => {
        setFormData(prev => ({
            ...prev,
            invitedRoles: prev.invitedRoles.includes(role)
                ? prev.invitedRoles.filter(r => r !== role)
                : [...prev.invitedRoles, role]
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Meetings</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Create Meeting
                </button>
            </div>

            {/* Meetings List */}
            <div className="grid gap-4">
                {meetings.map(meeting => (
                    <div key={meeting._id} className="dashboard-card">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">{meeting.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{meeting.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={16} />
                                        {new Date(meeting.startTime).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={16} />
                                        {new Date(meeting.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users size={16} />
                                        {meeting.attendees?.length || 0} attendees
                                    </div>
                                </div>
                            </div>
                            {meeting.meetingLink && (
                                <a
                                    href={meeting.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Video size={18} />
                                    Join
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Meeting Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
                        <h2 className="text-xl font-bold mb-4">Create Meeting</h2>
                        <form onSubmit={handleCreateMeeting} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    className="input-modern w-full"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="input-modern w-full"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Time *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="input-modern w-full"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Time *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="input-modern w-full"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Invite Team Members</label>
                                <div className="space-y-2">
                                    {roleOptions.map(role => (
                                        <label key={role.value} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.invitedRoles.includes(role.value)}
                                                onChange={() => handleRoleToggle(role.value)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{role.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create & Send Notifications
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingManagement;
```

---

## ✅ Implementation Checklist

- [ ] Step 1: Get Calendly API credentials
- [ ] Step 2: Add environment variables
- [ ] Step 3: Create Meeting model
- [ ] Step 4: Create Calendly service
- [ ] Step 5: Create meeting controller with role-based notifications
- [ ] Step 6: Add email notification function
- [ ] Step 7: Create API routes
- [ ] Step 8: Build frontend UI
- [ ] Step 9: Test notifications for different roles
- [ ] Step 10: (Optional) Setup Calendly webhooks for real-time sync

---

## 🚀 Usage Examples

### Create Meeting for All Developers
```javascript
POST /api/meetings
{
  "title": "Sprint Planning",
  "description": "Quarterly sprint planning session",
  "startTime": "2026-01-15T10:00:00",
  "endTime": "2026-01-15T11:00:00",
  "invitedRoles": ["individual-developer"],
  "location": "zoom"
}
```
**Result**: All developers get email notification! ✅

### Create Meeting for Everyone
```javascript
{
  "title": "All Hands Meeting",
  "invitedRoles": ["all"]
}
```
**Result**: Every team member gets notified! ✅

---

## 🔔 Notification Flow

1. **Manager creates meeting** → Select roles (developers, HR, all)
2. **Backend processes** → Find all users matching roles
3. **Send emails** → Parallel email dispatch to all recipients
4. **Store in DB** → Meeting saved with attendee list
5. **Users get notified** → Email + In-app notification

---

**Total Files to Create**: 5 new files + 2 modifications
**Estimated Time**: 2-3 hours for complete implementation

Let me know when you want to start implementing! 🚀
