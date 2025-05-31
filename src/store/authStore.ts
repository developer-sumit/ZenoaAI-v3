import {create} from 'zustand';
import {User} from '@src/types';
import {userService} from '@src/services/userService';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

interface AuthState {
  user: User | null;
  firebaseUser: any | null;
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
  firebaseUser: null,
  idToken: null,
  isLoading: true,
  initialized: false,

  // Restore user session
  restoreSession: async () => {
    try {
      set({isLoading: true});

      // Check if we have a Firebase user
      const firebaseUser = auth().currentUser;

      if (firebaseUser) {
        console.log('Firebase auth session found for user:', firebaseUser.uid);

        try {
          // Get a fresh token - this doesn't force a sign-out if token is expired
          // Firebase will refresh the token automatically
          const token = await firebaseUser.getIdToken(false);
          set({idToken: token});

          // Get user data from the database
          const userData = await userService.getUser(firebaseUser.uid);

          if (userData) {
            console.log('User data found, restoring session');
            // Update last login time
            userService
              .updateProfile(userData.id, {
                lastLogin: new Date().toISOString(),
              })
              .catch(e => console.log('Failed to update last login:', e));

            set({
              user: userData,
              firebaseUser: firebaseUser,
              isLoading: false,
              initialized: true,
            });
          } else {
            console.log('Creating new user profile for Firebase user');
            // Create new user profile if not found
            const newUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              photo: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };
            await userService.saveUser(newUser);

            set({
              user: newUser,
              firebaseUser: firebaseUser,
              isLoading: false,
              initialized: true,
            });
          }
        } catch (error) {
          console.error('Error refreshing token or getting user data:', error);
          set({
            user: {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              photo: firebaseUser.photoURL || '',
            },
            firebaseUser: firebaseUser,
            isLoading: false,
            initialized: true,
          });
        }
      } else {
        console.log('No Firebase user, checking for saved credentials');
        // No authenticated user
        set({
          user: null,
          firebaseUser: null,
          isLoading: false,
          initialized: true,
        });
      }
    } catch (error) {
      console.error('Session restore failed:', error);
      set({
        user: null,
        firebaseUser: null,
        isLoading: false,
        initialized: true,
      });
    }
  },

  // Get ID token (letting Firebase handle token refresh)
  getIdToken: async (forceRefresh: boolean = false): Promise<string | null> => {
    try {
      const {firebaseUser} = get();

      if (firebaseUser) {
        // If forceRefresh is true, force a network request to refresh the token
        // If false, use the cached token if valid (Firebase handles refresh automatically)
        const token = await firebaseUser.getIdToken(forceRefresh);
        set({idToken: token});
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  },

  login: async userData => {
    try {
      set({isLoading: true});
      await userService.saveUser(userData);

      const firebaseUser = auth().currentUser;
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken(false);
        set({
          user: userData,
          firebaseUser: firebaseUser,
          idToken: token,
          isLoading: false,
        });
      } else {
        set({user: userData, isLoading: false});
      }
    } catch (error) {
      console.error('Login failed:', error);
      set({isLoading: false});
      throw error;
    }
  },

  logout: async () => {
    try {
      set({isLoading: true});

      // Full cleanup sequence
      await auth().signOut();

      // Sign out from Google
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch (googleError) {
        console.warn('Google sign out error:', googleError);
      }

      // Clear user data
      await userService.clearCurrentUserData();

      set({user: null, firebaseUser: null, idToken: null, isLoading: false});
    } catch (error) {
      console.error('Logout failed:', error);
      set({isLoading: false});
      throw error;
    }
  },

  updateUser: (updatedUser: User) =>
    set(state => ({
      ...state,
      user: updatedUser,
    })),
}));
