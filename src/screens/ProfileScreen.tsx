import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useAuthStore} from '@src/store/authStore';
import {theme} from '@src/theme/Theme';
import appConfig from '@src/config/app.config';
import {useThemeStore} from '@src/store/themeStore';
import {useNavigation} from '@react-navigation/native';
import Routes from '@src/constants/routes';
import PersonIcon from '@src/assets/icons/PersonIcon';
import ChevronRightIcon from '@src/assets/icons/ChevronRightIcon';
import DarkModeIcon from '@src/assets/icons/DarkModeIcon';
import LightModeIcon from '@src/assets/icons/LightModeIcon';
import {openPrivacyPolicy, openTermsOfService} from '@src/utils/linkHelper';

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
      isPro: false,
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
              <PersonIcon
                size={20}
                color={colors.primary}
                style={{marginRight: 10}}
              />
              <Text style={{color: colors.text}}>Edit Profile</Text>
            </View>
            <ChevronRightIcon size={20} color={colors.secondaryText} />
          </View>
        </TouchableOpacity>

        {/* Dark Mode Option */}
        <View className="flex-row justify-between items-center py-3">
          <View className="flex-row items-center">
            {isDark ? (
              <DarkModeIcon
                size={20}
                color={colors.primary}
                style={{marginRight: 10}}
              />
            ) : (
              <LightModeIcon
                size={20}
                color={colors.primary}
                style={{marginRight: 10}}
              />
            )}
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

      {/* Privacy & Terms Section */}
      <View
        style={{backgroundColor: colors.surface}}
        className="rounded-3xl p-4 mb-6">
        <Text
          className="text-lg font-semibold mb-4"
          style={{color: colors.secondaryText}}>
          Legal
        </Text>

        <TouchableOpacity
          onPress={openTermsOfService}
          className="flex-row items-center py-2 justify-between">
          <Text style={{color: colors.text}} className="text-base">
            Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openPrivacyPolicy}
          className="flex-row items-center py-2 justify-between">
          <Text style={{color: colors.text}} className="text-base">
            Terms of Service
          </Text>
        </TouchableOpacity>
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
    </ScrollView>
  );
};

export default ProfileScreen;
