import {create} from 'zustand';
import EncryptedStorage from 'react-native-encrypted-storage';
import {User} from '@src/types';
import {firestore} from '@src/config/firebase.config';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {userService} from '@src/services/userService';
import { googleAuth } from '@src/config/auth.config';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  hasCheckedAuth: boolean;

  // Auth actions
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuthState: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  hasCheckedAuth: false,

  login: async (userData: User) => {
    try {
      set({isLoading: true});

      // Save the full user data to local storage and Firestore via userService
      const savedUser = await userService.saveUser({
        ...userData,
        lastLogin: new Date().toISOString(),
      });

      // Store auth token/user ID for persistent login
      await EncryptedStorage.setItem('currentUserId', userData.id);

      // Update the auth state
      set({
        user: savedUser,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login error:', error);
      set({isLoading: false});
      throw error;
    }
  },

  logout: async () => {
    try {
      set({isLoading: true});

      // Clear Google Auth tokens and sign out from Google
      try {
        // This needs to be imported in the file where logout is called
        // Add this to the login screen or wherever logout is triggered
        await googleAuth.signOut();
      } catch (signOutError) {
        console.warn('Error signing out from Google:', signOutError);
        // Continue with logout even if Google sign out fails
      }

      // Clear local auth data
      await EncryptedStorage.removeItem('currentUserId');

      // Clear any other stored user data
      await userService.clearCurrentUserData();

      // Update state
      set({
        user: null,
        isLoading: false,
        hasCheckedAuth: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({isLoading: false});
    }
  },

  updateUserProfile: async (profileData: Partial<User>) => {
    try {
      const {user} = get();

      if (!user?.id) {
        throw new Error('User not found');
      }

      // Update user profile via userService
      const updatedUser = await userService.updateProfile(user.id, profileData);

      if (updatedUser) {
        // Update local state with the new profile data
        set({user: updatedUser});
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      set({isLoading: true});

      // Check if we have a stored user ID
      const userId = await EncryptedStorage.getItem('currentUserId');

      if (!userId) {
        set({isLoading: false, hasCheckedAuth: true});
        return;
      }

      // Get the full user data from userService (which handles Firestore/local storage)
      const userData = await userService.getUser(userId);

      if (userData) {
        // If found and not marked as deleted, restore the session
        set({
          user: userData,
          isLoading: false,
          hasCheckedAuth: true,
        });

        // Update last login time in background
        userService
          .updateProfile(userId, {
            lastLogin: new Date().toISOString(),
          })
          .catch(err => console.log('Error updating last login:', err));
      } else {
        // User data not found or marked as deleted, clear the session
        await EncryptedStorage.removeItem('currentUserId');
        set({
          user: null,
          isLoading: false,
          hasCheckedAuth: true,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({isLoading: false, hasCheckedAuth: true});
    }
  },

  // Helper function to completely clear auth state
  clearAuthState: async () => {
    try {
      // Remove all auth-related items from storage
      await EncryptedStorage.removeItem('currentUserId');

      // Reset the auth state
      set({
        user: null,
        isLoading: false,
        hasCheckedAuth: true,
      });
    } catch (error) {
      console.error('Clear auth state error:', error);
    }
  },
}));
