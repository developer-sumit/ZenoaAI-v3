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
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {theme} from '@src/theme/Theme';
import {userService} from '@src/services/userService';
import {useToast} from '@masumdev/rn-toast';
import { doc, setDoc } from 'firebase/firestore';
import EncryptedStorage from 'react-native-encrypted-storage';

// Icons
import ArrowBackIcon from '@src/assets/icons/ArrowBackIcon';
import PersonIcon from '@src/assets/icons/PersonIcon';
import EmailIcon from '@src/assets/icons/EmailIcon';
import CameraIcon from '@src/assets/icons/CameraIcon';
import TrashIcon from '@src/assets/icons/TrashIcon';
import { firestore } from '@src/config/firebase.config';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const {isDark} = useThemeStore();
  const {user, logout} = useAuthStore();
  const {showToast} = useToast();
  const colors = isDark ? theme.dark : theme.light;

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
      setName(user.name || '');
      setPhotoUri(user.photo || '');
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
      showToast('Please log in', 'error');
      return;
    }

    try {
      setIsSaving(true);
      console.log('Starting profile update with user ID:', user.id);
      
      if (name !== user.name) {
        // Debug log for better troubleshooting
        console.log('Updating name from', user.name, 'to', name);
        
        try {
          // Make direct update to Firestore
          const userDocRef = doc(firestore, 'users', user.id);
          await setDoc(
            userDocRef,
            {
              name: name,
              lastUpdated: new Date().toISOString(),
            },
            { merge: true }
          );
          
          // Also update local encrypted storage
          const localUserData = await EncryptedStorage.getItem(`user_${user.id}`);
          if (localUserData) {
            const userData = JSON.parse(localUserData);
            userData.name = name;
            userData.lastUpdated = new Date().toISOString();
            await EncryptedStorage.setItem(
              `user_${user.id}`,
              JSON.stringify(userData)
            );
          }
          
          // Update auth store
          useAuthStore.getState().updateUser({...user, name});
          
          console.log('Profile successfully updated');
        } catch (updateError) {
          console.error('Direct update error:', updateError);
          throw updateError;
        }
      } else {
        console.log('No changes to save');
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsSaving(false);
      showToast('Profile updated successfully', 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsSaving(false);
      showToast('Failed to update profile', 'error');
    }
  };

  const handleChangePhoto = () => {
    // This would normally open image picker
    showToast('Photo upload coming soon', 'info');
  };

  const handleAccountDeletion = async () => {
    try {
      if (user?.id) {
        // Show deletion in progress
        showToast('Deleting account...', 'info');

        // Mark the account as deleted in Firestore
        await userService.markAccountAsDeleted(user.id);

        showToast('Your account has been deleted', 'success');
        await logout();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('Failed to delete account', 'error');
    }
  };

  if (!user) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{backgroundColor: colors.background}}>
        <Text style={{color: colors.text}}>Please log in</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1"
        style={{backgroundColor: colors.background}}
        contentContainerStyle={{paddingBottom: 120}}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 flex-row items-center justify-between py-5">
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{backgroundColor: colors.surface}}
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityLabel="Go back">
            <ArrowBackIcon size={20} color={colors.text} />
          </TouchableOpacity>
          <Text
            className="text-xl font-semibold tracking-tight"
            style={{color: colors.text}}>
            Edit Profile
          </Text>
          <TouchableOpacity
            className="rounded-full px-5 py-2.5"
            style={{
              backgroundColor: colors.primary,
              opacity: isSaving ? 0.7 : 1,
            }}
            onPress={saveProfile}
            disabled={isSaving}
            accessible={true}
            accessibilityLabel="Save profile changes"
            accessibilityState={{disabled: isSaving}}>
            <Text className="text-white font-medium text-sm">
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          }}>
          {/* Avatar Section with Change option */}
          <View className="items-center pt-6 pb-8">
            <View className="relative">
              <View
                className="rounded-full overflow-hidden"
                style={{
                  width: 150,
                  height: 150,
                  shadowColor: colors.primary,
                  shadowOffset: {width: 0, height: 8},
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 10,
                  backgroundColor: colors.surface,
                }}>
                <FastImage
                  source={{uri: photoUri}}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderWidth: 4,
                    borderColor: colors.surface,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </View>

              {/* Camera icon overlay */}
              <TouchableOpacity
                className="absolute bottom-0 right-0 w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: colors.primary,
                  borderWidth: 3,
                  borderColor: colors.background,
                }}
                onPress={handleChangePhoto}
                accessible={true}
                accessibilityLabel="Change profile photo">
                <CameraIcon size={20} color="white" />
              </TouchableOpacity>
            </View>

            <Text
              className="text-sm mt-4"
              style={{color: colors.secondaryText}}>
              Tap the camera icon to change your profile photo
            </Text>
          </View>

          {/* Form Fields with styled cards matching ProfileScreen */}
          <View className="px-5">
            <View
              className="rounded-3xl mb-6 overflow-hidden shadow-lg"
              style={{backgroundColor: colors.surface}}>
              <View
                className="px-5 py-4 border-b"
                style={{borderColor: colors.secondaryText + '20'}}>
                <Text
                  className="text-lg font-semibold"
                  style={{color: colors.text}}>
                  Personal Information
                </Text>
              </View>

              {/* Name field */}
              <View
                className="px-5 py-4 border-b flex-row items-center"
                style={{borderColor: colors.secondaryText + '20'}}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{backgroundColor: colors.primary + '15'}}>
                  <PersonIcon size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-xs mb-1"
                    style={{color: colors.secondaryText}}>
                    Full Name
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    className="text-base py-1"
                    style={{
                      color: colors.text,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.secondaryText + '30',
                    }}
                    placeholder="Your name"
                    placeholderTextColor={colors.secondaryText}
                    accessible={true}
                    accessibilityLabel="Name input"
                    accessibilityHint="Enter your display name"
                  />
                </View>
              </View>

              {/* Email field (non-editable) */}
              <View className="px-5 py-4 flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{backgroundColor: colors.primary + '15'}}>
                  <EmailIcon size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-xs mb-1"
                    style={{color: colors.secondaryText}}>
                    Email Address
                  </Text>
                  <Text
                    className="text-base py-1"
                    style={{color: colors.secondaryText}}>
                    {user?.email || 'Not available'}
                  </Text>
                  <Text
                    className="text-xs mt-1"
                    style={{color: colors.secondaryText + '80'}}>
                    Email cannot be changed
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Management Card */}
            <View
              className="rounded-3xl mb-6 overflow-hidden shadow-lg"
              style={{backgroundColor: colors.surface}}>
              <View
                className="px-5 py-4 border-b"
                style={{borderColor: colors.secondaryText + '20'}}>
                <Text
                  className="text-lg font-semibold"
                  style={{color: colors.text}}>
                  Account Management
                </Text>
              </View>

              {/* Delete Account Button */}
              <TouchableOpacity
                className="px-5 py-4 flex-row items-center"
                onPress={() => setShowDeleteModal(true)}
                accessible={true}
                accessibilityLabel="Delete my account"
                accessibilityHint="Opens confirmation dialog to delete your account">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                  style={{backgroundColor: '#e11d4815'}}>
                  <TrashIcon size={20} color="#e11d48" />
                </View>
                <View className="flex-1">
                  <Text className="text-base" style={{color: '#e11d48'}}>
                    Delete My Account
                  </Text>
                  <Text
                    className="text-xs mt-1"
                    style={{color: colors.secondaryText}}>
                    Permanently remove your account and all data
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Delete Account Modal with improved design */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <BlurView
          style={{flex: 1}}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={10}>
          <View className="flex-1 justify-center items-center p-6">
            <View
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                backgroundColor: colors.background,
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
                    style={{color: colors.text}}>
                    Delete Account?
                  </Text>
                  <Text
                    className="text-base mb-6 text-center leading-6"
                    style={{color: colors.secondaryText}}>
                    Your account will be permanently deleted. This action cannot
                    be undone.
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1 mr-3"
                    style={{backgroundColor: colors.surface}}
                    onPress={() => setShowDeleteModal(false)}
                    accessible={true}
                    accessibilityLabel="Cancel account deletion">
                    <Text
                      className="text-center font-medium"
                      style={{color: colors.text}}>
                      Cancel
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
                    accessibilityLabel="Confirm account deletion"
                    accessibilityHint="Permanently deletes your account">
                    <Text className="text-white font-medium text-center">
                      Delete
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
