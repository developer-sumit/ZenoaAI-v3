import {create} from 'zustand';
import {User} from '@src/types';
import auth from '@react-native-firebase/auth';
import {userService} from '@src/services/userService';
import {authService} from '@src/services/authService';

interface AuthState {
  user: User | null;
  idToken: string | null;
  isLoading: boolean;
  initialized: boolean;
  restoreSession: () => Promise<void>;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
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
          const userData = await userService.getUser(firebaseUser.uid);

          if (userData) {
            console.log('User data found, restoring session');

            set({
              user: userData,
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
                preferences: {
                  theme: 'light',
                  language: 'en',
                  notifications: true,
                },
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
              isDeleted: false,
              planType: 'free',
              quota: {
                imagesRemaining: 40,
                apiCallsRemaining: 100,
                refreshAt: new Date(),
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
              preferences: {
                theme: 'light',
                language: 'en',
                notifications: true,
              },
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            isDeleted: false,
            planType: 'free',
            quota: {
              imagesRemaining: 10, // Reduced quota for fallback
              apiCallsRemaining: 50,
              refreshAt: new Date(),
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

      console.log('User logged in successfully');
    } catch (error) {
      console.error('Error during login:', error);
      set({isLoading: false});
      throw error;
    }
  },

  // Logout function that uses the updated auth service
  logout: async () => {
    try {
      set({isLoading: true});

      // Use the auth service to handle logout
      await authService.signOut();

      // Clear user data from local storage
      const {user} = get();
      if (user) {
        await userService.clearCurrentUserData();
      }

      set({
        user: null,
        idToken: null,
        isLoading: false,
      });

      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      set({isLoading: false});
      throw error;
    }
  },

  // Update user data in the store and local storage
  updateUser: async (updatedUser: User) => {
    try {
      // Save updated user data
      await userService.saveUser(updatedUser);

      set({user: updatedUser});
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
