import Config from 'react-native-config';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {auth} from './firebase.config';
import {GoogleAuthProvider, signInWithCredential} from 'firebase/auth';

export function configureGoogleAuth() {
  GoogleSignin.configure({
    webClientId: Config.GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: ['profile', 'email'],
  });

  console.log('Google Sign-In configured');
  return true;
}

export const googleAuth = {
  signIn: async () => {
    try {
      // Get Google credentials
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // Get ID token from Google Sign-In
      const {idToken} = await GoogleSignin.getTokens();

      // Create a Google credential for Firebase
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign in with Firebase
      const result = await signInWithCredential(auth, googleCredential);

      // Return proper user format
      return {
        data: {
          user: {
            id: result.user.uid, // Use Firebase UID
            name:
              userInfo?.data?.user.givenName || result.user.displayName || '',
            email: userInfo?.data?.user.email || result.user.email || '',
            photo: userInfo?.data?.user.photo || result.user.photoURL || '',
          },
        },
      };
    } catch (error) {
      console.log('Google sign-in error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.log('Google sign-out error:', error);
    }
  },
};
