import crashlytics from '@react-native-firebase/crashlytics';
import {User} from '@src/types/user';

export const crashlyticsService = {
  /**
   * Initialize crashlytics with user data when logged in
   */
  async setUserInfo(user: User | null): Promise<void> {
    try {
      if (user) {
        // Set user identifier
        await crashlytics().setUserId(user.uid); // Changed from user.id to user.uid

        // Set user attributes
        await crashlytics().setAttributes({
          email: user.email || '',
          username: user.profile.username || '', // Updated to use new structure
          createdAt: user.createdAt.toISOString() || '',
          planType: user.planType || 'free',
        });

        console.log('Crashlytics user info set successfully');
      } else {
        // Clear user ID when logged out (no direct method to clear, using a placeholder)
        await crashlytics().setUserId('');
        await crashlytics().setAttributes({
          email: '',
          username: '',
          createdAt: '',
          planType: '',
        });
        console.log('Crashlytics user info cleared');
      }
    } catch (error) {
      console.error('Failed to set crashlytics user info:', error);
    }
  },

  /**
   * Log a custom message to Crashlytics
   */
  log(message: string): void {
    try {
      crashlytics().log(message);
    } catch (error) {
      console.error('Failed to log to Crashlytics:', error);
    }
  },

  /**
   * Log error to Crashlytics
   */
  recordError(error: Error, jsErrorName?: string): void {
    try {
      crashlytics().recordError(error, jsErrorName);
    } catch (recordError) {
      console.error('Failed to record error to Crashlytics:', recordError);
    }
  },

  /**
   * Enable or disable crashlytics collection
   */
  async setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      await crashlytics().setCrashlyticsCollectionEnabled(enabled);
      console.log(`Crashlytics collection ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to set crashlytics collection state:', error);
    }
  },
};
