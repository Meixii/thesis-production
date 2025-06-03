const notificationService = require('../services/notificationService');

/**
 * Get notifications for the authenticated user
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;
    
    const notifications = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

/**
 * Get unread notification count for the authenticated user
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

/**
 * Mark notifications as read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'notificationIds must be an array' });
    }
    
    const updatedNotifications = await notificationService.markNotificationsAsRead(
      userId,
      notificationIds
    );
    
    res.json({ 
      success: true,
      updatedNotifications 
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all unread notification IDs
    const unreadNotifications = await notificationService.getUserNotifications(userId, {
      unreadOnly: true,
      limit: 1000 // Get all unread notifications
    });
    
    if (unreadNotifications.length > 0) {
      const notificationIds = unreadNotifications.map(n => n.id);
      await notificationService.markNotificationsAsRead(userId, notificationIds);
    }
    
    res.json({ 
      success: true,
      markedCount: unreadNotifications.length
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
}; 