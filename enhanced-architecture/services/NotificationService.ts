import { EventEmitter } from 'events';
import { CacheService } from './CacheService';
import { DatabaseService } from './DatabaseService';

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  categories: {
    security: boolean;
    updates: boolean;
    marketing: boolean;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: string[];
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
}

export class NotificationService extends EventEmitter {
  private cache: CacheService;
  private db: DatabaseService;
  private templates: Map<string, NotificationTemplate> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private queue: Notification[] = [];
  private processing = false;

  constructor(cache: CacheService, db: DatabaseService) {
    super();
    this.cache = cache;
    this.db = db;
    this.setupDefaultTemplates();
    this.setupDefaultChannels();
    this.startQueueProcessor();
  }

  /**
   * Send notification
   */
  async sendNotification(
    userId: string,
    type: string,
    data: {
      title: string;
      message: string;
      templateId?: string;
      variables?: Record<string, any>;
      channels?: string[];
      priority?: 'low' | 'normal' | 'high';
      scheduledFor?: Date;
    }
  ): Promise<string> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Determine channels based on preferences and type
      const channels = this.determineChannels(data.channels, preferences, type);
      
      if (channels.length === 0) {
        console.log(`No channels enabled for user ${userId} and type ${type}`);
        return '';
      }

      // Create notification
      const notification: Notification = {
        id: this.generateId(),
        userId,
        type,
        title: data.title,
        message: data.message,
        data: data.variables,
        channels,
        status: 'pending',
        createdAt: new Date()
      };

      // Apply template if specified
      if (data.templateId) {
        await this.applyTemplate(notification, data.templateId, data.variables || {});
      }

      // Schedule or queue immediately
      if (data.scheduledFor && data.scheduledFor > new Date()) {
        await this.scheduleNotification(notification, data.scheduledFor);
      } else {
        await this.queueNotification(notification, data.priority);
      }

      this.emit('notification_created', notification);
      return notification.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    userIds: string[],
    type: string,
    data: {
      title: string;
      message: string;
      templateId?: string;
      variables?: Record<string, any>;
      channels?: string[];
    }
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const userId of userIds) {
      try {
        const id = await this.sendNotification(userId, type, data);
        if (id) notificationIds.push(id);
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
      }
    }

    return notificationIds;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      type?: string;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const where: any = { userId };
      
      if (options.status) where.status = options.status;
      if (options.type) where.type = options.type;
      if (options.unreadOnly) where.readAt = null;

      const [notifications, total, unreadCount] = await Promise.all([
        this.db.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: options.limit || 50,
          skip: options.offset || 0
        }),
        this.db.notification.count({ where }),
        this.db.notification.count({
          where: { userId, readAt: null }
        })
      ]);

      return {
        notifications: notifications as Notification[],
        total,
        unreadCount
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await this.db.notification.update({
        where: { id: notificationId, userId },
        data: { readAt: new Date() }
      });

      this.emit('notification_read', { notificationId, userId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.db.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() }
      });

      this.emit('all_notifications_read', { userId });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const existing = await this.getUserPreferences(userId);
      const updated = { ...existing, ...preferences };

      await this.cache.set(`notification_preferences:${userId}`, updated, 86400);
      
      // Also store in database
      await this.db.userPreferences.upsert({
        where: { userId },
        update: { notificationPreferences: updated },
        create: { userId, notificationPreferences: updated }
      });

      this.emit('preferences_updated', { userId, preferences: updated });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Try cache first
      const cached = await this.cache.get<NotificationPreferences>(`notification_preferences:${userId}`);
      if (cached) return cached;

      // Get from database
      const userPrefs = await this.db.userPreferences.findUnique({
        where: { userId }
      });

      const preferences: NotificationPreferences = userPrefs?.notificationPreferences || {
        userId,
        channels: { email: true, sms: false, push: true },
        frequency: 'immediate',
        categories: { security: true, updates: true, marketing: false }
      };

      // Cache for 24 hours
      await this.cache.set(`notification_preferences:${userId}`, preferences, 86400);

      return preferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      // Return default preferences
      return {
        userId,
        channels: { email: true, sms: false, push: true },
        frequency: 'immediate',
        categories: { security: true, updates: true, marketing: false }
      };
    }
  }

  /**
   * Create notification template
   */
  createTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Register notification channel
   */
  registerChannel(id: string, channel: NotificationChannel): void {
    this.channels.set(id, channel);
  }

  /**
   * Get notification statistics
   */
  async getStatistics(timeRange: { start: Date; end: Date }): Promise<{
    totalSent: number;
    deliveryRate: number;
    channelBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    failureReasons: Record<string, number>;
  }> {
    try {
      const notifications = await this.db.notification.findMany({
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        }
      });

      const totalSent = notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
      const totalDelivered = notifications.filter(n => n.status === 'delivered').length;
      const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;

      const channelBreakdown: Record<string, number> = {};
      const typeBreakdown: Record<string, number> = {};
      const failureReasons: Record<string, number> = {};

      notifications.forEach(notification => {
        // Channel breakdown
        notification.channels.forEach(channel => {
          channelBreakdown[channel] = (channelBreakdown[channel] || 0) + 1;
        });

        // Type breakdown
        typeBreakdown[notification.type] = (typeBreakdown[notification.type] || 0) + 1;

        // Failure reasons
        if (notification.status === 'failed' && notification.error) {
          failureReasons[notification.error] = (failureReasons[notification.error] || 0) + 1;
        }
      });

      return {
        totalSent: notifications.length,
        deliveryRate,
        channelBreakdown,
        typeBreakdown,
        failureReasons
      };
    } catch (error) {
      console.error('Error getting notification statistics:', error);
      throw error;
    }
  }

  // Private methods

  private async queueNotification(notification: Notification, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    // Add to queue based on priority
    if (priority === 'high') {
      this.queue.unshift(notification);
    } else {
      this.queue.push(notification);
    }

    // Store in database
    await this.db.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        channels: notification.channels,
        status: notification.status,
        createdAt: notification.createdAt
      }
    });

    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async scheduleNotification(notification: Notification, scheduledFor: Date): Promise<void> {
    // Store scheduled notification
    await this.cache.zadd('scheduled_notifications', scheduledFor.getTime(), JSON.stringify(notification));
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const notification = this.queue.shift()!;
      
      try {
        await this.deliverNotification(notification);
      } catch (error) {
        console.error(`Error delivering notification ${notification.id}:`, error);
        notification.status = 'failed';
        notification.error = error instanceof Error ? error.message : 'Unknown error';
        
        await this.updateNotificationStatus(notification);
      }

      // Small delay to prevent overwhelming external services
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    const deliveryPromises = notification.channels.map(async (channelId) => {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) {
        throw new Error(`Channel ${channelId} not found or disabled`);
      }

      switch (channel.type) {
        case 'email':
          return this.sendEmail(notification, channel);
        case 'sms':
          return this.sendSMS(notification, channel);
        case 'push':
          return this.sendPushNotification(notification, channel);
        case 'webhook':
          return this.sendWebhook(notification, channel);
        default:
          throw new Error(`Unknown channel type: ${channel.type}`);
      }
    });

    await Promise.all(deliveryPromises);
    
    notification.status = 'sent';
    notification.sentAt = new Date();
    
    await this.updateNotificationStatus(notification);
    this.emit('notification_sent', notification);
  }

  private async sendEmail(notification: Notification, channel: NotificationChannel): Promise<void> {
    // Email sending implementation would go here
    console.log(`Sending email notification ${notification.id}`);
  }

  private async sendSMS(notification: Notification, channel: NotificationChannel): Promise<void> {
    // SMS sending implementation would go here
    console.log(`Sending SMS notification ${notification.id}`);
  }

  private async sendPushNotification(notification: Notification, channel: NotificationChannel): Promise<void> {
    // Push notification implementation would go here
    console.log(`Sending push notification ${notification.id}`);
  }

  private async sendWebhook(notification: Notification, channel: NotificationChannel): Promise<void> {
    // Webhook implementation would go here
    console.log(`Sending webhook notification ${notification.id}`);
  }

  private async updateNotificationStatus(notification: Notification): Promise<void> {
    await this.db.notification.update({
      where: { id: notification.id },
      data: {
        status: notification.status,
        sentAt: notification.sentAt,
        deliveredAt: notification.deliveredAt,
        error: notification.error
      }
    });
  }

  private async applyTemplate(
    notification: Notification,
    templateId: string,
    variables: Record<string, any>
  ): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Replace variables in template
    let content = template.htmlContent;
    let textContent = template.textContent;
    let subject = template.subject;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
      textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value));
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
    }

    notification.title = subject;
    notification.message = textContent;
    notification.data = { ...notification.data, htmlContent: content };
  }

  private determineChannels(
    requestedChannels: string[] | undefined,
    preferences: NotificationPreferences,
    type: string
  ): string[] {
    const availableChannels = ['email', 'sms', 'push'];
    
    // If specific channels requested, use those (filtered by preferences)
    if (requestedChannels) {
      return requestedChannels.filter(channel => {
        if (!availableChannels.includes(channel)) return false;
        return preferences.channels[channel as keyof typeof preferences.channels];
      });
    }

    // Otherwise, use all enabled channels based on preferences
    const enabledChannels: string[] = [];
    
    if (preferences.channels.email) enabledChannels.push('email');
    if (preferences.channels.sms) enabledChannels.push('sms');
    if (preferences.channels.push) enabledChannels.push('push');

    // Filter by category preferences
    const category = this.getNotificationCategory(type);
    if (category && !preferences.categories[category]) {
      return [];
    }

    return enabledChannels;
  }

  private getNotificationCategory(type: string): keyof NotificationPreferences['categories'] | null {
    const categoryMap: Record<string, keyof NotificationPreferences['categories']> = {
      'security_alert': 'security',
      'password_changed': 'security',
      'login_attempt': 'security',
      'system_update': 'updates',
      'feature_announcement': 'updates',
      'newsletter': 'marketing',
      'promotion': 'marketing'
    };

    return categoryMap[type] || null;
  }

  private setupDefaultTemplates(): void {
    this.createTemplate({
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to {{siteName}}!',
      htmlContent: '<h1>Welcome {{userName}}!</h1><p>Thanks for joining {{siteName}}.</p>',
      textContent: 'Welcome {{userName}}! Thanks for joining {{siteName}}.',
      variables: ['userName', 'siteName']
    });

    this.createTemplate({
      id: 'password_reset',
      name: 'Password Reset',
      subject: 'Reset your password',
      htmlContent: '<p>Click <a href="{{resetLink}}">here</a> to reset your password.</p>',
      textContent: 'Reset your password: {{resetLink}}',
      variables: ['resetLink']
    });
  }

  private setupDefaultChannels(): void {
    this.registerChannel('email', {
      type: 'email',
      config: {},
      enabled: true
    });

    this.registerChannel('push', {
      type: 'push',
      config: {},
      enabled: true
    });
  }

  private startQueueProcessor(): void {
    // Process queue every 5 seconds
    setInterval(() => {
      this.processQueue();
    }, 5000);

    // Process scheduled notifications every minute
    setInterval(() => {
      this.processScheduledNotifications();
    }, 60000);
  }

  private async processScheduledNotifications(): Promise<void> {
    try {
      const now = Date.now();
      const scheduled = await this.cache.zrangebyscore('scheduled_notifications', 0, now);
      
      for (const notificationData of scheduled) {
        const notification = JSON.parse(notificationData) as Notification;
        await this.queueNotification(notification);
        await this.cache.zrem('scheduled_notifications', notificationData);
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop the notification service
   */
  async stop(): Promise<void> {
    this.processing = false;
    this.removeAllListeners();
  }
}

export default NotificationService;