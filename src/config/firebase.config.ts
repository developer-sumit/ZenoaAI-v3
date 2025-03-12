import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import Config from 'react-native-config';

const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.FIREBASE_AUTH_DOMAIN,
  projectId: Config.FIREBASE_PROJECT_ID,
  storageBucket: Config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.FIREBASE_APP_ID,
  measurementId: Config.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const firestore = getFirestore(app);

// Helper function to check if Firebase is initialized
export const isFirebaseInitialized = () => {
  try {
    getAuth(app);
    return true;
  } catch (error) {
    return false;
  }
};

export {app, auth, firestore};

// Debug info for development
if (__DEV__) {
  console.log('Firebase initialized with config:', {
    apiKey: Config.FIREBASE_API_KEY ? '✓ Set' : '✗ Missing',
    authDomain: Config.FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing',
    projectId: Config.FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing',
    storageBucket: Config.FIREBASE_STORAGE_BUCKET ? '✓ Set' : '✗ Missing',
    messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID
      ? '✓ Set'
      : '✗ Missing',
    appId: Config.FIREBASE_APP_ID ? '✓ Set' : '✗ Missing',
  });

  console.log(
    'Google Auth Web Client ID:',
    Config.GOOGLE_WEB_CLIENT_ID ? '✓ Set' : '✗ Missing',
  );
}
