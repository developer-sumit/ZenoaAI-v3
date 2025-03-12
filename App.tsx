import './global.css';
import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Screens
import SplashScreen from '@src/screens/SplashScreen';
import LoginScreen from '@src/screens/LoginScreen';
import HomeScreen from '@src/screens/HomeScreen';
import ProfileScreen from '@src/screens/ProfileScreen';
import GalleryScreen from '@src/screens/GalleryScreen';
import EditProfileScreen from '@src/screens/EditProfileScreen';

// Components
import {ToastProvider} from '@src/components/Toast';
import CustomTabBar from '@src/components/CustomTabBar';
import Routes from '@src/constants/routes';
import {useThemeStore} from '@src/store/themeStore';
import {theme} from '@src/theme/Theme';
import {useAuthStore} from '@src/store/authStore';

import {app} from '@src/config/firebase.config';
import {configureGoogleAuth} from '@src/config/auth.config';

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
  const {user, isLoading, checkAuth, hasCheckedAuth} = useAuthStore();

  // Initialize Firebase and check authentication status when app loads
  useEffect(() => {
    // Initialize Firebase
    console.log('Firebase initialized with app:', app?.name);

    // Initialize Google Sign-In
    try {
      configureGoogleAuth();
    } catch (error) {
      console.log('Google auth configuration error:', error);
    }

    // Check authentication state
    if (!hasCheckedAuth) {
      checkAuth();
    }
  }, [checkAuth, hasCheckedAuth]);

  return (
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
      <ToastProvider>
        <NavigationContainer>
          {isLoading ? (
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name={Routes.SPLASH} component={SplashScreen} />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator screenOptions={{headerShown: false}}>
              {!user ? (
                <Stack.Screen name={Routes.SIGN_IN} component={LoginScreen} />
              ) : (
                <Stack.Screen name={Routes.MAIN} component={HomeTabs} />
              )}
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaView>
  );
}

export default App;
