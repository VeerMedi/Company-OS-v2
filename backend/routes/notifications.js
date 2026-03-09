const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../services/NotificationService');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the current user
 * @access  Private (All authenticated users)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { unreadOnly, type, priority, limit } = req.query;
    
    const filters = {
      unreadOnly: unreadOnly === 'true',
      type,
      priority,
      limit: limit ? parseInt(limit) : undefined
    };

    const result = await getUserNotifications(req.user.userId, filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private (All authenticated users)
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const result = await getUserNotifications(req.user.userId, { unreadOnly: true });
    
    res.json({
      success: true,
      count: result.unread
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Private (All authenticated users)
 */
router.patch('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const notification = await markAsRead(req.user.userId, req.params.notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private (All authenticated users)
 */
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const result = await markAllAsRead(req.user.userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Private (All authenticated users)
 */
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const deleted = await deleteNotification(req.user.userId, req.params.notificationId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

module.exports = router;
