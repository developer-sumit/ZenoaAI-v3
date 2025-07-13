import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Platform,
  UIManager,
  TextInput,
  Animated,
  Modal,
  LayoutAnimation,
  Linking,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import {Toaster, useToast} from '@masumdev/rn-toast';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';

import {useAuthStore} from '@src/store/authStore';
import userService from '@src/services/userService';
import appConfig from '@src/config/app.config';
import {useTheme} from '@src/store/themeStore';
import {BlurView} from '@react-native-community/blur';
import Routes from '@src/constants/routes';
import feedbackService from '@src/services/feedbackService';
import LanguageSelector from '@src/components/LanguageSelector';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import urls from '@src/constants/urls';
import {notificationService} from '@src/services/notificationService';
import {notificationAPI} from '@src/services/notificationAPI';

// Icons
import PersonIcon from '@src/assets/icons/PersonIcon';
import ChevronRightIcon from '@src/assets/icons/ChevronRightIcon';
import DarkModeIcon from '@src/assets/icons/DarkModeIcon';
import LightModeIcon from '@src/assets/icons/LightModeIcon';
import FeedbackIcon from '@src/assets/icons/FeedbackIcon';
import StarIcon from '@src/assets/icons/StarIcon';
import SendIcon from '@src/assets/icons/SendIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import ShieldIcon from '@src/assets/icons/ShieldIcon';
import ExitToAppIcon from '@src/assets/icons/ExitToAppIcon';
import InfoOutlineIcon from '@src/assets/icons/InfoOutlineIcon';
import LanguageIcon from '@src/assets/icons/LanguageIcon';
import NotificationIcon from '@src/assets/icons/NotificationIcon';
import RefreshIcon from '@src/assets/icons/RefreshIcon';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SettingsScreen = () => {
  const strings = useStrings();
  const navigation = useNavigation();
  const {user, updateUser, logout} = useAuthStore();
  const {isDark, theme, toggleTheme} = useTheme();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();
  const scrollY = useRef(new Animated.Value(0)).current;
  const languageSelectorRef = useRef<{openModal: () => void}>(null);

  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [isLocalImage, setIsLocalImage] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(false);

  // Check notification status on mount
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        const enabled = await notificationService.areNotificationsEnabled();
        setNotificationsEnabled(enabled);
      } catch (error) {
        console.error('Error checking notification status:', error);
      }
    };

    checkNotificationStatus();
  }, []);

  const fetchQuota = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setQuotaLoading(true);

      const {success, data, message} = await userService.checkQuota();

      if (success && data) {
        updateUser({...user, quota: data});
      } else {
        showToast(message, 'error');
      }
    } catch (err: any) {
      console.error('Failed to fetch quota:', err);

      updateUser({
        ...user,
        quota: {
          imagesRemaining: 0,
          lastRefreshedAt: new Date(),
          planLimits: {
            totalImages: 0, // Reset to 0 if fetch fails
          },
        },
      });
    } finally {
      setQuotaLoading(false);
    }
  }, [user]);

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationLoading(true);

    try {
      if (value) {
        // User wants to enable notifications
        const granted = await notificationService.requestPermissions();
        if (granted) {
          setNotificationsEnabled(true);
          showToast(strings.settings.notificationsEnabled, 'success');

          // Send token to server
          try {
            await notificationAPI.updateFCMToken();
          } catch (error) {
            console.warn('Failed to update token on server:', error);
          }
        } else {
          setNotificationsEnabled(false);
          showToast(strings.settings.notificationsPermissionDenied, 'error');
        }
      } else {
        // User wants to disable notifications
        setNotificationsEnabled(false);
        showToast(strings.settings.notificationsDisabled, 'info');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showToast(strings.settings.notificationsUpdateFailed, 'error');
    } finally {
      setNotificationLoading(false);
    }
  };

  // Function to refresh user profile data
  const refreshUserProfile = useCallback(async () => {
    if (!user?.uid) {
      showToast(strings.settings.somethingWentWrong, 'error');
      return;
    }

    try {
      console.log('SettingsScreen: Refreshing user profile data');
      const {success, data, message} = await userService.getUser(user.uid);
      if (success && data) {
        // Update auth store with fresh data
        const {updateUser} = useAuthStore.getState();
        updateUser(data);
        console.log('SettingsScreen: User profile refreshed successfully');
      }

      showToast(message, success ? 'success' : 'error');
    } catch (error) {
      showToast(strings.settings.internalServerError, 'error');
      console.error('SettingsScreen: Failed to refresh user profile:', error);
    }
  }, [user?.uid]);

  // Refresh user data when component mounts
  useEffect(() => {
    refreshUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      // Use the new User interface structure
      setProfileName(user.profile.username || 'User');

      if (user.profile.avatar) {
        setProfileAvatar(user.profile.avatar);
        setIsLocalImage(false);
      } else {
        setProfileAvatar('');
        setIsLocalImage(true);
      }
    }
  }, [user]);

  const handleEditProfile = () => {
    navigation.navigate(Routes.EDIT_PROFILE as never);
  };

  const getProfileData = () => {
    return {
      name: profileName,
      email: user?.email || '',
      avatar: profileAvatar,
      isPro: user?.planType === 'pro' || user?.planType === 'enterprise',
      isLocalImage,
    };
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      showToast(strings.settings.selectRating, 'error');
      return;
    }

    if (!feedbackText.trim()) {
      showToast(strings.settings.enterFeedback, 'error');
      return;
    }

    try {
      setSubmittingFeedback(true);

      // Use the updated User interface structure
      await feedbackService.submitFeedback(
        user?.uid || 'anonymous',
        user?.profile.username || 'Anonymous User',
        user?.email || 'Not provided',
        feedbackRating,
        feedbackText,
      );

      // Success handling
      showToast(strings.settings.greetForFeedback, 'success');
      setShowFeedbackModal(false);
      setFeedbackText('');
      setFeedbackRating(0);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast(strings.settings.feedbackFailed, 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleRateApp = () => {
    // Direct redirect to Google Play Store
    triggerHaptic('light');

    Linking.openURL(urls.playstore)
      .then(() => {
        showToast(strings.settings.thankYouForRating, 'success');
      })
      .catch(error => {
        console.error('Error opening Play Store:', error);
        showToast(strings.settings.somethingWentWrong, 'error');
      });
  };

  const currentProfile = getProfileData();

  const renderRatingStars = () => {
    return (
      <View className="flex-row justify-center my-4">
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setFeedbackRating(star);
            }}
            className="mx-2"
            accessible={true}
            accessibilityLabel={`Rate ${star} stars`}
            accessibilityRole="button"
            accessibilityState={{selected: star <= feedbackRating}}>
            <StarIcon
              size={40}
              color={
                star <= feedbackRating ? '#F59E0B' : theme.secondaryText + '80'
              }
              filled={star <= feedbackRating}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Animated.ScrollView
      className="flex-1"
      style={{backgroundColor: theme.background}}
      contentContainerClassName="pb-[90px] pt-10 px-5"
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {
        useNativeDriver: false,
      })}>
      {/* Animated Header */}
      <View className="items-center">
        {currentProfile.avatar ? (
          <FastImage
            source={{uri: currentProfile.avatar}}
            style={{
              width: 150,
              height: 150,
              borderRadius: 90 / 2,
              backgroundColor: theme.primary + '15',
              marginBottom: 15,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: theme.primary + '15',
              marginBottom: 15,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: theme.primary,
                fontSize: 48,
                fontWeight: 'bold',
              }}>
              {currentProfile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text className="text-3xl font-bold" style={{color: theme.text}}>
          {currentProfile.name}
        </Text>
        <Text
          className="text-white opacity-80 text-sm mt-1"
          style={{color: theme.text}}>
          {currentProfile.email}
        </Text>
      </View>

      <View className="mt-10">
        {/* Quota Information Section */}
        {user && (
          <View
            className="rounded-3xl mb-6 overflow-hidden shadow-lg mx-0"
            style={{backgroundColor: theme.surface}}>
            <View
              className="px-5 py-4 border-b flex-row justify-between items-center"
              style={{borderColor: theme.secondaryText + '20'}}>
              <Text
                className="text-lg font-semibold"
                style={{color: theme.secondaryText}}>
                {strings.settings.quotaTitle}
              </Text>
              <TouchableOpacity
                onPress={fetchQuota}
                disabled={quotaLoading}
                className="p-2 rounded-full"
                style={{
                  backgroundColor: theme.background,
                  opacity: quotaLoading ? 0.5 : 1,
                }}
                accessible={true}
                accessibilityLabel="Refresh quota information"
                accessibilityRole="button">
                <RefreshIcon
                  size={20}
                  color={theme.primary}
                  style={{
                    transform: [{rotate: quotaLoading ? '45deg' : '0deg'}],
                  }}
                />
              </TouchableOpacity>
            </View>
            <View className="px-5 py-4">
              {/* Images Remaining */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    style={{color: theme.text}}
                    className="text-base font-medium">
                    {strings.settings.imagesRemaining}
                  </Text>
                  <Text
                    style={{color: theme.primary}}
                    className="text-base font-bold">
                    {user.quota && !quotaLoading
                      ? `${user.quota.imagesRemaining}${
                          user.quota.planLimits.totalImages
                            ? ` / ${user.quota.planLimits.totalImages}`
                            : ''
                        }`
                      : '0'}
                  </Text>
                </View>
                <View
                  className="h-2 rounded-full"
                  style={{backgroundColor: theme.background}}>
                  <View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        user.quota && user.quota.imagesRemaining > 5
                          ? theme.primary
                          : user.quota && user.quota.imagesRemaining > 0
                            ? '#f59e0b'
                            : '#ef4444',
                      width: `${
                        user.quota && user.quota.planLimits?.totalImages
                          ? Math.min(
                              (user.quota.imagesRemaining /
                                user.quota.planLimits.totalImages) *
                                100,
                              100,
                            )
                          : user.quota?.imagesRemaining
                            ? 100 // Show full bar if no limit is specified
                            : 0
                      }%`,
                    }}
                  />
                </View>
              </View>
              {/* Plan Type */}
              <View className="flex-row justify-between items-center">
                <Text
                  style={{color: theme.text}}
                  className="text-base font-medium">
                  {strings.settings.planType}
                </Text>
                <View
                  className="py-1 px-3 rounded-full"
                  style={{
                    backgroundColor:
                      user.planType === 'free'
                        ? theme.background
                        : theme.primary + '15',
                  }}>
                  <Text
                    className="text-sm font-medium capitalize"
                    style={{
                      color:
                        user.planType === 'free'
                          ? theme.secondaryText
                          : theme.primary,
                    }}>
                    {user.planType}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Account Settings Card */}
        <View
          className="rounded-3xl mb-6 overflow-hidden shadow-lg"
          style={{backgroundColor: theme.surface}}>
          <View
            className="px-5 py-4 border-b"
            style={{borderColor: theme.secondaryText + '20'}}>
            <Text
              className="text-lg font-semibold"
              style={{color: theme.secondaryText}}>
              {strings.settings.account}
            </Text>
          </View>
          {/* Edit Profile Option */}
          <TouchableOpacity
            className="px-5 py-4 border-b flex-row justify-between items-center"
            style={{borderColor: theme.secondaryText + '20'}}
            onPress={handleEditProfile}
            accessible={true}
            accessibilityLabel={strings.settings.editProfile}
            accessibilityHint={strings.settings.editProfileHint}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <PersonIcon size={20} color={theme.primary} />
              </View>
              <Text style={{color: theme.text}} className="text-base">
                {strings.settings.editProfile}
              </Text>
            </View>
            <ChevronRightIcon size={20} color={theme.secondaryText} />
          </TouchableOpacity>
          {/* Language Settings */}
          <TouchableOpacity
            className="px-5 py-4 border-b flex-row justify-between items-center"
            accessible={true}
            accessibilityLabel={strings.settings.changeLanguage}
            accessibilityHint={strings.settings.changeLanguageHint}
            style={{borderColor: theme.secondaryText + '20'}}
            onPress={() => {
              triggerHaptic('light');
              languageSelectorRef.current?.openModal();
            }}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <LanguageIcon size={20} color={theme.primary} />
              </View>
              <Text style={{color: theme.text}} className="text-base">
                {strings.settings.language}
              </Text>
            </View>
            <LanguageSelector ref={languageSelectorRef} />
          </TouchableOpacity>

          {/* Notification Settings Toggle */}
          <View
            className="px-5 py-4 border-b flex-row justify-between items-center"
            style={{borderColor: theme.secondaryText + '20'}}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <NotificationIcon size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={{color: theme.text}} className="text-base">
                  {strings.settings.notifications}
                </Text>
                <Text style={{color: theme.secondaryText}} className="text-xs">
                  {strings.settings.notificationsDesc}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="w-14 h-8 rounded-full p-1.5"
              style={{
                backgroundColor: notificationsEnabled
                  ? theme.primary
                  : '#cbd5e1',
                opacity: notificationLoading ? 0.5 : 1,
              }}
              onPress={() => handleToggleNotifications(!notificationsEnabled)}
              disabled={notificationLoading}
              accessible={true}
              accessibilityLabel={
                notificationsEnabled
                  ? strings.settings.notificationsDisabled
                  : strings.settings.notificationsEnabled
              }
              accessibilityRole="switch"
              accessibilityState={{checked: notificationsEnabled}}>
              <View
                className={`w-5 h-5 rounded-full bg-white ${
                  notificationsEnabled ? 'ml-6' : 'ml-0'
                }`}
              />
            </TouchableOpacity>
          </View>

          {/* Dark Mode Option */}
          <View className="px-5 py-4 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                {isDark ? (
                  <DarkModeIcon size={20} color={theme.primary} />
                ) : (
                  <LightModeIcon size={20} color={theme.primary} />
                )}
              </View>
              <Text style={{color: theme.text}} className="text-base">
                {strings.settings.darkMode}
              </Text>
            </View>
            <TouchableOpacity
              className="w-14 h-8 rounded-full p-1.5"
              style={{backgroundColor: isDark ? theme.primary : '#cbd5e1'}}
              onPress={() => {
                // Haptic feedback for theme toggle
                triggerHaptic('light');
                toggleTheme();
              }}
              accessible={true}
              accessibilityLabel={
                isDark
                  ? strings.settings.switchLightMode
                  : strings.settings.switchDarkMode
              }
              accessibilityHint={
                isDark
                  ? strings.settings.switchLightModeHint
                  : strings.settings.switchDarkModeHint
              }
              accessibilityRole="switch"
              accessibilityState={{checked: isDark}}>
              <View
                className={`w-5 h-5 rounded-full bg-white ${
                  isDark ? 'ml-6' : 'ml-0'
                }`}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Feedback Section */}
        <View
          className="rounded-3xl mb-6 overflow-hidden shadow-lg"
          style={{backgroundColor: theme.surface}}>
          <View
            className="px-5 py-4 border-b"
            style={{borderColor: theme.secondaryText + '20'}}>
            <Text
              className="text-lg font-semibold"
              style={{color: theme.secondaryText}}>
              {strings.settings.helpImprove}
            </Text>
          </View>

          <TouchableOpacity
            className="px-5 py-4 flex-row justify-between items-center border-b"
            style={{borderColor: theme.secondaryText + '20'}}
            onPress={() => {
              triggerHaptic('light');
              setShowFeedbackModal(true);
            }}
            accessible={true}
            accessibilityLabel={strings.settings.shareFeedback}
            accessibilityHint={strings.settings.shareFeedbackHint}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <FeedbackIcon size={20} color={theme.primary} />
              </View>
              <Text className="text-base" style={{color: theme.text}}>
                {strings.settings.shareFeedback}
              </Text>
            </View>
            <ChevronRightIcon size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            className="px-5 py-4 flex-row justify-between items-center"
            onPress={() => {
              triggerHaptic('light');
              handleRateApp();
            }}
            accessible={true}
            accessibilityLabel={strings.settings.rateApp}
            accessibilityHint={strings.settings.rateAppHint}>
            <View className="flex-row items-center flex-1">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <StarIcon size={20} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base" style={{color: theme.text}}>
                  {strings.settings.rateApp}
                </Text>
                <Text
                  className="text-sm mt-1"
                  style={{color: theme.secondaryText}}>
                  {strings.settings.rateAppDesc}
                </Text>
              </View>
            </View>
            <ChevronRightIcon size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>
        {/* About Section */}
        <View
          className="rounded-3xl mb-6 overflow-hidden shadow-lg"
          style={{backgroundColor: theme.surface}}>
          <View
            className="px-5 py-4 border-b"
            style={{borderColor: theme.secondaryText + '20'}}>
            <Text
              className="text-lg font-semibold"
              style={{color: theme.secondaryText}}>
              {strings.settings.about}
            </Text>
          </View>

          <View
            className="px-5 py-4 border-b"
            style={{borderColor: theme.secondaryText + '20'}}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <InfoOutlineIcon size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={{color: theme.text}} className="text-base">
                  {appConfig.name} v{appConfig.version}
                </Text>
                <Text
                  style={{color: theme.secondaryText}}
                  className="text-sm mt-1">
                  {appConfig.author.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Privacy & Terms */}
          <TouchableOpacity
            className="px-5 py-4 border-b flex-row justify-between items-center"
            style={{borderColor: theme.secondaryText + '20'}}
            onPress={() => {
              triggerHaptic('light');
              Linking.openURL(urls.privacyPolicy);
            }}
            accessible={true}
            accessibilityLabel={strings.settings.privacyPolicy}
            accessibilityHint={strings.settings.privacyPolicyHint}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <ShieldIcon size={20} color={theme.primary} />
              </View>
              <Text className="text-base" style={{color: theme.text}}>
                {strings.settings.privacyPolicy}
              </Text>
            </View>
            <ChevronRightIcon size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            className="px-5 py-4 flex-row justify-between items-center"
            onPress={() => Linking.openURL(urls.termsOfService)}
            accessible={true}
            accessibilityLabel={strings.settings.termsOfService}
            accessibilityHint={strings.settings.termsOfServiceHint}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <ShieldIcon size={20} color={theme.primary} />
              </View>
              <Text className="text-base" style={{color: theme.text}}>
                {strings.settings.termsOfService}
              </Text>
            </View>
            <ChevronRightIcon size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          className="rounded-2xl py-4 mb-4 items-center flex-row justify-center shadow-lg"
          style={{backgroundColor: theme.surface}}
          onPress={() => {
            triggerHaptic('heavy'); // Strong haptic for logout action
            logout();
          }}
          accessible={true}
          accessibilityLabel={strings.auth.signOut}
          accessibilityHint={strings.auth.signOutHint}>
          <ExitToAppIcon size={20} color="#e11d48" style={{marginRight: 8}} />
          <Text style={{color: '#e11d48'}} className="font-medium text-base">
            {strings.auth.signOut}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFeedbackModal(false)}
        statusBarTranslucent>
        <BlurView
          style={{flex: 1}}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={10}>
          <KeyboardAwareScrollView
            style={{flex: 1}}
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View className="flex-1 justify-center items-center">
              <View
                className="w-full max-w-md rounded-3xl overflow-hidden"
                style={{
                  backgroundColor: theme.background,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 10},
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  elevation: 15,
                }}>
                <View
                  className="w-full h-1"
                  style={{backgroundColor: theme.primary}}
                />

                <View className="p-6">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text
                      className="text-2xl font-semibold"
                      style={{color: theme.text}}>
                      {strings.settings.shareFeedback}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowFeedbackModal(false)}
                      className="p-1 rounded-full"
                      style={{backgroundColor: theme.surface}}
                      accessible={true}
                      accessibilityLabel={strings.settings.closeFeedback}
                      accessibilityRole="button">
                      <CloseIcon size={20} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  <Text
                    className="text-base mb-2"
                    style={{color: theme.secondaryText}}>
                    {strings.settings.rateExperience}
                  </Text>

                  {renderRatingStars()}

                  <Text
                    className="text-base mb-2 mt-4"
                    style={{color: theme.secondaryText}}>
                    {strings.settings.whatToImprove}
                  </Text>

                  <TextInput
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    multiline
                    numberOfLines={5}
                    className="p-4 rounded-xl mb-6 text-base"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text,
                      height: 130,
                      textAlignVertical: 'top',
                    }}
                    placeholder={strings.settings.feedbackPlaceholder}
                    placeholderTextColor={theme.secondaryText}
                    accessible={true}
                    accessibilityLabel={strings.settings.feedbackPlaceholder}
                    accessibilityHint={strings.settings.feedbackHint}
                  />

                  <TouchableOpacity
                    className="py-4 rounded-xl flex-row items-center justify-center"
                    style={{backgroundColor: theme.primary}}
                    onPress={handleSubmitFeedback}
                    disabled={submittingFeedback}
                    accessible={true}
                    accessibilityLabel={strings.settings.submitFeedback}
                    accessibilityState={{disabled: submittingFeedback}}
                    accessibilityHint={strings.settings.submitFeedbackHint}>
                    {submittingFeedback ? (
                      <Text className="text-white font-medium text-base">
                        {strings.settings.submitting}
                      </Text>
                    ) : (
                      <>
                        <Text className="text-white font-medium text-base mr-2">
                          {strings.settings.submitFeedback}
                        </Text>
                        <SendIcon size={18} color="white" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </BlurView>

        <Toaster
          customColors={{
            success: {background: '#E7F5E9', text: '#256029'},
            error: {background: '#FDECEA', text: '#B3261E'},
            info: {background: '#E3F2FD', text: '#1E88E5'},
          }}
        />
      </Modal>
    </Animated.ScrollView>
  );
};

export default SettingsScreen;
