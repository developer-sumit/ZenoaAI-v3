import {AppState, AppStateStatus} from 'react-native';
import {auth} from '@src/config/firebase.config';
import {authManager} from './authManager';

/**
 * Service to handle token refresh logic and app state changes
 */
export const tokenService = {
  // Store the subscription
  appStateSubscription: null as ReturnType<
    typeof AppState.addEventListener
  > | null,

  /**
   * Initialize token refresh listeners
   */
  init(): void {
    // Clean up any existing listeners first
    this.cleanup();
    
    // Set up app state change listener to refresh when app comes to foreground
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
    
    // Do an immediate refresh when starting the app
    this.forceTokenRefresh();
  },

  /**
   * Handle app coming to foreground
   */
  handleAppStateChange(nextAppState: AppStateStatus): void {
    // When app comes to foreground (becomes active), refresh token
    if (nextAppState === 'active') {
      console.log('App became active, refreshing token');
      this.forceTokenRefresh();
    }
  },

  /**
   * Force refresh the Firebase token regardless of timing
   */
  async forceTokenRefresh(): Promise<boolean> {
    try {
      if (auth.currentUser) {
        // Force token refresh
        await auth.currentUser.getIdToken(true);
        console.log('Firebase token refreshed successfully');
        return true;
      } else if (authManager.isAuthenticated()) {
        // Try to restore session if no current user but we think we're logged in
        return await authManager.restoreAuthSession();
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  },

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  },
};
