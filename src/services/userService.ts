import {doc, setDoc, getDoc, updateDoc} from 'firebase/firestore';
import {User} from '@src/types';
import EncryptedStorage from 'react-native-encrypted-storage';
import NetInfo from '@react-native-community/netinfo';
import {auth, firestore} from '@src/config/firebase.config';

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

      // Check if this user already exists and preserve any custom data
      try {
        const existingUser = await this.getUser(userData.id);
        if (existingUser) {
          // Keep existing data that wasn't explicitly provided in userData
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
      if (!userId) {
        console.log('No userId provided to getUser');
        return null;
      }

      // First try to get data from local storage (faster)
      let userData: User | null = null;
      const localUserData = await EncryptedStorage.getItem(`user_${userId}`);

      if (localUserData) {
        try {
          userData = JSON.parse(localUserData);

          // Check if locally stored user is marked as deleted
          if (userData && userData.isDeleted) {
            console.log('User was marked as deleted locally');
            return null;
          }
          console.log('Found user data in local storage');
        } catch (parseError) {
          console.error('Error parsing local user data:', parseError);
        }
      }

      // Check network connectivity for potential Firestore fetch
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      // If connected, try to get the most up-to-date data from Firestore
      if (isConnected) {
        try {
          console.log('Attempting to fetch user data from Firestore');
          const userDocRef = doc(firestore, 'users', userId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const firestoreData = userDoc.data() as User;

            // If account is marked as deleted in Firestore, return null
            if (firestoreData.isDeleted) {
              console.log('Account is marked as deleted in Firestore');
              // Update local storage to reflect deleted status
              await EncryptedStorage.setItem(
                `user_${userId}`,
                JSON.stringify({
                  ...firestoreData,
                  lastUpdated: new Date().toISOString(),
                }),
              );
              return null;
            }

            // Check if Firestore data is newer than local data
            if (
              !userData ||
              !userData.lastUpdated ||
              (firestoreData.lastUpdated &&
                new Date(firestoreData.lastUpdated) >
                  new Date(userData.lastUpdated))
            ) {
              console.log('Using newer Firestore data');
              userData = firestoreData;

              // Update local cache with fresh data
              await EncryptedStorage.setItem(
                `user_${userId}`,
                JSON.stringify({
                  ...userData,
                  lastUpdated: new Date().toISOString(),
                }),
              );
            }
          } else {
            console.log('User document does not exist in Firestore');
            if (userData) {
              console.log('Using local data only');
            }
          }
        } catch (firestoreError) {
          console.log(
            'Firestore fetch failed, using local data:',
            firestoreError,
          );
        }
      } else {
        console.log('No network connection, using local data only');
      }

      return userData;
    } catch (error) {
      console.error('Error retrieving user data:', error);
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
      console.log(`Starting profile update for userId: ${userId}`, profileData);

      // Get existing user data
      const existingUser = await this.getUser(userId);
      if (!existingUser) {
        console.error('User not found for update operation');
        throw new Error('User not found');
      }

      // Merge with new profile data
      const updatedUser = {
        ...existingUser,
        ...profileData,
        lastUpdated: new Date().toISOString(),
      };

      console.log('Merged user data:', updatedUser);

      // Save to Firestore if connected
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      console.log(
        `Network connection status: ${
          isConnected ? 'Connected' : 'Disconnected'
        }`,
      );

      if (isConnected) {
        try {
          // Check if Firebase authenticated
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.log(
              'No Firebase authentication, updating local storage only',
            );
          } else {
            console.log(`Firebase user authenticated: ${currentUser.uid}`);
            console.log(`Updating Firestore document for user: ${userId}`);

            // If using Firebase Auth, make sure userId matches Firebase UID
            const userDocRef = doc(firestore, 'users', userId);

            // Use setDoc with merge option instead of updateDoc for more reliability
            await setDoc(
              userDocRef,
              {
                ...profileData,
                lastUpdated: new Date().toISOString(),
              },
              {merge: true},
            );

            console.log('Profile successfully updated in Firestore');
          }
        } catch (firestoreError) {
          console.error('Error updating profile in Firestore:', firestoreError);
          // Continue to update local storage even if Firestore fails
        }
      }

      // Always save to local storage
      console.log('Saving updated profile to local storage');
      await EncryptedStorage.setItem(
        `user_${userId}`,
        JSON.stringify(updatedUser),
      );
      console.log('Profile updated in local storage');

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
   * Clear current user data from local storage
   */
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
