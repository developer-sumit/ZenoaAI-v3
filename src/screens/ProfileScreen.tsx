import React, {useState, useEffect, useCallback, useRef} from 'react';
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
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useAuthStore} from '@src/store/authStore';
import {theme} from '@src/theme/Theme';
import appConfig from '@src/config/app.config';
import {useThemeStore} from '@src/store/themeStore';
import {useNavigation} from '@react-navigation/native';
import {useToast} from '@masumdev/rn-toast';
import {BlurView} from '@react-native-community/blur';
import Routes from '@src/constants/routes';
import {openPrivacyPolicy, openTermsOfService} from '@src/utils/linkHelper';
import {feedbackService} from '@src/services/feedbackService';

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

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {user, logout} = useAuthStore();
  const {isDark, toggleTheme} = useThemeStore();
  const {showToast} = useToast();
  const colors = isDark ? theme.dark : theme.light;
  const scrollY = useRef(new Animated.Value(0)).current;

  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [isLocalImage, setIsLocalImage] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user, user?.name]);

  const loadProfileData = useCallback(() => {
    if (user) {
      setProfileName(user.name || 'User');

      if (user.photo) {
        setProfileAvatar(user.photo);
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
      isPro: false,
      isLocalImage,
    };
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    if (!feedbackText.trim()) {
      showToast('Please enter your feedback', 'error');
      return;
    }

    try {
      setSubmittingFeedback(true);

      await feedbackService.submitFeedback(
        user?.id || 'anonymous',
        user?.name || 'Anonymous User',
        user?.email || 'Not provided',
        feedbackRating,
        feedbackText,
      );

      // Success handling
      showToast('Thank you for your feedback!', 'success');
      setShowFeedbackModal(false);
      setFeedbackText('');
      setFeedbackRating(0);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('Failed to submit feedback', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
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
                star <= feedbackRating ? '#F59E0B' : colors.secondaryText + '80'
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
      style={{backgroundColor: colors.background}}
      contentContainerClassName="pb-[90px] pt-10 px-5"
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {
        useNativeDriver: false,
      })}>
      {/* Animated Header */}
      <View className="items-center">
        <FastImage
          source={{uri: currentProfile.avatar}}
          style={{
            width: 150,
            height: 150,
            borderRadius: 90 / 2,
            backgroundColor: colors.primary + '15',
            marginBottom: 15,
          }}
          resizeMode={FastImage.resizeMode.cover}
        />
        <Text className="text-3xl font-bold" style={{color: colors.text}}>
          {currentProfile.name}
        </Text>
        <Text
          className="text-white opacity-80 text-sm mt-1"
          style={{color: colors.text}}>
          {currentProfile.email}
        </Text>
      </View>

      <View className="mt-10">
        {/* Account Settings Card */}
        <View
          className="rounded-3xl mb-6 overflow-hidden shadow-lg"
          style={{backgroundColor: colors.surface}}>
          <View
            className="px-5 py-4 border-b"
            style={{borderColor: colors.secondaryText + '20'}}>
            <Text
              className="text-lg font-semibold"
              style={{color: colors.text}}>
              Account
            </Text>
          </View>

          {/* Edit Profile Option */}
          <TouchableOpacity
            className="px-5 py-4 border-b flex-row justify-between items-center"
            style={{borderColor: colors.secondaryText + '20'}}
            onPress={handleEditProfile}
            accessible={true}
            accessibilityLabel="Edit profile"
            accessibilityHint="Go to profile editing screen">
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: colors.primary + '15'}}>
                <PersonIcon size={20} color={colors.primary} />
              </View>
              <Text className="text-base" style={{color: colors.text}}>
                Edit Profile
              </Text>
            </View>
            <ChevronRightIcon size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* Dark Mode Option */}
          <View className="px-5 py-4 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: colors.primary + '15'}}>
                {isDark ? (
                  <DarkModeIcon size={20} color={colors.primary} />
                ) : (
                  <LightModeIcon size={20} color={colors.primary} />
                )}
              </View>
              <Text className="text-base" style={{color: colors.text}}>
                Dark Mode
              </Text>
            </View>
            <TouchableOpacity
              className="w-14 h-8 rounded-full p-1.5"
              style={{backgroundColor: isDark ? colors.primary : '#cbd5e1'}}
              onPress={toggleTheme}
              accessible={true}
              accessibilityLabel={
                isDark ? 'Switch to light mode' : 'Switch to dark mode'
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
          style={{backgroundColor: colors.surface}}>
          <View
            className="px-5 py-4 border-b"
            style={{borderColor: colors.secondaryText + '20'}}>
            <Text
              className="text-lg font-semibold"
              style={{color: colors.text}}>
              Help Us Improve
            </Text>
          </View>

          <TouchableOpacity
            className="px-5 py-4 flex-row justify-between items-center"
            onPress={() => setShowFeedbackModal(true)}
            accessible={true}
            accessibilityLabel="Share feedback"
            accessibilityHint="Opens a form to share your feedback about the app">
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: colors.primary + '15'}}>
                <FeedbackIcon size={20} color={colors.primary} />
              </View>
              <Text className="text-base" style={{color: colors.text}}>
                Share Your Feedback
              </Text>
            </View>
            <ChevronRightIcon size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View
          className="rounded-3xl mb-6 overflow-hidden shadow-lg"
          style={{backgroundColor: colors.surface}}>
          <View
            className="px-5 py-4 border-b"
            style={{borderColor: colors.secondaryText + '20'}}>
            <Text
              className="text-lg font-semibold"
              style={{color: colors.text}}>
              About
            </Text>
          </View>

          <View
            className="px-5 py-4 border-b"
            style={{borderColor: colors.secondaryText + '20'}}>
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: colors.primary + '15'}}>
                <InfoOutlineIcon size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={{color: colors.text}} className="text-base">
                  {appConfig.name} v{appConfig.version}
                </Text>
                <Text
                  style={{color: colors.secondaryText}}
                  className="text-sm mt-1">
                  {appConfig.author.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Privacy & Terms */}
          <TouchableOpacity
            className="px-5 py-4 border-b flex-row justify-between items-center"
            style={{borderColor: colors.secondaryText + '20'}}
            onPress={openPrivacyPolicy}
            accessible={true}
            accessibilityLabel="View privacy policy"
            accessibilityHint="Opens the privacy policy in your browser">
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: colors.primary + '15'}}>
                <ShieldIcon size={20} color={colors.primary} />
              </View>
              <Text className="text-base" style={{color: colors.text}}>
                Privacy Policy
              </Text>
            </View>
            <ChevronRightIcon size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            className="px-5 py-4 flex-row justify-between items-center"
            onPress={openTermsOfService}
            accessible={true}
            accessibilityLabel="View terms of service"
            accessibilityHint="Opens the terms of service in your browser">
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: colors.primary + '15'}}>
                <ShieldIcon size={20} color={colors.primary} />
              </View>
              <Text className="text-base" style={{color: colors.text}}>
                Terms of Service
              </Text>
            </View>
            <ChevronRightIcon size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          className="rounded-2xl py-4 mb-4 items-center flex-row justify-center shadow-lg"
          style={{backgroundColor: colors.surface}}
          onPress={logout}
          accessible={true}
          accessibilityLabel="Sign out"
          accessibilityHint="Signs you out of your account">
          <ExitToAppIcon size={20} color="#e11d48" style={{marginRight: 8}} />
          <Text style={{color: '#e11d48'}} className="font-medium text-base">
            Sign Out
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
          <View className="flex-1 justify-center items-center p-5">
            <View
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                backgroundColor: colors.background,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 10},
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 15,
              }}>
              <View
                className="w-full h-1"
                style={{backgroundColor: colors.primary}}
              />
              <View className="p-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text
                    className="text-2xl font-semibold"
                    style={{color: colors.text}}>
                    Share Your Feedback
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowFeedbackModal(false)}
                    className="p-1 rounded-full"
                    style={{backgroundColor: colors.surface}}
                    accessible={true}
                    accessibilityLabel="Close feedback form"
                    accessibilityRole="button">
                    <CloseIcon size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <Text
                  className="text-base mb-2"
                  style={{color: colors.secondaryText}}>
                  How would you rate your experience?
                </Text>

                {renderRatingStars()}

                <Text
                  className="text-base mb-2 mt-4"
                  style={{color: colors.secondaryText}}>
                  What can we improve?
                </Text>

                <TextInput
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  multiline
                  numberOfLines={5}
                  className="p-4 rounded-xl mb-6 text-base"
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.text,
                    height: 130,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Share your thoughts here..."
                  placeholderTextColor={colors.secondaryText}
                  accessible={true}
                  accessibilityLabel="Feedback text"
                  accessibilityHint="Enter your detailed feedback here"
                />

                <TouchableOpacity
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{backgroundColor: colors.primary}}
                  onPress={handleSubmitFeedback}
                  disabled={submittingFeedback}
                  accessible={true}
                  accessibilityLabel="Submit feedback"
                  accessibilityState={{disabled: submittingFeedback}}
                  accessibilityHint="Sends your feedback to the developers">
                  {submittingFeedback ? (
                    <Text className="text-white font-medium text-base">
                      Submitting...
                    </Text>
                  ) : (
                    <>
                      <Text className="text-white font-medium text-base mr-2">
                        Submit Feedback
                      </Text>
                      <SendIcon size={18} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    </Animated.ScrollView>
  );
};

export default ProfileScreen;
