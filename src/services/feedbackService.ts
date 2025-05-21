import {Platform} from 'react-native';
import appConfig from '@src/config/app.config';
import firestore from '@react-native-firebase/firestore';

export interface FeedbackData {
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  feedback: string;
  appVersion: string;
  platform: string;
  platformVersion: number;
  deviceModel: string;
  createdAt: any; // Firebase timestamp
  status: 'new' | 'reviewed' | 'resolved' | 'closed';
}

export const feedbackService = {
  /**
   * Submit user feedback to Firestore
   */
  async submitFeedback(
    userId: string,
    userName: string,
    userEmail: string,
    rating: number,
    feedback: string,
  ): Promise<string> {
    try {
      // Create the feedback object to save to Firestore
      const feedbackData: FeedbackData = {
        userId: userId || 'anonymous',
        userName: userName || 'Anonymous User',
        userEmail: userEmail || 'Not provided',
        rating,
        feedback: feedback.trim(),
        appVersion: appConfig.version,
        platform: Platform.OS,
        platformVersion:
          typeof Platform.Version === 'string'
            ? parseInt(Platform.Version, 10)
            : Platform.Version,
        deviceModel:
          Platform.OS === 'ios'
            ? Platform.constants.systemName
            : 'Android Device',
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: 'new',
      };

      // Add the feedback to Firestore - using RN Firebase SDK
      const docRef = await firestore().collection('feedback').add(feedbackData);

      console.log('Feedback submitted successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  /**
   * Get feedback history for a user
   */
  async getUserFeedbackHistory(userId: string): Promise<FeedbackData[]> {
    try {
      // Query Firestore using RN Firebase SDK
      const querySnapshot = await firestore()
        .collection('feedback')
        .where('userId', '==', userId)
        .get();

      const feedbackHistory: FeedbackData[] = [];

      querySnapshot.forEach(doc => {
        feedbackHistory.push({
          ...(doc.data() as FeedbackData),
          id: doc.id,
        } as any);
      });

      return feedbackHistory;
    } catch (error) {
      console.error('Error fetching user feedback history:', error);
      throw error;
    }
  },
};
