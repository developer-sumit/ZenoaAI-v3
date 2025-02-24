import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import React from 'react';
import FastImage from 'react-native-fast-image';
import {BlurView} from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';

const FeatureItem = ({icon, title}: {icon: string; title: string}) => (
  <View className="flex-row items-center py-2">
    <Icon name={icon} size={20} color="#9333ea" />
    <Text className="text-slate-600 dark:text-slate-300 ml-3">{title}</Text>
  </View>
);

export default function SubscriptionModal({
  visible,
  setVisibility,
}: {
  visible: boolean;
  setVisibility: (event: GestureResponderEvent) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
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
            <FastImage
              source={require('@src/assets/favicon.png')} // Add your premium image
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
                  activeOpacity={0.8}
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
            // onPress={() => setShowSubscriptionModal(false)}
            onPress={setVisibility}
            activeOpacity={0.8}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
