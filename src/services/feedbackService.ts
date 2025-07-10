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
  createdAt: any;
  status: 'new' | 'reviewed' | 'resolved' | 'closed';
}

/**
 * Submits user feedback to Firestore with device and app metadata.
 *
 * @param userId - The unique identifier of the user submitting feedback. Defaults to 'anonymous' if not provided.
 * @param userName - The name of the user submitting feedback. Defaults to 'Anonymous User' if not provided.
 * @param userEmail - The email address of the user. Defaults to 'Not provided' if not provided.
 * @param rating - The numerical rating given by the user for the feedback.
 * @param feedback - The feedback text content from the user. Will be trimmed of whitespace.
 *
 * @returns A Promise that resolves to the document ID of the created feedback entry in Firestore.
 *
 * @throws Will throw an error if the Firestore operation fails or if there are network issues.
 *
 * @example
 * ```typescript
 * try {
 *   const feedbackId = await submitFeedback(
 *     'user123',
 *     'John Doe',
 *     'john@example.com',
 *     5,
 *     'Great app!'
 *   );
 *   console.log('Feedback submitted with ID:', feedbackId);
 * } catch (error) {
 *   console.error('Failed to submit feedback:', error);
 * }
 * ```
 */
const submitFeedback = async (
  userId: string,
  userName: string,
  userEmail: string,
  rating: number,
  feedback: string,
): Promise<string> => {
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
};

/**
 * Retrieves the feedback history for a specific user from Firestore.
 *
 * @param userId - The unique identifier of the user whose feedback history to retrieve
 * @returns A Promise that resolves to an array of FeedbackData objects representing the user's feedback history
 * @throws Will throw an error if the Firestore query fails or if there's a network issue
 *
 * @example
 * ```typescript
 * const userFeedback = await getUserFeedbackHistory('user123');
 * console.log(userFeedback); // Array of feedback entries for user123
 * ```
 */
const getUserFeedbackHistory = async (
  userId: string,
): Promise<FeedbackData[]> => {
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
};

const feedbackService = {
  submitFeedback,
  getUserFeedbackHistory,
};
export default feedbackService;
