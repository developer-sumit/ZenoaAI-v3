/**
 * App Name: Zenoa AI
 * Version: 1.0.0
 * Company Name: Zenoa
 * Developer: Sumit Singh Rathore
 * Released on Indus App Store: 30 April 2025
 *
 * Description:
 * This application is designed to provide AI-powered solutions for users,
 * offering features like personalized recommendations, secure authentication,
 * and seamless navigation. Built with React Native, it ensures cross-platform
 * compatibility and a smooth user experience.
 *
 * Key Features:
 * - Secure authentication with Firebase and Google Sign-In
 * - Customizable themes (Dark and Light modes)
 * - Modular navigation with stack and tab navigators
 * - Token management for session handling
 * - Toast notifications for user feedback
 *
 * License:
 * This software is proprietary and owned by Zenoa. Unauthorized distribution
 * or modification is strictly prohibited.
 *
 */

import './global.css';
import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import CustomTabBar from '@src/components/CustomTabBar';
import Routes from '@src/constants/routes';
import {useThemeStore} from '@src/store/themeStore';
import {theme} from '@src/theme/Theme';
import {useAuthStore} from '@src/store/authStore';
import {auth} from '@src/config/firebase.config';
import SplashScreen from '@src/screens/SplashScreen';
import LoginScreen from '@src/screens/LoginScreen';
import HomeScreen from '@src/screens/HomeScreen';
import ProfileScreen from '@src/screens/ProfileScreen';
import GalleryScreen from '@src/screens/GalleryScreen';
import EditProfileScreen from '@src/screens/EditProfileScreen';
import Toast from 'react-native-toast-message';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import {authManager} from '@src/services/authManager';
import {tokenService} from '@src/services/tokenService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={Routes.SETTINGS} component={ProfileScreen} />
      <Stack.Screen name={Routes.EDIT_PROFILE} component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name={Routes.HOME} component={HomeScreen} />
      <Tab.Screen name={Routes.GALLERY} component={GalleryScreen} />
      <Tab.Screen name={Routes.SETTINGS} component={ProfileStack} />
    </Tab.Navigator>
  );
}

function App() {
  const {isDark} = useThemeStore();
  const {user, isLoading, restoreSession} = useAuthStore();

  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        // Configure Google Sign In only once at app startup
        GoogleSignin.configure({
          webClientId: Config.GOOGLE_WEB_CLIENT_ID,
          offlineAccess: true,
          forceCodeForRefreshToken: true,
        });

        // Wait for Firebase auth to fully initialize
        await auth.authStateReady();

        // Try to restore the auth session
        const isRestored = await authManager.restoreAuthSession();

        // Now check the auth state
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          console.log('User already logged in:', firebaseUser.email);

          try {
            const tokenResult = await firebaseUser.getIdTokenResult(true);
            if (tokenResult.claims.revoked) {
              await handleLogout();
              return;
            }

            // Initialize token refresh service when user is authenticated
            tokenService.init();

            await restoreSession();
          } catch (error) {
            console.error('Token validation error:', error);
            // If token refresh fails, try logout and make user sign in again
            await handleLogout();
          }
        } else {
          useAuthStore.setState({isLoading: false, user: null});
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        useAuthStore.setState({isLoading: false, user: null});
      }
    };

    initializeAuthState();

    // Clean up token service on unmount
    return () => {
      tokenService.cleanup();
    };
  }, [restoreSession]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await GoogleSignin.signOut();
      await GoogleSignin.revokeAccess();
      authManager.clearAuthData();
      useAuthStore.setState({user: null, isLoading: false});
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <SafeAreaView
        className="flex-1"
        style={{
          backgroundColor: isDark
            ? theme.dark.background
            : theme.light.background,
        }}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <NavigationContainer>
          {isLoading ? (
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name={Routes.SPLASH} component={SplashScreen} />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator screenOptions={{headerShown: false}}>
              {user ? (
                <Stack.Screen name={Routes.MAIN} component={HomeTabs} />
              ) : (
                <Stack.Screen name={Routes.SIGN_IN} component={LoginScreen} />
              )}
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </SafeAreaView>

      <Toast />
    </>
  );
}

export default App;
