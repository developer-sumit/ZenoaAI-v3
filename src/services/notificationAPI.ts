import axiosServer from './axiosServer';
import {notificationService} from './notificationService';

export interface NotificationAPIResponse {
  success: boolean;
  message: string;
  result?: any;
}

class NotificationAPI {
  /**
   * Update user's FCM token on the server
   */
  async updateFCMToken(): Promise<boolean> {
    try {
      const fcmToken = await notificationService.getFCMToken();
      
      if (!fcmToken) {
        console.log('No FCM token available');
        return false;
      }

      const response = await axiosServer.post<NotificationAPIResponse>(
        '/notifications/token',
        {fcmToken}
      );

      if (response.data.success) {
        console.log('FCM token updated on server successfully');
        return true;
      } else {
        console.error('Failed to update FCM token on server:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating FCM token on server:', error);
      return false;
    }
  }

  /**
   * Remove user's FCM token from the server (on logout)
   */
  async removeFCMToken(): Promise<boolean> {
    try {
      const response = await axiosServer.delete<NotificationAPIResponse>(
        '/notifications/token'
      );

      if (response.data.success) {
        console.log('FCM token removed from server successfully');
        return true;
      } else {
        console.error('Failed to remove FCM token from server:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('Error removing FCM token from server:', error);
      return false;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      const response = await axiosServer.post<NotificationAPIResponse>(
        '/notifications/test'
      );

      if (response.data.success) {
        console.log('Test notification sent successfully');
        return true;
      } else {
        console.error('Failed to send test notification:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  /**
   * Subscribe to a notification topic
   */
  async subscribeToTopic(topic: string): Promise<boolean> {
    try {
      const response = await axiosServer.post<NotificationAPIResponse>(
        '/notifications/subscribe',
        {topic}
      );

      if (response.data.success) {
        console.log(`Successfully subscribed to topic: ${topic}`);
        return true;
      } else {
        console.error(`Failed to subscribe to topic ${topic}:`, response.data.message);
        return false;
      }
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
      return false;
    }
  }

  /**
   * Unsubscribe from a notification topic
   */
  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    try {
      const response = await axiosServer.post<NotificationAPIResponse>(
        '/notifications/unsubscribe',
        {topic}
      );

      if (response.data.success) {
        console.log(`Successfully unsubscribed from topic: ${topic}`);
        return true;
      } else {
        console.error(`Failed to unsubscribe from topic ${topic}:`, response.data.message);
        return false;
      }
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
      return false;
    }
  }

  /**
   * Send image generation completion notification
   */
  async sendImageGenerationNotification(
    userId: string,
    imageId: string,
    prompt: string,
    imageUrl?: string
  ): Promise<boolean> {
    try {
      const response = await axiosServer.post<NotificationAPIResponse>(
        '/notifications/image-complete',        {
          userId,
          imageId,
          prompt,
          imageUrl,
        }
      );

      if (response.data.success) {
        console.log('Image generation notification sent successfully');
        return true;
      } else {
        console.error('Failed to send image generation notification:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('Error sending image generation notification:', error);
      return false;
    }
  }
}

export const notificationAPI = new NotificationAPI();
