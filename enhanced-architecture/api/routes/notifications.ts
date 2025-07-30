import express from 'express';
import { NotificationService } from '../../services/NotificationService';

const router = express.Router();

// Get user notifications
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      limit = '50',
      offset = '0',
      status,
      type,
      unreadOnly = 'false'
    } = req.query;

    const notifications: NotificationService = (req as any).services.notifications;
    
    const result = await notifications.getUserNotifications(userId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      status: status as string,
      type: type as string,
      unreadOnly: unreadOnly === 'true'
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      error: 'Failed to get notifications'
    });
  }
});

// Send notification
router.post('/send', async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      templateId,
      variables,
      channels,
      priority = 'normal',
      scheduledFor
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'userId, type, title, and message are required'
      });
    }

    const notifications: NotificationService = (req as any).services.notifications;
    
    const notificationId = await notifications.sendNotification(userId, type, {
      title,
      message,
      templateId,
      variables,
      channels,
      priority,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
    });

    res.json({ 
      success: true, 
      notificationId,
      message: 'Notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      error: 'Failed to send notification'
    });
  }
});

// Send bulk notifications
router.post('/send/bulk', async (req, res) => {
  try {
    const {
      userIds,
      type,
      title,
      message,
      templateId,
      variables,
      channels
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || !type || !title || !message) {
      return res.status(400).json({
        error: 'userIds (array), type, title, and message are required'
      });
    }

    const notifications: NotificationService = (req as any).services.notifications;
    
    const notificationIds = await notifications.sendBulkNotifications(userIds, type, {
      title,
      message,
      templateId,
      variables,
      channels
    });

    res.json({ 
      success: true, 
      notificationIds,
      count: notificationIds.length,
      message: `${notificationIds.length} notifications sent successfully` 
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      error: 'Failed to send bulk notifications'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    const notifications: NotificationService = (req as any).services.notifications;
    await notifications.markAsRead(notificationId, userId);

    res.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications: NotificationService = (req as any).services.notifications;
    await notifications.markAllAsRead(userId);

    res.json({ 
      success: true, 
      message: 'All notifications marked as read' 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read'
    });
  }
});

// Get user preferences
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications: NotificationService = (req as any).services.notifications;
    const preferences = await notifications.getUserPreferences(userId);

    res.json(preferences);
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({
      error: 'Failed to get user preferences'
    });
  }
});

// Update user preferences
router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    const notifications: NotificationService = (req as any).services.notifications;
    await notifications.updateUserPreferences(userId, preferences);

    res.json({ 
      success: true, 
      message: 'Preferences updated successfully' 
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      error: 'Failed to update user preferences'
    });
  }
});

// Get notification statistics (admin endpoint)
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }

    const notifications: NotificationService = (req as any).services.notifications;
    const statistics = await notifications.getStatistics({
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    });

    res.json(statistics);
  } catch (error) {
    console.error('Error getting notification statistics:', error);
    res.status(500).json({
      error: 'Failed to get notification statistics'
    });
  }
});

// Create notification template (admin endpoint)
router.post('/templates', async (req, res) => {
  try {
    const { id, name, subject, htmlContent, textContent, variables } = req.body;

    if (!id || !name || !subject || !htmlContent || !textContent) {
      return res.status(400).json({
        error: 'id, name, subject, htmlContent, and textContent are required'
      });
    }

    const notifications: NotificationService = (req as any).services.notifications;
    notifications.createTemplate({
      id,
      name,
      subject,
      htmlContent,
      textContent,
      variables: variables || []
    });

    res.json({ 
      success: true, 
      message: 'Template created successfully' 
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      error: 'Failed to create template'
    });
  }
});

// Register notification channel (admin endpoint)
router.post('/channels', async (req, res) => {
  try {
    const { id, type, config, enabled = true } = req.body;

    if (!id || !type) {
      return res.status(400).json({
        error: 'id and type are required'
      });
    }

    const notifications: NotificationService = (req as any).services.notifications;
    notifications.registerChannel(id, {
      type,
      config: config || {},
      enabled
    });

    res.json({ 
      success: true, 
      message: 'Channel registered successfully' 
    });
  } catch (error) {
    console.error('Error registering channel:', error);
    res.status(500).json({
      error: 'Failed to register channel'
    });
  }
});

export default router;