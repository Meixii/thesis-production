const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  unarchiveNotification
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticateToken);

// Get user notifications
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark notifications as read
router.post('/mark-read', markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', markAllAsRead);

// Archive a notification
router.post('/:notificationId/archive', archiveNotification);

// Unarchive a notification
router.post('/:notificationId/unarchive', unarchiveNotification);

module.exports = router; 