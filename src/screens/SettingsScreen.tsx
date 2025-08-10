import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
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
  ScrollView,
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

const ProfileAvatar = React.memo(({avatar, isDark, theme}: any) => {
  const imageSource = avatar
    ? {uri: avatar}
    : isDark
      ? appConfig.darkFavicon
      : appConfig.lightFavicon;

  return (
    <FastImage
      source={imageSource}
      style={{
        width: 150,
        height: 150,
        marginBottom: 15,
        borderRadius: 45,
        backgroundColor: theme.surface,
      }}
      resizeMode={FastImage.resizeMode.cover}
    />
  );
});

const SettingRow = React.memo(
  ({
    icon,
    title,
    subtitle,
    onPress,
    accessibilityLabel,
    accessibilityHint,
    theme,
    showChevron = true,
    rightComponent,
    hasBorder = true,
  }: any) => {
    return (
      <TouchableOpacity
        className={`px-5 py-4 flex-row justify-between items-center ${
          hasBorder ? 'border-b' : ''
        }`}
        style={{borderColor: theme.secondaryText + '20'}}
        onPress={onPress}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        activeOpacity={0.7}>
        <View className="flex-row items-center flex-1">
          <View
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{backgroundColor: theme.primary + '15'}}>
            {icon}
          </View>
          <View className="flex-1">
            <Text style={{color: theme.text}} className="text-base">
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{color: theme.secondaryText}}
                className="text-xs mt-1">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightComponent ||
          (showChevron && (
            <ChevronRightIcon size={20} color={theme.secondaryText} />
          ))}
      </TouchableOpacity>
    );
  },
);

const ToggleSwitch = React.memo(
  ({enabled, onToggle, loading, theme, accessibilityLabel}: any) => {
    return (
      <TouchableOpacity
        className="w-14 h-8 rounded-full p-1.5"
        style={{
          backgroundColor: enabled ? theme.primary : '#cbd5e1',
          opacity: loading ? 0.5 : 1,
        }}
        onPress={onToggle}
        disabled={loading}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="switch"
        accessibilityState={{checked: enabled}}
        activeOpacity={0.8}>
        <Animated.View
          className={`w-5 h-5 rounded-full bg-white ${
            enabled ? 'ml-6' : 'ml-0'
          }`}
        />
      </TouchableOpacity>
    );
  },
);

const QuotaProgressBar = React.memo(({quota, planLimits, theme}: any) => {
  const percentage = useMemo(() => {
    if (!quota || !planLimits?.totalImages) return 0;
    return Math.min(
      (quota.imagesRemaining / planLimits.totalImages) * 100,
      100,
    );
  }, [quota, planLimits]);

  const barColor = useMemo(() => {
    if (!quota) return '#ef4444';
    if (quota.imagesRemaining > 5) return theme.primary;
    if (quota.imagesRemaining > 0) return '#f59e0b';
    return '#ef4444';
  }, [quota, theme.primary]);

  return (
    <View
      className="h-2 rounded-full"
      style={{backgroundColor: theme.background}}>
      <View
        className="h-full rounded-full"
        style={{
          backgroundColor: barColor,
          width: `${percentage}%`,
        }}
      />
    </View>
  );
});

const RatingStars = React.memo(({rating, onRatingChange, theme}: any) => {
  const handleStarPress = useCallback(
    (star: number) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onRatingChange(star);
    },
    [onRatingChange],
  );

  return (
    <View className="flex-row justify-center my-4">
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          onPress={() => handleStarPress(star)}
          className="mx-2"
          accessible={true}
          accessibilityLabel={`Rate ${star} stars`}
          accessibilityRole="button"
          accessibilityState={{selected: star <= rating}}
          activeOpacity={0.7}>
          <StarIcon
            size={40}
            color={star <= rating ? '#F59E0B' : theme.secondaryText + '80'}
            filled={star <= rating}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
});

const SettingsScreen = () => {
  const t = useStrings();
  const navigation = useNavigation();
  const {user, logout} = useAuthStore();
  const {isDark, theme, toggleTheme} = useTheme();
  const {show} = useLoginModalStore();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();
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

  const resetTime = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeDiff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return {hours, minutes};
  }, []);

  const currentProfile = useMemo(
    () => ({
      name: profileName,
      email: user?.email || '',
      avatar: profileAvatar,
      isPro: user?.planType === 'pro' || user?.planType === 'enterprise',
      isLocalImage,
    }),
    [profileName, user?.email, user?.planType, profileAvatar, isLocalImage],
  );

  const quotaPercentage = useMemo(() => {
    if (!user?.quota?.planLimits?.totalImages) return 0;
    return Math.round(
      (user.quota.imagesRemaining / user.quota.planLimits.totalImages) * 100,
    );
  }, [user?.quota]);

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

  const handleToggleNotifications = useCallback(
    async (value: boolean) => {
      setNotificationLoading(true);

      try {
        if (value) {
          const granted = await notificationService.requestPermissions();
          if (granted) {
            setNotificationsEnabled(true);
            showToast(t('settings.notificationsEnabled'), 'success');

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
          setNotificationsEnabled(false);
          showToast(t('settings.notificationsDisabled'), 'info');
        }
      } catch (error) {
        console.error('Error toggling notifications:', error);
        showToast(t('settings.notificationsUpdateFailed'), 'error');
      } finally {
        setNotificationLoading(false);
      }
    },
    [showToast, t],
  );

  useEffect(() => {
    if (user) {
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

  const handleEditProfile = useCallback(() => {
    navigation.navigate(Routes.EDIT_PROFILE as never);
  }, [navigation]);

  const handleSubmitFeedback = useCallback(async () => {
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

      await feedbackService.submitFeedback(
        user?.uid || 'anonymous',
        user?.profile.username || 'Anonymous User',
        user?.email || 'Not provided',
        feedbackRating,
        feedbackText,
      );

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
  }, [feedbackRating, feedbackText, showToast, t, user]);

  const handleRateApp = useCallback(() => {
    triggerHaptic('light');

    Linking.openURL(urls.playstore)
      .then(() => {
        showToast(t('settings.thankYouForRating'), 'success');
      })
      .catch(error => {
        console.error('Error opening Play Store:', error);
        showToast(t('errors.somethingWentWrong'), 'error');
      });
  }, [triggerHaptic, showToast, t]);

  const handleThemeToggle = useCallback(() => {
    triggerHaptic('light');
    toggleTheme();
  }, [triggerHaptic, toggleTheme]);

  const handleLanguagePress = useCallback(() => {
    triggerHaptic('light');
    languageSelectorRef.current?.openModal();
  }, [triggerHaptic]);

  const handleLogout = useCallback(() => {
    triggerHaptic('heavy');
    logout();
  }, [triggerHaptic, logout]);

  const handleFeedbackPress = useCallback(() => {
    triggerHaptic('light');
    setShowFeedbackModal(true);
  }, [triggerHaptic]);

  const handlePrivacyPress = useCallback(() => {
    triggerHaptic('light');
    Linking.openURL(urls.privacyPolicy);
  }, [triggerHaptic]);

  const handleTermsPress = useCallback(() => {
    Linking.openURL(urls.termsOfService);
  }, []);

  return (
    <>
      <ScrollView
        className="flex-1"
        style={{backgroundColor: theme.background}}
        contentContainerStyle={{
          paddingBottom: 90,
          paddingTop: 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}>
        {/* Header */}
        <View className="items-center mb-10">
          <ProfileAvatar
            avatar={currentProfile.avatar}
            isDark={isDark}
            theme={theme}
          />

          {user ? (
            <>
              <Text className="text-3xl font-bold" style={{color: theme.text}}>
                {currentProfile.name}
              </Text>
              <Text
                className="opacity-80 text-sm mt-1"
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
              accessibilityLabel={t('auth.signInRequired')}
              activeOpacity={0.8}>
              <Text className="text-white font-semibold">
                {t('auth.signInToContinue')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quota Information */}
        {user && (
          <View
            className="rounded-3xl mb-6 overflow-hidden shadow-lg"
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
                        {quotaPercentage}% remaining
                      </Text>
                    )}
                  </View>
                </View>
                <QuotaProgressBar
                  quota={user.quota}
                  planLimits={user.quota?.planLimits}
                  theme={theme}
                />
              </View>

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

        {/* Account Settings */}
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

          <SettingRow
            icon={<PersonIcon size={20} color={theme.primary} />}
            title={t('settings.editProfile')}
            onPress={handleEditProfile}
            accessibilityLabel={t('settings.editProfile')}
            accessibilityHint={t('settings.editProfileHint')}
            theme={theme}
          />

          <SettingRow
            icon={<LanguageIcon size={20} color={theme.primary} />}
            title={t('settings.language')}
            onPress={handleLanguagePress}
            accessibilityLabel={t('settings.changeLanguage')}
            accessibilityHint={t('settings.changeLanguageHint')}
            theme={theme}
            rightComponent={<LanguageSelector ref={languageSelectorRef} />}
          />

          <SettingRow
            icon={<NotificationIcon size={20} color={theme.primary} />}
            title={t('settings.notifications')}
            subtitle={t('settings.notificationsDesc')}
            theme={theme}
            showChevron={false}
            rightComponent={
              <ToggleSwitch
                enabled={notificationsEnabled}
                onToggle={() =>
                  handleToggleNotifications(!notificationsEnabled)
                }
                loading={notificationLoading}
                theme={theme}
                accessibilityLabel={
                  notificationsEnabled
                    ? t('settings.notificationsDisabled')
                    : t('settings.notificationsEnabled')
                }
              />
            }
            hasBorder={true}
          />

          <SettingRow
            icon={
              isDark ? (
                <DarkModeIcon size={20} color={theme.primary} />
              ) : (
                <LightModeIcon size={20} color={theme.primary} />
              )
            }
            title={t('settings.darkMode')}
            theme={theme}
            showChevron={false}
            rightComponent={
              <ToggleSwitch
                enabled={isDark}
                onToggle={handleThemeToggle}
                loading={false}
                theme={theme}
                accessibilityLabel={
                  isDark
                    ? t('settings.switchLightMode')
                    : t('settings.switchDarkMode')
                }
              />
            }
            hasBorder={false}
          />
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

          <SettingRow
            icon={<FeedbackIcon size={20} color={theme.primary} />}
            title={t('settings.shareFeedback')}
            onPress={handleFeedbackPress}
            accessibilityLabel={t('settings.shareFeedback')}
            accessibilityHint={t('settings.shareFeedbackHint')}
            theme={theme}
          />

          <SettingRow
            icon={<StarIcon size={20} color={theme.primary} />}
            title={t('settings.rateApp')}
            subtitle={t('settings.rateAppDesc')}
            onPress={handleRateApp}
            accessibilityLabel={t('settings.rateApp')}
            accessibilityHint={t('settings.rateAppHint')}
            theme={theme}
            hasBorder={false}
          />
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

          <SettingRow
            icon={<ShieldIcon size={20} color={theme.primary} />}
            title={t('settings.privacyPolicy')}
            onPress={handlePrivacyPress}
            accessibilityLabel={t('settings.privacyPolicy')}
            accessibilityHint={t('settings.privacyPolicyHint')}
            theme={theme}
          />

          <SettingRow
            icon={<ShieldIcon size={20} color={theme.primary} />}
            title={t('settings.termsOfService')}
            onPress={handleTermsPress}
            accessibilityLabel={t('settings.termsOfService')}
            accessibilityHint={t('settings.termsOfServiceHint')}
            theme={theme}
            hasBorder={false}
          />
        </View>

        {/* Sign Out Button */}
        {user && (
          <TouchableOpacity
            className="rounded-2xl py-4 mb-4 items-center flex-row justify-center shadow-lg"
            style={{backgroundColor: theme.surface}}
            onPress={handleLogout}
            accessible={true}
            accessibilityLabel={t('auth.signOut')}
            accessibilityHint={t('auth.signOutHint')}
            activeOpacity={0.8}>
            <ExitToAppIcon size={20} color="#e11d48" style={{marginRight: 8}} />
            <Text style={{color: '#e11d48'}} className="font-medium text-base">
              {t('auth.signOut')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
                      accessibilityRole="button"
                      activeOpacity={0.7}>
                      <CloseIcon size={20} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  <Text
                    className="text-base mb-2"
                    style={{color: theme.secondaryText}}>
                    {t('settings.rateExperience')}
                  </Text>

                  <RatingStars
                    rating={feedbackRating}
                    onRatingChange={setFeedbackRating}
                    theme={theme}
                  />

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
                    accessibilityHint={t('settings.submitFeedbackHint')}
                    activeOpacity={0.8}>
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
    </>
  );
};

export default SettingsScreen;
