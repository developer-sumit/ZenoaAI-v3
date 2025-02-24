import React, {useState} from 'react';
import {BlurView} from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';

import {theme} from '@src/theme/Theme';
import appConfig from '@src/config/app.config';
import {useThemeStore} from '@src/store/themeStore';
import SubscriptionModal from '@src/components/SubscriptionModal';

const ProfileScreen = () => {
  const [user] = useState({
    name: appConfig.author.name,
    email: 'test@example.com',
    avatar: appConfig.author.avatar,
    isPro: false,
  });
  const {isDark, toggleTheme} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleAvatarChange = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', quality: 0.8});

    if (!result.didCancel && result.assets?.[0]?.uri) {
      // Handle image upload here
    }
  };

  return (
    <ScrollView
      style={{backgroundColor: colors.background}}
      className="flex-1"
      contentContainerClassName="pb-[150px] pt-10 px-5">
      {/* User Profile Section */}
      <View className="items-center mb-8">
        <View className="relative">
          <Image
            source={{uri: user.avatar}}
            className="h-44 aspect-square rounded-full mb-4"
          />
          <TouchableOpacity
            className="absolute bottom-5 right-2 p-3 rounded-full elevation-xl"
            style={{
              backgroundColor: colors.surface,
              shadowColor: colors.primary,
            }}
            onPress={handleAvatarChange}>
            <Icon name="edit" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          {isEditingName ? (
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              className="text-2xl font-bold mr-2"
              style={{color: colors.text}}
              autoFocus
            />
          ) : (
            <Text
              className="text-2xl font-bold mr-2"
              style={{color: colors.text}}>
              {editedName}
            </Text>
          )}
          <TouchableOpacity
            className="p-2.5 rounded-full elevation-xl"
            style={{
              backgroundColor: colors.surface,
              shadowColor: colors.primary,
            }}
            onPress={() => setIsEditingName(!isEditingName)}>
            <Icon name="edit" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={{color: colors.secondaryText}}>{user.email}</Text>
      </View>

      {/* Account Settings */}
      <View
        className="rounded-3xl p-4 mb-6"
        style={{backgroundColor: colors.surface}}>
        <Text
          className="text-lg font-semibold mb-4"
          style={{color: colors.secondaryText}}>
          Account Settings
        </Text>

        <View
          style={{borderColor: colors.secondaryText + '50'}}
          className="flex-row justify-between items-center py-3 border-b">
          <Text style={{color: colors.text}}>Dark Mode</Text>
          <TouchableOpacity
            className="w-14 h-8 rounded-full p-1.5"
            style={{backgroundColor: isDark ? colors.primary : '#cbd5e1'}}
            onPress={toggleTheme}>
            <View
              className={`w-5 h-5 rounded-full bg-white ${
                isDark ? 'ml-6' : 'ml-0'
              }`}
            />
          </TouchableOpacity>
        </View>

        <View
          style={{borderColor: colors.secondaryText + '50'}}
          className="flex-row justify-between items-center py-3 border-b">
          <Text style={{color: colors.text}}>Notifications</Text>
          <TouchableOpacity
            className="w-14 h-8 rounded-full p-1.5"
            style={{
              backgroundColor: notificationsEnabled
                ? colors.primary
                : '#cbd5e1',
            }}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}>
            <View
              className={`w-5 h-5 rounded-full bg-white ${
                notificationsEnabled ? 'ml-6' : 'ml-0'
              }`}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="py-3"
          onPress={() => setShowSubscriptionModal(true)}>
          <View className="flex-row justify-between items-center">
            <Text
              style={{color: user.isPro ? colors.primary : colors.secondary}}>
              {user.isPro ? 'Pro Member 🎉' : 'Upgrade to Pro'}
            </Text>
            {!user.isPro && (
              <Icon name="arrow-forward" size={20} color={colors.secondary} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View
        style={{backgroundColor: colors.background}}
        className="rounded-2xl p-4 mb-6">
        <Text
          className="text-lg font-semibold mb-4"
          style={{color: colors.text}}>
          About
        </Text>
        <Text style={{color: colors.secondaryText}} className="text-base mb-2">
          {appConfig.name} v{appConfig.version}
        </Text>
        <Text style={{color: colors.secondaryText}} className="text-base">
          {appConfig.author.name} © {new Date().getFullYear()}
        </Text>
      </View>

      {/* Delete Account Section */}
      <TouchableOpacity
        style={{backgroundColor: isDark ? colors.surface : '#fecdd3'}}
        className="p-2.5 rounded-2xl absolute top-4 right-5"
        onPress={() => setShowDeleteModal(true)}>
        <Icon name="delete" size={20} color="#e11d48" />
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <BlurView
          style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
          blurType="dark"
          blurAmount={7}
          reducedTransparencyFallbackColor="white">
          <View
            style={{backgroundColor: colors.surface}}
            className="w-[90%] rounded-2xl p-6">
            <Text
              style={{color: colors.text}}
              className="text-lg font-bold mb-4">
              Are you sure you want to delete your account?
            </Text>
            <Text className="text-slate-600 dark:text-slate-300 mb-6">
              This action cannot be undone. All your data will be permanently
              removed.
            </Text>
            <View className="flex-row justify-end space-x-4">
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Text className="text-slate-600 dark:text-slate-300 p-3">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Text className="text-red-600 dark:text-red-400 p-3">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      <SubscriptionModal
        visible={showSubscriptionModal}
        setVisibility={() => setShowSubscriptionModal(false)}
      />
    </ScrollView>
  );
};

export default ProfileScreen;
