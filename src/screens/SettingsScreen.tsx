import React, {useState, useEffect, useRef} from 'react';
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
import Toast from 'react-native-toast-message';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import {BlurView} from '@react-native-community/blur';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';

import {useAuthStore} from '@src/store/authStore';
import appConfig from '@src/config/app.config';
import {useTheme} from '@src/store/themeStore';
import Routes from '@src/constants/routes';
import feedbackService from '@src/services/feedbackService';
import LanguageSelector from '@src/components/LanguageSelector';
import useToast from '@src/hooks/useToast';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import urls from '@src/constants/urls';
import {useLoginModalStore} from '@src/components/LoginBottomSheet';
import {toastConfig} from '@src/config/toastConfig';
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

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SettingsScreen = () => {
  const t = useStrings();
  const navigation = useNavigation();
  const {user, logout} = useAuthStore();
  const {isDark, theme, toggleTheme} = useTheme();
  const {show} = useLoginModalStore();
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

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationLoading(true);

    try {
      if (value) {
        // User wants to enable notifications
        const granted = await notificationService.requestPermissions();
        if (granted) {
          setNotificationsEnabled(true);
          showToast(t('settings.notificationsEnabled'), 'success');

          // Send token to server
          try {
            await notificationAPI.updateFCMToken();
          } catch (error) {
            console.warn('Failed to update token on server:', error);
          }
        } else {
          setNotificationsEnabled(false);
          showToast(t('settings.notificationsPermissionDenied'), 'error');
        }
      } else {
        // User wants to disable notifications
        setNotificationsEnabled(false);
        showToast(t('settings.notificationsDisabled'), 'info');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showToast(t('settings.notificationsUpdateFailed'), 'error');
    } finally {
      setNotificationLoading(false);
    }
  };

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
      showToast(t('settings.selectRating'), 'error');
      return;
    }

    if (!feedbackText.trim()) {
      showToast(t('settings.enterFeedback'), 'error');
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
      showToast(t('settings.greetForFeedback'), 'success');
      setShowFeedbackModal(false);
      setFeedbackText('');
      setFeedbackRating(0);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast(t('settings.feedbackFailed'), 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleRateApp = () => {
    // Direct redirect to Google Play Store
    triggerHaptic('light');

    Linking.openURL(urls.playstore)
      .then(() => {
        showToast(t('settings.thankYouForRating'), 'success');
      })
      .catch(error => {
        console.error('Error opening Play Store:', error);
        showToast(t('errors.somethingWentWrong'), 'error');
      });
  };

  // Calculate time until midnight for reset info
  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeDiff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return {hours, minutes};
  };

  const resetTime = getTimeUntilReset();

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
      removeClippedSubviews={true}
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
              marginBottom: 15,
              borderRadius: 90 / 2,
              backgroundColor: theme.surface,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <FastImage
            source={isDark ? appConfig.darkFavicon : appConfig.lightFavicon}
            style={{
              width: 150,
              height: 150,
              marginBottom: 15,
              borderRadius: 90 / 2,
              backgroundColor: theme.surface,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}
        {user ? (
          <>
            <Text className="text-3xl font-bold" style={{color: theme.text}}>
              {currentProfile.name}
            </Text>
            <Text
              className="text-white opacity-80 text-sm mt-1"
              style={{color: theme.text}}>
              {currentProfile.email}
            </Text>
          </>
        ) : (
          <TouchableOpacity
            className="py-4 px-8 rounded-full shadow-lg"
            style={{backgroundColor: theme.primary}}
            onPress={show}
            accessible={true}
            accessibilityLabel={t('auth.signInRequired')}>
            <Text className="text-white font-semibold">
              {t('auth.signInToContinue')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="mt-10">
        {/* Enhanced Quota Information Section */}
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
                {t('settings.dailyQuota')}
              </Text>
              <Text className="text-xs" style={{color: theme.secondaryText}}>
                {t('settings.renewsIn', {
                  hours: resetTime.hours,
                  minutes: resetTime.minutes,
                })}
              </Text>
            </View>
            <View className="px-5 py-4">
              {/* Images Remaining with Daily Context */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <View>
                    <Text
                      style={{color: theme.text}}
                      className="text-base font-medium">
                      {t('settings.images')}
                    </Text>
                    <Text
                      style={{color: theme.secondaryText}}
                      className="text-xs">
                      {t('settings.dailyReset')}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      style={{color: theme.primary}}
                      className="text-base font-bold">
                      {user.quota
                        ? user.quota.planLimits.totalImages
                          ? t('settings.imagesRemainingDaily', {
                              count: user.quota.imagesRemaining,
                              total: user.quota.planLimits.totalImages,
                            })
                          : `${user.quota.imagesRemaining}`
                        : '0'}
                    </Text>
                    {user.quota?.planLimits.totalImages && (
                      <Text
                        style={{color: theme.secondaryText}}
                        className="text-xs">
                        {Math.round(
                          (user.quota.imagesRemaining /
                            user.quota.planLimits.totalImages) *
                            100,
                        )}
                        % remaining
                      </Text>
                    )}
                  </View>
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
                            ? 100
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
                  {t('settings.planType')}
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
              {t('settings.account')}
            </Text>
          </View>
          {/* Edit Profile Option */}
          <TouchableOpacity
            className="px-5 py-4 border-b flex-row justify-between items-center"
            style={{borderColor: theme.secondaryText + '20'}}
            onPress={handleEditProfile}
            accessible={true}
            accessibilityLabel={t('settings.editProfile')}
            accessibilityHint={t('settings.editProfileHint')}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <PersonIcon size={20} color={theme.primary} />
              </View>
              <Text style={{color: theme.text}} className="text-base">
                {t('settings.editProfile')}
              </Text>
            </View>
            <ChevronRightIcon size={20} color={theme.secondaryText} />
          </TouchableOpacity>
          {/* Language Settings */}
          <TouchableOpacity
            className="px-5 py-4 border-b flex-row justify-between items-center"
            accessible={true}
            accessibilityLabel={t('settings.changeLanguage')}
            accessibilityHint={t('settings.changeLanguageHint')}
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
                {t('settings.language')}
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
                  {t('settings.notifications')}
                </Text>
                <Text style={{color: theme.secondaryText}} className="text-xs">
                  {t('settings.notificationsDesc')}
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
                  ? t('settings.notificationsDisabled')
                  : t('settings.notificationsEnabled')
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
                {t('settings.darkMode')}
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
                  ? t('settings.switchLightMode')
                  : t('settings.switchDarkMode')
              }
              accessibilityHint={
                isDark
                  ? t('settings.switchLightModeHint')
                  : t('settings.switchDarkModeHint')
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
              {t('settings.helpImprove')}
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
            accessibilityLabel={t('settings.shareFeedback')}
            accessibilityHint={t('settings.shareFeedbackHint')}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <FeedbackIcon size={20} color={theme.primary} />
              </View>
              <Text className="text-base" style={{color: theme.text}}>
                {t('settings.shareFeedback')}
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
            accessibilityLabel={t('settings.rateApp')}
            accessibilityHint={t('settings.rateAppHint')}>
            <View className="flex-row items-center flex-1">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <StarIcon size={20} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base" style={{color: theme.text}}>
                  {t('settings.rateApp')}
                </Text>
                <Text
                  className="text-sm mt-1"
                  style={{color: theme.secondaryText}}>
                  {t('settings.rateAppDesc')}
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
              {t('settings.about')}
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
            accessibilityLabel={t('settings.privacyPolicy')}
            accessibilityHint={t('settings.privacyPolicyHint')}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <ShieldIcon size={20} color={theme.primary} />
              </View>
              <Text className="text-base" style={{color: theme.text}}>
                {t('settings.privacyPolicy')}
              </Text>
            </View>
            <ChevronRightIcon size={20} color={theme.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            className="px-5 py-4 flex-row justify-between items-center"
            onPress={() => Linking.openURL(urls.termsOfService)}
            accessible={true}
            accessibilityLabel={t('settings.termsOfService')}
            accessibilityHint={t('settings.termsOfServiceHint')}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <ShieldIcon size={20} color={theme.primary} />
              </View>
              <Text className="text-base" style={{color: theme.text}}>
                {t('settings.termsOfService')}
              </Text>
            </View>
            <ChevronRightIcon size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        {user && (
          <TouchableOpacity
            className="rounded-2xl py-4 mb-4 items-center flex-row justify-center shadow-lg"
            style={{backgroundColor: theme.surface}}
            onPress={() => {
              triggerHaptic('heavy'); // Strong haptic for logout action
              logout();
            }}
            accessible={true}
            accessibilityLabel={t('auth.signOut')}
            accessibilityHint={t('auth.signOutHint')}>
            <ExitToAppIcon size={20} color="#e11d48" style={{marginRight: 8}} />
            <Text style={{color: '#e11d48'}} className="font-medium text-base">
              {t('auth.signOut')}
            </Text>
          </TouchableOpacity>
        )}
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
                      {t('settings.shareFeedback')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowFeedbackModal(false)}
                      className="p-1 rounded-full"
                      style={{backgroundColor: theme.surface}}
                      accessible={true}
                      accessibilityLabel={t('settings.closeFeedback')}
                      accessibilityRole="button">
                      <CloseIcon size={20} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  <Text
                    className="text-base mb-2"
                    style={{color: theme.secondaryText}}>
                    {t('settings.rateExperience')}
                  </Text>

                  {renderRatingStars()}

                  <Text
                    className="text-base mb-2 mt-4"
                    style={{color: theme.secondaryText}}>
                    {t('settings.whatToImprove')}
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
                    placeholder={t('settings.feedbackPlaceholder')}
                    placeholderTextColor={theme.secondaryText}
                    accessible={true}
                    accessibilityLabel={t('settings.feedbackPlaceholder')}
                    accessibilityHint={t('settings.feedbackHint')}
                  />

                  <TouchableOpacity
                    className="py-4 rounded-xl flex-row items-center justify-center"
                    style={{backgroundColor: theme.primary}}
                    onPress={handleSubmitFeedback}
                    disabled={submittingFeedback}
                    accessible={true}
                    accessibilityLabel={t('settings.submitFeedback')}
                    accessibilityState={{disabled: submittingFeedback}}
                    accessibilityHint={t('settings.submitFeedbackHint')}>
                    {submittingFeedback ? (
                      <Text className="text-white font-medium text-base">
                        {t('settings.submitting')}
                      </Text>
                    ) : (
                      <>
                        <Text className="text-white font-medium text-base mr-2">
                          {t('settings.submitFeedback')}
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

        <Toast config={toastConfig} />
      </Modal>
    </Animated.ScrollView>
  );
};

export default SettingsScreen;
