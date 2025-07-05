import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Linking,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {useToast} from '@masumdev/rn-toast';

import urls from '@src/constants/urls';
import {useTheme} from '@src/store/themeStore';
import appConfig from '@src/config/app.config';
import {useAuthStore} from '@src/store/authStore';
import {useStrings} from '@src/hooks/useStrings';
import LanguageSelector from '@src/components/LanguageSelector';
import authService from '@src/services/authService';

// Icons
import LanguageIcon from '@src/assets/icons/LanguageIcon';
import SparklesIcon from '@src/assets/icons/SparklesIcon';
import GoogleLogoIcon from '@src/assets/icons/GoogleLogoIcon';

const LoginScreen = () => {
  const strings = useStrings();
  const {isDark, theme} = useTheme();
  const {login} = useAuthStore();
  const {showToast} = useToast();
  const [signingIn, setSigningIn] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const languageSelectorRef = React.useRef<{openModal: () => void}>(null);

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
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

      // Get the user ID token from Google
      const {data} = await GoogleSignin.signIn();

      if (!data?.idToken) {
        showToast(strings.auth.signInFailed, 'error');
        throw new Error('Failed to get ID token from Google Sign-In');
      }

      // Log token receipt for debugging
      console.log('Google sign-in successful, proceeding with Firebase auth');

      // Use authService to handle the complete sign-in flow
      const userData = await authService.signInWithGoogle(data?.idToken);

      // Store the user data in your app state
      await login(userData);

      showToast(strings.auth.signInSuccessful, 'success');
    } catch (error: any) {
      console.error('Sign-in error:', error);

      // Check for email restriction error first
      if ((error as any).errorType === 'EMAIL_RESTRICTION') {
        showToast(
          error.message ||
            'This email cannot be used due to a recent account deletion.',
          'error',
          {duration: 8000}, // Show longer for this important message
        );
        return; // Don't try fallback for email restrictions
      }

      // Check if this is a network error, which could be causing the 401
      if (
        error.message?.includes('Network Error') ||
        error.message?.includes('network request failed')
      ) {
        showToast(
          'Network connection issue. Please check your internet connection.',
          'error',
        );
      } else {
        showToast(strings.auth.signInFailed, 'error');
      }

      // If we're already authenticated with Firebase but server failed
      const fallbackUser = await authService.handleFailedGoogleSignIn();
      if (fallbackUser) {
        console.log('Using fallback authentication method');
        await login(fallbackUser);
        showToast('Signed in with limited functionality', 'info');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <View style={{backgroundColor: theme.background}} className="flex-1">
      {/* Rest of your component remains unchanged */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={20}
      />

      {/* Language Selector Button */}
      <View
        className="absolute self-center mt-6 z-10 rounded-full px-1.5 pl-3"
        style={{backgroundColor: theme.surface}}>
        <TouchableOpacity
          onPress={() => languageSelectorRef.current?.openModal()}
          className="flex-row rounded-full items-center justify-center"
          accessible={true}
          accessibilityLabel={strings.settings.language}
          accessibilityHint={strings.settings.languageHint}>
          <LanguageIcon size={22} color={theme.primary} />
          <LanguageSelector ref={languageSelectorRef} />
        </TouchableOpacity>
      </View>

      <Animated.View
        className="flex-1 justify-center items-center p-8"
        style={{opacity: fadeAnim, transform: [{translateY: slideAnim}]}}>
        {/* App Logo/Title */}
        <View className="items-center mb-16">
          <SparklesIcon
            size={64}
            color={theme.primary}
            style={{marginBottom: 16}}
          />
          <Text
            className="text-4xl font-bold text-center mb-4"
            style={{color: theme.text}}>
            {appConfig.name}
          </Text>
          <Text
            className="text-lg font-bold text-center mt-2"
            style={{color: theme.secondaryText}}>
            {strings.auth.createAmazingImages}
          </Text>
        </View>

        {/* Sign In Options */}
        <View className="w-full max-w-[370px]">
          {/* Google Sign-In Button */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={signingIn}
            style={{
              backgroundColor: theme.surface,
              opacity: signingIn ? 0.7 : 1,
            }}
            className="flex-row items-center justify-center p-4 rounded-2xl mb-4 shadow-xl"
            accessible={true}
            accessibilityLabel={strings.auth.continueWithGoogle}
            accessibilityHint={strings.auth.continueWithGoogleHint}
            accessibilityState={{disabled: signingIn}}>
            {signingIn ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <GoogleLogoIcon size={24} color={theme.text} />
                <Text style={{color: theme.text}} className="ml-3 text-lg">
                  {strings.auth.continueWithGoogle}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Switch Account Note */}
          <Text
            style={{color: theme.secondaryText}}
            className="text-center text-sm mt-4">
            {strings.auth.switchAccount}
          </Text>
        </View>

        {/* Privacy Notice */}
        <Text
          className="text-center text-base px-8 mt-8"
          style={{color: theme.secondaryText}}>
          {strings.auth.agreeToTerms}&nbsp;
          <Text
            onPress={() => Linking.openURL(urls.termsOfService)}
            accessible={true}
            accessibilityLabel={strings.settings.termsOfServiceHint}
            style={{color: theme.primary}}>
            {strings.settings.termsOfService}
          </Text>
          &nbsp;{strings.common.and}&nbsp;
          <Text
            onPress={() => Linking.openURL(urls.privacyPolicy)}
            accessible={true}
            accessibilityLabel={strings.settings.privacyPolicyHint}
            style={{color: theme.primary}}>
            {strings.settings.privacyPolicy}
          </Text>
        </Text>
      </Animated.View>
    </View>
  );
};

export default LoginScreen;
