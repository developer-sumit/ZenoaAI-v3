import NetInfo from '@react-native-community/netinfo';
import EncryptedStorage from 'react-native-encrypted-storage';

import {userAPI} from './axiosServer';
import {User, IUserQuota} from '@src/types';

/**
 * Saves user data to encrypted local storage with proper date serialization.
 *
 * Converts Date objects to ISO strings for JSON storage compatibility and stores
 * the user data under a unique key based on the user's UID. Also sets the current
 * user ID for quick access.
 *
 * @param userData - The user object containing all user information including
 *                   dates, quota, statistics, and FCM token data
 * @returns A promise that resolves when the user data is successfully saved
 * @throws Will throw an error if the storage operation fails
 *
 * @example
 * ```typescript
 * const user: User = {
 *   uid: 'user123',
 *   createdAt: new Date(),
 *   quota: { lastRefreshedAt: new Date() },
 *   // ... other user properties
 * };
 * await saveUser(user);
 * ```
 */
const saveUser = async (userData: User): Promise<void> => {
  try {
    await EncryptedStorage.setItem(
      `user_${userData.uid}`,
      JSON.stringify({
        ...userData,
        // Convert dates to ISO strings for JSON storage
        createdAt: userData.createdAt?.toISOString(),
        updatedAt: userData.updatedAt?.toISOString(),
        quota: {
          ...userData.quota,
          lastRefreshedAt: userData.quota.lastRefreshedAt?.toISOString(),
        },
        statistics: {
          ...userData.statistics,
          lastLoginAt: userData.statistics?.lastLoginAt?.toISOString(),
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
};

/**
 * Retrieves user data with a cache-first strategy, falling back to API when network is available.
 *
 * This function implements a hybrid data fetching approach:
 * 1. First attempts to load user data from encrypted local storage for faster access
 * 2. If network is available, fetches the latest data from the API
 * 3. Compares timestamps and uses the most recent data
 * 4. Updates local cache when newer API data is available
 * 5. Falls back to cached data if API request fails
 *
 * @param userId - The unique identifier for the user to retrieve
 * @returns A Promise that resolves to a User object if found, or null if not found or on error
 *
 * @example
 * ```typescript
 * const user = await getUser('user123');
 * if (user) {
 *   console.log('User found:', user.profile.username);
 * } else {
 *   console.log('User not found or error occurred');
 * }
 * ```
 *
 * @throws Does not throw errors directly, but logs them to console and returns null
 *
 * @remarks
 * - Automatically converts ISO date strings back to Date objects
 * - Provides default values for missing statistics and quota data
 * - Handles network connectivity checks before attempting API calls
 * - Gracefully handles JSON parsing errors from corrupted local storage
 */
const getUser = async (userId: string): Promise<User | null> => {
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
          quota: {
            ...parsedData.quota,
            lastRefreshedAt: parsedData.quota.lastRefreshedAt
              ? new Date(parsedData.quota.lastRefreshedAt)
              : undefined,
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
        }; // User data found locally
        console.log('User data found locally, validating...');
        console.log('Found user data in local storage');
      } catch (parseError) {
        console.error('Error parsing local user data:', parseError);
      }
    }

    // Check network connectivity for potential API fetch
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);

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
            },
            createdAt: apiUser.createdAt
              ? new Date(apiUser.createdAt)
              : new Date(),
            updatedAt: apiUser.updatedAt
              ? new Date(apiUser.updatedAt)
              : new Date(),
            planType: apiUser.planType || 'free',
            quota: {
              imagesRemaining: apiUser.quota?.imagesRemaining || 40, // Default for free plan
              lastRefreshedAt: apiUser.quota?.lastRefreshedAt
                ? new Date(apiUser.quota.lastRefreshedAt)
                : undefined,
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
            await saveUser(userData);
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
};

/**
 * Updates a user's profile information both locally and via API.
 *
 * This function retrieves the existing user data, merges it with the provided
 * profile updates, sends the changes to the API, and updates local storage
 * upon successful API response.
 *
 * @param userId - The unique identifier of the user whose profile is being updated
 * @param profileData - Partial user data containing the fields to be updated
 * @returns A Promise that resolves to the updated User object, or null if the operation fails
 *
 * @throws {Error} When the user is not found in the system
 * @throws {Error} When the API update operation fails
 * @throws {Error} When any other error occurs during the update process
 *
 * @example
 * ```typescript
 * const updatedUser = await updateProfile('user123', {
 *   profile: {
 *     username: 'newUsername',
 *     bio: 'Updated bio text'
 *   }
 * });
 * ```
 */
const updateProfile = async (
  userId: string,
  profileData: Partial<User>,
): Promise<User | null> => {
  try {
    console.log(`Starting profile update for userId: ${userId}`, profileData);

    // Get existing user data for merging
    const existingUser = await getUser(userId);
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
      username: profileData.profile?.username || existingUser.profile.username,
      avatar: profileData.profile?.avatar || existingUser.profile.avatar,
      bio: profileData.profile?.bio || existingUser.profile.bio,
    };

    // Call the API endpoint using userAPI (token automatically added)
    const response = await userAPI.updateProfile(apiData);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update profile');
    }

    // Update local storage with the updated user
    await saveUser(updatedUser);

    console.log('Profile updated successfully through API');
    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Marks a user account as deleted by calling the backend API and updating local storage.
 *
 * This function performs the following operations:
 * 1. Calls the backend API to delete the account with an optional reason
 * 2. Updates the local user data with a new timestamp
 * 3. Removes the current user ID from encrypted storage
 *
 * @param userId - The unique identifier of the user account to delete
 * @param reason - Optional reason for account deletion to be sent to the backend
 * @returns A Promise that resolves when the account deletion process is complete
 * @throws {Error} When the API call fails or returns an unsuccessful response
 *
 * @example
 * ```typescript
 * await markAccountAsDeleted('user123', 'User requested deletion');
 * ```
 */
const markAccountAsDeleted = async (
  userId: string,
  reason?: string,
): Promise<void> => {
  try {
    console.log('Initiating account deletion process');

    // Call the backend API endpoint using userAPI (token automatically added)
    const response = await userAPI.deleteAccount(reason);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete account');
    }

    // Update local storage to reflect deleted status immediately
    const existingUser = await getUser(userId);
    if (existingUser) {
      const userWithDeletedFlag = {
        ...existingUser,
        updatedAt: new Date(),
      };

      await saveUser(userWithDeletedFlag);
    }

    // Clear current user ID from local storage
    await EncryptedStorage.removeItem('currentUserId');

    console.log('Account successfully marked as deleted through API');
  } catch (error) {
    console.error('Error marking account as deleted:', error);
    throw error;
  }
};

/**
 * Clears the current user's data from encrypted storage.
 *
 * This function removes the currently logged-in user's data while preserving
 * other users' data in storage. It performs the following operations:
 * 1. Retrieves the current user ID from encrypted storage
 * 2. Removes the specific user data associated with that ID
 * 3. Removes the current user ID marker
 *
 * @returns A Promise that resolves when the user data has been cleared
 *
 * @throws Will log an error to console if clearing user data fails
 *
 * @example
 * ```typescript
 * await clearCurrentUserData();
 * console.log('User logged out successfully');
 * ```
 */
const clearCurrentUserData = async (): Promise<void> => {
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
};

/**
 * Checks the current quota information for a user.
 *
 * @param userId - The unique identifier of the user whose quota to check
 * @returns A Promise that resolves to the user's quota information, or null if the check fails
 *
 * @remarks
 * This function calls the user API to retrieve quota information and transforms the response
 * into an IUserQuota object. If the API call fails or returns an unsuccessful response,
 * the function logs the error and returns null instead of throwing.
 *
 * The quota object includes:
 * - imagesRemaining: Number of images remaining (defaults to 15 for free plan)
 * - lastRefreshedAt: Date when the quota was last refreshed (optional)
 *
 * @example
 * ```typescript
 * const quota = await checkQuota('user123');
 * if (quota) {
 *   console.log(`Images remaining: ${quota.imagesRemaining}`);
 * }
 * ```
 */
const checkQuota = async (userId: string): Promise<IUserQuota | null> => {
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
      lastRefreshedAt: apiQuota.lastRefreshedAt
        ? new Date(apiQuota.lastRefreshedAt)
        : undefined,
    };

    console.log('Quota information retrieved successfully');
    return quota;
  } catch (error) {
    console.error('Error checking user quota:', error);
    return null;
  }
};

/**
 * Checks if the device is currently offline by fetching network information.
 *
 * @returns A Promise that resolves to `true` if the device is offline (not connected to any network),
 *          or `false` if the device is online. Defaults to `false` (online) if an error occurs
 *          while checking the network status.
 *
 * @throws Does not throw errors - catches and logs any network checking errors internally
 *
 * @example
 * ```typescript
 * const offline = await isOffline();
 * if (offline) {
 *   console.log('Device is offline');
 * } else {
 *   console.log('Device is online');
 * }
 * ```
 */
const isOffline = async (): Promise<boolean> => {
  try {
    const netInfo = await NetInfo.fetch();
    return !netInfo.isConnected;
  } catch (error) {
    console.error('Error checking network status:', error);
    // Default to assuming we're online
    return false;
  }
};

/**
 * Retrieves the current user ID from encrypted storage.
 *
 * @returns A promise that resolves to the user ID string if found, or null if not found or an error occurs
 *
 * @example
 * ```typescript
 * const userId = await getCurrentUserId();
 * if (userId) {
 *   console.log('Current user ID:', userId);
 * } else {
 *   console.log('No user ID found');
 * }
 * ```
 */
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    return await EncryptedStorage.getItem('currentUserId');
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

/**
 * Checks if an email address is available for registration.
 *
 * @param email - The email address to check for availability
 * @returns A promise that resolves to an object containing:
 *   - `isAvailable`: Boolean indicating if the email is available
 *   - `message`: Optional message with additional details
 *   - `expiresAt`: Optional expiration date for email restrictions
 *
 * @throws {Error} When there's no internet connection or other network errors occur
 *
 * @example
 * ```typescript
 * const result = await checkEmailAvailability("user@example.com");
 * if (result.isAvailable) {
 *   console.log("Email is available for registration");
 * } else {
 *   console.log(`Email not available: ${result.message}`);
 * }
 * ```
 */
const checkEmailAvailability = async (
  email: string,
): Promise<{
  isAvailable: boolean;
  message?: string;
  expiresAt?: Date;
}> => {
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
};

export const userService = {
  saveUser,
  getUser,
  updateProfile,
  markAccountAsDeleted,
  clearCurrentUserData,
  checkQuota,
  isOffline,
  getCurrentUserId,
  checkEmailAvailability,
};
export default userService;
