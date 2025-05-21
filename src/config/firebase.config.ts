import {initializeApp} from 'firebase/app';
import Config from 'react-native-config';
import {MMKV} from 'react-native-mmkv';

// MMKV instance with a specific ID for auth
export const authStorage = new MMKV({
  id: 'auth-storage',
  encryptionKey: 'zenoa-encryption-key', // Optional but recommended for security
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

export {app};
