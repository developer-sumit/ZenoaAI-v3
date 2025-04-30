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
import {BlurView} from '@react-native-community/blur';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {tokenService} from '@src/services/tokenService';
import SparklesIcon from '@src/assets/icons/SparklesIcon';
import GoogleLogoIcon from '@src/assets/icons/GoogleLogoIcon';
import {useToast} from '@masumdev/rn-toast';

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  typeof Routes.SIGN_IN
>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {isLoading, login} = useAuthStore();
  const {isDark} = useThemeStore();
  const {showToast} = useToast();
  const colors = isDark ? theme.dark : theme.light;
  const [signingIn, setSigningIn] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
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
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);

      // Sign out from any previous Google sessions
      await GoogleSignin.signOut();

      // Check for Play Services
      await GoogleSignin.hasPlayServices();

      const result = await googleAuth.signIn();
      if (!result?.success) {
        showToast('Sign-in failed', 'error');
        return;
      }

      const {user: googleUser, firebaseUser} = result.data || {};
      const userData = {
        id: firebaseUser?.uid || '',
        email: googleUser?.email || '',
        name: googleUser?.name || '',
        photo: googleUser?.photo || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await login(userData);
      tokenService.init();
      navigation.replace(Routes.MAIN as never);
    } catch (error) {
      console.error('Sign-in error:', error);
      showToast('Sign-in failed', 'error');
    } finally {
      setSigningIn(false);
    }
  };

  if (isLoading || signingIn) {
    return (
      <View className="flex-1" style={{backgroundColor: colors.background}}>
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
          <SparklesIcon
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
            <GoogleLogoIcon size={24} color={colors.text} />
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
