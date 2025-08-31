const db = require('../config/db');
const { sendNotificationEmail } = require('../utils/email');

/**
 * Create a notification in the database
 * @param {Object} notificationData - Notification data
 * @param {number} notificationData.userId - User ID
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type
 * @param {string} [notificationData.relatedEntityType] - Related entity type (e.g., 'due', 'payment')
 * @param {number} [notificationData.relatedEntityId] - Related entity ID
 * @param {string} [notificationData.targetUrl] - Target URL for the notification
 */
const createNotification = async (notificationData) => {
  const { userId, message, type, relatedEntityType, relatedEntityId, targetUrl } = notificationData;
  let finalTargetUrl = targetUrl;
  
  // Auto-generate target_url for common types if not provided
  if (!finalTargetUrl && relatedEntityType && relatedEntityId) {
    // Get user role to determine appropriate target URL
    let userRole = null;
    try {
      const userResult = await db.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows.length > 0) {
        userRole = userResult.rows[0].role;
      }
    } catch (error) {
      console.error('Error getting user role for notification:', error);
    }

    switch (relatedEntityType) {
      case 'due':
        if (userRole === 'treasurer') {
          finalTargetUrl = `/treasurer/dues/${relatedEntityId}`;
        } else if (userRole === 'student') {
          // For students, route to their dashboard where dues are displayed
          finalTargetUrl = `/dashboard`;
        } else {
          // For other roles (admin, finance_coordinator), route to dashboard
          finalTargetUrl = `/dashboard`;
        }
        break;
      case 'payment':
        if (userRole === 'treasurer') {
          finalTargetUrl = `/treasurer/payments/pending`;
        } else {
          finalTargetUrl = `/payment-history`;
        }
        break;
      case 'loan':
        if (userRole === 'finance_coordinator') {
          finalTargetUrl = `/loans`;
        } else {
          finalTargetUrl = `/loans/my-loans`;
        }
        break;
      default:
        finalTargetUrl = null;
    }
  }
  
  try {
    const result = await db.query(
      `INSERT INTO notifications (user_id, message, type, related_entity_type, related_entity_id, target_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, message, type, relatedEntityType, relatedEntityId, finalTargetUrl]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 * @param {number[]} userIds - Array of user IDs
 * @param {Object} notificationData - Base notification data
 */
const createBulkNotifications = async (userIds, notificationData) => {
  const notifications = [];
  
  for (const userId of userIds) {
    try {
      const notification = await createNotification({
        ...notificationData,
        userId
      });
      notifications.push(notification);
    } catch (error) {
      console.error(`Failed to create notification for user ${userId}:`, error);
    }
  }
  
  return notifications;
};

/**
 * Get all users in a group
 * @param {number} groupId - Group ID
 */
const getUsersInGroup = async (groupId) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name 
       FROM users 
       WHERE group_id = $1 AND is_active = true`,
      [groupId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting users in group:', error);
    throw error;
  }
};

/**
 * Notify users about a new due (all users in group or selected users)
 * @param {Object} dueData - Due information
 * @param {number} dueData.dueId - Due ID
 * @param {string} dueData.title - Due title
 * @param {number} dueData.amount - Due amount
 * @param {Date} dueData.dueDate - Due date
 * @param {number} dueData.groupId - Group ID
 * @param {string} dueData.creatorName - Name of the user who created the due
 * @param {number[]} [dueData.targetUserIds] - Specific user IDs to notify (optional)
 */
const notifyNewDue = async (dueData) => {
  const { dueId, title, amount, dueDate, groupId, creatorName, targetUserIds } = dueData;
  
  try {
    // Resolve creator name if not provided by caller
    let resolvedCreatorName = creatorName;
    if (!resolvedCreatorName && dueId) {
      try {
        const nameResult = await db.query(
          `SELECT u.first_name, u.last_name
           FROM dues d
           JOIN users u ON u.id = d.created_by_user_id
           WHERE d.id = $1
           LIMIT 1`,
          [dueId]
        );
        if (nameResult.rows.length > 0) {
          resolvedCreatorName = `${nameResult.rows[0].first_name} ${nameResult.rows[0].last_name}`;
        }
      } catch (e) {
        console.error('Failed to resolve creator name for due:', dueId, e);
      }
    }
    if (!resolvedCreatorName) {
      resolvedCreatorName = 'Treasurer';
    }
    let users;
    
    if (targetUserIds && targetUserIds.length > 0) {
      // Notify only selected users
      const result = await db.query(
        `SELECT id, email, first_name, last_name 
         FROM users 
         WHERE id = ANY($1) AND group_id = $2 AND is_active = true`,
        [targetUserIds, groupId]
      );
      users = result.rows;
    } else {
      // Get all users in the group (backward compatibility)
      users = await getUsersInGroup(groupId);
    }
    
    // Create in-app notifications
    const message = `New due "${title}" for ₱${amount.toFixed(2)} has been created by ${resolvedCreatorName}. Due date: ${new Date(dueDate).toLocaleDateString()}`;
    
    await createBulkNotifications(
      users.map(u => u.id),
      {
        message,
        type: 'alert',
        relatedEntityType: 'due',
        relatedEntityId: dueId
      }
    );
    
    // Send email notifications
    for (const user of users) {
      try {
        await sendNotificationEmail({
          to: user.email,
          subject: `New Due Created: ${title}`,
          type: 'due_created',
          data: {
            userName: user.first_name,
            dueTitle: title,
            amount: amount,
            dueDate: dueDate,
            creatorName: resolvedCreatorName
          }
        });
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error notifying new due:', error);
    throw error;
  }
};

/**
 * Notify user about payment verification
 * @param {Object} paymentData - Payment information
 */
const notifyPaymentVerified = async (paymentData) => {
  const { userId, userEmail, userName, amount, dueTitle, paymentMethod } = paymentData;
  
  try {
    // Create in-app notification
    const message = `Your payment of ₱${amount.toFixed(2)} for "${dueTitle}" has been verified.`;
    
    await createNotification({
      userId,
      message,
      type: 'confirmation',
      relatedEntityType: 'payment',
      relatedEntityId: paymentData.paymentId
    });
    
    // Send email notification
    await sendNotificationEmail({
      to: userEmail,
      subject: 'Payment Verified',
      type: 'payment_verified',
      data: {
        userName,
        amount,
        dueTitle,
        paymentMethod
      }
    });
  } catch (error) {
    console.error('Error notifying payment verified:', error);
    throw error;
  }
};

/**
 * Notify user about payment rejection
 * @param {Object} paymentData - Payment information
 */
const notifyPaymentRejected = async (paymentData) => {
  const { userId, userEmail, userName, amount, dueTitle, rejectionReason } = paymentData;
  
  try {
    // Create in-app notification
    const message = `Your payment of ₱${amount.toFixed(2)} for "${dueTitle}" has been rejected. Reason: ${rejectionReason}`;
    
    await createNotification({
      userId,
      message,
      type: 'alert',
      relatedEntityType: 'payment',
      relatedEntityId: paymentData.paymentId
    });
    
    // Send email notification
    await sendNotificationEmail({
      to: userEmail,
      subject: 'Payment Rejected',
      type: 'payment_rejected',
      data: {
        userName,
        amount,
        dueTitle,
        rejectionReason
      }
    });
  } catch (error) {
    console.error('Error notifying payment rejected:', error);
    throw error;
  }
};

/**
 * Notify users about upcoming due deadline
 * @param {Object} dueData - Due information
 */
const notifyUpcomingDueDeadline = async (dueData) => {
  const { dueId, title, amount, dueDate, groupId, daysUntilDue } = dueData;
  
  try {
    // Get unpaid users for this due
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name
       FROM users u
       JOIN user_dues ud ON u.id = ud.user_id
       WHERE ud.due_id = $1 
       AND ud.status IN ('pending', 'partially_paid')
       AND u.is_active = true`,
      [dueId]
    );
    
    const unpaidUsers = result.rows;
    
    // Create in-app notifications
    const message = `Reminder: Due "${title}" for ₱${amount.toFixed(2)} is due in ${daysUntilDue} days.`;
    
    await createBulkNotifications(
      unpaidUsers.map(u => u.id),
      {
        message,
        type: 'reminder',
        relatedEntityType: 'due',
        relatedEntityId: dueId
      }
    );
    
    // Send email notifications
    for (const user of unpaidUsers) {
      try {
        await sendNotificationEmail({
          to: user.email,
          subject: `Due Reminder: ${title}`,
          type: 'due_reminder',
          data: {
            userName: user.first_name,
            dueTitle: title,
            amount: amount,
            dueDate: dueDate,
            daysUntilDue: daysUntilDue
          }
        });
      } catch (error) {
        console.error(`Failed to send reminder email to ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error notifying upcoming due deadline:', error);
    throw error;
  }
};

/**
 * Notify about expense request status change
 * @param {Object} data - Notification data
 * @param {number} data.expenseId - Expense request ID
 * @param {number} data.userId - User ID
 * @param {string} data.status - New status
 */
const notifyExpenseStatusChange = async (data) => {
  try {
    // Get expense request details
    const result = await db.query(
      `SELECT er.*, u.email, u.first_name, u.last_name
       FROM expense_requests er
       JOIN users u ON er.user_id = u.id
       WHERE er.id = $1`,
      [data.expenseId]
    );

    if (result.rows.length === 0) {
      throw new Error('Expense request not found');
    }

    const expense = result.rows[0];
    let message = '';
    let emailSubject = '';
    let emailType = '';

    switch (data.status) {
      case 'approved':
        message = `Your expense request "${expense.title}" for ₱${parseFloat(expense.amount).toFixed(2)} has been approved.`;
        emailSubject = 'Expense Request Approved';
        emailType = 'expense_approved';
        break;
      case 'denied':
        message = `Your expense request "${expense.title}" for ₱${parseFloat(expense.amount).toFixed(2)} has been denied.`;
        emailSubject = 'Expense Request Denied';
        emailType = 'expense_denied';
        break;
      case 'completed':
        message = `Your expense request "${expense.title}" has been marked as completed.`;
        emailSubject = 'Expense Request Completed';
        emailType = 'expense_completed';
        break;
      default:
        return;
    }

    // Create in-app notification
    await createNotification({
      userId: data.userId,
      message,
      type: 'expense_status',
      relatedEntityType: 'expense',
      relatedEntityId: data.expenseId
    });

    // Send email notification
    await sendNotificationEmail({
      to: expense.email,
      subject: emailSubject,
      type: emailType,
      data: {
        userName: expense.first_name,
        expenseTitle: expense.title,
        amount: parseFloat(expense.amount),
        status: data.status
      }
    });
  } catch (error) {
    console.error('Error notifying expense status change:', error);
    throw error;
  }
};

/**
 * Get user notifications
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 */
const getUserNotifications = async (userId, options = {}) => {
  const { limit = 20, offset = 0, unreadOnly = false, archived = false } = options;
  
  try {
    let query = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [userId];
    if (unreadOnly) {
      query += ` AND is_read = false`;
    }
    query += ` AND archived = $2`;
    params.push(archived);
    query += ` ORDER BY created_at DESC LIMIT $3 OFFSET $4`;
    params.push(limit, offset);
    const result = await db.query(query, params);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Mark notifications as read
 * @param {number} userId - User ID
 * @param {number[]} notificationIds - Array of notification IDs
 */
const markNotificationsAsRead = async (userId, notificationIds) => {
  try {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND id = ANY($2::int[])
       RETURNING *`,
      [userId, notificationIds]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 * @param {number} userId - User ID
 */
const getUnreadCount = async (userId) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Archive a notification
 * @param {number} userId
 * @param {number} notificationId
 */
const archiveNotification = async (userId, notificationId) => {
  try {
    const result = await db.query(
      `UPDATE notifications SET archived = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error archiving notification:', error);
    throw error;
  }
};

/**
 * Unarchive a notification
 * @param {number} userId
 * @param {number} notificationId
 */
const unarchiveNotification = async (userId, notificationId) => {
  try {
    const result = await db.query(
      `UPDATE notifications SET archived = false WHERE id = $1 AND user_id = $2 RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error unarchiving notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getUsersInGroup,
  notifyNewDue,
  notifyPaymentVerified,
  notifyPaymentRejected,
  notifyUpcomingDueDeadline,
  notifyExpenseStatusChange,
  getUserNotifications,
  markNotificationsAsRead,
  getUnreadCount,
  archiveNotification,
  unarchiveNotification
}; 