import EncryptedStorage from 'react-native-encrypted-storage';

import {userAPI} from './axiosServer';
import {User, IUserQuota} from '@src/types/user';
import {ResponseData} from '@src/types/api';
import {DEFAULT_PLAN_TYPE} from '@src/constants';

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
    const newData: User = {
      uid: userData.uid,
      email: userData.email,
      profile: {
        username: userData.profile.username,
        avatar: userData.profile.avatar,
        bio: userData.profile.bio,
      },
      planType: userData.planType,
      // Convert dates to ISO strings for JSON storage
      createdAt: new Date(userData.createdAt),
      updatedAt: new Date(userData.updatedAt),
      quota: userData.quota,
      statistics: userData.statistics,
      fcmTokenUpdatedAt: new Date(
        userData.fcmTokenUpdatedAt?.toISOString() || '',
      ),
    };

    await EncryptedStorage.setItem(
      `user_${userData.uid}`,
      JSON.stringify(newData),
    );
    await EncryptedStorage.setItem('currentUserId', userData.uid);
    console.log('User data saved to local storage');
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

/**
 * Updates specific fields of a locally stored user object in encrypted storage.
 *
 * Retrieves the user data by `userId`, merges the provided `updates` into the existing user object,
 * updates the `updatedAt` timestamp, and saves the updated user data back to encrypted storage.
 *
 * @param userId - The unique identifier of the user whose data will be updated.
 * @param updates - An object containing the fields to update in the user data.
 * @throws Will throw an error if no local user data is found or if an error occurs during the update process.
 */
const updateLocalUser = async (
  userId: string,
  updates: Partial<User>,
): Promise<void> => {
  try {
    const localUserData = await EncryptedStorage.getItem(`user_${userId}`);
    if (!localUserData) {
      throw new Error('No local user data found');
    }
    const parsedData: User = JSON.parse(localUserData);

    // Merge updates into existing user data
    const updatedUser: User = {
      ...parsedData,
      ...updates,
      // Optionally update updatedAt timestamp
      updatedAt: new Date(),
    };

    await EncryptedStorage.setItem(
      `user_${userId}`,
      JSON.stringify(updatedUser),
    );
    console.log('Local user field(s) updated');
  } catch (error) {
    console.error('Error updating local user field:', error);
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
const getUser = async (userId: string): Promise<ResponseData<User>> => {
  if (!userId) {
    console.log('No userId provided to getUser');
    return {
      success: false,
      data: null,
      message: 'Unauthenticated: User must be logged in',
    };
  }

  try {
    // First try to get data from local storage (faster)
    let userData: User | null = null;
    const localUserData = await EncryptedStorage.getItem(`user_${userId}`);

    if (localUserData) {
      const parsedData = JSON.parse(localUserData);
      userData = {
        ...parsedData,
        // Convert ISO strings back to Date objects
        createdAt: new Date(parsedData.createdAt),
        updatedAt: new Date(parsedData.updatedAt),
        quota: parsedData.quota,
        statistics: parsedData.statistics || {
          lastLoginAt: new Date(),
          totalLogins: 0,
          imagesGenerated: 0,
        },
        fcmTokenUpdatedAt: parsedData.fcmTokenUpdatedAt
          ? new Date(parsedData.fcmTokenUpdatedAt)
          : undefined,
      };
      // User data found locally
      console.log('User data found locally, validating...');
      console.log('Found user data in local storage');
    }

    try {
      // Call the API endpoint using userAPI (token automatically added)
      const response = await userAPI.getProfile();
      if (response.data.success && response.data.data) {
        const apiUser = response.data.data;
        const apiUserData: User = {
          uid: userId,
          email: apiUser.email || '',
          profile: {
            username: apiUser.profile?.username || '',
            avatar: apiUser.profile?.avatar || '',
            bio: apiUser.profile?.bio || '',
          },
          createdAt: apiUser.createdAt
            ? new Date(apiUser.createdAt)
            : new Date(),
          updatedAt: apiUser.updatedAt
            ? new Date(apiUser.updatedAt)
            : new Date(),
          planType: apiUser.planType || DEFAULT_PLAN_TYPE,
          quota: {
            imagesRemaining: apiUser.quota?.imagesRemaining || 0, // Default for free plan
            planLimits: {
              totalImages: apiUser.quota?.planLimits?.totalImages || 0,
            },
          },
          statistics: apiUser.statistics
            ? {
                lastLoginAt: apiUser.statistics.lastLoginAt
                  ? new Date(apiUser.statistics.lastLoginAt)
                  : new Date(),
                totalLogins: apiUser.statistics.totalLogins || 0,
                imagesGenerated: apiUser.statistics.imagesGenerated || 0,
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
          await saveUser(apiUserData);

          return {
            success: true,
            data: apiUserData,
            message: 'User data retrieved from API',
          };
        }
      }
    } catch (apiError) {
      console.log('API fetch failed, using cached data:', apiError);

      return {
        success: true,
        data: userData,
        message: 'Using cached user data',
      };
    }

    return {
      success: true,
      data: userData,
      message: userData ? '' : 'User not found',
    };
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return {
      success: false,
      data: null,
      message: 'Error retrieving user data',
    };
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
): Promise<ResponseData<User>> => {
  try {
    console.log(`Starting profile update for userId: ${userId}`, profileData);

    // Get existing user data for merging
    const {success, data} = await getUser(userId);
    if (!success || !data) {
      return {
        success: false,
        message: 'User not found',
        data: null,
      };
    }

    // Prepare the merged data
    const updatedUser = {
      ...data,
      ...profileData,
      updatedAt: new Date(),
    };

    // Format data for the API
    const apiData = {
      username: profileData.profile?.username || data.profile.username,
      bio: profileData.profile?.bio || data.profile.bio,
      avatar: profileData.profile?.avatar || data.profile.avatar,
    };

    // Call the API endpoint using userAPI (token automatically added)
    const response = await userAPI.updateProfile(apiData);

    if (!response.data.success) {
      return {
        success: false,
        message: response.data.message || 'Failed to update profile',
        data: null,
      };
    }

    // Update local storage with the updated user
    await saveUser(updatedUser);

    console.log('Profile updated successfully through API');
    return {
      success: true,
      message: response.data.message || 'Profile updated successfully',
      data: updatedUser,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      message: 'Failed to update profile',
      data: null,
    };
  }
};

/**
 * Deletes a user account by calling the backend API and clearing all local data.
 *
 * This function performs the following operations:
 * 1. Calls the backend API to delete the account with an optional reason
 * 2. Clears all user data from local storage
 * 3. Removes the current user ID from encrypted storage
 * 4. Sets the email restriction in local storage for 30 days
 *
 * @param userId - The unique identifier of the user account to delete
 * @param reason - Optional reason for account deletion to be sent to the backend
 * @returns A Promise that resolves when the account deletion process is complete
 * @throws {Error} When the API call fails or returns an unsuccessful response
 *
 * @example
 * ```typescript
 * await deleteUserAccount('user123', 'User requested deletion');
 * ```
 */
const deleteUserAccount = async (
  userId: string,
  reason?: string,
): Promise<ResponseData<void>> => {
  try {
    console.log('Initiating account deletion process');

    // Get user data to store email for restriction
    const {success, data} = await getUser(userId);
    if (!success || !data) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const userEmail = data?.email;

    // Call the backend API endpoint using userAPI (token automatically added)
    const response = await userAPI.deleteAccount(reason);

    if (!response.data.success) {
      return {
        success: false,
        message: response.data.message || 'Failed to delete account',
      };
    }

    // Set email restriction for 30 days if we have the user's email
    if (userEmail) {
      const restrictionExpiry = new Date();
      restrictionExpiry.setDate(restrictionExpiry.getDate() + 30);

      await EncryptedStorage.setItem(
        `email_restriction_${userEmail.toLowerCase()}`,
        JSON.stringify({
          email: userEmail.toLowerCase(),
          deletedAt: new Date().toISOString(),
          expiresAt: restrictionExpiry.toISOString(),
          reason: reason || 'Account deletion',
        }),
      );

      console.log(
        `Email restriction set for ${userEmail} until ${restrictionExpiry.toISOString()}`,
      );
    }

    // Clear all user data from local storage
    await EncryptedStorage.removeItem(`user_${userId}`);
    await EncryptedStorage.removeItem('currentUserId');

    console.log('Account successfully deleted and all data cleared');
    return {
      success: true,
      message: 'Account deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting account:', error);
    return {
      success: false,
      message: 'Failed to delete account',
    };
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
 * - imagesRemaining: Number of images remaining
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
const checkQuota = async (): Promise<ResponseData<IUserQuota>> => {
  try {
    // Call the API endpoint using userAPI (token automatically added)
    const response = await userAPI.checkQuota();

    if (!response.data.success) {
      return {
        success: false,
        message: response.data.message || 'Failed to check quota',
        data: null,
      };
    }
    const apiQuota = response.data.data;
    const quota: IUserQuota = {
      imagesRemaining: apiQuota.imagesRemaining || 0, // Default for free plan
      lastRefreshedAt: apiQuota.lastRefreshedAt
        ? new Date(apiQuota.lastRefreshedAt)
        : undefined,
      planLimits: {
        totalImages: apiQuota.planLimits?.totalImages || 0, // Default for free
      },
    };

    console.log('Quota refreshed successfully:', quota);
    return {
      success: true,
      message: 'Quota refreshed successfully',
      data: quota,
    };
  } catch (error) {
    console.error('Error checking user quota:', error);
    return {
      success: false,
      message: 'Error refreshing user quota',
      data: null,
    };
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
 *   - `daysRemaining`: Optional number of days remaining in restriction
 *   - `hoursRemaining`: Optional number of hours remaining in restriction
 *   - `minutesRemaining`: Optional number of minutes remaining in restriction
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
  daysRemaining?: number;
  hoursRemaining?: number;
  minutesRemaining?: number;
}> => {
  try {
    // First check local email restrictions
    const localRestriction = await checkEmailRestriction(email);
    if (localRestriction.isRestricted) {
      return {
        isAvailable: false,
        message:
          'This email cannot be used to create a new account due to a recent account deletion. Please try again later or use a different email.',
        expiresAt: localRestriction.expiresAt,
        daysRemaining: localRestriction.daysRemaining,
        hoursRemaining: localRestriction.hoursRemaining,
        minutesRemaining: localRestriction.minutesRemaining,
      };
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

/**
 * Checks if an email is restricted due to recent account deletion.
 *
 * @param email - The email address to check for restrictions
 * @returns A promise that resolves to an object containing:
 *   - `isRestricted`: Boolean indicating if the email is restricted
 *   - `expiresAt`: Date when the restriction expires (if restricted)
 *   - `daysRemaining`: Number of days remaining in the restriction
 *   - `hoursRemaining`: Number of hours remaining in the restriction
 *   - `minutesRemaining`: Number of minutes remaining in the restriction
 *
 * @example
 * ```typescript
 * const restriction = await checkEmailRestriction("user@example.com");
 * if (restriction.isRestricted) {
 *   console.log(`Email restricted for ${restriction.daysRemaining} more days`);
 * }
 * ```
 */
const checkEmailRestriction = async (
  email: string,
): Promise<{
  isRestricted: boolean;
  expiresAt?: Date;
  daysRemaining?: number;
  hoursRemaining?: number;
  minutesRemaining?: number;
}> => {
  try {
    const restrictionData = await EncryptedStorage.getItem(
      `email_restriction_${email.toLowerCase()}`,
    );

    if (!restrictionData) {
      return {isRestricted: false};
    }

    const restriction = JSON.parse(restrictionData);
    const expiresAt = new Date(restriction.expiresAt);
    const now = new Date();

    if (now >= expiresAt) {
      // Restriction has expired, remove it
      await EncryptedStorage.removeItem(
        `email_restriction_${email.toLowerCase()}`,
      );
      return {isRestricted: false};
    }

    // Calculate remaining time
    const timeDiff = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60));
    const minutesRemaining = Math.ceil(timeDiff / (1000 * 60));

    return {
      isRestricted: true,
      expiresAt,
      daysRemaining,
      hoursRemaining,
      minutesRemaining,
    };
  } catch (error) {
    console.error('Error checking email restriction:', error);
    return {isRestricted: false};
  }
};

/**
 * Removes an email restriction from local storage.
 *
 * @param email - The email address to remove restrictions for
 * @returns A promise that resolves when the restriction is removed
 *
 * @example
 * ```typescript
 * await removeEmailRestriction("user@example.com");
 * ```
 */
const removeEmailRestriction = async (email: string): Promise<void> => {
  try {
    await EncryptedStorage.removeItem(
      `email_restriction_${email.toLowerCase()}`,
    );
    console.log(`Email restriction removed for ${email}`);
  } catch (error) {
    console.error('Error removing email restriction:', error);
  }
};

const userService = {
  saveUser,
  updateLocalUser,
  getUser,
  updateProfile,
  deleteUserAccount,
  clearCurrentUserData,
  checkQuota,
  checkEmailAvailability,
  checkEmailRestriction,
  removeEmailRestriction,
};
export default userService;
