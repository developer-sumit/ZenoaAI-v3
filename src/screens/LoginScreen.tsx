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
import auth from '@react-native-firebase/auth';

import urls from '@src/constants/urls';
import {useTheme} from '@src/store/themeStore';
import appConfig from '@src/config/app.config';
import {useAuthStore} from '@src/store/authStore';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import {useAnimations} from '@src/hooks/useAnimations';
import LanguageSelector from '@src/components/LanguageSelector';
import EmailRestrictionDialog from '@src/components/EmailRestrictionDialog';
import authService from '@src/services/authService';
import userService from '@src/services/userService';

// Icons
import LanguageIcon from '@src/assets/icons/LanguageIcon';
import SparklesIcon from '@src/assets/icons/SparklesIcon';
import GoogleLogoIcon from '@src/assets/icons/GoogleLogoIcon';

const LoginScreen = () => {
  const t = useStrings();
  const {isDark, theme} = useTheme();
  const {login} = useAuthStore();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();
  const {animatePress} = useAnimations();

  const [signingIn, setSigningIn] = React.useState(false);
  const [emailRestrictionVisible, setEmailRestrictionVisible] =
    React.useState(false);
  const [restrictionData, setRestrictionData] = React.useState<{
    expiresAt?: Date;
    daysRemaining?: number;
    hoursRemaining?: number;
    minutesRemaining?: number;
  }>({});
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const logoScale = React.useRef(new Animated.Value(0.8)).current;
  const languageSelectorRef = React.useRef<{openModal: () => void}>(null);

  React.useEffect(() => {
    // Logo entrance animation
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, logoScale]);

  const handleLanguagePress = () => {
    triggerHaptic('selection');
    languageSelectorRef.current?.openModal();
  };

  const handleTermsPress = () => {
    triggerHaptic('light');
    Linking.openURL(urls.termsOfService);
  };

  const handlePrivacyPress = () => {
    triggerHaptic('light');
    Linking.openURL(urls.privacyPolicy);
  };

  const handleGoogleSignIn = async () => {
    try {
      triggerHaptic('light');
      setSigningIn(true);

      // Button press animation
      animatePress(buttonScale, 150);

      // Check if Play Services is available
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

      // Get the user ID token from Google
      const {data} = await GoogleSignin.signIn();

      if (!data?.idToken) {
        triggerHaptic('error');
        showToast(t('auth.signInFailed'), 'error');
        throw new Error('Failed to get ID token from Google Sign-In');
      }

      // Extract email from the user data to check for restrictions
      const currentUser = auth().currentUser;
      const userEmail = currentUser?.email || data.user?.email; // Check for local email restrictions first
      if (userEmail) {
        const restriction = await userService.checkEmailRestriction(userEmail);
        if (restriction.isRestricted) {
          triggerHaptic('error');

          // Sign out from Firebase and Google to allow user to select different account
          try {
            await auth().signOut();
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
          } catch (signOutError) {
            console.warn(
              'Failed to sign out after local restriction:',
              signOutError,
            );
          }

          setRestrictionData({
            expiresAt: restriction.expiresAt,
            daysRemaining: restriction.daysRemaining,
            hoursRemaining: restriction.hoursRemaining,
            minutesRemaining: restriction.minutesRemaining,
          });
          setEmailRestrictionVisible(true);
          return; // Don't continue with sign-in
        }
      }

      // Log token receipt for debugging
      console.log('Google sign-in successful, proceeding with Firebase auth');

      // Use authService to handle the complete sign-in flow
      const userData = await authService.signInWithGoogle(data?.idToken);

      // Store the user data in your app state
      await login(userData);

      triggerHaptic('success');
      showToast(t('auth.signInSuccessful'), 'success');
    } catch (error: any) {
      console.error('Sign-in error:', error);

      // Check for email restriction error first
      if ((error as any).errorType === 'EMAIL_RESTRICTION') {
        triggerHaptic('error');

        // Sign out from Firebase and Google to allow user to select different account
        try {
          await auth().signOut();
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        } catch (signOutError) {
          console.warn('Failed to sign out after restriction:', signOutError);
        }
        // If we have emailRestrictionExpiresAt from the backend, use it to show the dialog
        if (error.emailRestrictionExpiresAt) {
          const expiresAt = new Date(error.emailRestrictionExpiresAt);
          const now = new Date();
          const timeDiff = expiresAt.getTime() - now.getTime();

          const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hoursRemaining = Math.floor(
            (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutesRemaining = Math.floor(
            (timeDiff % (1000 * 60 * 60)) / (1000 * 60),
          );

          setRestrictionData({
            expiresAt,
            daysRemaining: Math.max(0, daysRemaining),
            hoursRemaining: Math.max(0, hoursRemaining),
            minutesRemaining: Math.max(0, minutesRemaining),
          });
          setEmailRestrictionVisible(true);
        } else {
          // Fallback to just showing the error message
          showToast(
            error.message ||
              'This email cannot be used due to a recent account deletion.',
            'error',
            {duration: 8000}, // Show longer for this important message
          );
        }
        return; // Don't proceed with fallback for email restrictions
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <View style={{backgroundColor: theme.background}} className="flex-1">
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
          onPress={handleLanguagePress}
          className="flex-row rounded-full items-center justify-center"
          accessible={true}
          accessibilityLabel={t('settings.language')}
          accessibilityHint={t('settings.languageHint')}>
          <LanguageIcon size={22} color={theme.primary} />
          <LanguageSelector ref={languageSelectorRef} />
        </TouchableOpacity>
      </View>

      <Animated.View
        className="flex-1 justify-center items-center p-8"
        style={{opacity: fadeAnim, transform: [{translateY: slideAnim}]}}>
        {/* App Logo/Title */}
        <Animated.View
          className="items-center mb-16"
          style={{transform: [{scale: logoScale}]}}>
          <View className="mb-4">
            <SparklesIcon size={64} color={theme.primary} />
          </View>
          <Text
            className="text-4xl font-bold text-center mb-4"
            style={{color: theme.text}}>
            {appConfig.name}
          </Text>
          <Text
            className="text-lg font-bold text-center mt-2"
            style={{color: theme.secondaryText}}>
            {t('auth.createAmazingImages')}
          </Text>
        </Animated.View>

        {/* Sign In Options */}
        <View className="w-full max-w-[370px]">
          {/* Google Sign-In Button */}
          <Animated.View style={{transform: [{scale: buttonScale}]}}>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={signingIn}
              style={{backgroundColor: theme.surface}}
              className={`flex-row items-center justify-center p-4 rounded-2xl mb-4 shadow-xl ${
                signingIn ? 'opacity-70' : 'opacity-100'
              }`}
              accessible={true}
              accessibilityLabel={t('auth.continueWithGoogle')}
              accessibilityHint={t('auth.continueWithGoogleHint')}
              accessibilityState={{disabled: signingIn}}>
              {signingIn ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <GoogleLogoIcon size={24} color={theme.text} />
                  <Text style={{color: theme.text}} className="ml-3 text-lg">
                    {t('auth.continueWithGoogle')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Switch Account Note */}
          <Text
            style={{color: theme.secondaryText}}
            className="text-center text-sm mt-4">
            {t('auth.switchAccount')}
          </Text>
        </View>

        {/* Privacy Notice */}
        <Text
          className="text-center text-base px-8 mt-8"
          style={{color: theme.secondaryText}}>
          {t('auth.agreeToTerms')}&nbsp;
          <Text
            onPress={handleTermsPress}
            accessible={true}
            accessibilityLabel={t('settings.termsOfServiceHint')}
            style={{color: theme.primary}}>
            {t('settings.termsOfService')}
          </Text>
          &nbsp;{t('common.and')}&nbsp;
          <Text
            onPress={handlePrivacyPress}
            accessible={true}
            accessibilityLabel={t('settings.privacyPolicyHint')}
            style={{color: theme.primary}}>
            {t('settings.privacyPolicy')}
          </Text>
        </Text>
      </Animated.View>

      {/* Email Restriction Dialog */}
      <EmailRestrictionDialog
        visible={emailRestrictionVisible}
        onClose={() => setEmailRestrictionVisible(false)}
        expiresAt={restrictionData.expiresAt}
        daysRemaining={restrictionData.daysRemaining}
        hoursRemaining={restrictionData.hoursRemaining}
        minutesRemaining={restrictionData.minutesRemaining}
      />
    </View>
  );
};

export default LoginScreen;
