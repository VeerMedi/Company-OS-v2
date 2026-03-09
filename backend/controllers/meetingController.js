const Meeting = require('../models/Meeting');
const User = require('../models/User');
const calendlyService = require('../services/calendlyService');
const nodemailer = require('nodemailer');

// Email transporter (reuse from existing email service if available)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send meeting notification email
async function sendMeetingNotification({ recipientEmail, recipientName, meetingTitle, meetingDescription, startTime, endTime, organizerName, meetingLink }) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: recipientEmail,
        subject: `📅 Meeting Invitation: ${meetingTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📅 Meeting Invitation</h1>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">Hi <strong>${recipientName}</strong>,</p>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;"><strong>${organizerName}</strong> has invited you to a meeting.</p>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                        <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">${meetingTitle}</h2>
                        <p style="color: #4b5563; margin: 10px 0;">${meetingDescription || 'No description provided'}</p>
                        
                        <div style="margin-top: 15px;">
                            <p style="margin: 8px 0; color: #374151;"><strong>📅 Date:</strong> ${new Date(startTime).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p style="margin: 8px 0; color: #374151;"><strong>⏰ Time:</strong> ${new Date(startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p style="margin: 8px 0; color: #374151;"><strong>⏱️ Duration:</strong> ${Math.round((new Date(endTime) - new Date(startTime)) / 60000)} minutes</p>
                            ${meetingLink ? `<p style="margin: 8px 0; color: #374151;"><strong>🔗 Join Link:</strong> <a href="${meetingLink}" style="color: #667eea; text-decoration: none;">${meetingLink}</a></p>` : ''}
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL}/meetings" 
                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            View in Dashboard
                        </a>
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                            This is an automated notification from The Hustle System.<br>
                            Please do not reply to this email.
                        </p>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, recipient: recipientEmail };
    } catch (error) {
        console.error('Email send error to', recipientEmail, ':', error.message);
        return { success: false, error: error.message, recipient: recipientEmail };
    }
}

// Get notification recipients based on roles and specific users
async function getNotificationRecipients(meeting) {
    let recipients = [];

    // If 'all' role is selected, get all active users
    if (meeting.invitedRoles.includes('all')) {
        recipients = await User.find({ isActive: true }).select('firstName lastName email role');
    } else {
        // Get users by specific roles
        if (meeting.invitedRoles.length > 0) {
            const roleUsers = await User.find({
                role: { $in: meeting.invitedRoles },
                isActive: true
            }).select('firstName lastName email role');
            recipients.push(...roleUsers);
        }

        // Get specific invited users
        if (meeting.invitedUsers.length > 0) {
            const specificUsers = await User.find({
                _id: { $in: meeting.invitedUsers },
                isActive: true
            }).select('firstName lastName email role');
            recipients.push(...specificUsers);
        }
    }

    // Remove duplicates by converting to Map using _id as key
    const uniqueRecipients = Array.from(
        new Map(recipients.map(u => [u._id.toString(), u])).values()
    );

    // Exclude the meeting creator from notifications (optional - can be removed if creator should also be notified)
    return uniqueRecipients.filter(u => u._id.toString() !== meeting.createdBy._id.toString());
}

// Send notifications to all users
async function sendNotificationsToUsers(meeting, users) {
    const organizerName = `${meeting.createdBy.firstName} ${meeting.createdBy.lastName}`;

    const emailPromises = users.map(user =>
        sendMeetingNotification({
            recipientEmail: user.email,
            recipientName: `${user.firstName} ${user.lastName}`,
            meetingTitle: meeting.title,
            meetingDescription: meeting.description,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            organizerName: organizerName,
            meetingLink: meeting.meetingLink || '#'
        })
    );

    const results = await Promise.allSettled(emailPromises);

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`📧 Sent ${successful} meeting notifications, ${failed} failed`);

    return results;
}

// Auto-detect team roles from meeting title/description
function detectInvitedRoles(title, description) {
    const text = `${title} ${description || ''}`.toLowerCase();
    const roles = [];

    // Check for specific keywords to determine which teams to invite
    if (text.includes('all hands') || text.includes('company') || text.includes('everyone') || text.includes('team meeting')) {
        roles.push('all');
    }
    if (text.includes('developer') || text.includes('dev') || text.includes('sprint') || text.includes('standup') || text.includes('technical') || text.includes('code')) {
        roles.push('individual-developer');
    }
    if (text.includes('manager') || text.includes('leadership') || text.includes('management')) {
        roles.push('manager');
    }
    if (text.includes('hr') || text.includes('human resource') || text.includes('recruitment') || text.includes('hiring')) {
        roles.push('hr');
    }
    if (text.includes('sales') || text.includes('revenue') || text.includes('client') || text.includes('customer')) {
        roles.push('head-of-sales');
    }
    if (text.includes('ceo') || text.includes('executive') || text.includes('board')) {
        roles.push('ceo');
    }

    // Default: if no specific role detected, invite all
    if (roles.length === 0) {
        roles.push('all');
    }

    return [...new Set(roles)]; // Remove duplicates
}

// ==================== CONTROLLER FUNCTIONS ====================

// Create meeting and send notifications (Manual creation)
exports.createMeeting = async (req, res) => {
    try {
        const { title, description, startTime, endTime, invitedRoles, invitedUsers, location, meetingLink } = req.body;

        // Validation
        if (!title || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Title, start time, and end time are required'
            });
        }

        // Create meeting
        const meeting = new Meeting({
            title,
            description,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            invitedRoles: invitedRoles || [],
            invitedUsers: invitedUsers || [],
            location: location || 'zoom',
            meetingLink,
            createdBy: req.user.id,
            status: 'scheduled'
        });

        await meeting.save();
        await meeting.populate('createdBy invitedUsers', 'firstName lastName email');

        // Get all users who should be notified
        const usersToNotify = await getNotificationRecipients(meeting);

        // Send notifications to all recipients
        await sendNotificationsToUsers(meeting, usersToNotify);

        // Update meeting to mark notifications as sent
        meeting.notificationsSent = true;
        meeting.notificationsSentAt = new Date();
        meeting.notifiedUserIds = usersToNotify.map(u => u._id);
        await meeting.save();

        res.status(201).json({
            success: true,
            message: `Meeting created successfully! ${usersToNotify.length} notifications sent.`,
            data: meeting,
            notificationCount: usersToNotify.length
        });

    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create meeting',
            error: error.message
        });
    }
};

// Get all meetings (for admins/managers)
exports.getAllMeetings = async (req, res) => {
    try {
        const { status, upcoming, past } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (upcoming === 'true') {
            filter.startTime = { $gte: new Date() };
            filter.status = 'scheduled';
        }
        if (past === 'true') {
            filter.startTime = { $lt: new Date() };
        }

        const meetings = await Meeting.find(filter)
            .populate('createdBy', 'firstName lastName email role')
            .populate('invitedUsers', 'firstName lastName email role')
            .populate('attendees.user', 'firstName lastName email')
            .sort({ startTime: upcoming === 'true' ? 1 : -1 });

        res.json({
            success: true,
            count: meetings.length,
            data: meetings
        });
    } catch (error) {
        console.error('Get all meetings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch meetings',
            error: error.message
        });
    }
};

// Get my meetings (where I'm invited or creator)
exports.getMyMeetings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const meetings = await Meeting.find({
            $or: [
                { createdBy: req.user.id },
                { invitedUsers: req.user.id },
                { invitedRoles: user.role },
                { invitedRoles: 'all' },
                { notifiedUserIds: req.user.id }
            ],
            status: { $ne: 'cancelled' }
        })
            .populate('createdBy', 'firstName lastName email')
            .populate('attendees.user', 'firstName lastName email')
            .sort({ startTime: 1 });

        // Separate upcoming and past meetings
        const now = new Date();
        const upcomingMeetings = meetings.filter(m => new Date(m.startTime) >= now);
        const pastMeetings = meetings.filter(m => new Date(m.startTime) < now);

        res.json({
            success: true,
            total: meetings.length,
            upcoming: upcomingMeetings.length,
            past: pastMeetings.length,
            data: {
                upcoming: upcomingMeetings,
                past: pastMeetings
            }
        });
    } catch (error) {
        console.error('Get my meetings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your meetings',
            error: error.message
        });
    }
};

// Get single meeting details
exports.getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.meetingId)
            .populate('createdBy', 'firstName lastName email role')
            .populate('invitedUsers', 'firstName lastName email role')
            .populate('attendees.user', 'firstName lastName email role');

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        res.json({
            success: true,
            data: meeting
        });
    } catch (error) {
        console.error('Get meeting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch meeting',
            error: error.message
        });
    }
};

// Update meeting
exports.updateMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.meetingId);

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        // Check if user is the creator
        if (meeting.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the meeting creator can update this meeting'
            });
        }

        const { title, description, startTime, endTime, location, meetingLink } = req.body;

        if (title) meeting.title = title;
        if (description !== undefined) meeting.description = description;
        if (startTime) meeting.startTime = new Date(startTime);
        if (endTime) meeting.endTime = new Date(endTime);
        if (location) meeting.location = location;
        if (meetingLink !== undefined) meeting.meetingLink = meetingLink;

        await meeting.save();
        await meeting.populate('createdBy invitedUsers attendees.user');

        res.json({
            success: true,
            message: 'Meeting updated successfully',
            data: meeting
        });
    } catch (error) {
        console.error('Update meeting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update meeting',
            error: error.message
        });
    }
};

// Respond to meeting invitation
exports.respondToMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { status } = req.body; // 'accepted', 'declined', 'tentative'

        if (!['accepted', 'declined', 'tentative'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: accepted, declined, or tentative'
            });
        }

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
        console.error('Respond to meeting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to respond to meeting',
            error: error.message
        });
    }
};

// Cancel meeting
exports.cancelMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.meetingId);

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        // Check if user is the creator
        if (meeting.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the meeting creator can cancel this meeting'
            });
        }

        meeting.status = 'cancelled';
        meeting.cancelledBy = req.user.id;
        meeting.cancellationReason = req.body.reason || 'No reason provided';
        meeting.cancelledAt = new Date();

        await meeting.save();

        res.json({
            success: true,
            message: 'Meeting cancelled successfully',
            data: meeting
        });
    } catch (error) {
        console.error('Cancel meeting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel meeting',
            error: error.message
        });
    }
};

// Sync with Calendly (fetch events and auto-send notifications) - MAIN FEATURE
exports.syncCalendlyEvents = async (req, res) => {
    try {
        if (!calendlyService.isConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Calendly API is not configured. Please add CALENDLY_API_KEY to .env file'
            });
        }

        console.log('🔄 Starting Calendly sync...');

        // First, get current user to obtain user URI
        let currentUser;
        try {
            currentUser = await calendlyService.getCurrentUser();
            console.log('✅ Calendly user authenticated:', currentUser.name);
        } catch (error) {
            console.error('❌ Failed to authenticate with Calendly:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Failed to authenticate with Calendly. Please check your API key.',
                error: error.message
            });
        }

        // Fetch events using the user URI
        const events = await calendlyService.getScheduledEvents({ user: currentUser.uri });
        console.log(`📅 Found ${events.length} events from Calendly`);

        let syncedCount = 0;
        let skippedCount = 0;
        let notificationsSent = 0;
        const syncDetails = [];

        for (const event of events) {
            // Check if event already exists
            const existing = await Meeting.findOne({ calendlyEventUri: event.uri });

            if (!existing) {
                console.log(`✨ New event found: ${event.name}`);

                // Auto-detect which teams to invite based on meeting title/description
                const invitedRoles = detectInvitedRoles(event.name, event.event_memberships?.[0]?.user_name || '');
                console.log(`   Detected roles: ${invitedRoles.join(', ')}`);

                // Get event invitees from Calendly (optional, for logging)
                let inviteeCount = 0;
                try {
                    const invitees = await calendlyService.getEventInvitees(event.uri);
                    inviteeCount = invitees.length;
                } catch (err) {
                    console.log('   Could not fetch invitees:', err.message);
                }

                // Create new meeting from Calendly event
                const meeting = await Meeting.create({
                    title: event.name,
                    description: `Synced from Calendly. ${inviteeCount > 0 ? `External invitees: ${inviteeCount}` : ''}`,
                    calendlyEventUri: event.uri,
                    calendlyEventId: event.uri.split('/').pop(),
                    calendlyEventUrl: event.scheduling_url,
                    startTime: event.start_time,
                    endTime: event.end_time,
                    location: 'calendly',
                    meetingLink: event.location?.join_url || event.scheduling_url,
                    createdBy: req.user.id,
                    invitedRoles: invitedRoles,
                    status: event.status === 'active' ? 'scheduled' : 'cancelled'
                });

                await meeting.populate('createdBy', 'firstName lastName email');

                // Send notifications to team members
                const usersToNotify = await getNotificationRecipients(meeting);
                console.log(`   📧 Sending notifications to ${usersToNotify.length} team members`);

                if (usersToNotify.length > 0) {
                    await sendNotificationsToUsers(meeting, usersToNotify);

                    // Update meeting with notification details
                    meeting.notificationsSent = true;
                    meeting.notificationsSentAt = new Date();
                    meeting.notifiedUserIds = usersToNotify.map(u => u._id);
                    await meeting.save();

                    notificationsSent += usersToNotify.length;
                }

                syncDetails.push({
                    title: event.name,
                    startTime: new Date(event.start_time).toLocaleString('en-IN'),
                    invitedRoles: invitedRoles,
                    notificationsSent: usersToNotify.length
                });

                syncedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`✅ Sync complete! New: ${syncedCount}, Skipped: ${skippedCount}, Notifications: ${notificationsSent}`);

        res.json({
            success: true,
            message: `🎉 Calendly sync complete! ${syncedCount} new meetings imported, ${notificationsSent} notifications sent`,
            summary: {
                totalEvents: events.length,
                newMeetings: syncedCount,
                skippedDuplicates: skippedCount,
                notificationsSent: notificationsSent
            },
            newMeetings: syncDetails
        });
    } catch (error) {
        console.error('❌ Sync Calendly error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync with Calendly',
            error: error.message
        });
    }
};

module.exports = exports;
