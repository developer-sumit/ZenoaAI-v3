import {doc, setDoc, getDoc, updateDoc} from 'firebase/firestore';
import {User} from '@src/types';
import EncryptedStorage from 'react-native-encrypted-storage';
import NetInfo from '@react-native-community/netinfo';
import {firestore} from '@src/config/firebase.config';

/**
 * User data service that synchronizes between Firestore and secure local storage
 */
export const userService = {
  /**
   * Save a user to Firestore and encrypted storage
   */
  async saveUser(userData: User): Promise<User> {
    try {
      const userWithTimestamp = {
        ...userData,
        lastUpdated: new Date().toISOString(),
      };

      // First, check if this user's email exists but was marked as deleted
      // If so, create a new account instead of reusing the deleted one
      if (userData.email) {
        const existingUserWithEmail = await this.findUserByEmail(
          userData.email,
        );
        if (existingUserWithEmail && existingUserWithEmail.isDeleted) {
          // Generate a new user ID
          userData.id = `user_${new Date().getTime()}`;
          // Clear the isDeleted flag
          delete userWithTimestamp.isDeleted;
          console.log('Creating new account for previously deleted email');
        }
      }

      // Check if this user already exists and preserve any custom data
      try {
        const existingUser = await this.getUser(userData.id);
        if (existingUser) {
          // Keep existing data that wasn't explicitly provided in userData
          // This ensures we don't overwrite custom profile changes
          Object.keys(existingUser).forEach(key => {
            if (
              key !== 'lastUpdated' &&
              (userData as unknown as Record<string, unknown>)[key] ===
                undefined
            ) {
              (userWithTimestamp as Record<string, unknown>)[key] = (
                existingUser as unknown as Record<string, unknown>
              )[key];
            }
          });
        }
      } catch (error) {
        console.log('No existing user data found, creating new profile');
      }

      // Save to Firestore if connected
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );
      if (isConnected) {
        try {
          const userDocRef = doc(firestore, 'users', userData.id);
          await setDoc(userDocRef, userWithTimestamp, {merge: true});
          console.log('User data successfully saved to Firestore');
        } catch (firestoreError) {
          console.error(
            'Error saving to Firestore, falling back to local only:',
            firestoreError,
          );
          // Continue with local save even if Firestore fails
        }
      }

      // Always save to local encrypted storage
      await EncryptedStorage.setItem(
        `user_${userData.id}`,
        JSON.stringify(userWithTimestamp),
      );

      // Remember current user ID
      await EncryptedStorage.setItem('currentUserId', userData.id);
      console.log('User data saved to local storage');

      return userWithTimestamp;
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },

  /**
   * Retrieve user data from Firestore or local storage
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      // Check network connectivity
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );
      let userData: User | null = null;

      if (isConnected) {
        try {
          const userDocRef = doc(firestore, 'users', userId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            userData = userDoc.data() as User;

            // If the account is marked as deleted, return null
            if (userData.isDeleted) {
              console.log('Account is marked as deleted');
              return null;
            }

            // Update local cache with fresh data
            await EncryptedStorage.setItem(
              `user_${userId}`,
              JSON.stringify({
                ...userData,
                lastUpdated: new Date().toISOString(),
              }),
            );
          }
        } catch (firestoreError) {
          console.log('Firestore fetch failed, falling back to local data');
        }
      }

      // If not connected or Firestore fetch failed, get from local storage
      if (!userData) {
        const localUserData = await EncryptedStorage.getItem(`user_${userId}`);
        if (localUserData) {
          userData = JSON.parse(localUserData);

          // Check if locally stored user is marked as deleted
          if (userData && userData.isDeleted) {
            return null;
          }
        }
      }

      return userData;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  },

  /**
   * Find a user by email address
   */
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (!isConnected) {
        console.log('No network connection, cannot search by email');
        return null;
      }

      // In a real app, you would use a Firestore query with email index
      // Here's a simplified example:
      // const usersRef = collection(firestore, 'users');
      // const q = query(usersRef, where('email', '==', email));
      // const querySnapshot = await getDocs(q);
      // if (!querySnapshot.empty) {
      //   const userDoc = querySnapshot.docs[0];
      //   return { id: userDoc.id, ...userDoc.data() } as User;
      // }

      // For now, we'll assume this functionality would be implemented properly
      // with the appropriate Firestore query
      console.log('Email lookup not fully implemented in this version');
      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  },

  /**
   * Update user profile information
   */
  async updateProfile(
    userId: string,
    profileData: Partial<User>,
  ): Promise<User | null> {
    try {
      // Get existing user data
      const existingUser = await this.getUser(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Merge with new profile data
      const updatedUser = {
        ...existingUser,
        ...profileData,
        lastUpdated: new Date().toISOString(),
      };

      // Save to Firestore if connected
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );
      if (isConnected) {
        const userDocRef = doc(firestore, 'users', userId);
        await updateDoc(userDocRef, updatedUser);
      }

      // Save to local storage
      await EncryptedStorage.setItem(
        `user_${userId}`,
        JSON.stringify(updatedUser),
      );

      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Mark account as deleted but keep the data
   */
  async markAccountAsDeleted(userId: string): Promise<void> {
    try {
      // Get existing user data
      const existingUser = await this.getUser(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Mark as deleted with timestamp
      const userWithDeletedFlag = {
        ...existingUser,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      // Update in Firestore if connected
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );
      if (isConnected) {
        const userDocRef = doc(firestore, 'users', userId);
        await updateDoc(userDocRef, userWithDeletedFlag);
        console.log('User marked as deleted in Firestore');
      } else {
        console.log(
          'No connection, account will be marked deleted on next sync',
        );
      }

      // Update in local storage
      await EncryptedStorage.setItem(
        `user_${userId}`,
        JSON.stringify(userWithDeletedFlag),
      );

      // Clear current user ID
      await EncryptedStorage.removeItem('currentUserId');

      console.log('Account marked as deleted');
    } catch (error) {
      console.error('Error marking account as deleted:', error);
      throw error;
    }
  },

  /**
   * Clear user data from local storage
   */
  async clearUserData(): Promise<void> {
    try {
      const userId = await EncryptedStorage.getItem('currentUserId');
      if (userId) {
        await EncryptedStorage.removeItem(`user_${userId}`);
        await EncryptedStorage.removeItem('currentUserId');
      }
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  },

  async clearCurrentUserData(): Promise<void> {
    try {
      // Get the current user ID
      const currentUserId = await EncryptedStorage.getItem('currentUserId');

      if (currentUserId) {
        // Remove the specific user data, but keep other users' data
        await EncryptedStorage.removeItem(`user_${currentUserId}`);
      }

      // Remove the current user ID marker
      await EncryptedStorage.removeItem('currentUserId');

      console.log('Cleared current user data');
    } catch (error) {
      console.error('Error clearing current user data:', error);
    }
  },
};
