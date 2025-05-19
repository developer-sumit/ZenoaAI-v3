import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import {theme} from '@src/theme/Theme';
import {useThemeStore} from '@src/store/themeStore';
import appConfig from '@src/config/app.config';
import {useToast} from '@masumdev/rn-toast';
import SparklesIcon from '@src/assets/icons/SparklesIcon';
import GoogleLogoIcon from '@src/assets/icons/GoogleLogoIcon';
import {openPrivacyPolicy, openTermsOfService} from '@src/utils/linkHelper';

const LoginScreen = () => {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;
  const {showToast} = useToast();
  const [signingIn, setSigningIn] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
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

      // Check if Play Services is available
      await GoogleSignin.hasPlayServices();

      // Get the user ID token
      const {data} = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(
        data?.idToken || '',
      );

      // Sign in with the credential
      await auth().signInWithCredential(googleCredential);

      showToast('Sign-in successful', 'success');
    } catch (error) {
      console.error('Sign-in error:', error);
      showToast('Sign-in failed', 'error');
    } finally {
      setSigningIn(false);
    }
  };

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
            disabled={signingIn}
            style={{
              backgroundColor: colors.surface,
              opacity: signingIn ? 0.7 : 1,
            }}
            className="flex-row items-center justify-center p-4 rounded-2xl mb-4"
            accessible={true}
            accessibilityLabel="Continue with Google"
            accessibilityHint="Sign in using your Google account"
            accessibilityState={{disabled: signingIn}}>
            {signingIn ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <GoogleLogoIcon size={24} color={colors.text} />
                <Text style={{color: colors.text}} className="ml-3 text-lg">
                  Continue with Google
                </Text>
              </>
            )}
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
          <Text
            onPress={openTermsOfService}
            accessible={true}
            accessibilityLabel="View Terms of Service"
            style={{color: colors.primary}}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            onPress={openPrivacyPolicy}
            accessible={true}
            accessibilityLabel="View Privacy Policy"
            style={{color: colors.primary}}>
            Privacy Policy
          </Text>
        </Text>
      </Animated.View>
    </View>
  );
};

export default LoginScreen;
