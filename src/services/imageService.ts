import {
  doc,
  collection,
  setDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {firestore} from '@src/config/firebase.config';
import {GeneratedImage} from '@src/types';
import NetInfo from '@react-native-community/netinfo';

export const imageService = {
  /**
   * Save an image directly to Firestore
   */
  async saveImage(userId: string, imageData: GeneratedImage): Promise<void> {
    try {
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (!isConnected) {
        console.log('No network connection, image will not be saved');
        return;
      }

      const imagesCollection = collection(firestore, 'users', userId, 'images');

      // Create a unique ID using timestamp and seed
      const imageId = `${imageData.timestamp}_${imageData.seed}`;

      const imageWithTimestamp = {
        ...imageData,
        imageId,
        createdAt: serverTimestamp(),
      };

      // Save to Firestore with custom ID to avoid duplicates
      await setDoc(doc(imagesCollection, imageId), imageWithTimestamp);
      console.log('Image saved to Firestore');
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  },

  /**
   * Get all user's images from Firestore
   */
  async getUserImages(userId: string): Promise<GeneratedImage[]> {
    try {
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (!isConnected) {
        console.log('No network connection, cannot retrieve images');
        return [];
      }

      const imagesCollection = collection(firestore, 'users', userId, 'images');
      const q = query(imagesCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const images: GeneratedImage[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data() as GeneratedImage;
        images.push(data);
      });

      return images;
    } catch (error) {
      console.error('Error getting images:', error);
      return [];
    }
  },

  /**
   * Delete an image from Firestore
   */
  async deleteImage(userId: string, imageId: string): Promise<void> {
    try {
      const isConnected = await NetInfo.fetch().then(
        state => state.isConnected,
      );

      if (!isConnected) {
        console.log('No network connection, cannot delete image');
        return;
      }

      await setDoc(
        doc(firestore, 'users', userId, 'images', imageId),
        {deleted: true, deletedAt: serverTimestamp()},
        {merge: true},
      );

      console.log('Image marked as deleted');
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },
};
