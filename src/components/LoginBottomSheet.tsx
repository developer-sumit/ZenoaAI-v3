import clsx from 'clsx';
import {create} from 'zustand';
import React, {useRef, useEffect, useMemo} from 'react';
import auth from '@react-native-firebase/auth';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  Animated,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

import urls from '@src/constants/urls';
import {useTheme} from '@src/store/themeStore';
import appConfig from '@src/config/app.config';
import useToast from '@src/hooks/useToast';
import {useAuthStore} from '@src/store/authStore';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import {useAnimations} from '@src/hooks/useAnimations';
import authService from '@src/services/authService';
import userService from '@src/services/userService';
import GoogleLogoIcon from '@src/assets/icons/GoogleLogoIcon';
import EmailRestrictionDialog from './EmailRestrictionDialog';

interface LoginModalState {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

export const useLoginModalStore = create<LoginModalState>(set => ({
  visible: false,
  show: () => set({visible: true}),
  hide: () => set({visible: false}),
}));

const LoginBottomSheet: React.FC = () => {
  const sheetRef = useRef<BottomSheet>(null);
  const t = useStrings();
  const {isDark, theme} = useTheme();
  const {login} = useAuthStore();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();
  const {animatePress} = useAnimations();

  const {visible, hide} = useLoginModalStore();

  const [signingIn, setSigningIn] = React.useState(false);
  const [emailRestrictionVisible, setEmailRestrictionVisible] =
    React.useState(false);
  const [restrictionData, setRestrictionData] = React.useState<{
    expiresAt?: Date;
    daysRemaining?: number;
    hoursRemaining?: number;
    minutesRemaining?: number;
  }>({});
  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current; // Animated value for overlay opacity

  const snapPoints = useMemo(() => ['25%', '50%'], []);

  useEffect(() => {
    console.log('LoginBottomSheet visibility changed:', visible);
    if (visible) {
      sheetRef.current?.expand();
      // Animate overlay in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      sheetRef.current?.close();
      // Animate overlay out
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, overlayOpacity]);

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

      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const {data} = await GoogleSignin.signIn();

      if (!data?.idToken) {
        triggerHaptic('error');
        showToast(t('auth.signInFailed'), 'error');
        throw new Error('Failed to get ID token from Google Sign-In');
      }

      const currentUser = auth().currentUser;
      const userEmail = currentUser?.email || data.user?.email;

      // Check local email restrictions BEFORE proceeding with server auth
      if (userEmail) {
        const restriction = await userService.checkEmailRestriction(userEmail);
        if (restriction.isRestricted) {
          triggerHaptic('error');

          // Perform complete logout immediately
          await performCompleteLogoutOnRestriction();

          setRestrictionData({
            expiresAt: restriction.expiresAt,
            daysRemaining: restriction.daysRemaining,
            hoursRemaining: restriction.hoursRemaining,
            minutesRemaining: restriction.minutesRemaining,
          });
          setEmailRestrictionVisible(true);
          return;
        }
      }

      console.log('Google sign-in successful, proceeding with Firebase auth');
      const userData = await authService.signInWithGoogle(data?.idToken);
      await login(userData);
      hide(); // Automatically hide the bottom sheet on successful login
      triggerHaptic('success');
      showToast(t('auth.signInSuccessful'), 'success');
    } catch (error: any) {
      console.error('Sign-in error:', error);
      if (error.errorType === 'EMAIL_RESTRICTION') {
        triggerHaptic('error');

        // Perform complete logout on server restriction
        await performCompleteLogoutOnRestriction();

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
          showToast(
            error.message ||
              'This email cannot be used due to a recent account deletion.',
            'error',
          );
        }
        return;
      }

      // For any other error, also ensure complete logout
      await performCompleteLogoutOnRestriction();
      showToast(t('auth.signInFailed'), 'error');
    } finally {
      setSigningIn(false);
    }
  };

  /**
   * Performs complete logout when email restriction is detected
   * This ensures no traces of the restricted user remain in the app
   */
  const performCompleteLogoutOnRestriction = async () => {
    try {
      console.log('Performing complete logout due to email restriction');

      // 1. Sign out from Firebase Auth
      const currentUser = auth().currentUser;
      if (currentUser) {
        await auth().signOut();
      }

      // 2. Sign out from Google
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch (googleSignOutError) {
        console.warn(
          'Google sign out failed during restriction cleanup:',
          googleSignOutError,
        );
      }

      // 3. Clear auth store completely
      const {logout} = useAuthStore.getState();
      await logout();

      // 4. Clear any cached data
      try {
        await clearAllCaches();
      } catch (cacheError) {
        console.warn(
          'Failed to clear caches during restriction cleanup:',
          cacheError,
        );
      }

      console.log('Complete logout successful due to email restriction');
    } catch (error) {
      console.error('Error during restriction logout:', error);
      // Even if logout fails, ensure auth state is cleared
      try {
        const {logout} = useAuthStore.getState();
        await logout();
      } catch (fallbackError) {
        console.error('Fallback logout also failed:', fallbackError);
      }
    }
  };

  const clearAllCaches = async () => {
    try {
      // Clear FastImage cache
      const {FastImage} = require('react-native-fast-image');
      await FastImage.clearMemoryCache();
      await FastImage.clearDiskCache();

      // Clear image store
      const {useImageStore} = require('@src/store/imageStore');
      useImageStore.getState().clearImages();

      console.log('All caches cleared during restriction cleanup');
    } catch (error) {
      console.warn('Error clearing caches during restriction cleanup:', error);
    }
  };

  return (
    <>
      {/* Blurry Overlay */}
      {visible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {opacity: overlayOpacity, backgroundColor: 'rgba(0,0,0,0.5)'},
          ]}
          pointerEvents={visible ? 'auto' : 'none'}>
          <TouchableWithoutFeedback onPress={hide}>
            <BlurView
              style={StyleSheet.absoluteFillObject}
              blurType={isDark ? 'dark' : 'light'}
              blurAmount={10}
              reducedTransparencyFallbackColor={isDark ? 'black' : 'white'}
            />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}

      <BottomSheet
        ref={sheetRef}
        index={visible ? 0 : -1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={hide}
        backgroundStyle={{
          backgroundColor: theme.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderColor: theme.text + '40',
          borderWidth: 2,
        }}
        style={{elevation: 10}}
        handleIndicatorStyle={{backgroundColor: theme.surface}}>
        <BottomSheetView className="flex-1">
          <View className="items-center" style={{padding: 24}}>
            <View
              className="w-28 h-28 rounded-[28px] mb-8 items-center justify-center shadow-lg"
              style={{backgroundColor: isDark ? '#121212' : 'white'}}>
              <Image
                source={isDark ? appConfig.darkFavicon : appConfig.lightFavicon}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>

            {/* App Name */}
            <Text
              className="text-2xl font-bold text-center mb-2"
              style={{color: theme.text}}>
              {appConfig.name}
            </Text>
            <Text
              className="text-lg text-center mb-6"
              style={{color: theme.secondaryText}}>
              {t('auth.createAmazingImages')}
            </Text>

            {/* Google Auth Button */}
            <Animated.View style={{transform: [{scale: buttonScale}]}}>
              <TouchableOpacity
                className={clsx(
                  'flex-row items-center justify-center p-4 rounded-2xl mb-4 shadow-xl',
                  signingIn ? 'opacity-70' : 'opacity-100',
                )}
                style={{
                  backgroundColor: theme.surface,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  marginBottom: 16,
                  shadowColor: theme.secondaryText,
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={handleGoogleSignIn}
                accessible={true}
                accessibilityLabel={t('auth.continueWithGoogle')}>
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
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Email Restriction Dialog */}
      <EmailRestrictionDialog
        visible={emailRestrictionVisible}
        onClose={() => setEmailRestrictionVisible(false)}
        expiresAt={restrictionData.expiresAt}
        daysRemaining={restrictionData.daysRemaining}
        hoursRemaining={restrictionData.hoursRemaining}
        minutesRemaining={restrictionData.minutesRemaining}
      />
    </>
  );
};

export default LoginBottomSheet;
