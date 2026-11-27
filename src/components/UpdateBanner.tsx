import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useTheme} from '@src/store/themeStore';
import {useHaptics} from '@src/hooks/useHaptics';

import StarIcon from '@src/assets/icons/StarIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import SparklesIcon from '@src/assets/icons/SparklesIcon';

export default function UpdateBanner() {
  const {theme} = useTheme();
  const {triggerHaptic} = useHaptics();

  return (
    <View className="mx-6 mb-4">
      <View
        className="p-5 rounded-3xl relative overflow-hidden"
        style={{
          backgroundColor: theme.primary,
          borderWidth: 1,
          borderColor: theme.primary + '20',
        }}>
        {/* Background decorative elements */}
        <View className="absolute -top-4 -right-4 opacity-20">
          <SparklesIcon size={48} color="#ffffff" />
        </View>
        <View className="absolute -bottom-2 -left-2 opacity-10">
          <StarIcon size={32} color="#ffffff" />
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center"
          style={{backgroundColor: 'rgba(255, 255, 255, 0.2)'}}
          onPress={() => {
            triggerHaptic('light');
            // setShowUpdateBanner(false);
          }}>
          <CloseIcon size={16} color="#ffffff" />
        </TouchableOpacity>

        <View className="flex-row items-center pr-10">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{backgroundColor: 'rgba(255, 255, 255, 0.2)'}}>
            <SparklesIcon size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text
              className="text-xl font-bold mb-1"
              style={{color: '#ffffff', fontFamily: 'Poppins-Bold'}}>
              New Features Available! ✨
            </Text>
            <Text
              className="text-base opacity-90 mb-3"
              style={{color: '#ffffff', fontFamily: 'Poppins-Regular'}}>
              Advanced AI models, new art styles & faster generation
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                // Navigate to what's new or features screen
                triggerHaptic('light');
              }}>
              <View
                className="px-4 py-2.5 rounded-2xl self-start"
                style={{backgroundColor: 'rgba(255, 255, 255, 0.25)'}}>
                <Text
                  className="font-semibold text-sm"
                  style={{color: '#ffffff', fontFamily: 'Poppins-SemiBold'}}>
                  Explore Updates
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
