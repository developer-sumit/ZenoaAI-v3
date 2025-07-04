import notifee, {
  AndroidImportance,
  AndroidStyle,
  TriggerType,
  TimestampTrigger,
  EventType,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';

export interface NotificationData {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, any>;
  channelId?: string;
  scheduledTime?: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  description?: string;
  importance?: AndroidImportance;
  sound?: string;
  vibration?: boolean;
}

class NotificationService {
  private initialized = false;
  private fcmToken: string | null = null;

  /**
   * Initialize the notification service
   */  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Request permissions
      await this.requestPermissions();
      
      // Create default notification channels
      await this.createDefaultChannels();
      
      // Initialize FCM
      await this.initializeFCM();
      
      // Set up notification handlers
      this.setupNotificationHandlers();

      this.initialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requires explicit notification permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // Android < 13 doesn't need explicit permission
      } else {
        // iOS
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus === 1; // authorized
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Create default notification channels for Android
   */  async createDefaultChannels(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    const channels: NotificationChannel[] = [
      {
        id: 'default',
        name: 'Default Notifications',
        description: 'General app notifications',
        importance: AndroidImportance.DEFAULT,
        vibration: true,
      },
      {
        id: 'image_generation',
        name: 'Image Generation',
        description: 'Notifications for image generation completion',
        importance: AndroidImportance.HIGH,
        vibration: true,
      },
      {
        id: 'promotions',
        name: 'Promotions & Updates',
        description: 'App updates and promotional notifications',
        importance: AndroidImportance.DEFAULT,
        vibration: false,
      },
      {
        id: 'system',
        name: 'System Messages',
        description: 'Important system notifications',
        importance: AndroidImportance.HIGH,
        vibration: true,
      },
    ];

    for (const channel of channels) {
      await this.createChannel(channel);
    }
  }

  /**
   * Create a notification channel (Android only)
   */  async createChannel(channel: NotificationChannel): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await notifee.createChannel({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        importance: channel.importance || AndroidImportance.DEFAULT,
        vibration: channel.vibration !== false,
        sound: channel.sound || 'default',
      });
    } catch (error) {
      console.error(`Error creating channel ${channel.id}:`, error);
    }
  }

  /**
   * Initialize Firebase Cloud Messaging
   */  async initializeFCM(): Promise<void> {
    try {
      // Register device for remote messages
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }

      // Get FCM token
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Store token locally
      await EncryptedStorage.setItem('fcm_token', token);
      
      console.log('FCM Token:', token);

      // Listen for token refresh
      messaging().onTokenRefresh(async (newToken) => {
        this.fcmToken = newToken;
        await EncryptedStorage.setItem('fcm_token', newToken);
        console.log('FCM Token refreshed:', newToken);
        
        // TODO: Send new token to server
        this.sendTokenToServer(newToken);
      });

      // Send initial token to server
      this.sendTokenToServer(token);
    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  }  /**
   * Send FCM token to server
   */
  private async sendTokenToServer(_token: string): Promise<void> {
    try {
      // Import notificationAPI dynamically to avoid circular dependency
      const notificationAPI = require('./notificationAPI').notificationAPI;
      await notificationAPI.updateFCMToken();
      console.log('FCM token sent to server successfully');
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  /**
   * Set up notification event handlers
   */
  private setupNotificationHandlers(): void {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Received foreground message:', remoteMessage);
        if (remoteMessage.notification) {
        await this.displayNotification({
          title: remoteMessage.notification.title || 'Zenoa AI',
          body: remoteMessage.notification.body || '',
          imageUrl: remoteMessage.notification.android?.imageUrl,
          data: remoteMessage.data,
          channelId: (remoteMessage.data?.channelId as string) || 'default',
        });
      }
    });

    // Handle notification opening app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationPress(remoteMessage.data);
    });

    // Handle notification when app is opened from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          this.handleNotificationPress(remoteMessage.data);
        }
      });

    // Handle notification interactions
    notifee.onForegroundEvent(async ({type, detail}) => {
      if (type === EventType.PRESS) {
        console.log('User pressed notification:', detail.notification);
        this.handleNotificationPress(detail.notification?.data);
      }
    });

    notifee.onBackgroundEvent(async ({type, detail}) => {
      if (type === EventType.PRESS) {
        console.log('User pressed notification in background:', detail.notification);
        this.handleNotificationPress(detail.notification?.data);
      }
    });
  }

  /**
   * Handle notification press
   */  private handleNotificationPress(data?: Record<string, any>): void {
    if (!data) {
      return;
    }

    console.log('Handling notification press with data:', data);
    
    // TODO: Implement navigation logic based on notification data
    // Example: Navigate to specific screen based on data.screen
    switch (data.type) {
      case 'image_generation_complete':
        // Navigate to gallery or specific image
        break;
      case 'promotion':
        // Navigate to promotions or specific feature
        break;
      case 'system_update':
        // Navigate to settings or update screen
        break;
      default:
        // Navigate to home screen
        break;
    }
  }

  /**
   * Display a local notification
   */
  async displayNotification(notification: NotificationData): Promise<string | null> {
    try {
      const notificationId = await notifee.displayNotification({
        title: notification.title,
        body: notification.body,
        data: notification.data,
        android: {
          channelId: notification.channelId || 'default',
          importance: AndroidImportance.DEFAULT,
          pressAction: {
            id: 'default',
          },
          largeIcon: notification.imageUrl,
          style: notification.imageUrl ? {
            type: AndroidStyle.BIGPICTURE,
            picture: notification.imageUrl,
          } : undefined,
        },        ios: {
          attachments: notification.imageUrl ? [{
            url: notification.imageUrl,
            typeHint: 'public.jpeg',
          }] : undefined,
        },
      });

      console.log('Notification displayed with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error displaying notification:', error);
      return null;
    }
  }

  /**
   * Schedule a notification for later
   */
  async scheduleNotification(
    notification: NotificationData,
    scheduledTime: Date,
  ): Promise<string | null> {
    if (!notification.scheduledTime && !scheduledTime) {
      throw new Error('Scheduled time is required for scheduled notifications');
    }

    try {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: (notification.scheduledTime || scheduledTime).getTime(),
      };

      const notificationId = await notifee.createTriggerNotification({
        title: notification.title,
        body: notification.body,
        data: notification.data,
        android: {
          channelId: notification.channelId || 'default',
          importance: AndroidImportance.DEFAULT,
          pressAction: {
            id: 'default',
          },
        },
      }, trigger);

      console.log('Notification scheduled with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
      console.log('Notification canceled:', notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      console.log('All notifications canceled');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all displayed notifications
   */
  async getDisplayedNotifications(): Promise<any[]> {
    try {
      const notifications = await notifee.getDisplayedNotifications();
      return notifications;
    } catch (error) {
      console.error('Error getting displayed notifications:', error);
      return [];
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    if (this.fcmToken) {
      return this.fcmToken;
    }

    try {
      const storedToken = await EncryptedStorage.getItem('fcm_token');
      if (storedToken) {
        this.fcmToken = storedToken;
        return storedToken;
      }

      // Try to get fresh token
      if (messaging().isDeviceRegisteredForRemoteMessages) {
        const token = await messaging().getToken();
        this.fcmToken = token;
        await EncryptedStorage.setItem('fcm_token', token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await notifee.getNotificationSettings();
      return settings.authorizationStatus === 1; // authorized
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return false;
    }
  }

  /**
   * Open notification settings
   */
  async openNotificationSettings(): Promise<void> {
    try {
      await notifee.openNotificationSettings();
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  }

  /**
   * Handle user logout - remove FCM token from server
   */
  async handleUserLogout(): Promise<void> {
    try {
      // Remove token from server
      const notificationAPI = require('./notificationAPI').notificationAPI;
      await notificationAPI.removeFCMToken();
      
      // Clear local token
      this.fcmToken = null;
      await EncryptedStorage.removeItem('fcm_token');
      
      console.log('User logout handled - FCM token cleaned up');
    } catch (error) {
      console.error('Error handling user logout:', error);
    }
  }

  /**
   * Handle user login - send FCM token to server
   */
  async handleUserLogin(): Promise<void> {
    try {
      if (this.fcmToken) {
        await this.sendTokenToServer(this.fcmToken);
      } else {
        // Try to get token and send to server
        const token = await this.getFCMToken();
        if (token) {
          await this.sendTokenToServer(token);
        }
      }
    } catch (error) {
      console.error('Error handling user login:', error);
    }
  }
}

export const notificationService = new NotificationService();
