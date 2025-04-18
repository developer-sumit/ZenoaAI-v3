import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@src/store/themeStore';
import { useAuthStore } from '@src/store/authStore';
import { theme } from '@src/theme/Theme';
import { userService } from '@src/services/userService';
import Toast from 'react-native-toast-message';
import Icon from '@src/components/Icon';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { isDark } = useThemeStore();
  const { user, logout } = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhotoUri(user.photo || '');
    }
  }, [user]);

  const saveProfile = async () => {
    if (!user) {
      Toast.show({ text1: 'Please log in', type: 'error' });
      return;
    }

    try {
      Toast.show({ text1: 'Profile updated', type: 'success' });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({ text1: 'Failed to update profile', type: 'error' });
    }
  };

  const handleAccountDeletion = async () => {
    try {
      if (user?.id) {
        // Mark the account as deleted in Firestore
        await userService.markAccountAsDeleted(user.id);

        Toast.show({
          text1: 'Account deleted',
          text2: 'Your account has been deleted',
          type: 'success',
        });

        await logout();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Toast.show({
        text1: 'Failed to delete account',
        text2: 'An error occurred while deleting your account',
        type: 'error',
      });
    }
  };

  if (!user) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.text }}>Please log in</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 flex-row items-center justify-between py-5 mb-4">
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.surface }}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-semibold tracking-tight" style={{ color: colors.text }}>
            Edit Profile
          </Text>
          <TouchableOpacity
            className="rounded-full px-5 py-2.5"
            style={{ backgroundColor: colors.primary }}
            onPress={saveProfile}
          >
            <Text className="text-white font-medium text-sm">Save</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View className="items-center pt-4 pb-8 mb-6">
          <View
            className="rounded-full overflow-hidden"
            style={{
              width: 150,
              height: 150,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 10,
              backgroundColor: colors.surface
            }}
          >
            <FastImage
              source={{ uri: photoUri }}
              style={{
                width: '100%',
                height: '100%',
                borderWidth: 4,
                borderColor: colors.surface,
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>
        </View>

        {/* Form Fields */}
        <View className="px-6 mb-8">
          <Text
            className="text-sm font-medium mb-2 ml-1"
            style={{ color: colors.secondaryText }}
          >
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="text-base px-5 py-4 rounded-2xl mb-6"
            style={{
              color: colors.text,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: 'transparent',
            }}
            placeholder="Your name"
            placeholderTextColor={colors.secondaryText}
          />

          <Text
            className="text-sm font-medium mb-2 ml-1"
            style={{ color: colors.secondaryText }}
          >
            Email
          </Text>
          <View
            className="px-5 py-4 rounded-2xl mb-1"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: 'transparent',
              opacity: 0.7,
            }}
          >
            <Text style={{ color: colors.secondaryText }}>
              {user?.email || 'Not available'}
            </Text>
          </View>
          <Text
            className="text-xs ml-1 mb-4"
            style={{ color: colors.secondaryText + '90' }}
          >
            Email cannot be changed
          </Text>
        </View>

        {/* Premium Divider */}
        <View className="px-10 mb-8">
          <View
            className="h-[1px] w-full"
            style={{ backgroundColor: colors.secondaryText + '20' }}
          />
        </View>

        {/* Footer with Delete Account Option */}
        <View className="items-center px-6">
          <TouchableOpacity
            className="py-3 px-6 rounded-lg"
            style={{ backgroundColor: '#e11d4810' }}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text className="text-sm" style={{ color: '#e11d48' }}>
              Delete my account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <BlurView
          style={{ flex: 1 }}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={10}>
          <View className="flex-1 justify-center items-center p-6">
            <View
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                backgroundColor: colors.background,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
              }}>
              <View
                className="w-full h-1.5"
                style={{ backgroundColor: '#e11d48' }}
              />
              <View className="p-6">
                <Text
                  className="text-2xl font-semibold mb-3 text-center"
                  style={{ color: colors.text }}>
                  Delete Account?
                </Text>
                <Text
                  className="text-base mb-8 text-center leading-6"
                  style={{ color: colors.secondaryText }}>
                  Your account will be permanently deleted. This action cannot be undone.
                </Text>

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1 mr-3"
                    style={{ backgroundColor: colors.surface }}
                    onPress={() => setShowDeleteModal(false)}>
                    <Text
                      className="text-center font-medium"
                      style={{ color: colors.text }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1"
                    style={{ backgroundColor: '#e11d48' }}
                    onPress={() => {
                      handleAccountDeletion();
                      setShowDeleteModal(false);
                    }}>
                    <Text className="text-white font-medium text-center">Delete</Text>
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