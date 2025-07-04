/**
 * App Name: Zenoa AI
 * Version: 3.0.0
 * Company Name: Zenoa
 * Owner & Developer: Sumit Singh Rathore
 * Released on Indus App Store: 30 April 2025
 *
 * License:
 * This software is proprietary and owned by Zenoa. Unauthorized distribution
 * or modification is strictly prohibited.
 *
 */

import './global.css';
import React, {useEffect} from 'react';
import Config from 'react-native-config';
import auth from '@react-native-firebase/auth';
import {StatusBar, AppState, AppStateStatus} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {Toaster} from '@masumdev/rn-toast';

import {User} from '@src/types';
import Routes from '@src/constants/routes';
import CustomTabBar from '@src/components/CustomTabBar';

// Stores
import {useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useLanguageStore} from '@src/store/languageStore';

// Services
import {userService} from '@src/services/userService';
import {analyticsService} from '@src/services/analyticsService';
import {crashlyticsService} from '@src/services/crashlyticsService';
import {notificationService} from '@src/services/notificationService';

// Screens
import SplashScreen from '@src/screens/SplashScreen';
import LoginScreen from '@src/screens/LoginScreen';
import HomeScreen from '@src/screens/HomeScreen';
import ProfileScreen from '@src/screens/ProfileScreen';
import GalleryScreen from '@src/screens/GalleryScreen';
import CommunityScreen from '@src/screens/CommunityScreen';
import EditProfileScreen from '@src/screens/EditProfileScreen';
import AdvancedSettingsScreen from '@src/screens/AdvancedSettingsScreen';

GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

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
      <Tab.Screen name={Routes.COMMUNITY} component={CommunityScreen} />
      <Tab.Screen name={Routes.SETTINGS} component={ProfileStack} />
    </Tab.Navigator>
  );
}

function App() {
  const {isDark, theme} = useTheme();
  const {language} = useLanguageStore();
  const {
    user,
    isLoading,
    initialized,
    restoreSession,
    getIdToken,
    login,
    logout,
  } = useAuthStore();

  // Set up auth state listener
  useEffect(() => {
    if (initialized) {
      return;
    } // Only run once

    console.log('Setting up auth state listeners...');

    // Initialize notification service
    const initializeServices = async () => {
      try {
        // Initialize Firebase Auth first
        await restoreSession();

        // Then initialize notification service
        await notificationService.initialize();
        console.log('All services initialized successfully');
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initializeServices();

    // Listen for auth state changes
    const unsubscribeAuthState = auth().onAuthStateChanged(async authUser => {
      console.log(
        'Auth state changed:',
        authUser ? `User ${authUser.uid}` : 'No user',
      );

      if (authUser) {
        // User just signed in or session was restored
        try {
          // Get user data using the updated User interface
          let userData = await userService.getUser(authUser.uid);

          if (!userData) {
            // Create a new user profile using the updated User interface
            const newUser: User = {
              uid: authUser.uid,
              email: authUser.email || '',
              profile: {
                username: authUser.displayName || '',
                avatar: authUser.photoURL || '',
                bio: '',
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
              planType: 'free',
              statistics: {
                imagesGenerated: 0,
                lastLoginAt: new Date(),
                totalLogins: 1,
              },
              quota: {
                imagesRemaining: 40,
                refreshAt: new Date(),
              },
            };

            // Save the new user
            await login(newUser);
          } else {
            // Update existing user with fresh info
            await login(userData);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        }
      } else {
        // User is signed out - explicitly set state to null
        // This ensures the state is consistent with Firebase
        if (user) {
          console.log('Firebase indicates user is signed out, updating state');
          await logout();
        }
      }
    });

    // Set up token change listener
    const unsubscribeTokenChange = auth().onIdTokenChanged(async _authUser => {
      if (user) {
        console.log('ID token changed for user:', user.uid);
        // Get fresh token - this lets Firebase handle the refresh automatically
        await getIdToken(false);
      }
    });

    return () => {
      unsubscribeAuthState();
      unsubscribeTokenChange();
    };
  }, [initialized, restoreSession, getIdToken, login, user]);

  // Debug effect to log current auth state - helps identify auth issues
  useEffect(() => {
    console.log('Auth State Debug:', {
      userExists: !!user,
      userId: user?.uid, // Changed from user?.id to user?.uid
      isLoading,
      initialized,
      currentFirebaseUser: !!auth().currentUser,
      currentFirebaseUid: auth().currentUser?.uid,
    });
  }, [user, isLoading, initialized]);

  // Handle app state changes to ensure token freshness
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && auth().currentUser) {
        // App came to foreground, refresh token
        console.log('App is active, refreshing session if needed');
        getIdToken(false);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => subscription.remove();
  }, [getIdToken]);

  useEffect(() => {
    // Initialize analytics and crashlytics
    analyticsService.setAnalyticsCollectionEnabled(true);
    crashlyticsService.setCrashlyticsCollectionEnabled(true);

    // Log initial app launch
    analyticsService.logEvent('app_launched', {
      timestamp: new Date().toISOString(),
    });

    return () => {
      // Cleanup if needed
      analyticsService.setAnalyticsCollectionEnabled(false);
      crashlyticsService.setCrashlyticsCollectionEnabled(false);
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Set user properties for analytics and crashlytics
      analyticsService.setUserProperties(user);
      crashlyticsService.setUserInfo(user);
    }
  }, [user]);

  // Effect to track language changes
  useEffect(() => {
    if (user) {
      analyticsService.logEvent('language_changed', {
        language,
        userId: user.uid,
      });
    }
  }, [language, user]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{backgroundColor: theme.background}}>
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
            <Stack.Screen
              name={Routes.ADVANCED_SETTINGS}
              component={(props: any) => <AdvancedSettingsScreen {...props} />}
              options={{headerShown: false}}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>

      <Toaster
        customColors={{
          success: {background: '#E7F5E9', text: '#256029'},
          error: {background: '#FDECEA', text: '#B3261E'},
          info: {background: '#E3F2FD', text: '#1E88E5'},
        }}
      />
    </SafeAreaView>
  );
}

export default App;
