import {firebaseCrashlytics} from '@src/config/firebase.config';
import {User} from '@src/types';

export const crashlyticsService = {
  /**
   * Initialize crashlytics with user data when logged in
   */
  async setUserInfo(user: User | null): Promise<void> {
    try {
      if (user) {
        // Set user identifier
        await firebaseCrashlytics.setUserId(user.id);

        // Set user attributes
        await firebaseCrashlytics.setAttributes({
          email: user.email || '',
          name: user.name || '',
          createdAt: user.createdAt || '',
        });

        console.log('Crashlytics user info set successfully');
      } else {
        // Clear user ID when logged out (no direct method to clear, using a placeholder)
        await firebaseCrashlytics.setUserId('');
        await firebaseCrashlytics.setAttributes({
          email: '',
          name: '',
          createdAt: '',
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
      firebaseCrashlytics.log(message);
    } catch (error) {
      console.error('Failed to log to Crashlytics:', error);
    }
  },

  /**
   * Log error to Crashlytics
   */
  recordError(error: Error, jsErrorName?: string): void {
    try {
      firebaseCrashlytics.recordError(error, jsErrorName);
    } catch (recordError) {
      console.error('Failed to record error to Crashlytics:', recordError);
    }
  },

  /**
   * Enable or disable crashlytics collection
   */
  async setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      await firebaseCrashlytics.setCrashlyticsCollectionEnabled(enabled);
      console.log(`Crashlytics collection ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to set crashlytics collection state:', error);
    }
  },
};
