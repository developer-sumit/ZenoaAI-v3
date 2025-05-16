import {create} from 'zustand';
import {User} from '@src/types';
import {userService} from '@src/services/userService';
import {auth} from '@src/config/firebase.config';
import {signOut} from 'firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {authManager} from '@src/services/authManager';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  restoreSession: () => Promise<void>;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isLoading: true,

  restoreSession: async () => {
    try {
      set({isLoading: true});

      // Check if we have a Firebase user
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        console.log('Firebase auth session found for user:', firebaseUser.uid);

        try {
          // Validate token and make sure it's not revoked
          const token = await firebaseUser.getIdTokenResult(true);
          if (token.claims.revoked) {
            console.log('User token revoked, logging out');
            await signOut(auth);
            authManager.clearAuthData();
            set({isLoading: false, user: null});
            return;
          }
        } catch (tokenError) {
          console.error('Token validation failed:', tokenError);
          // If token validation fails, we might still have a valid user
        }

        // Get user data from your database
        const userData = await userService.getUser(firebaseUser.uid);

        if (userData) {
          console.log('User data found, restoring session');
          // Update last login time
          userService
            .updateProfile(userData.id, {
              lastLogin: new Date().toISOString(),
            })
            .catch(e => console.log('Failed to update last login:', e));

          // Store the updated auth data
          authManager.storeAuthData(firebaseUser);

          set({user: userData, isLoading: false});
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

          // Store the auth data
          authManager.storeAuthData(firebaseUser);

          set({user: newUser, isLoading: false});
        }
      } else {
        console.log('No Firebase user, checking for saved credentials');
        set({isLoading: false, user: null});
      }
    } catch (error) {
      console.error('Session restore failed:', error);
      set({user: null, isLoading: false});
    }
  },

  login: async userData => {
    try {
      set({isLoading: true});
      await userService.saveUser(userData);
      set({user: userData, isLoading: false});
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
      await signOut(auth);
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await userService.clearCurrentUserData();
      // Clear auth storage
      authManager.clearAuthData();
      set({user: null, isLoading: false});
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
