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

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setName(user.profile.username || '');
      setPhotoUri(user.profile.avatar || '');
    }

    // Animate content in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user, fadeAnim, slideAnim]);

  const saveProfile = async () => {
    if (!user) {
      showToast(strings.editProfile.pleaseLogin, 'error');
      return;
    }
    try {
      setIsSaving(true);
      console.log('Starting profile update with user ID:', user.uid);

      if (name !== user.profile.username) {
        // Debug log for better troubleshooting
        console.log(
          'Updating username from',
          user.profile.username,
          'to',
          name,
        );

        try {
          // Prepare updated user data with proper type structure matching web API
          const updatedUserData: Partial<User> = {
            profile: {
              ...user.profile,
              username: name.trim(),
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
      showToast(strings.editProfile.profileUpdated, 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsSaving(false);
      showToast(strings.editProfile.updateFailed, 'error');
    }
  };
  const handleChangePhoto = () => {
    // TODO: Implement image picker for avatar upload
    // For now, show info message that this feature will be added
    showToast(strings.editProfile.uploadPhoto, 'info');
  };

  const handleAccountDeletion = async () => {
    try {
      if (user?.uid) {
        showToast(strings.editProfile.deletingAccount, 'info');

        // Use userService to mark account as deleted via API
        await userService.markAccountAsDeleted(user.uid);

        showToast(strings.editProfile.accountDeleted, 'success');
        await logout();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast(strings.editProfile.accountDeleteFailed, 'error');
    }
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
            onPress={() => navigation.goBack()}
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
              <TouchableOpacity
                className="absolute bottom-0 right-0 w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: theme.primary,
                  borderWidth: 3,
                  borderColor: theme.background,
                }}
                onPress={handleChangePhoto}
                accessible={true}
                accessibilityLabel="Change profile photo">
                <CameraIcon size={20} color="white" />
              </TouchableOpacity>
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
                onPress={() => setShowDeleteModal(true)}
                accessible={true}
                accessibilityLabel={strings.editProfile.deleteMyAccount}
                accessibilityHint={strings.editProfile.deleteAccountHint}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{backgroundColor: '#e11d4815'}}>
                  <TrashIcon size={20} color="#e11d48" />
                </View>
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
                    onPress={() => setShowDeleteModal(false)}
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
