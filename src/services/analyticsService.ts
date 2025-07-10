import analytics from '@react-native-firebase/analytics';
import {User} from '@src/types';

export const analyticsService = {
  /**
   * Initialize analytics with user data when logged in
   */
  async setUserProperties(user: User | null): Promise<void> {
    try {
      if (user) {
        // Set user ID for analytics
        await analytics().setUserId(user.uid); // Changed from user.id to user.uid

        // Set some basic user properties
        await analytics().setUserProperties({
          email: user.email || '',
          username: user.profile.username || '', // Updated to use new structure
          createdAt: user.createdAt.toISOString() || '',
          planType: user.planType || 'free',
        });

        console.log('Analytics user properties set successfully');
      } else {
        // Clear user ID when logged out
        await analytics().setUserId(null);
        console.log('Analytics user properties cleared');
      }
    } catch (error) {
      console.error('Failed to set analytics user properties:', error);
    }
  },

  /**
   * Log a screen view event
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error(`Failed to log screen view (${screenName}):`, error);
    }
  },

  /**
   * Log a custom event
   */
  async logEvent(
    eventName: string,
    params?: Record<string, any>,
  ): Promise<void> {
    try {
      await analytics().logEvent(eventName, params);
    } catch (error) {
      console.error(`Failed to log event (${eventName}):`, error);
    }
  },

  /**
   * Enable or disable analytics collection
   */
  async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      await analytics().setAnalyticsCollectionEnabled(enabled);
      console.log(`Analytics collection ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to set analytics collection state:', error);
    }
  },
};
