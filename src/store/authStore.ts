import {create} from 'zustand';
import auth from '@react-native-firebase/auth';
import EncryptedStorage from 'react-native-encrypted-storage';

import {User} from '@src/types/user';
import userService from '@src/services/userService';
import authService from '@src/services/authService';
import {useImageStore} from './imageStore';

interface AuthState {
  user: User | null;
  idToken: string | null;
  isLoading: boolean;
  initialized: boolean;
  restoreSession: () => Promise<void>;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  idToken: null,
  isLoading: true,
  initialized: false,

  // Restore user session using API-first approach
  restoreSession: async () => {
    try {
      set({isLoading: true});

      // Check if we have a Firebase user (for token generation)
      const firebaseUser = auth().currentUser;

      if (firebaseUser) {
        console.log('Firebase auth session found for user:', firebaseUser.uid);

        try {
          // Try to get a fresh token - Firebase will refresh automatically if needed
          const token = await firebaseUser.getIdToken(false);
          set({idToken: token});

          // Get user data from our API using the updated service
          const {data} = await userService.getUser(firebaseUser.uid);

          if (data && data !== null) {
            console.log('User data found, restoring session');

            set({
              user: data,
              isLoading: false,
              initialized: true,
            });
          } else {
            console.log('No user data found in API, creating new user profile');

            // Create new user profile if not found
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              profile: {
                username: firebaseUser.displayName || '',
                avatar: firebaseUser.photoURL || '',
                bio: '',
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              planType: 'free',
              quota: {
                imagesRemaining: 0, // Default for free plan
                lastRefreshedAt: new Date(),
                planLimits: {
                  totalImages: 0,
                },
              },
              statistics: {
                lastLoginAt: new Date(),
                totalLogins: 1,
                imagesGenerated: 0,
              },
            };

            await userService.saveUser(newUser);

            set({
              user: newUser,
              isLoading: false,
              initialized: true,
            });
          }
        } catch (error) {
          console.error('Error during session restoration:', error);

          // Create a fallback user with basic info from Firebase
          const fallbackUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            profile: {
              username: firebaseUser.displayName || '',
              avatar: firebaseUser.photoURL || '',
              bio: '',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            planType: 'free',
            quota: {
              imagesRemaining: 10, // Reduced quota for fallback
              lastRefreshedAt: new Date(),
              planLimits: {
                totalImages: 0,
              },
            },
            statistics: {
              lastLoginAt: new Date(),
              totalLogins: 1,
              imagesGenerated: 0,
            },
          };

          set({
            user: fallbackUser,
            isLoading: false,
            initialized: true,
          });
        }
      } else {
        console.log('No Firebase user found');
        set({
          user: null,
          idToken: null,
          isLoading: false,
          initialized: true,
        });
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      set({
        user: null,
        idToken: null,
        isLoading: false,
        initialized: true,
      });
    }
  },

  // Login function that uses the updated auth service
  login: async (userData: User) => {
    try {
      set({isLoading: true});

      // Get fresh token for the session
      const token = await authService.getCurrentUserIdToken(true);

      // Save user data using the service
      await userService.saveUser(userData);

      set({
        user: userData,
        idToken: token,
        isLoading: false,
      });

      // Update FCM token to server after successful login
      try {
        const {
          notificationService,
        } = require('@src/services/notificationService');
        await notificationService.updateTokenToServer();
      } catch (fcmError) {
        console.warn('Failed to update FCM token after login:', fcmError);
      }

      console.log('User logged in successfully');
    } catch (error) {
      console.error('Error during login:', error);
      set({isLoading: false});
      throw error;
    }
  },

  // Enhanced logout function for complete cleanup
  logout: async () => {
    try {
      set({isLoading: true});

      // Get user info before clearing
      const {user} = get();
      const userId = user?.uid;

      // Use the auth service to handle logout
      await authService.signOut();

      // Clear user data from local storage if we have a user ID
      if (userId) {
        // Perform complete data cleanup
        await userService.performCompleteDataCleanup(userId);
      } else {
        // Fallback cleanup if no user ID available
        await performFallbackCleanup();
      }

      // Clear all image store data
      useImageStore.getState().clearImages();

      // Clear generation store data if available
      try {
        const {useGenerationStore} = require('./generationStore');
        if (useGenerationStore.getState().clearAll) {
          useGenerationStore.getState().clearAll();
        }
      } catch (error) {
        console.warn('Failed to clear generation store:', error);
      }

      // Reset auth state completely
      set({
        user: null,
        idToken: null,
        isLoading: false,
        initialized: true, // Keep initialized true to prevent reauth attempts
      });

      console.log('Complete user logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if logout fails, clear the state
      set({
        user: null,
        idToken: null,
        isLoading: false,
        initialized: true,
      });
      throw error;
    }
  },

  // Update user data in the store and local storage
  updateUser: async (updatedUser: Partial<User>) => {
    try {
      const {user} = get();
      if (!user) {
        console.warn('No user found to update');
        return;
      }

      const newUser = {
        ...user,
        ...updatedUser,
        updatedAt: new Date(),
      };
      await userService.saveUser(newUser);
      set({user: newUser});
      console.log('User data updated in store');
    } catch (error) {
      console.error('Error updating user in store:', error);
    }
  },

  // Get current ID token with optional refresh
  getIdToken: async (forceRefresh = false) => {
    try {
      const {idToken} = get();

      // If we have a token and don't need to force refresh, return it
      if (idToken && !forceRefresh) {
        return idToken;
      }

      // Otherwise get a fresh token from Firebase
      const newToken = await authService.getCurrentUserIdToken(true);

      if (newToken) {
        set({idToken: newToken});
        return newToken;
      }

      return null;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  },
}));

// Add fallback cleanup function
const performFallbackCleanup = async (): Promise<void> => {
  try {
    // Clear any auth-related data without requiring user ID
    await EncryptedStorage.removeItem('authToken');
    await EncryptedStorage.removeItem('currentUserId');
    await EncryptedStorage.removeItem('fcm_token');

    console.log('Fallback cleanup completed');
  } catch (error) {
    console.error('Error in fallback cleanup:', error);
  }
};
