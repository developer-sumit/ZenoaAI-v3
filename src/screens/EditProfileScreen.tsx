import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import {useToast} from '@masumdev/rn-toast';

import {User} from '@src/types';
import {useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import userService from '@src/services/userService';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import {useAnimations} from '@src/hooks/useAnimations';

// Icons
import ArrowBackIcon from '@src/assets/icons/ArrowBackIcon';
import PersonIcon from '@src/assets/icons/PersonIcon';
import EmailIcon from '@src/assets/icons/EmailIcon';
import CameraIcon from '@src/assets/icons/CameraIcon';
import TrashIcon from '@src/assets/icons/TrashIcon';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const EditProfileScreen = () => {
  const strings = useStrings();
  const navigation = useNavigation();
  const {isDark, theme} = useTheme();
  const {user, logout, updateUser} = useAuthStore();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();
  const {animatePress} = useAnimations();

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const deleteButtonScale = useRef(new Animated.Value(1)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setName(user.profile.username || '');
      setBio(user.profile.bio || '');
      setPhotoUri(user.profile.avatar || '');
    }

    // Animate content in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user, fadeAnim, slideAnim]);

  const handleBackPress = () => {
    triggerHaptic('selection');
    animatePress(saveButtonScale, 150);
    navigation.goBack();
  };

  const saveProfile = async () => {
    if (!user) {
      triggerHaptic('error');
      showToast(strings.editProfile.pleaseLogin, 'error');
      return;
    }
    try {
      setIsSaving(true);
      triggerHaptic('selection');
      animatePress(saveButtonScale, 150);

      console.log('Starting profile update with user ID:', user.uid);
      if (name !== user.profile.username || bio !== user.profile.bio) {
        // Debug log for better troubleshooting
        console.log(
          'Updating profile data:',
          'username from',
          user.profile.username,
          'to',
          name,
          'bio from',
          user.profile.bio,
          'to',
          bio,
        );

        try {
          // Prepare updated user data with proper type structure matching web API
          const updatedUserData: Partial<User> = {
            profile: {
              ...user.profile,
              username: name.trim(),
              bio: bio.trim(),
            },
          };

          // Use userService to update profile via API - this matches web updateProfile structure
          const updatedUser = await userService.updateProfile(
            user.uid,
            updatedUserData,
          );

          if (updatedUser) {
            // Update auth store with the new user data
            updateUser(updatedUser);
            console.log('Profile successfully updated via API');
          } else {
            throw new Error('Failed to update profile - no response data');
          }
        } catch (updateError) {
          console.error('API update error:', updateError);
          throw updateError;
        }
      } else {
        console.log('No changes to save');
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsSaving(false);
      triggerHaptic('success');
      showToast(strings.editProfile.profileUpdated, 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsSaving(false);
      triggerHaptic('error');
      showToast(strings.editProfile.updateFailed, 'error');
    }
  };

  const handleAvatarPress = () => {
    triggerHaptic('light');
    animatePress(avatarScale, 200);
    // TODO: Implement image picker for avatar upload
    // For now, show info message that this feature will be added
    showToast(strings.editProfile.uploadPhoto, 'info');
  };

  const handleAccountDeletion = async () => {
    try {
      triggerHaptic('warning');
      if (user?.uid) {
        showToast(strings.editProfile.deletingAccount, 'info');

        // Get the final reason - either selected option or custom reason
        const deletionReason =
          selectedReason === 'Other' ? customReason : selectedReason;

        // Use userService to mark account as deleted via API
        await userService.deleteUserAccount(user.uid, deletionReason);

        triggerHaptic('success');
        showToast(strings.editProfile.accountDeleted, 'success');
        await logout();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      triggerHaptic('error');
      showToast(strings.editProfile.accountDeleteFailed, 'error');
    }
  };

  const handleDeleteAccountPress = () => {
    triggerHaptic('selection');
    animatePress(deleteButtonScale, 150);
    setShowReasonModal(true);
  };

  const handleReasonNext = () => {
    if (
      !selectedReason ||
      (selectedReason === 'Other' && !customReason.trim())
    ) {
      showToast(strings.editProfile.selectReasonError, 'error');
      return;
    }
    setShowReasonModal(false);
    setShowDeleteModal(true);
  };

  if (!user) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{backgroundColor: theme.background}}>
        <Text style={{color: theme.text}}>
          {strings.editProfile.pleaseLogin}
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1"
        style={{backgroundColor: theme.background}}
        contentContainerStyle={{paddingBottom: 120}}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 flex-row items-center justify-between py-5">
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{backgroundColor: theme.surface}}
            onPress={handleBackPress}
            accessible={true}
            accessibilityLabel={strings.common.goBack}>
            <ArrowBackIcon size={20} color={theme.text} />
          </TouchableOpacity>
          <Text
            className="text-xl font-semibold tracking-tight"
            style={{color: theme.text}}>
            {strings.editProfile.title}
          </Text>
          <TouchableOpacity
            className="rounded-full px-5 py-2.5"
            style={{
              backgroundColor: theme.primary,
              opacity: isSaving ? 0.7 : 1,
            }}
            onPress={saveProfile}
            disabled={isSaving}
            accessible={true}
            accessibilityLabel={strings.editProfile.saveChanges}
            accessibilityState={{disabled: isSaving}}>
            <Text className="text-white font-medium text-sm">
              {isSaving ? strings.editProfile.saving : strings.common.save}
            </Text>
          </TouchableOpacity>
        </View>
        <Animated.View
          style={{opacity: fadeAnim, transform: [{translateY: slideAnim}]}}>
          {/* Avatar Section with Change option */}
          <View className="items-center pt-6 pb-8">
            <View className="relative">
              <View
                className="rounded-full overflow-hidden"
                style={{
                  width: 150,
                  height: 150,
                  shadowColor: theme.primary,
                  shadowOffset: {width: 0, height: 8},
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 10,
                  backgroundColor: theme.surface,
                }}>
                <FastImage
                  source={{uri: photoUri}}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderWidth: 4,
                    borderColor: theme.surface,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </View>

              {/* Camera icon overlay */}
              <Animated.View style={{transform: [{scale: avatarScale}]}}>
                <TouchableOpacity
                  className="absolute bottom-0 right-0 w-12 h-12 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: theme.primary,
                    borderWidth: 3,
                    borderColor: theme.background,
                  }}
                  onPress={handleAvatarPress}
                  accessible={true}
                  accessibilityLabel="Change profile photo">
                  <CameraIcon size={20} color="white" />
                </TouchableOpacity>
              </Animated.View>
            </View>

            <Text className="text-sm mt-4" style={{color: theme.secondaryText}}>
              {strings.editProfile.tapCamera}
            </Text>
          </View>

          <View className="px-5">
            <View
              className="rounded-3xl mb-6 overflow-hidden shadow-lg"
              style={{backgroundColor: theme.surface}}>
              <View
                className="px-5 py-4 border-b"
                style={{borderColor: theme.secondaryText + '20'}}>
                <Text
                  className="text-lg font-semibold"
                  style={{color: theme.text}}>
                  {strings.editProfile.personalInfo}
                </Text>
              </View>

              {/* Name field */}
              <View
                className="px-5 py-4 border-b flex-row items-center"
                style={{borderColor: theme.secondaryText + '20'}}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{backgroundColor: theme.primary + '15'}}>
                  <PersonIcon size={20} color={theme.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-xs mb-1"
                    style={{color: theme.secondaryText}}>
                    {strings.editProfile.fullName}
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    className="text-base py-1"
                    style={{
                      color: theme.text,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.secondaryText + '30',
                    }}
                    placeholder={strings.editProfile.yourName}
                    placeholderTextColor={theme.secondaryText}
                    accessible={true}
                    accessibilityLabel={strings.editProfile.yourName}
                    accessibilityHint={strings.editProfile.fullNameHint}
                  />
                </View>
              </View>

              {/* Bio field */}
              <View
                className="px-5 py-4 border-b flex-row items-start"
                style={{borderColor: theme.secondaryText + '20'}}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4 mt-1"
                  style={{backgroundColor: theme.primary + '15'}}>
                  <PersonIcon size={20} color={theme.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-xs mb-1"
                    style={{color: theme.secondaryText}}>
                    {strings.editProfile.bio}
                  </Text>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    className="text-base py-1"
                    style={{
                      color: theme.text,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.secondaryText + '30',
                      minHeight: 60,
                    }}
                    placeholder={strings.editProfile.bioPlaceholder}
                    placeholderTextColor={theme.secondaryText}
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                    accessible={true}
                    accessibilityLabel={strings.editProfile.bio}
                    accessibilityHint={strings.editProfile.bioHint}
                  />
                </View>
              </View>

              {/* Email field (non-editable) */}
              <View className="px-5 py-4 flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{backgroundColor: theme.primary + '15'}}>
                  <EmailIcon size={20} color={theme.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-xs mb-1"
                    style={{color: theme.secondaryText}}>
                    {strings.editProfile.email}
                  </Text>
                  <Text
                    className="text-base py-1"
                    style={{color: theme.secondaryText}}>
                    {user?.email || 'Not available'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Management Card */}
            <View
              className="rounded-3xl mb-6 overflow-hidden shadow-lg"
              style={{backgroundColor: theme.surface}}>
              <View
                className="px-5 py-4 border-b"
                style={{borderColor: theme.secondaryText + '20'}}>
                <Text
                  className="text-lg font-semibold"
                  style={{color: theme.text}}>
                  {strings.editProfile.accountManagement}
                </Text>
              </View>

              {/* Delete Account Button */}
              <TouchableOpacity
                className="px-5 py-4 flex-row items-center"
                onPress={handleDeleteAccountPress}
                accessible={true}
                accessibilityLabel={strings.editProfile.deleteMyAccount}
                accessibilityHint={strings.editProfile.deleteAccountHint}>
                <Animated.View
                  style={{transform: [{scale: deleteButtonScale}]}}>
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-4"
                    style={{backgroundColor: '#e11d4815'}}>
                    <TrashIcon size={20} color="#e11d48" />
                  </View>
                </Animated.View>
                <View className="flex-1">
                  <Text className="text-base" style={{color: '#e11d48'}}>
                    {strings.editProfile.deleteMyAccount}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Reason Selection Modal */}
      <Modal visible={showReasonModal} transparent animationType="fade">
        <BlurView
          style={{flex: 1}}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={10}>
          <View className="flex-1 justify-center items-center p-6">
            <View
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                backgroundColor: theme.background,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 10},
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
              }}>
              <View
                className="w-full h-1.5"
                style={{backgroundColor: theme.primary}}
              />
              <View className="p-6">
                <View className="items-center mb-6">
                  <Text
                    className="text-xl font-semibold mb-2 text-center"
                    style={{color: theme.text}}>
                    {strings.editProfile.deleteReasonTitle ||
                      'Why are you deleting your account?'}
                  </Text>
                  <Text
                    className="text-sm mb-4 text-center leading-5"
                    style={{color: theme.secondaryText}}>
                    {strings.editProfile.deleteReasonSubtitle ||
                      "Help us improve by letting us know why you're leaving"}
                  </Text>
                </View>
                <View className="space-y-3 mb-6">
                  {[
                    strings.editProfile.deleteReasonOption1 ||
                      'No longer using the app',
                    strings.editProfile.deleteReasonOption2 ||
                      'Privacy concerns',
                    strings.editProfile.deleteReasonOption3 ||
                      'Found a better alternative',
                    strings.editProfile.deleteReasonOption4 ||
                      'Technical issues',
                    strings.editProfile.deleteReasonOther || 'Other',
                  ].map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      className="p-4 rounded-xl flex-row items-center"
                      style={{
                        backgroundColor:
                          selectedReason === option
                            ? theme.primary + '15'
                            : theme.surface,
                        borderWidth: selectedReason === option ? 1 : 0,
                        borderColor:
                          selectedReason === option
                            ? theme.primary
                            : 'transparent',
                      }}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedReason(option);
                        if (option !== 'Other') {
                          setCustomReason('');
                        }
                      }}>
                      <View
                        className="w-5 h-5 rounded-full mr-3 items-center justify-center"
                        style={{
                          backgroundColor:
                            selectedReason === option
                              ? theme.primary
                              : 'transparent',
                          borderWidth: selectedReason === option ? 0 : 2,
                          borderColor: theme.secondaryText,
                        }}>
                        {selectedReason === option && (
                          <View
                            className="w-2 h-2 rounded-full"
                            style={{backgroundColor: 'white'}}
                          />
                        )}
                      </View>
                      <Text className="text-base" style={{color: theme.text}}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedReason === 'Other' && (
                  <TextInput
                    className="p-4 rounded-xl mb-6"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderWidth: 1,
                      borderColor: theme.secondaryText + '30',
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                    placeholder={strings.editProfile.deleteReasonPlaceholder}
                    placeholderTextColor={theme.secondaryText}
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                    numberOfLines={3}
                  />
                )}
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1 mr-3"
                    style={{backgroundColor: theme.surface}}
                    onPress={() => {
                      triggerHaptic('selection');
                      setShowReasonModal(false);
                      setSelectedReason('');
                      setCustomReason('');
                    }}>
                    <Text
                      className="text-center font-medium"
                      style={{color: theme.text}}>
                      {strings.editProfile.deleteReasonBack}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1"
                    style={{
                      backgroundColor:
                        !selectedReason ||
                        (selectedReason === 'Other' && !customReason.trim())
                          ? theme.secondaryText + '50'
                          : theme.primary,
                    }}
                    onPress={handleReasonNext}
                    disabled={
                      !selectedReason ||
                      (selectedReason === 'Other' && !customReason.trim())
                    }>
                    <Text className="text-white font-medium text-center">
                      {strings.editProfile.deleteReasonNext}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <BlurView
          style={{flex: 1}}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={10}>
          <View className="flex-1 justify-center items-center p-6">
            <View
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                backgroundColor: theme.background,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 10},
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
              }}>
              <View
                className="w-full h-1.5"
                style={{backgroundColor: '#e11d48'}}
              />
              <View className="p-6">
                <View className="items-center mb-4">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                    style={{backgroundColor: '#e11d4815'}}>
                    <TrashIcon size={32} color="#e11d48" />
                  </View>
                  <Text
                    className="text-2xl font-semibold mb-2 text-center"
                    style={{color: theme.text}}>
                    {strings.editProfile.deleteMyAccount}?
                  </Text>
                  <Text
                    className="text-base mb-6 text-center leading-6"
                    style={{color: theme.secondaryText}}>
                    {strings.editProfile.deleteAccountWarning}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1 mr-3"
                    style={{backgroundColor: theme.surface}}
                    onPress={() => {
                      triggerHaptic('selection');
                      setShowDeleteModal(false);
                    }}
                    accessible={true}
                    accessibilityLabel={
                      strings.editProfile.cancelAccountDelete
                    }>
                    <Text
                      className="text-center font-medium"
                      style={{color: theme.text}}>
                      {strings.common.cancel}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1"
                    style={{backgroundColor: '#e11d48'}}
                    onPress={() => {
                      triggerHaptic('heavy');
                      handleAccountDeletion();
                      setShowDeleteModal(false);
                    }}
                    accessible={true}
                    accessibilityLabel={
                      strings.editProfile.confirmAccountDelete
                    }
                    accessibilityHint={strings.editProfile.deleteAccountHint}>
                    <Text className="text-white font-medium text-center">
                      {strings.common.delete}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
  );
};

export default EditProfileScreen;
