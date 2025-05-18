import {
  doc,
  collection,
  setDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {firestore} from '@src/config/firebase.config';
import {GeneratedImage} from '@src/types';
import NetInfo from '@react-native-community/netinfo';
import EncryptedStorage from 'react-native-encrypted-storage';

export const imageService = {
  /**
   * Save an image to Firestore and local cache
   */
  async saveImage(userId: string, imageData: GeneratedImage): Promise<string> {
    try {
      // Create a unique ID using timestamp and seed
      const imageId =
        `${imageData.timestamp}_${imageData.seed}` ||
        `img_${new Date().getTime()}_${Math.floor(Math.random() * 10000)}`;

      const imageWithTimestamp = {
        ...imageData,
        imageId,
        userId,
        createdAt: serverTimestamp(),
        synced: false,
      };

      // Save to local storage first for offline access
      const userImages = await this.getLocalUserImages(userId);
      userImages.unshift(imageWithTimestamp);

      // Limit local storage to 50 recent images to prevent storage issues
      const limitedImages = userImages.slice(0, 50);
      await EncryptedStorage.setItem(
        `images_${userId}`,
        JSON.stringify(limitedImages),
      );
      console.log('Image saved to local storage');

      // Try to sync with Firestore if connected
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (isConnected) {
        try {
          // Save to user's images collection
          const imageRef = doc(
            collection(firestore, 'users', userId, 'images'),
            imageId,
          );
          await setDoc(imageRef, {
            ...imageWithTimestamp,
            createdAt: serverTimestamp(), // Use server timestamp
            synced: true,
          });
          console.log('Image saved to Firestore');
        } catch (error) {
          console.error('Error saving image to Firestore:', error);
        }
      } else {
        console.log('No network connection, image will sync later');
        // Flag for future sync
        this.markImagesForSync(userId);
      }

      return imageId;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  },

  /**
   * Mark images for future sync when connection is restored
   */
  async markImagesForSync(userId: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(`sync_needed_${userId}`, 'true');
    } catch (error) {
      console.error('Error marking for sync:', error);
    }
  },

  /**
   * Get all user images, combining from both local storage and Firestore, excluding deleted ones
   */
  async getUserImages(userId: string): Promise<any[]> {
    try {
      if (!userId) {
        console.error('No user ID provided to getUserImages');
        return [];
      }

      console.log('Fetching images for user:', userId);

      // Try to sync if needed and connected
      await this.syncImagesIfNeeded(userId);

      // First, get local images
      const localImages = await this.getLocalUserImages(userId);

      // Get remote images if connected
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (isConnected) {
        try {
          console.log('Fetching images from Firestore');
          const imagesCollection = collection(
            firestore,
            'users',
            userId,
            'images',
          );
          const q = query(imagesCollection, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const firestoreImages = querySnapshot.docs
              .map(d => {
                const data = d.data();
                // Convert Firestore timestamp to ISO string if present
                if (data.createdAt && data.createdAt instanceof Timestamp) {
                  data.createdAt = data.createdAt.toDate().toISOString();
                }
                return {id: d.id, ...data};
              })
              .filter(img => !img.isDeleted); // Filter out deleted images

            console.log(`Found ${firestoreImages.length} images in Firestore`);

            // Update local cache
            await EncryptedStorage.setItem(
              `images_${userId}`,
              JSON.stringify(firestoreImages),
            );

            const allImages = firestoreImages;

            return allImages.filter(img => !img.isDeleted);
          } else {
            console.log('No images found in Firestore');
            const allImages = localImages;
            return allImages.filter(img => !img.isDeleted);
          }
        } catch (error) {
          console.error('Error fetching images from Firestore:', error);
          const allImages = localImages;
          return allImages.filter(img => !img.isDeleted);
        }
      } else {
        console.log('Offline mode: Using cached images');
        const allImages = localImages;
        return allImages.filter(img => !img.isDeleted);
      }
    } catch (error) {
      console.error('Error in getUserImages:', error);
      return [];
    }
  },

  /**
   * Get images from local storage
   */
  async getLocalUserImages(userId: string): Promise<any[]> {
    try {
      const cachedImagesJson = await EncryptedStorage.getItem(
        `images_${userId}`,
      );
      if (cachedImagesJson) {
        const parsedImages = JSON.parse(cachedImagesJson);
        console.log(`Found ${parsedImages.length} cached images`);
        return parsedImages;
      }
      return [];
    } catch (error) {
      console.error('Error getting local images:', error);
      return [];
    }
  },

  /**
   * Sync local images with Firestore if needed
   */
  async syncImagesIfNeeded(userId: string): Promise<void> {
    try {
      const syncNeeded = await EncryptedStorage.getItem(
        `sync_needed_${userId}`,
      );

      if (syncNeeded !== 'true') {
        return;
      }

      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (!isConnected) {
        return;
      }

      console.log('Syncing local images with Firestore');

      // Get local images
      const localImages = await this.getLocalUserImages(userId);
      const unsynced = localImages.filter(img => !img.synced);

      if (unsynced.length === 0) {
        await EncryptedStorage.removeItem(`sync_needed_${userId}`);
        return;
      }

      // Upload unsynced images
      for (const image of unsynced) {
        try {
          const imageRef = doc(
            collection(firestore, 'users', userId, 'images'),
            image.imageId,
          );

          await setDoc(imageRef, {
            ...image,
            createdAt: serverTimestamp(),
            synced: true,
            // Explicitly include isFavorite status
            isFavorite: image.isFavorite === true,
          });

          // Mark as synced locally
          image.synced = true;
        } catch (error) {
          console.error('Error syncing image:', error);
        }
      }

      // Update local storage with synced status
      await EncryptedStorage.setItem(
        `images_${userId}`,
        JSON.stringify(localImages),
      );

      // Clear sync flag
      await EncryptedStorage.removeItem(`sync_needed_${userId}`);
      console.log('Image sync complete');
    } catch (error) {
      console.error('Error in syncImagesIfNeeded:', error);
    }
  },

  /**
   * Delete an image locally and from Firestore
   */
  async deleteImage(userId: string, imageId: string): Promise<void> {
    try {
      // First, delete/mark locally
      const localImages = await this.getLocalUserImages(userId);
      const updatedImages = localImages.filter(img => img.imageId !== imageId);

      await EncryptedStorage.setItem(
        `images_${userId}`,
        JSON.stringify(updatedImages),
      );

      // Try to delete from Firestore
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (isConnected) {
        const imageRef = doc(
          collection(firestore, 'users', userId, 'images'),
          imageId,
        );

        await setDoc(
          imageRef,
          {deleted: true, deletedAt: serverTimestamp()},
          {merge: true},
        );

        console.log('Image marked as deleted in Firestore');
      } else {
        // Mark for sync later
        this.markImagesForSync(userId);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  /**
   * Mark an image as deleted (soft delete)
   */
  async markImageAsDeleted(userId: string, imageId: string): Promise<void> {
    try {
      // First, update locally
      const localImages = await this.getLocalUserImages(userId);
      const updatedImages = localImages.map(img =>
        img.imageId === imageId
          ? {...img, isDeleted: true, deletedAt: new Date().toISOString()}
          : img,
      );

      await EncryptedStorage.setItem(
        `images_${userId}`,
        JSON.stringify(updatedImages),
      );

      // Try to update in Firestore
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (isConnected) {
        const imageRef = doc(
          collection(firestore, 'users', userId, 'images'),
          imageId,
        );

        await setDoc(
          imageRef,
          {isDeleted: true, deletedAt: serverTimestamp()},
          {merge: true},
        );

        console.log('Image marked as deleted in Firestore');
      } else {
        // Mark for sync later
        this.markImagesForSync(userId);
      }
    } catch (error) {
      console.error('Error marking image as deleted:', error);
      throw error;
    }
  },

  /**
   * Toggle favorite status for an image and save to Firestore
   */
  async toggleFavoriteStatus(
    userId: string,
    imageId: string,
    isFavorite: boolean,
  ): Promise<boolean> {
    try {
      console.log(
        `Starting toggleFavoriteStatus for image ${imageId}, userId: ${userId}, setting to ${isFavorite}`,
      );

      // First update local storage
      const localImages = await this.getLocalUserImages(userId);

      // Find the image in local cache
      const updatedLocalImages = localImages.map(img => {
        if (
          img.imageId === imageId ||
          `${img.timestamp}_${img.seed}` === imageId
        ) {
          console.log(
            `Found image in local storage, updating isFavorite to ${isFavorite}`,
          );
          return {...img, isFavorite: isFavorite};
        }
        return img;
      });

      // Save back to local storage
      await EncryptedStorage.setItem(
        `images_${userId}`,
        JSON.stringify(updatedLocalImages),
      );
      console.log('Updated favorite status in local storage');

      // Update in Firestore if connected
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (isConnected) {
        try {
          console.log(`Network available, updating in Firestore: ${imageId}`);
          // Get reference to the image document in Firestore
          const imageRef = doc(
            collection(firestore, 'users', userId, 'images'),
            imageId,
          );

          // Update the isFavorite field
          await setDoc(
            imageRef,
            {
              isFavorite: isFavorite,
              lastUpdated: serverTimestamp(),
            },
            {merge: true},
          );

          console.log(
            `Image ${
              isFavorite ? 'marked as favorite' : 'removed from favorites'
            } in Firestore`,
          );
          return true;
        } catch (firestoreError) {
          console.error(
            'Error updating favorite status in Firestore:',
            firestoreError,
          );
          // Continue with local update even if Firestore fails
        }
      } else {
        console.log('No network connection, will sync when online');
        // Flag for future sync when connection is restored
        this.markImagesForSync(userId);
      }

      // Return true even if only updated locally
      return true;
    } catch (error) {
      console.error('Failed to update favorite status:', error);
      return false;
    }
  },
};
