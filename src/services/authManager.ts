import {auth} from '@src/config/firebase.config';
import {authStorage} from '@src/config/firebase.config';
import {User as FirebaseUser} from 'firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {GoogleAuthProvider, signInWithCredential} from 'firebase/auth';

// Keys for token storage
const AUTH_USER_KEY = 'auth_user';
const AUTH_REFRESH_TOKEN = 'auth_refresh_token';
const AUTH_LAST_REFRESH = 'auth_last_refresh';
const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000; // Refresh token every 45 minutes

export const authManager = {
  /**
   * Store authentication data after successful login
   */
  async storeAuthData(
    firebaseUser: FirebaseUser | null,
    refreshToken?: string,
  ): Promise<void> {
    if (!firebaseUser) {
      return;
    }

    try {
      // Store login timestamp 
      const loginTime = new Date().toISOString();
      
      // Store user data
      authStorage.set(
        AUTH_USER_KEY,
        JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          lastLoginAt: loginTime,
        }),
      );

      // Store refresh token if provided
      if (refreshToken) {
        authStorage.set(AUTH_REFRESH_TOKEN, refreshToken);
      }

      // Store current time as last refresh
      authStorage.set(AUTH_LAST_REFRESH, loginTime);

      console.log('Auth data stored successfully');
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  },

  /**
   * Get stored authentication data
   */
  getStoredAuth() {
    try {
      const userData = authStorage.getString(AUTH_USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get stored auth data:', error);
      return null;
    }
  },

  /**
   * Check if user is already authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser || !!this.getStoredAuth();
  },

  /**
   * Check if token needs refreshing
   */
  shouldRefreshToken(): boolean {
    try {
      const lastRefreshStr = authStorage.getString(AUTH_LAST_REFRESH);
      if (!lastRefreshStr) {
        return true;
      }

      const lastRefresh = new Date(lastRefreshStr).getTime();
      const now = new Date().getTime();

      return now - lastRefresh > TOKEN_REFRESH_INTERVAL;
    } catch (error) {
      console.error('Error checking token refresh time:', error);
      return true; // Refresh token on error to be safe
    }
  },

  /**
   * Proactively refresh Firebase token to prevent expiration
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.shouldRefreshToken()) {
      return true; // No refresh needed
    }

    try {
      if (auth.currentUser) {
        // Force token refresh
        await auth.currentUser.getIdToken(true);

        // Update last refresh time
        authStorage.set(AUTH_LAST_REFRESH, new Date().toISOString());
        console.log('Firebase token refreshed successfully');
        return true;
      } else {
        // Try to restore session if no current user
        return await this.restoreAuthSession();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  },

  /**
   * Restore auth session on app startup
   */
  async restoreAuthSession(): Promise<boolean> {
    try {
      // First check if Firebase already has an active user
      if (auth.currentUser) {
        console.log('Firebase already has authenticated user');

        // Refresh the token to ensure it's valid
        await auth.currentUser.getIdToken(true);
        authStorage.set(AUTH_LAST_REFRESH, new Date().toISOString());

        return true;
      }

      // Try to restore Google Sign-In session
      const googleUser = await GoogleSignin.getCurrentUser();
      if (googleUser?.idToken) {
        console.log('Found stored Google session, attempting to restore');
        try {
          // Create credential and sign in with Firebase
          const credential = GoogleAuthProvider.credential(googleUser.idToken);
          const userCredential = await signInWithCredential(auth, credential);

          if (userCredential?.user) {
            // Store refreshed auth data
            this.storeAuthData(userCredential.user);
            return true;
          }
        } catch (signInError) {
          console.log(
            'Failed to restore with stored token, attempting refresh',
          );

          // Try getting fresh tokens from Google
          try {
            // Force a refresh of Google tokens
            await GoogleSignin.hasPlayServices();
            const {idToken} = await GoogleSignin.getTokens();

            if (idToken) {
              const freshCredential = GoogleAuthProvider.credential(idToken);
              const userCredential = await signInWithCredential(
                auth,
                freshCredential,
              );

              if (userCredential?.user) {
                this.storeAuthData(userCredential.user);
                return true;
              }
            }
          } catch (refreshError) {
            console.error('Failed to refresh Google tokens:', refreshError);
          }
        }
      }

      console.log('No valid auth session found');
      return false;
    } catch (error) {
      console.error('Auth session restoration failed:', error);
      return false;
    }
  },

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    authStorage.delete(AUTH_USER_KEY);
    authStorage.delete(AUTH_REFRESH_TOKEN);
    authStorage.delete(AUTH_LAST_REFRESH);
  },
};
