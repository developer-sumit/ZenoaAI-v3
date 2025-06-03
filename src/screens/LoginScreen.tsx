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
import LanguageIcon from '@src/assets/icons/LanguageIcon';
import {openPrivacyPolicy, openTermsOfService} from '@src/utils/linkHelper';
import {useAuthStore} from '@src/store/authStore';
import {useStrings} from '@src/hooks/useStrings';
import LanguageSelector from '@src/components/LanguageSelector';

const LoginScreen = () => {
  const strings = useStrings();
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;
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
      await GoogleSignin.hasPlayServices();

      // Get the user ID token
      const {data} = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(
        data?.idToken || '',
      );
      // Sign in with the credential
      const res = await auth().signInWithCredential(googleCredential);
      const userData = {
        id: res.user.uid || '',
        email: res.user.email || '',
        name: data?.user?.name || '',
        photo: data?.user?.photo || '',
        createdAt: res.user.metadata.creationTime || new Date().toISOString(),
        lastLogin: res.user.metadata.lastSignInTime || new Date().toISOString(),
      };
      console.log({userData});
      await login(userData);
      showToast(strings.auth.signInSuccessful, 'success');
    } catch (error) {
      console.error('Sign-in error:', error);
      showToast(strings.auth.signInFailed, 'error');
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

      {/* Language Selector Button */}
      <View className="absolute self-center mt-6 z-10 rounded-full px-1.5 pl-3 bg-gray-100">
        <TouchableOpacity
          onPress={() => languageSelectorRef.current?.openModal()}
          className="flex-row rounded-full items-center justify-center"
          accessible={true}
          accessibilityLabel={strings.settings.language}
          accessibilityHint={strings.settings.languageHint}>
          <LanguageIcon size={22} color={colors.primary} />
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
              backgroundColor: colors.surface,
              opacity: signingIn ? 0.7 : 1,
            }}
            className="flex-row items-center justify-center p-4 rounded-2xl mb-4 shadow-xl"
            accessible={true}
            accessibilityLabel={strings.auth.continueWithGoogle}
            accessibilityHint={strings.auth.continueWithGoogleHint}
            accessibilityState={{disabled: signingIn}}>
            {signingIn ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <GoogleLogoIcon size={24} color={colors.text} />
                <Text style={{color: colors.text}} className="ml-3 text-lg">
                  {strings.auth.continueWithGoogle}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Switch Account Note */}
          <Text
            style={{color: colors.secondaryText}}
            className="text-center text-sm mt-4">
            {strings.auth.switchAccount}
          </Text>
        </View>

        {/* Privacy Notice */}
        <Text
          className="text-center text-base px-8 mt-8"
          style={{color: colors.secondaryText}}>
          {strings.auth.agreeToTerms}{' '}
          <Text
            onPress={openTermsOfService}
            accessible={true}
            accessibilityLabel={strings.settings.termsOfServiceHint}
            style={{color: colors.primary}}>
            {strings.settings.termsOfService}
          </Text>{' '}
          {strings.common.and}{' '}
          <Text
            onPress={openPrivacyPolicy}
            accessible={true}
            accessibilityLabel={strings.settings.privacyPolicyHint}
            style={{color: colors.primary}}>
            {strings.settings.privacyPolicy}
          </Text>
        </Text>
      </Animated.View>
    </View>
  );
};

export default LoginScreen;
