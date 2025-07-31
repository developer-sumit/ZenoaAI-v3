/**
 * App Name: Zenoa AI
 * Version: 3.2.0
 * Company Name: Zenoa
 * Owner & Developer: Sumit Singh Rathore
 * Released on Indus App Store: 30 April 2025
 * Released on Google Play Store: 08 June 2025
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
import Toast from 'react-native-toast-message';
import {enableScreens} from 'react-native-screens';
import {SystemBars} from 'react-native-edge-to-edge';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import {MenuProvider} from 'react-native-popup-menu';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {User} from '@src/types/user';
import Routes from '@src/constants/routes';
import CustomTabBar from '@src/components/CustomTabBar';
import LoginBottomSheet from '@src/components/LoginBottomSheet';

// Stores
import {useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useLanguageStore} from '@src/store/languageStore';

// Services
import userService from '@src/services/userService';
import {analyticsService} from '@src/services/analyticsService';
import {crashlyticsService} from '@src/services/crashlyticsService';
import {notificationService} from '@src/services/notificationService';

// Screens
import SplashScreen from '@src/screens/SplashScreen';
import HomeScreen from '@src/screens/HomeScreen';
import GenerateScreen from '@src/screens/GenerateScreen';
import SettingsScreen from '@src/screens/SettingsScreen';
import GalleryLayout from '@src/screens/GalleryLayout';
import EditProfileScreen from '@src/screens/EditProfileScreen';
import AdvancedSettingsScreen from '@src/screens/AdvancedSettingsScreen';

enableScreens();

GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animationTypeForReplace: 'push',
      }}>
      <Stack.Screen name={Routes.SETTINGS} component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        animation: 'shift',
      }}>
      <Tab.Screen name={Routes.HOME} component={HomeScreen} />
      <Tab.Screen name={Routes.GENERATE} component={GenerateScreen} />
      <Tab.Screen name={Routes.GALLERY} component={GalleryLayout} />
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

  SystemBars.setHidden(true);

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
          const {data} = await userService.getUser(authUser.uid);

          if (!data || data === null) {
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
              planType: 'free',
              statistics: {
                imagesGenerated: 0,
                lastLoginAt: new Date(),
                totalLogins: 1,
              },
              quota: {
                imagesRemaining: 15,
                lastRefreshedAt: new Date(),
                planLimits: {
                  totalImages: 15,
                },
              },
            };

            // Save the new user
            await login(newUser);
          } else {
            // Update existing user with fresh info
            await login(data);
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
    <GestureHandlerRootView>
      <MenuProvider>
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
          <SafeAreaView
            className="flex-1"
            style={{backgroundColor: theme.background}}>
            <StatusBar
              barStyle={isDark ? 'light-content' : 'dark-content'}
              backgroundColor="transparent"
              translucent
            />

            <NavigationContainer
              onStateChange={state => {
                // Optional: Log navigation state changes for debugging
                console.log('Navigation state changed:', state);
              }}>
              {isLoading ? (
                <Stack.Navigator
                  screenOptions={{
                    headerShown: false,
                    animationTypeForReplace: 'pop',
                  }}>
                  <Stack.Screen name={Routes.SPLASH} component={SplashScreen} />
                </Stack.Navigator>
              ) : (
                <Stack.Navigator screenOptions={{headerShown: false}}>
                  <Stack.Screen name={Routes.MAIN} component={HomeTabs} />
                  <Stack.Screen
                    name={Routes.ADVANCED_SETTINGS}
                    component={AdvancedSettingsScreen}
                    options={{headerShown: false, gestureEnabled: true}}
                  />
                  <Stack.Screen
                    name={Routes.EDIT_PROFILE}
                    component={EditProfileScreen}
                  />
                </Stack.Navigator>
              )}

              <LoginBottomSheet />
            </NavigationContainer>

            <Toast />
          </SafeAreaView>
        </KeyboardProvider>
      </MenuProvider>
    </GestureHandlerRootView>
  );
}

export default App;
