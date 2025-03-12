import React, {useState, useEffect, useCallback} from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Platform,
  UIManager,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useAuthStore} from '@src/store/authStore';
import {theme} from '@src/theme/Theme';
import appConfig from '@src/config/app.config';
import {useThemeStore} from '@src/store/themeStore';
import SubscriptionModal from '@src/components/SubscriptionModal';
import {useToast} from '@src/components/Toast';
import {useNavigation} from '@react-navigation/native';
import Routes from '@src/constants/routes';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const PLACEHOLDER_IMAGE = require('@src/assets/favicon.png');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {user, logout} = useAuthStore();
  const {isDark, toggleTheme} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isLocalImage, setIsLocalImage] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

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
      isPro: false, // Would come from user subscription status
      isLocalImage,
    };
  };

  const currentProfile = getProfileData();

  const renderAvatar = (
    imageUri: string,
    size: number,
    localImage = isLocalImage,
  ) => {
    if (localImage) {
      return (
        <Image
          source={PLACEHOLDER_IMAGE}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#0077b6',
          }}
          resizeMode="cover"
        />
      );
    } else {
      return (
        <FastImage
          source={{uri: imageUri}}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode={FastImage.resizeMode.cover}
        />
      );
    }
  };

  return (
    <ScrollView
      style={{backgroundColor: colors.background}}
      className="flex-1"
      contentContainerClassName="pb-[150px] pt-10 px-5">
      {/* User Profile Section */}
      <View className="items-center mb-8">
        {/* Profile Info */}
        <View className="items-center">
          <View style={{marginBottom: 16}}>
            {renderAvatar(currentProfile.avatar, 160)}
          </View>

          <Text className="text-2xl font-bold" style={{color: colors.text}}>
            {currentProfile.name}
          </Text>

          <Text style={{color: colors.secondaryText}} className="mt-1 mb-4">
            {currentProfile.email}
          </Text>
        </View>
      </View>

      {/* Account Settings */}
      <View
        className="rounded-3xl p-4 mb-6"
        style={{backgroundColor: colors.surface}}>
        <Text
          className="text-lg font-semibold mb-4"
          style={{color: colors.secondaryText}}>
          Account
        </Text>

        {/* Edit Profile Option */}
        <TouchableOpacity
          className="py-3 border-b"
          style={{borderColor: colors.secondaryText + '50'}}
          onPress={handleEditProfile}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Icon
                name="person"
                size={20}
                color={colors.primary}
                style={{marginRight: 10}}
              />
              <Text style={{color: colors.text}}>Edit Profile</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.secondaryText} />
          </View>
        </TouchableOpacity>

        {/* Dark Mode Option */}
        <View
          style={{borderColor: colors.secondaryText + '50'}}
          className="flex-row justify-between items-center py-3 border-b">
          <View className="flex-row items-center">
            <Icon
              name={isDark ? 'dark-mode' : 'light-mode'}
              size={20}
              color={colors.primary}
              style={{marginRight: 10}}
            />
            <Text style={{color: colors.text}}>Dark Mode</Text>
          </View>
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

        {/* Upgrade to Pro */}
        <TouchableOpacity
          className="py-3"
          onPress={() => setShowSubscriptionModal(true)}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Icon
                name="star"
                size={20}
                color={currentProfile.isPro ? colors.primary : colors.secondary}
                style={{marginRight: 10}}
              />
              <Text
                style={{
                  color: currentProfile.isPro ? colors.primary : colors.text,
                }}>
                {currentProfile.isPro ? 'Pro Member 🎉' : 'Upgrade to Pro'}
              </Text>
            </View>
            {!currentProfile.isPro && (
              <Icon
                name="chevron-right"
                size={20}
                color={colors.secondaryText}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View
        style={{backgroundColor: colors.surface}}
        className="rounded-3xl p-4 mb-6">
        <Text
          className="text-lg font-semibold mb-4"
          style={{color: colors.secondaryText}}>
          About
        </Text>
        <Text style={{color: colors.text}} className="text-base mb-2">
          {appConfig.name} v{appConfig.version}
        </Text>
        <Text style={{color: colors.secondaryText}} className="text-base">
          {appConfig.author.name}
        </Text>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        className="p-4 rounded-2xl mb-4 items-center"
        style={{backgroundColor: colors.surface}}
        onPress={logout}>
        <Text style={{color: '#e11d48'}} className="font-medium">
          Sign Out
        </Text>
      </TouchableOpacity>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </ScrollView>
  );
};

export default ProfileScreen;
