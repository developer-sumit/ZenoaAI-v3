import {User, IUserQuota} from '@src/types';
import EncryptedStorage from 'react-native-encrypted-storage';
import NetInfo from '@react-native-community/netinfo';
import {userAPI} from './axiosServer';

/**
 * User data service that synchronizes between API and secure local storage
 */
export const userService = {
  /**
   * Save user data to local storage and set as current user
   */
  async saveUser(userData: User): Promise<void> {
    try {
      await EncryptedStorage.setItem(
        `user_${userData.uid}`,
        JSON.stringify({
          ...userData,
          // Convert dates to ISO strings for JSON storage
          createdAt: userData.createdAt.toISOString(),
          updatedAt: userData.updatedAt.toISOString(),
          lastLoginAt: userData.lastLoginAt?.toISOString(),
          deletedAt: userData.deletedAt?.toISOString(),
          recoveryExpiresAt: userData.recoveryExpiresAt?.toISOString(),
          quota: {
            ...userData.quota,
            refreshAt: userData.quota.refreshAt.toISOString(),
          },
          statistics: {
            ...userData.statistics,
            lastLoginAt: userData.statistics.lastLoginAt.toISOString(),
          },
          fcmTokenUpdatedAt: userData.fcmTokenUpdatedAt?.toISOString(),
        }),
      );
      await EncryptedStorage.setItem('currentUserId', userData.uid);
      console.log('User data saved to local storage');
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },

  /**
   * Retrieve user data from API or local storage
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
          const parsedData = JSON.parse(localUserData);
          userData = {
            ...parsedData,
            // Convert ISO strings back to Date objects
            createdAt: new Date(parsedData.createdAt),
            updatedAt: new Date(parsedData.updatedAt),
            lastLoginAt: parsedData.lastLoginAt
              ? new Date(parsedData.lastLoginAt)
              : undefined,
            deletedAt: parsedData.deletedAt
              ? new Date(parsedData.deletedAt)
              : undefined,
            recoveryExpiresAt: parsedData.recoveryExpiresAt
              ? new Date(parsedData.recoveryExpiresAt)
              : undefined,
            quota: {
              ...parsedData.quota,
              refreshAt: new Date(parsedData.quota.refreshAt),
            },
            statistics: parsedData.statistics
              ? {
                  ...parsedData.statistics,
                  lastLoginAt: parsedData.statistics.lastLoginAt
                    ? new Date(parsedData.statistics.lastLoginAt)
                    : new Date(),
                }
              : {
                  lastLoginAt: new Date(),
                  totalLogins: 0,
                  imagesGenerated: 0,
                },
            fcmTokenUpdatedAt: parsedData.fcmTokenUpdatedAt
              ? new Date(parsedData.fcmTokenUpdatedAt)
              : undefined,
          };

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

      // Check network connectivity for potential API fetch
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      // If connected, try to get the most up-to-date data from API
      if (isConnected) {
        try {
          console.log('Attempting to fetch user data from API');

          // Call the API endpoint using userAPI (token automatically added)
          const response = await userAPI.getProfile();
          if (response.data.success) {
            const apiUser = response.data.profile;
            const apiUserData: User = {
              uid: userId,
              email: apiUser.email || '',
              profile: {
                username: apiUser.username || apiUser.profile?.username || '',
                avatar: apiUser.avatar || apiUser.profile?.avatar || '',
                bio: apiUser.bio || apiUser.profile?.bio || '',
                preferences: {
                  theme:
                    apiUser.theme ||
                    apiUser.profile?.preferences?.theme ||
                    'system',
                  language:
                    apiUser.language ||
                    apiUser.profile?.preferences?.language ||
                    'en',
                  notifications:
                    apiUser.notifications ??
                    apiUser.profile?.preferences?.notifications ??
                    true,
                },
              },
              createdAt: apiUser.createdAt
                ? new Date(apiUser.createdAt)
                : new Date(),
              updatedAt: apiUser.updatedAt
                ? new Date(apiUser.updatedAt)
                : new Date(),
              lastLoginAt: apiUser.lastLoginAt
                ? new Date(apiUser.lastLoginAt)
                : new Date(),
              isDeleted: apiUser.isDeleted || false,
              deletedAt: apiUser.deletedAt
                ? new Date(apiUser.deletedAt)
                : undefined,
              recoveryExpiresAt: apiUser.recoveryExpiresAt
                ? new Date(apiUser.recoveryExpiresAt)
                : undefined,
              planType: apiUser.planType || 'free',
              quota: {
                imagesRemaining: apiUser.quota?.imagesRemaining || 40, // Default for free plan
                refreshAt: apiUser.quota?.refreshAt
                  ? new Date(apiUser.quota.refreshAt)
                  : new Date(),
              },
              statistics: apiUser.statistics
                ? {
                    lastLoginAt: apiUser.statistics.lastLoginAt
                      ? new Date(apiUser.statistics.lastLoginAt)
                      : new Date(),
                    totalLogins: apiUser.statistics.totalLogins || 0,
                    imagesGenerated:
                      apiUser.statistics.imagesGenerated ||
                      apiUser.statistics.totalImages ||
                      0,
                  }
                : {
                    lastLoginAt: new Date(),
                    totalLogins: 0,
                    imagesGenerated: 0,
                  },
              fcmToken: apiUser.fcmToken,
              fcmTokenUpdatedAt: apiUser.fcmTokenUpdatedAt
                ? new Date(apiUser.fcmTokenUpdatedAt)
                : undefined,
            };

            // If account is marked as deleted in API, return null
            if (apiUserData.isDeleted) {
              console.log('Account is marked as deleted in API');
              // Update local storage to reflect deleted status
              await this.saveUser(apiUserData);
              return null;
            }

            // Check if API data is newer than local data
            if (
              !userData ||
              !userData.updatedAt ||
              (apiUserData.updatedAt &&
                new Date(apiUserData.updatedAt) > new Date(userData.updatedAt))
            ) {
              console.log('Using newer API data');
              userData = apiUserData;

              // Update local cache with fresh data
              await this.saveUser(userData);
            }

            return userData;
          }
        } catch (apiError) {
          console.log('API fetch failed, using cached data:', apiError);
          // Return whatever we have in the cache
          return userData;
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

      // Get existing user data for merging
      const existingUser = await this.getUser(userId);
      if (!existingUser) {
        console.error('User not found for update operation');
        throw new Error('User not found');
      }

      // Prepare the merged data
      const updatedUser = {
        ...existingUser,
        ...profileData,
        updatedAt: new Date(),
      };

      // Format data for the API
      const apiData = {
        username:
          profileData.profile?.username || existingUser.profile.username,
        avatar: profileData.profile?.avatar || existingUser.profile.avatar,
        bio: profileData.profile?.bio || existingUser.profile.bio,
        theme:
          profileData.profile?.preferences?.theme ||
          existingUser.profile.preferences?.theme ||
          'system',
        language:
          profileData.profile?.preferences?.language ||
          existingUser.profile.preferences?.language ||
          'en',
        notifications:
          profileData.profile?.preferences?.notifications ??
          existingUser.profile.preferences?.notifications ??
          true,
      };

      // Call the API endpoint using userAPI (token automatically added)
      const response = await userAPI.updateProfile(apiData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update profile');
      }

      // Update local storage with the updated user
      await this.saveUser(updatedUser);

      console.log('Profile updated successfully through API');
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Mark account as deleted but keep the data
   */
  async markAccountAsDeleted(userId: string, reason?: string): Promise<void> {
    try {
      console.log('Initiating account deletion process');

      // Call the backend API endpoint using userAPI (token automatically added)
      const response = await userAPI.deleteAccount(reason);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete account');
      }

      // Update local storage to reflect deleted status immediately
      const existingUser = await this.getUser(userId);
      if (existingUser) {
        const userWithDeletedFlag = {
          ...existingUser,
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        };

        await this.saveUser(userWithDeletedFlag);
      }

      // Clear current user ID from local storage
      await EncryptedStorage.removeItem('currentUserId');

      console.log('Account successfully marked as deleted through API');
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

  /**
   * Check user quota information
   */
  async checkQuota(userId: string): Promise<IUserQuota | null> {
    try {
      console.log('Checking quota for user:', userId);

      // Call the API endpoint using userAPI (token automatically added)
      const response = await userAPI.checkQuota();

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check quota');
      }
      const apiQuota = response.data.quota;
      const quota: IUserQuota = {
        imagesRemaining: apiQuota.imagesRemaining || 15, // Default for free plan
        refreshAt: apiQuota.refreshAt
          ? new Date(apiQuota.refreshAt)
          : new Date(),
      };

      console.log('Quota information retrieved successfully');
      return quota;
    } catch (error) {
      console.error('Error checking user quota:', error);
      return null;
    }
  },

  /**
   * Handle offline mode by checking connectivity
   */
  async isOffline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return !netInfo.isConnected;
    } catch (error) {
      console.error('Error checking network status:', error);
      // Default to assuming we're online
      return false;
    }
  },

  /**
   * Get cached user data from storage
   */
  async getCachedUser(userId: string): Promise<User | null> {
    try {
      const localUserData = await EncryptedStorage.getItem(`user_${userId}`);
      if (!localUserData) {
        return null;
      }

      const parsedData = JSON.parse(localUserData);
      const user: User = {
        ...parsedData,
        // Convert ISO strings back to Date objects
        createdAt: new Date(parsedData.createdAt),
        updatedAt: new Date(parsedData.updatedAt),
        lastLoginAt: parsedData.lastLoginAt
          ? new Date(parsedData.lastLoginAt)
          : undefined,
        deletedAt: parsedData.deletedAt
          ? new Date(parsedData.deletedAt)
          : undefined,
        recoveryExpiresAt: parsedData.recoveryExpiresAt
          ? new Date(parsedData.recoveryExpiresAt)
          : undefined,
        quota: {
          ...parsedData.quota,
          refreshAt: new Date(parsedData.quota.refreshAt),
        },
      };

      // Check if user is marked as deleted
      if (user.isDeleted) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error retrieving cached user data:', error);
      return null;
    }
  },

  /**
   * Get current user ID from storage
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      return await EncryptedStorage.getItem('currentUserId');
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  },

  /**
   * Check if an email is available for account creation
   */
  async checkEmailAvailability(email: string): Promise<{
    isAvailable: boolean;
    message?: string;
    expiresAt?: Date;
  }> {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection available');
      }

      const response = await userAPI.checkEmailAvailability(email);

      return {
        isAvailable: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error('Error checking email availability:', error);

      if (
        error.response?.status === 403 &&
        error.response?.data?.errorType === 'EMAIL_RESTRICTION'
      ) {
        return {
          isAvailable: false,
          message: error.response.data.message,
          expiresAt: error.response.data.expiresAt
            ? new Date(error.response.data.expiresAt)
            : undefined,
        };
      }

      throw error;
    }
  },
};
