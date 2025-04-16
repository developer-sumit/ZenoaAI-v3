import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@src/store/themeStore';
import { useAuthStore } from '@src/store/authStore';
import { theme } from '@src/theme/Theme';
import { userService } from '@src/services/userService';
import Toast from 'react-native-toast-message';
import Icon from '@src/components/Icon';

const PLACEHOLDER_IMAGE = require('@src/assets/favicon.png');

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { isDark } = useThemeStore();
  const { user, logout } = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [isLocalImage, setIsLocalImage] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setName(user.name || '');

      if (user.photo) {
        setPhotoUri(user.photo);
        setIsLocalImage(false);
      } else {
        setPhotoUri('');
        setIsLocalImage(true);
      }
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
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}>
        <Text style={{ color: colors.text }}>Please log in</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Profile
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={saveProfile}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        {isLocalImage && photoUri === '' ? (
          <Image
            source={PLACEHOLDER_IMAGE}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <FastImage
            source={{ uri: photoUri }}
            style={styles.avatar}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}

        {/* Reset to default button */}
        {!isLocalImage && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setPhotoUri('');
              setIsLocalImage(true);
            }}>
            <Text style={{ color: colors.secondary }}>Reset to default</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>
          Name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[
            styles.textInput,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: colors.secondaryText + '30',
            },
          ]}
          placeholder="Your name"
          placeholderTextColor={colors.secondaryText}
        />

        <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>
          Email
        </Text>
        <View
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.secondaryText + '30',
              opacity: 0.7,
            },
          ]}>
          <Text style={{ color: colors.secondaryText }}>
            {user?.email || 'Not available'}
          </Text>
        </View>
        <Text style={[styles.helpText, { color: colors.secondaryText }]}>
          Email cannot be changed
        </Text>
      </View>

      {/* Footer with Delete Account Option */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.deleteLink}
          onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.deleteLinkText}>Delete my account</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <BlurView
          style={{ flex: 1 }}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={5}>
          <View className="flex-1 justify-center items-center p-6">
            <View
              className="w-full max-w-md rounded-3xl p-6"
              style={{ backgroundColor: colors.background }}>
              <Text
                className="text-xl font-bold mb-4 text-center"
                style={{ color: colors.text }}>
                Delete Account?
              </Text>
              <Text
                className="text-base mb-6 text-center"
                style={{ color: colors.secondaryText }}>
                Your account will be deleted, but you can always create a new
                one with the same email later.
              </Text>
              <View className="flex-row gap-4 justify-end">
                <TouchableOpacity
                  className="py-2 px-4 rounded-xl"
                  onPress={() => setShowDeleteModal(false)}>
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-2 px-4 rounded-xl"
                  style={{ backgroundColor: '#e11d48' }}
                  onPress={() => {
                    handleAccountDeletion();
                    setShowDeleteModal(false);
                  }}>
                  <Text className="text-white font-medium">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: '50%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 30,
    right: '25%',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    marginTop: 12,
  },
  formContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  helpText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    opacity: 0.6,
  },
  deleteLink: {
    padding: 8,
  },
  deleteLinkText: {
    fontSize: 14,
    color: '#e11d48',
  },
});

export default EditProfileScreen;
