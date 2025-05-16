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

      // First, check if this user's email exists but was marked as deleted
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
   * Restore the current user session from encrypted storage
   */
  async restoreUserSession(): Promise<User | null> {
    try {
      console.log('Attempting to restore user session');

      // First check if Firebase has an authenticated user
      const currentFirebaseUser = auth.currentUser;

      if (currentFirebaseUser) {
        console.log('Firebase user found:', currentFirebaseUser.uid);

        // Try to get user data based on Firebase ID
        let userData = await this.getUser(currentFirebaseUser.uid);

        if (!userData) {
          console.log(
            'No existing user data found for Firebase user, creating basic profile',
          );

          // Create a basic user profile from Firebase user data
          userData = {
            id: currentFirebaseUser.uid,
            email: currentFirebaseUser.email || '',
            name: currentFirebaseUser.displayName || '',
            photo: currentFirebaseUser.photoURL || '',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };

          // Save to our system
          await this.saveUser(userData);
        } else {
          console.log('Found existing user data for Firebase user');
          // Update last login silently
          this.updateProfile(userData.id, {
            lastLogin: new Date().toISOString(),
          }).catch(e => console.log('Failed to update last login:', e));
        }

        // Always ensure currentUserId in EncryptedStorage matches Firebase
        await EncryptedStorage.setItem(
          'currentUserId',
          currentFirebaseUser.uid,
        );

        return userData;
      }

      // Fall back to stored user ID if no Firebase user
      console.log('No Firebase user, checking encrypted storage');
      const userId = await EncryptedStorage.getItem('currentUserId');

      if (!userId) {
        console.log('No saved user ID in storage');
        return null;
      }

      console.log('Found saved user ID:', userId);

      // Validate the stored user data
      const userData = await this.getUser(userId);

      if (!userData) {
        console.log('No valid user data found for stored ID');
        await EncryptedStorage.removeItem('currentUserId');
        return null;
      }

      console.log('Successfully restored user from encrypted storage');
      return userData;
    } catch (error) {
      console.error('Error restoring user session:', error);
      return null;
    }
  },

  /**
   * Validates and ensures the integrity of the stored user session
   */
  async validateUserSession(): Promise<boolean> {
    try {
      // Check Firebase auth first
      const currentFirebaseUser = auth.currentUser;

      if (currentFirebaseUser) {
        console.log('Firebase auth session is valid:', currentFirebaseUser.uid);
        return true;
      }

      // Fall back to local storage check
      console.log('No Firebase session, checking local storage integrity');

      // Get the current user ID
      const userId = await EncryptedStorage.getItem('currentUserId');

      if (!userId) {
        console.log('No user ID found in storage');
        return false;
      }

      // Check if the corresponding user data exists
      const userDataExists = await EncryptedStorage.getItem(`user_${userId}`);

      // If we have a user ID but no data, clear the invalid ID
      if (!userDataExists) {
        console.log('User ID references non-existent data, clearing');
        await EncryptedStorage.removeItem('currentUserId');
        return false;
      }

      // Additional validation: make sure the data is valid JSON
      try {
        const userData = JSON.parse(userDataExists);
        if (!userData || !userData.id || userData.id !== userId) {
          console.log('User data is invalid or mismatched');
          await EncryptedStorage.removeItem('currentUserId');
          return false;
        }
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        await EncryptedStorage.removeItem('currentUserId');
        return false;
      }

      console.log('Local storage user session is valid');
      return true;
    } catch (error) {
      console.error('Error validating user session:', error);
      return false;
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

  async debugSessionState(): Promise<void> {
    try {
      console.log('=== DEBUG SESSION STATE ===');

      // Check Firebase auth status
      const currentFirebaseUser = auth.currentUser;
      console.log(
        'Firebase auth state:',
        currentFirebaseUser
          ? `Authenticated as ${currentFirebaseUser.uid} (${currentFirebaseUser.email})`
          : 'Not authenticated',
      );

      // Check for current user ID in storage
      const userId = await EncryptedStorage.getItem('currentUserId');
      console.log('Current user ID in storage:', userId || 'Not set');

      if (userId) {
        // Look for user data
        const userDataRaw = await EncryptedStorage.getItem(`user_${userId}`);
        if (userDataRaw) {
          const userData = JSON.parse(userDataRaw);
          console.log('User data found:', {
            id: userData.id,
            email: userData.email,
            lastUpdated: userData.lastUpdated,
            firebaseUid: userData.firebaseUid || 'Not set',
          });
        } else {
          console.log('No user data found for ID:', userId);
        }
      }

      console.log('=== END DEBUG SESSION ===');
    } catch (error) {
      console.error('Error in session debug:', error);
    }
  },
};
