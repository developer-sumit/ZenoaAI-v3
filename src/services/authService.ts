import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {authAPI} from './axiosServer';
import NetInfo from '@react-native-community/netinfo';
import {User} from '@src/types';
import EncryptedStorage from 'react-native-encrypted-storage';

// For debugging
const DEBUG = __DEV__;

export const authService = {
  /**
   * Sign in with Google using API-first approach
   * Firebase is only used as a backup for token generation
   * @param googleIdToken ID token from Google Sign-in
   */
  async signInWithGoogle(googleIdToken: string): Promise<User> {
    if (DEBUG) {
      console.log('Starting Google sign-in flow with API-first approach');
    }

    try {
      // 1. Check network connectivity first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection available');
      }

      // 2. Create a Google credential with the token for Firebase backup
      const googleCredential =
        auth.GoogleAuthProvider.credential(googleIdToken);

      // 3. Sign in with Firebase to get Firebase ID token (for server authentication)
      const userCredential = await auth().signInWithCredential(
        googleCredential,
      );
      const firebaseIdToken = await userCredential.user.getIdToken(true);

      if (DEBUG) {
        console.log('Got Firebase ID token, authenticating with server');
      }

      // 4. Authenticate with our server using Firebase ID token
      const response = await authAPI.googleAuth(firebaseIdToken);

      if (response.data.success) {
        const apiUser = response.data.profile;
        const authenticatedUser: User = {
          uid: response.data.uid,
          email: response.data.email,
          profile: {
            username: apiUser.profile?.username || apiUser.username || '',
            avatar: apiUser.profile?.avatar || apiUser.avatar || '',
            bio: apiUser.profile?.bio || apiUser.bio || '',
          },
          createdAt: apiUser.createdAt
            ? new Date(apiUser.createdAt)
            : new Date(),
          updatedAt: apiUser.updatedAt
            ? new Date(apiUser.updatedAt)
            : new Date(),
          lastLoginAt: apiUser.statistics?.lastLoginAt
            ? new Date(apiUser.statistics.lastLoginAt)
            : apiUser.lastLoginAt
            ? new Date(apiUser.lastLoginAt)
            : new Date(),
          planType: apiUser.planType || 'free',
          quota: {
            imagesRemaining: apiUser.quota?.imagesRemaining || 40, // Default for free plan
            refreshAt: apiUser.quota?.refreshAt
              ? new Date(apiUser.quota.refreshAt)
              : new Date(),
          },
          statistics: {
            lastLoginAt: apiUser.statistics?.lastLoginAt
              ? new Date(apiUser.statistics.lastLoginAt)
              : new Date(),
            totalLogins: apiUser.statistics?.totalLogins || 0,
            imagesGenerated:
              apiUser.statistics?.imagesGenerated ||
              apiUser.statistics?.totalImages ||
              0,
          },
          fcmToken: apiUser.fcmToken,
          fcmTokenUpdatedAt: apiUser.fcmTokenUpdatedAt
            ? new Date(apiUser.fcmTokenUpdatedAt)
            : undefined,
        };

        // Store authentication token locally
        await EncryptedStorage.setItem('authToken', firebaseIdToken);

        // Handle notification service login
        try {
          const {notificationService} = require('./notificationService');
          await notificationService.handleUserLogin();
        } catch (notificationError) {
          console.warn(
            'Failed to handle notification login:',
            notificationError,
          );
        }

        if (DEBUG) {
          console.log('Server authentication successful');
        }

        return authenticatedUser;
      } else {
        throw new Error(response.data.message || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Google auth error:', error);

      // Check if this is a network or server error - provide fallback
      if (
        error.code === 'auth/network-request-failed' ||
        error.message?.includes('Network Error')
      ) {
        // Fallback to Firebase-only authentication when server is unreachable
        try {
          const currentUser = auth().currentUser;
          if (currentUser) {
            if (DEBUG) {
              console.log('Server unavailable, using Firebase fallback');
            }
            return {
              uid: currentUser.uid,
              email: currentUser.email || '',
              profile: {
                username: currentUser.displayName || '',
                avatar: currentUser.photoURL || '',
                bio: '',
              },
              createdAt: new Date(
                currentUser.metadata.creationTime || new Date().toISOString(),
              ),
              updatedAt: new Date(),
              lastLoginAt: new Date(
                currentUser.metadata.lastSignInTime || new Date().toISOString(),
              ),
              planType: 'free',
              quota: {
                imagesRemaining: 10,
                refreshAt: new Date(),
              },
              statistics: {
                lastLoginAt: new Date(
                  currentUser.metadata.lastSignInTime ||
                    new Date().toISOString(),
                ),
                totalLogins: 1,
                imagesGenerated: 0,
              },
            };
          }
        } catch (fbError) {
          console.error('Firebase fallback failed:', fbError);
        }
      }      // Format the error message for better UX
      let errorMessage = 'Authentication failed';
      let errorType = 'GENERAL_ERROR';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        errorType = error.response.data.errorType || 'GENERAL_ERROR';
      } else if (error.message) {
        // Clean up common Firebase error messages
        errorMessage = error.message
          .replace('Firebase: ', '')
          .replace(/\(auth.*\)\.?/, '');
      }

      // Create a specialized error for email restrictions
      const authError = new Error(errorMessage);
      (authError as any).errorType = errorType;
      throw authError;
    }
  },

  /**
   * Get current user's Firebase ID token
   * @param forceRefresh Force refresh the token
   */
  async getCurrentUserIdToken(forceRefresh = false): Promise<string | null> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        if (DEBUG) {
          console.log('No current user found when requesting ID token');
        }
        return null;
      }

      return await currentUser.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  },

  /**
   * Get stored auth token from local storage
   */
  async getStoredAuthToken(): Promise<string | null> {
    try {
      return await EncryptedStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting stored auth token:', error);
      return null;
    }
  },

  /**
   * Verify token with server
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await authAPI.verifyToken(token);
      return response.data.success;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  },

  /**
   * Handle Google sign-in failure with graceful degradation
   */
  async handleFailedGoogleSignIn(): Promise<User | null> {
    try {
      // Try to get current Firebase user as fallback
      const currentUser = auth().currentUser;
      if (currentUser) {
        return {
          uid: currentUser.uid,
          email: currentUser.email || '',
          profile: {
            username: currentUser.displayName || '',
            avatar: currentUser.photoURL || '',
            bio: '',
          },
          createdAt: new Date(
            currentUser.metadata.creationTime || new Date().toISOString(),
          ),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          planType: 'free',
          quota: {
            imagesRemaining: 10,
            refreshAt: new Date(),
          },
          statistics: {
            lastLoginAt: new Date(),
            totalLogins: 1,
            imagesGenerated: 0,
          },
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to handle Google sign-in fallback:', error);
      return null;
    }
  },

  /**
   * Sign out from both Firebase and Google, and notify the server
   */
  async signOut(): Promise<void> {
    try {
      // Get current user before signing out
      const currentUser = auth().currentUser;

      // Notify server about logout if we have a user and network connection
      if (currentUser) {
        try {
          const netInfo = await NetInfo.fetch();
          if (netInfo.isConnected) {
            if (DEBUG) {
              console.log('Notifying server about logout');
            }
            await authAPI.logout();
          }
        } catch (serverError) {
          // Don't let server notification failure prevent client logout
          console.warn('Failed to notify server about logout:', serverError);
        }
      }

      // Clear stored auth token
      await EncryptedStorage.removeItem('authToken');

      // Handle notification service logout
      try {
        const {notificationService} = require('./notificationService');
        await notificationService.handleUserLogout();
      } catch (notificationError) {
        console.warn(
          'Failed to handle notification logout:',
          notificationError,
        );
      }

      // Proceed with Firebase sign out
      await auth().signOut();

      // Also sign out from Google
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch (googleSignOutError) {
        // Google sign out may fail if user wasn't signed in with Google
        console.warn('Google sign out failed:', googleSignOutError);
      }

      if (DEBUG) {
        console.log('User signed out successfully');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },
};
