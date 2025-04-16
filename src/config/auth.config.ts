import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {GoogleAuthProvider, signInWithCredential} from 'firebase/auth';
import {auth} from './firebase.config';
import Config from 'react-native-config';
import {authManager} from '@src/services/authManager';

// Initialize Google Sign-In immediately
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true, // Keep this for refresh tokens
  forceCodeForRefreshToken: true,
});

export const googleAuth = {
  async signIn() {
    try {
      // Ensure configuration is set
      GoogleSignin.configure({
        webClientId: Config.GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });

      // Check for Play Services
      await GoogleSignin.hasPlayServices();

      // Get Google user
      const userInfo = await GoogleSignin.signIn();
      console.log('Google sign-in successful:', userInfo.data?.user?.email);

      // Get ID token for Firebase auth
      const {idToken, accessToken} = await GoogleSignin.getTokens();

      // Create credential
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign in with Firebase
      const firebaseUserCredential = await signInWithCredential(
        auth,
        googleCredential,
      );

      // Store auth data for persistence
      await authManager.storeAuthData(firebaseUserCredential.user, accessToken);

      return {
        success: true,
        data: {
          user: userInfo.data?.user,
          firebaseUser: firebaseUserCredential.user,
        },
      };
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return {success: false, error};
    }
  },

  async signOut() {
    try {
      await GoogleSignin.signOut();
      // Clear stored auth data
      authManager.clearAuthData();
      return {success: true};
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
      return {success: false, error};
    }
  },

  async checkCurrentUser() {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return {
        success: !!currentUser,
        data: currentUser,
      };
    } catch (error) {
      console.error('Error checking current Google user:', error);
      return {success: false, error};
    }
  },
};
