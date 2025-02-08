import appConfig from '@zenoa/config/app.config';
import React, {useState} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import {BlurView} from '@react-native-community/blur';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';

const ProfileScreen = () => {
  const [user] = useState({
    name: appConfig.author.name,
    email: 'test@example.com',
    avatar: appConfig.author.avatar,
    isPro: false,
  });

  const [darkMode, setDarkMode] = useState(false);
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

  const SubscriptionPlansModal = () => (
    <Modal visible={showSubscriptionModal} transparent animationType="fade">
      <BlurView
        style={{flex: 1, justifyContent: 'center'}}
        blurType="dark"
        blurAmount={10}
        reducedTransparencyFallbackColor="white">
        <Animated.View
          className="bg-white dark:bg-gray-800 mx-4 rounded-3xl overflow-hidden"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}>
          {/* Header Section */}
          <View className="bg-purple-600 dark:bg-purple-800 p-6">
            <Image
              source={require('@zenoa/assets/favicon.png')} // Add your premium image
              className="w-full h-32 mb-4"
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold text-white text-center">
              Unlock Premium Features
            </Text>
          </View>

          <ScrollView className="max-h-[70vh] p-6">
            {/* Pricing Cards */}
            <View className="space-y-4">
              {/* Yearly Plan */}
              <View className="relative bg-purple-50 dark:bg-gray-700 p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-900">
                <View className="absolute top-2 right-2 bg-purple-600 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs font-medium">
                    Best Value
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Icon name="stars" size={24} color="#9333ea" />
                  <Text className="text-lg font-semibold text-purple-600 dark:text-purple-300 ml-2">
                    Annual Plan
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  $99.99
                  <Text className="text-base text-slate-500 dark:text-slate-400">
                    /year
                  </Text>
                </Text>
                <Text className="text-green-500 text-sm mt-1">
                  Save 20% compared to monthly
                </Text>

                <View className="mt-4 space-y-2">
                  <View className="flex-row items-center">
                    <Icon name="check-circle" size={18} color="#4BB543" />
                    <Text className="text-slate-600 dark:text-slate-300 ml-2 text-sm">
                      Unlimited AI Generations
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Icon name="check-circle" size={18} color="#4BB543" />
                    <Text className="text-slate-600 dark:text-slate-300 ml-2 text-sm">
                      Premium Support
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Icon name="check-circle" size={18} color="#4BB543" />
                    <Text className="text-slate-600 dark:text-slate-300 ml-2 text-sm">
                      Exclusive Styles & Filters
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-purple-600 dark:bg-purple-700 py-4 rounded-xl mt-4"
                  // onPress={() => handlePurchase('yearly')}
                >
                  <Text className="text-white text-center font-medium">
                    Choose Annual Plan
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Monthly Plan */}
              <View className="bg-white dark:bg-gray-700 p-5 rounded-2xl border border-slate-200 dark:border-gray-600 mt-4">
                <View className="flex-row items-center mb-2">
                  <Icon name="flash-on" size={20} color="#9333ea" />
                  <Text className="text-lg font-semibold text-slate-900 dark:text-slate-200 ml-2">
                    Monthly Plan
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  $9.99
                  <Text className="text-base text-slate-500 dark:text-slate-400">
                    /month
                  </Text>
                </Text>

                <View className="mt-4 space-y-2">
                  <View className="flex-row items-center">
                    <Icon name="check-circle" size={18} color="#4BB543" />
                    <Text className="text-slate-600 dark:text-slate-300 ml-2 text-sm">
                      All Premium Features
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Icon name="check-circle" size={18} color="#4BB543" />
                    <Text className="text-slate-600 dark:text-slate-300 ml-2 text-sm">
                      Cancel Anytime
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  className="border-2 border-purple-600 py-4 rounded-xl mt-4"
                  // onPress={() => handlePurchase('monthly')}
                >
                  <Text className="text-purple-600 dark:text-purple-400 text-center font-medium">
                    Choose Monthly Plan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Features List */}
            <View className="mt-6">
              <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Premium Features Include:
              </Text>
              <View className="space-y-2">
                <FeatureItem icon="image" title="HD Resolution Exports" />
                <FeatureItem icon="palette" title="Exclusive Art Styles" />
                <FeatureItem icon="bolt" title="Priority Generation" />
                <FeatureItem
                  icon="workspace-premium"
                  title="Pro Badge Profile"
                />
              </View>
            </View>

            {/* Footer */}
            <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-6">
              7-day free trial available • Cancel anytime • Privacy Policy
            </Text>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-4 right-4 p-2 rounded-full aspect-square bg-white/50"
            onPress={() => setShowSubscriptionModal(false)}>
            <Icon name="close" size={24} color={darkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );

  // Helper component for features
  const FeatureItem = ({icon, title}: {icon: string; title: string}) => (
    <View className="flex-row items-center py-2">
      <Icon name={icon} size={20} color="#9333ea" />
      <Text className="text-slate-600 dark:text-slate-300 ml-3">{title}</Text>
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-gray-900"
      contentContainerClassName="pb-[150px] pt-10 px-5">
      {/* User Profile Section */}
      <View className="items-center mb-8">
        <View className="relative">
          <Image
            source={{uri: user.avatar}}
            className="h-44 aspect-square rounded-full mb-4"
          />
          <TouchableOpacity
            className="absolute bottom-2 right-0 bg-white dark:bg-gray-700 p-1 rounded-full"
            onPress={handleAvatarChange}>
            <Icon name="edit" size={18} color={darkMode ? '#fff' : '#4f46e5'} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          {isEditingName ? (
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              className="text-2xl font-bold text-slate-900 dark:text-white mr-2"
              autoFocus
            />
          ) : (
            <Text className="text-2xl font-bold text-slate-900 dark:text-white mr-2">
              {editedName}
            </Text>
          )}
          <TouchableOpacity onPress={() => setIsEditingName(!isEditingName)}>
            <Icon name="edit" size={20} color={darkMode ? '#fff' : '#4f46e5'} />
          </TouchableOpacity>
        </View>
        <Text className="text-slate-600 dark:text-slate-300">{user.email}</Text>
      </View>

      {/* Account Settings */}
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6">
        <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Account Settings
        </Text>

        <View className="flex-row justify-between items-center py-3 border-b border-slate-100 dark:border-gray-700">
          <Text className="text-slate-600 dark:text-slate-300">Dark Mode</Text>
          <TouchableOpacity
            className={`w-14 h-8 rounded-full p-1.5 ${
              darkMode ? 'bg-purple-600' : 'bg-slate-200'
            }`}
            onPress={() => setDarkMode(!darkMode)}>
            <View
              className={`w-5 h-5 rounded-full bg-white ${
                darkMode ? 'ml-6' : 'ml-0'
              }`}
            />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center py-3 border-b border-slate-100 dark:border-gray-700">
          <Text className="text-slate-600 dark:text-slate-300">
            Notifications
          </Text>
          <TouchableOpacity
            className={`w-14 h-8 rounded-full p-1.5 ${
              notificationsEnabled ? 'bg-purple-600' : 'bg-slate-200'
            }`}
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
            <Text className={user.isPro ? 'text-green-500' : 'text-purple-600'}>
              {user.isPro ? 'Pro Member 🎉' : 'Upgrade to Pro'}
            </Text>
            {!user.isPro && (
              <Icon name="arrow-forward" size={20} color="#4f46e5" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6">
        <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          About
        </Text>
        <Text className="text-slate-600 dark:text-slate-300 text-base mb-2">
          {appConfig.name} v{appConfig.version}
        </Text>
        <Text className="text-slate-600 dark:text-slate-300 text-base">
          {appConfig.author.name} © {new Date().getFullYear()}
        </Text>
      </View>

      {/* Delete Account Section */}
      <TouchableOpacity
        className="bg-red-100 dark:bg-red-900/30 p-4 rounded-2xl"
        onPress={() => setShowDeleteModal(true)}>
        <Text className="text-red-600 dark:text-red-400 text-center">
          Delete Account
        </Text>
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <BlurView
          style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
          blurType="dark"
          blurAmount={7}
          reducedTransparencyFallbackColor="white">
          <View className="bg-white dark:bg-gray-800 w-[90%] rounded-2xl p-6">
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">
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

      <SubscriptionPlansModal />
    </ScrollView>
  );
};

export default ProfileScreen;
