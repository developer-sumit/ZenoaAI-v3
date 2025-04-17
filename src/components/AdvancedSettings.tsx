import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  ScrollView,
  LayoutAnimation,
  TouchableOpacity,
  Image,
  BackHandler,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from '@react-native-community/blur';

import Icon from './Icon';
import { theme } from '@src/theme/Theme';
import { artStyles } from '@src/data/styles';
import { aspectRatios } from '@src/data/ratio';
import { AdvancedSettingsProps } from '@src/types';
import { useThemeStore } from '@src/store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  visible,
  onClose,
  selectedStyles,
  setSelectedStyles,
  aspectRatio,
  setAspectRatio,
  numberOfImages,
  setNumberOfImages,
  quality,
  setQuality,
  seed,
  setSeed,
  sampler,
  setSampler,
  negativePrompt,
  setNegativePrompt,
  qualityPresets,
  samplers,
}) => {
  const { isDark } = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;
  const [selectedRatio, setSelectedRatio] = useState(aspectRatio);
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const [showSamplerPicker, setShowSamplerPicker] = useState(false);

  const seedInputRef = useRef<TextInput>(null);
  const negativePromptRef = useRef<TextInput>(null);

  const keyExtractor = React.useCallback((item: any) => item.name, []);

  const toggleStyle = (styleName: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setSelectedStyles(prevStyles => {
      const newStyles = prevStyles.includes(styleName)
        ? prevStyles.filter(s => s !== styleName)
        : [...prevStyles, styleName];
      return newStyles;
    });
  };

  const renderStyleItem = React.useCallback(
    ({ item }: { item: any; index: number }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        className="w-full h-full mb-2 p-1"
        onPress={() => toggleStyle(item.name)}>
        <View className="w-full aspect-square">
          <View
            className="w-full h-full rounded-[20px] overflow-hidden"
            style={{
              borderWidth: selectedStyles.includes(item.name) ? 4 : 0,
              borderColor: colors.primary,
            }}>
            <Image
              source={item.image}
              className="w-full h-full"
              style={{ borderRadius: selectedStyles.includes(item.name) ? 16 : 20 }}
            />
          </View>
          {selectedStyles.includes(item.name) && (
            <View
              style={{ backgroundColor: colors.primary }}
              className="absolute top-2 right-2 p-1 rounded-full">
              <Icon name="checkmark" size={16} color="white" />
            </View>
          )}
        </View>
        <Text className="font-medium mt-1" style={{ color: colors.text }}>
          {item.name}
        </Text>
      </TouchableOpacity>
    ),
    [selectedStyles, colors],
  );

  const styleGridItems = React.useMemo(
    () => (
      <FlashList
        data={artStyles}
        estimatedItemSize={151}
        renderItem={renderStyleItem}
        keyExtractor={keyExtractor}
        extraData={selectedStyles}
        numColumns={3}
        removeClippedSubviews={true}
      />
    ),
    [artStyles, renderStyleItem, keyExtractor, selectedStyles],
  );

  const aspectRatioOptions = React.useMemo(
    () => (
      <View className="flex-row flex-wrap gap-3">
        {aspectRatios.map((ratio, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              LayoutAnimation.spring();
              setAspectRatio({ ...ratio, size: 'medium' });
              setSelectedRatio(ratio);
            }}
            style={{
              shadowColor: colors.primary,
              backgroundColor:
                aspectRatio.ratio === ratio.ratio
                  ? colors.primary
                  : colors.surface,
            }}
            className={`px-5 py-3 rounded-2xl ${aspectRatio.ratio === ratio.ratio ? 'elevation-xl' : ''
              }`}>
            <Text
              style={{
                color:
                  aspectRatio.ratio === ratio.ratio
                    ? isDark
                      ? colors.text
                      : 'white'
                    : colors.secondaryText,
              }}
              className="text-lg font-medium">
              {ratio.ratio}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    [aspectRatios, aspectRatio, colors, isDark, setAspectRatio],
  );

  // Close pickers when touching outside
  const dismissAllPickers = React.useCallback(() => {
    if (showQualityPicker || showSamplerPicker) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowQualityPicker(false);
      setShowSamplerPicker(false);
      return true;
    }
    return false;
  }, [showQualityPicker, showSamplerPicker]);

  useEffect(() => {
    const backAction = () => {
      console.log('Back button pressed, modal visible:', visible); // Debug logging

      if (!visible) { return false; }

      // First handle open pickers
      if (showQualityPicker || showSamplerPicker) {
        console.log('Closing pickers');
        dismissAllPickers();
        return true;
      }

      // Close the modal if no pickers are open
      console.log('Closing modal');
      onClose();
      return true;
    };

    // Add event listener with higher priority
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    // Make sure to clean up
    return () => {
      console.log('Removing back handler');
      backHandler.remove();
    };
  }, [visible, showQualityPicker, showSamplerPicker, onClose, dismissAllPickers]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        // This provides an additional layer of back button handling
        if (showQualityPicker || showSamplerPicker) {
          dismissAllPickers();
        } else {
          onClose();
        }
      }}>
      <BlurView
        style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
        blurType={isDark ? "dark" : "light"}
        blurAmount={10}
      />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center py-3 px-7">
          <View className="w-12 h-12" />
          <Text style={{ color: colors.text }} className="font-bold text-base">
            Advanced Settings
          </Text>
          <TouchableOpacity
            onPress={() => {
              dismissAllPickers();
              onClose();
            }}
            style={{ backgroundColor: colors.surface }}
            className="p-2 rounded-full">
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 m-4 rounded-3xl"
          style={{ elevation: 100 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ backgroundColor: colors.background }}
          contentContainerClassName="gap-7 rounded-3xl px-4 py-5 bg-white elevation-xl"
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          overScrollMode="never">
          {/* Style Grid */}
          <View className="gap-4">
            <Text
              style={{ color: colors.secondaryText }}
              className="text-lg font-medium">
              Art Styles
            </Text>
            {styleGridItems}
          </View>

          {/* Aspect Ratio Section */}
          <View>
            <Text
              style={{ color: colors.secondaryText }}
              className="text-lg font-medium mb-4">
              Aspect Ratio
            </Text>
            {aspectRatioOptions}
          </View>

          {/* Size Selection */}
          <View>
            <Text
              style={{ color: colors.secondaryText }}
              className="text-lg font-medium mb-3">
              Image Size
            </Text>
            <View className="flex-row gap-2">
              {Object.entries(selectedRatio.sizes).map(([size, resolution]) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => {
                    LayoutAnimation.spring();
                    setAspectRatio({
                      ...selectedRatio,
                      size: size as 'small' | 'medium' | 'large',
                    });
                  }}
                  style={{
                    shadowColor: colors.primary,
                    backgroundColor:
                      aspectRatio.size === size
                        ? colors.primary
                        : colors.surface,
                  }}
                  className={`flex-1 p-3 rounded-2xl ${aspectRatio.size === size ? 'elevation-xl' : ''
                    }`}>
                  <Text
                    style={{
                      color:
                        aspectRatio.size === size
                          ? isDark
                            ? colors.text
                            : 'white'
                          : colors.secondaryText,
                    }}
                    className="text-center text-sm">
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                  <Text
                    style={{
                      color:
                        aspectRatio.size === size
                          ? isDark
                            ? colors.text
                            : 'white'
                          : colors.secondaryText,
                    }}
                    className="text-center text-base">
                    {resolution}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Batch Count */}
          <View>
            <Text
              style={{ color: colors.secondaryText }}
              className="text-lg font-medium mb-3">
              Batch Count
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[1, 2, 4, 6, 9].map((count, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    LayoutAnimation.spring();
                    setNumberOfImages(count);
                  }}
                  style={{
                    backgroundColor:
                      numberOfImages === count
                        ? colors.primary
                        : colors.surface,
                  }}
                  className={`w-16 h-16 items-center justify-center rounded-2xl ${numberOfImages === count ? 'elevation-xl' : ''
                    }`}>
                  <Text
                    style={{
                      shadowColor: colors.primary,
                      color:
                        numberOfImages === count
                          ? isDark
                            ? colors.text
                            : 'white'
                          : colors.secondaryText,
                    }}
                    className="text-lg">
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row gap-4">
            {/* Quality Picker */}
            <View className="flex-1">
              <Text
                style={{ color: colors.secondaryText }}
                className="text-lg font-medium mb-3">
                Quality
              </Text>
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setShowQualityPicker(!showQualityPicker);
                  setShowSamplerPicker(false); // Close other picker
                }}
                style={{ backgroundColor: colors.surface }}
                className="p-5 rounded-2xl">
                <Text style={{ color: colors.text }} className="text-lg">
                  {qualityPresets.find(q => q.value === quality)?.label}
                </Text>
              </TouchableOpacity>

              {showQualityPicker && (
                <View
                  style={{ backgroundColor: colors.surface }}
                  className="absolute bottom-0 translate-y-0 w-full z-10 rounded-2xl overflow-hidden">
                  {qualityPresets.map((q, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        LayoutAnimation.spring();
                        setQuality(q.value);
                        setShowQualityPicker(false);
                      }}
                      className="p-5 border-b border-gray-200 dark:border-gray-700">
                      <Text style={{ color: colors.text }} className="text-lg">
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Sampler Picker */}
            <View className="flex-1">
              <Text
                style={{ color: colors.secondaryText }}
                className="text-lg font-medium mb-3">
                Sampler
              </Text>
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setShowSamplerPicker(!showSamplerPicker);
                  setShowQualityPicker(false); // Close other picker
                }}
                style={{ backgroundColor: colors.surface }}
                className="p-5 rounded-2xl">
                <Text style={{ color: colors.text }} className="text-lg">
                  {sampler}
                </Text>
              </TouchableOpacity>

              {showSamplerPicker && (
                <View
                  style={{ backgroundColor: colors.surface }}
                  className="absolute bottom-0 translate-y-0 w-full z-10 rounded-2xl overflow-hidden">
                  {samplers.map((s, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        LayoutAnimation.spring();
                        setSampler(s);
                        setShowSamplerPicker(false);
                      }}
                      className="p-5 border-b">
                      <Text style={{ color: colors.text }} className="text-base">
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Seed Input */}
          <View>
            <Text
              style={{ color: colors.secondaryText }}
              className="text-lg font-medium mb-3">
              Seed
            </Text>
            <TextInput
              ref={seedInputRef}
              value={seed}
              onChangeText={setSeed}
              placeholder="Random"
              keyboardType="numeric"
              className="p-5 rounded-2xl"
              style={{ backgroundColor: colors.surface, color: colors.text }}
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Negative Prompt */}
          <View>
            <Text
              style={{ color: colors.secondaryText }}
              className="text-lg font-medium mb-3">
              Negative Prompt
            </Text>
            <TextInput
              ref={negativePromptRef}
              value={negativePrompt}
              onChangeText={setNegativePrompt}
              placeholder="What to exclude..."
              multiline
              numberOfLines={4}
              className="p-5 rounded-2xl"
              textAlignVertical="top"
              style={{ backgroundColor: colors.surface, color: colors.text, minHeight: 100 }}
              placeholderTextColor="#6B7280"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default React.memo(AdvancedSettings);
