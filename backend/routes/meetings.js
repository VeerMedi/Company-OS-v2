const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');

// All routes require authentication
router.use(authenticateToken);

// ==================== MEETING ROUTES ====================

// Create new meeting (with role-based notifications)
router.post('/', meetingController.createMeeting);

// Get all meetings (for admins/managers)
router.get('/', meetingController.getAllMeetings);

// Get my meetings (upcoming and past)
router.get('/my-meetings', meetingController.getMyMeetings);

// Get single meeting details
router.get('/:meetingId', meetingController.getMeetingById);

// Update meeting (only creator)
router.put('/:meetingId', meetingController.updateMeeting);

// Respond to meeting invitation (accept/decline/tentative)
router.post('/:meetingId/respond', meetingController.respondToMeeting);

// Cancel meeting (only creator)
router.post('/:meetingId/cancel', meetingController.cancelMeeting);

// ==================== CALENDLY INTEGRATION ====================

// Sync events from Calendly
router.post('/calendly/sync', meetingController.syncCalendlyEvents);

module.exports = router;
