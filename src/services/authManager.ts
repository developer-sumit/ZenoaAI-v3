import {auth} from '@src/config/firebase.config';
import {authStorage} from '@src/config/firebase.config';
import {User as FirebaseUser} from 'firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {GoogleAuthProvider, signInWithCredential} from 'firebase/auth';

// Keys for token storage
const AUTH_USER_KEY = 'auth_user';
const AUTH_REFRESH_TOKEN = 'auth_refresh_token';

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
      // Store user ID and email for quick access
      authStorage.set(
        AUTH_USER_KEY,
        JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          lastLoginAt: new Date().toISOString(),
        }),
      );

      // Store refresh token if provided
      if (refreshToken) {
        authStorage.set(AUTH_REFRESH_TOKEN, refreshToken);
      }

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
   * Restore auth session on app startup
   */
  async restoreAuthSession(): Promise<boolean> {
    try {
      // First check if Firebase already has an active user
      if (auth.currentUser) {
        console.log('Firebase already has authenticated user');
        return true;
      }

      // Try to restore Google Sign-In session
      const googleUser = await GoogleSignin.getCurrentUser();
      if (googleUser?.idToken) {
        console.log('Found stored Google session, attempting to restore');
        // Create credential and sign in with Firebase
        const credential = GoogleAuthProvider.credential(googleUser.idToken);
        const userCredential = await signInWithCredential(auth, credential);

        if (userCredential?.user) {
          // Store refreshed auth data
          this.storeAuthData(userCredential.user);
          return true;
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
  },
};
