import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import {useAuthStore} from '@src/store/authStore';
import {googleAuth} from '@src/config/auth.config';
import {theme} from '@src/theme/Theme';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '@src/types';
import {useThemeStore} from '@src/store/themeStore';
import appConfig from '@src/config/app.config';
import Routes from '@src/constants/routes';
import Icon from 'react-native-vector-icons/Ionicons';
import {BlurView} from '@react-native-community/blur';
import {useToast} from '@src/components/Toast';
import {userService} from '@src/services/userService';

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  typeof Routes.SIGN_IN
>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {user, isLoading, login, checkAuth, hasCheckedAuth} = useAuthStore();
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;
  const toast = useToast();
  const [signingIn, setSigningIn] = useState(false);

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Clear any existing Google sign-in state on component mount
    const clearGoogleAuthState = async () => {
      try {
        // Force sign out from Google to ensure fresh auth flow
        await googleAuth.signOut();
        console.log('Successfully cleared Google auth state');
      } catch (error) {
        console.warn('Error clearing Google auth state:', error);
      }
    };

    // Check for existing session
    if (!hasCheckedAuth) {
      checkAuth();
    }

    // Always clear Google auth state when showing login screen
    clearGoogleAuthState();

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hasCheckedAuth]);

  useEffect(() => {
    // If user is already logged in, navigate to main screen
    if (hasCheckedAuth && !isLoading && user) {
      navigation.replace(Routes.MAIN as never);
    }
  }, [isLoading, user, hasCheckedAuth]);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);

      // Force sign out first to ensure we get the account picker
      try {
        await googleAuth.signOut();
      } catch (signOutError) {
        console.warn('Error signing out before sign in:', signOutError);
      }

      // Request a new authentication
      const userInfo = await googleAuth.signIn();

      if (!userInfo?.data?.user?.id) {
        toast.error('Unable to sign in. Please try again.');
        return;
      }

      const googleUser = userInfo.data.user;

      // Check if this user already exists but with custom profile data
      let existingUserData = null;
      try {
        existingUserData = await userService.getUser(googleUser.id);
      } catch (error) {
        console.log('Error checking for existing user:', error);
      }

      // Preserve existing user data if available
      await login({
        id: googleUser.id,
        name: existingUserData?.name || googleUser.name || '',
        email: googleUser.email || '',
        // Use existing photo if available, otherwise use Google photo
        photo: existingUserData?.photo || googleUser.photo || '',
        // Preserve any other custom fields
        ...existingUserData,
      });

      navigation.replace(Routes.MAIN as never);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  if (isLoading || signingIn) {
    return (
      <View
        style={{backgroundColor: colors.background}}
        className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{backgroundColor: colors.background}} className="flex-1">
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={20}
      />

      {/* Animated Content Container */}
      <Animated.View
        className="flex-1 justify-center items-center p-8"
        style={{
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        }}>
        {/* App Logo/Title */}
        <View className="items-center mb-16">
          <Icon
            name="sparkles"
            size={64}
            color={colors.primary}
            style={{marginBottom: 16}}
          />
          <Text
            className="text-4xl font-bold text-center mb-4"
            style={{color: colors.text}}>
            {appConfig.name}
          </Text>
          <Text
            className="text-lg font-bold text-center mt-2"
            style={{color: colors.secondaryText}}>
            Create Amazing AI Art
          </Text>
        </View>

        {/* Sign In Options */}
        <View className="w-full max-w-[370px]">
          {/* Google Sign-In Button */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            style={{backgroundColor: colors.surface}}
            className="flex-row items-center justify-center p-4 rounded-2xl mb-4">
            <Icon name="logo-google" size={24} color={colors.text} />
            <Text style={{color: colors.text}} className="ml-3 text-lg">
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Switch Account Note */}
          <Text
            style={{color: colors.secondaryText}}
            className="text-center text-sm mt-4">
            You can tap the button above to sign in with a different Google
            account
          </Text>
        </View>

        {/* Privacy Notice */}
        <Text
          className="text-center text-base px-8 mt-8"
          style={{color: colors.secondaryText}}>
          By continuing, you agree to our{' '}
          <Text style={{color: colors.primary}}>Terms of Service</Text> and{' '}
          <Text style={{color: colors.primary}}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
};

export default LoginScreen;
