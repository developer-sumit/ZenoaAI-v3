import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useTheme} from '@src/store/themeStore';
import {useHaptics} from '@src/hooks/useHaptics';

import StarIcon from '@src/assets/icons/StarIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import useToast from '@src/hooks/useToast';

export default function PromotionalBanner() {
  const {theme} = useTheme();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();

  return (
    <View className="mx-6 mb-4">
      <View
        className="p-5 rounded-3xl border-2"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.primary + '30',
          borderStyle: 'dashed',
        }}>
        {/* Dismiss button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center"
          style={{backgroundColor: theme.background}}
          onPress={() => {
            triggerHaptic('light');
            // setShowPromoBanner(false);
          }}>
          <CloseIcon size={16} color={theme.secondaryText} />
        </TouchableOpacity>

        <View className="flex-row items-center pr-10">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{backgroundColor: theme.primary + '20'}}>
            <StarIcon size={24} color={theme.primary} />
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-bold mb-1"
              style={{color: theme.text, fontFamily: 'Poppins-Bold'}}>
              🎉 Limited Time Offer
            </Text>
            <Text
              className="text-base opacity-80 mb-3"
              style={{
                color: theme.secondaryText,
                fontFamily: 'Poppins-Regular',
              }}>
              Get 50% off Premium plan. Unlock unlimited generations!
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('light');
                showToast('Redirecting to subscription...', 'info');
              }}>
              <View
                className="px-4 py-2.5 rounded-2xl self-start"
                style={{backgroundColor: theme.primary}}>
                <Text
                  className="font-semibold text-sm"
                  style={{color: '#ffffff', fontFamily: 'Poppins-SemiBold'}}>
                  Claim Offer
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
