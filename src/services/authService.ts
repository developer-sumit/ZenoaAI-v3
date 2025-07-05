import auth from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import EncryptedStorage from 'react-native-encrypted-storage';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

import {User} from '@src/types';
import {authAPI} from './axiosServer';
import {notificationService} from './notificationService';

/**
 * Authenticates a user using Google ID token with API-first approach and Firebase fallback.
 *
 * This function implements a robust authentication flow that:
 * 1. Checks network connectivity
 * 2. Creates Firebase Google credential from the provided token
 * 3. Signs in with Firebase to obtain ID token for server authentication
 * 4. Authenticates with the server API using Firebase ID token
 * 5. Falls back to Firebase-only authentication on network/server errors
 * 6. Stores authentication token locally and handles notification service login
 *
 * @param googleIdToken - The Google ID token obtained from Google Sign-In
 * @returns Promise that resolves to authenticated User object with profile, quota, and statistics
 *
 * @throws {Error} When no internet connection is available
 * @throws {Error} When authentication fails on both server and Firebase fallback
 * @throws {Error} With specialized errorType property for email restrictions and other specific errors
 *
 * @example
 * ```typescript
 * try {
 *   const user = await signInWithGoogle(googleIdToken);
 *   console.log('User authenticated:', user.profile.username);
 * } catch (error) {
 *   if (error.errorType === 'EMAIL_RESTRICTED') {
 *     // Handle email restriction error
 *   }
 * }
 * ```
 */
const signInWithGoogle = async (googleIdToken: string): Promise<User> => {
  if (__DEV__) {
    console.log('Starting Google sign-in flow with API-first approach');
  }

  try {
    // 1. Check network connectivity first
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection available');
    }

    // 2. Create a Google credential with the token for Firebase backup
    const googleCredential = auth.GoogleAuthProvider.credential(googleIdToken);

    // 3. Sign in with Firebase to get Firebase ID token (for server authentication)
    const userCredential = await auth().signInWithCredential(googleCredential);
    const firebaseIdToken = await userCredential.user.getIdToken(true);

    if (__DEV__) {
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
        createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
        updatedAt: apiUser.updatedAt ? new Date(apiUser.updatedAt) : new Date(),
        planType: apiUser.planType || 'free',
        quota: {
          imagesRemaining: apiUser.quota?.imagesRemaining || 0, // Default for free plan
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
        await notificationService.handleUserLogin();
      } catch (notificationError) {
        console.warn('Failed to handle notification login:', notificationError);
      }

      if (__DEV__) {
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
      if (__DEV__) {
        console.log('Network error, falling back to Firebase-only auth');
      }

      const user = await handleFailedGoogleSignIn();
      if (!user) {
        throw new Error('Failed to authenticate user');
      }

      return user;
    }

    // Format the error message for better UX
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
};

/**
 * Retrieves the ID token for the currently authenticated user.
 *
 * @param forceRefresh - Whether to force refresh the token from the server.
 *                      If false, returns cached token if not expired. Defaults to false.
 * @returns A Promise that resolves to the user's ID token string, or null if no user
 *          is authenticated or if an error occurs during token retrieval.
 *
 * @example
 * ```typescript
 * // Get cached token
 * const token = await getCurrentUserIdToken();
 *
 * // Force refresh token
 * const freshToken = await getCurrentUserIdToken(true);
 * ```
 */
const getCurrentUserIdToken = async (
  forceRefresh = false,
): Promise<string | null> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      if (__DEV__) {
        console.log('No current user found when requesting ID token');
      }
      return null;
    }

    return await currentUser.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

/**
 * Verifies the validity of an authentication token by making an API call.
 *
 * @param token - The authentication token to verify
 * @returns A promise that resolves to true if the token is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * if (isValid) {
 *   console.log('Token is valid');
 * } else {
 *   console.log('Token is invalid or expired');
 * }
 * ```
 */
const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await authAPI.verifyToken(token);
    return response.data.success;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
};

/**
 * Handles failed Google sign-in attempts by attempting to retrieve the current Firebase user as a fallback.
 *
 * This function is called when the primary Google sign-in process fails, and it tries to create
 * a User object from the currently authenticated Firebase user if one exists. The returned user
 * will have default values for quota and statistics.
 *
 * @returns A Promise that resolves to a User object if a current Firebase user exists,
 *          or null if no user is found or an error occurs
 *
 * @example
 * ```typescript
 * const fallbackUser = await handleFailedGoogleSignIn();
 * if (fallbackUser) {
 *   console.log('Fallback user found:', fallbackUser.email);
 * } else {
 *   console.log('No fallback user available');
 * }
 * ```
 */
const handleFailedGoogleSignIn = async (): Promise<User | null> => {
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
        planType: 'free',
        quota: {
          imagesRemaining: 0,
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
};

/**
 * Signs out the current user from the application.
 *
 * This function performs a comprehensive logout process that includes:
 * - Notifying the server about the logout (if network is available)
 * - Clearing the stored authentication token from encrypted storage
 * - Handling notification service cleanup
 * - Signing out from Firebase authentication
 * - Revoking Google Sign-In access and signing out from Google services
 *
 * The function is designed to be resilient - if any non-critical step fails
 * (server notification, notification service cleanup, or Google sign-out),
 * the logout process will continue to ensure the user is properly signed out
 * from the core authentication system.
 *
 * @returns A Promise that resolves when the sign-out process is complete
 * @throws Will throw an error if the core sign-out process fails
 *
 * @example
 * ```typescript
 * try {
 *   await signOut();
 *   console.log('User successfully signed out');
 * } catch (error) {
 *   console.error('Sign out failed:', error);
 * }
 * ```
 */
const signOut = async (): Promise<void> => {
  try {
    // Get current user before signing out
    const currentUser = auth().currentUser;

    // Notify server about logout if we have a user and network connection
    if (currentUser) {
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          if (__DEV__) {
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
      await notificationService.handleUserLogout();
    } catch (notificationError) {
      console.warn('Failed to handle notification logout:', notificationError);
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

    if (__DEV__) {
      console.log('User signed out successfully');
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

const authService = {
  signInWithGoogle,
  signOut,
  getCurrentUserIdToken,
  verifyToken,
  handleFailedGoogleSignIn,
};

export default authService;
