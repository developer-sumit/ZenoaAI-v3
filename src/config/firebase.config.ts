import {initializeApp} from 'firebase/app';
import {initializeAuth, setPersistence, browserLocalPersistence} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import Config from 'react-native-config';
import {MMKV} from 'react-native-mmkv';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

// MMKV instance with a specific ID for auth
export const authStorage = new MMKV({
  id: 'auth-storage',
  encryptionKey: 'your-app-encryption-key', // Optional but recommended for security
});

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

// Initialize Firebase Auth without custom persistence
const auth = initializeAuth(app);

// Set persistence for auth
setPersistence(auth, browserLocalPersistence);

const firestore = getFirestore(app);

// Initialize Analytics and Crashlytics modules
const firebaseAnalytics = analytics();
const firebaseCrashlytics = crashlytics();

export {app, auth, firestore, firebaseAnalytics, firebaseCrashlytics};
