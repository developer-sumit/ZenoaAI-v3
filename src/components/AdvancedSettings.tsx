import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  ScrollView,
  LayoutAnimation,
  TouchableOpacity,
  Image,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import Icon from 'react-native-vector-icons/Ionicons';
import {BlurView} from '@react-native-community/blur';

import {theme} from '@src/theme/Theme';
import {artStyles} from '@src/data/styles';
import {aspectRatios} from '@src/data/ratio';
import {AdvancedSettingsProps} from '@src/types';
import {useThemeStore} from '@src/store/themeStore';

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
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;
  const [selectedRatio, setSelectedRatio] = useState(aspectRatio);
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const [showSamplerPicker, setShowSamplerPicker] = useState(false);

  const toggleStyle = (styleName: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setSelectedStyles(
      selectedStyles.includes(styleName)
        ? selectedStyles.filter(s => s !== styleName)
        : [...selectedStyles, styleName],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1">
        <BlurView
          style={{flex: 1, position: 'absolute', width: '100%', height: '100%'}}
          blurType="light"
          blurAmount={10}
        />
        {/* Header */}
        <View className="flex-row justify-between items-center py-3 px-7">
          <View className="w-12 h-12" />
          <Text style={{color: colors.text}} className="font-bold text-base">
            Advanced Settings
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{backgroundColor: colors.surface}}
            className="p-2 rounded-full">
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 m-4 rounded-3xl"
          style={{elevation: 100}}
          contentContainerStyle={{backgroundColor: colors.background}}
          contentContainerClassName="gap-7 rounded-3xl px-4 py-5 bg-white elevation-xl">
          {/* Style Grid */}
          <View className="gap-4">
            <Text
              style={{color: colors.secondaryText}}
              className="text-lg font-medium">
              Art Styles
            </Text>
            <FlashList
              data={artStyles}
              estimatedItemSize={151}
              renderItem={({item, index}) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="w-full h-full mb-2 p-1"
                  onPress={() => toggleStyle(item.name)}>
                  <View key={index} className="w-full aspect-square">
                    <View
                      style={{borderRadius: 20, borderColor: colors.primary}}
                      className={
                        selectedStyles.includes(item.name)
                          ? 'elevation-xl border-4'
                          : ''
                      }>
                      <Image
                        source={item.image}
                        style={{
                          borderRadius: 20,
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    </View>
                    {selectedStyles.includes(item.name) && (
                      <View
                        style={{backgroundColor: colors.primary}}
                        className="absolute top-2 right-2 p-1 rounded-full">
                        <Icon name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </View>
                  <Text
                    className="font-medium mt-1"
                    style={{color: colors.text}}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              numColumns={3}
            />
          </View>

          {/* Aspect Ratio Section */}
          <View>
            <Text
              style={{color: colors.secondaryText}}
              className="text-lg font-medium mb-4">
              Aspect Ratio
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {aspectRatios.map((ratio, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    LayoutAnimation.spring();
                    setAspectRatio({...ratio, size: 'medium'});
                    setSelectedRatio(ratio);
                  }}
                  style={{
                    shadowColor: colors.primary,
                    backgroundColor:
                      aspectRatio.ratio === ratio.ratio
                        ? colors.primary
                        : colors.surface,
                  }}
                  className={`px-5 py-3 rounded-2xl ${
                    aspectRatio.ratio === ratio.ratio ? 'elevation-xl' : ''
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
          </View>

          {/* Size Selection */}
          <View>
            <Text
              style={{color: colors.secondaryText}}
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
                  className={`flex-1 p-3 rounded-2xl ${
                    aspectRatio.size === size ? 'elevation-xl' : ''
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
              style={{color: colors.secondaryText}}
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
                  className={`w-16 h-16 items-center justify-center rounded-2xl ${
                    numberOfImages === count ? 'elevation-xl' : ''
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
                style={{color: colors.secondaryText}}
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
                style={{backgroundColor: colors.surface}}
                className="p-5 rounded-2xl">
                <Text style={{color: colors.text}} className="text-lg">
                  {qualityPresets.find(q => q.value === quality)?.label}
                </Text>
              </TouchableOpacity>

              {showQualityPicker && (
                <View
                  style={{backgroundColor: colors.surface}}
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
                      <Text style={{color: colors.text}} className="text-lg">
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
                style={{color: colors.secondaryText}}
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
                style={{backgroundColor: colors.surface}}
                className="p-5 rounded-2xl">
                <Text style={{color: colors.text}} className="text-lg">
                  {sampler}
                </Text>
              </TouchableOpacity>

              {showSamplerPicker && (
                <View
                  style={{backgroundColor: colors.surface}}
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
                      <Text style={{color: colors.text}} className="text-base">
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
              style={{color: colors.secondaryText}}
              className="text-lg font-medium mb-3">
              Seed
            </Text>
            <TextInput
              value={seed}
              onChangeText={setSeed}
              placeholder="Random"
              keyboardType="numeric"
              className="p-5 rounded-2xl dark:text-white"
              style={{backgroundColor: colors.surface}}
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Negative Prompt */}
          <View>
            <Text
              style={{color: colors.secondaryText}}
              className="text-lg font-medium mb-3">
              Negative Prompt
            </Text>
            <TextInput
              value={negativePrompt}
              onChangeText={setNegativePrompt}
              placeholder="What to exclude..."
              multiline
              className="p-5 rounded-2xl dark:text-white"
              style={{backgroundColor: colors.surface}}
              placeholderTextColor="#6B7280"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default AdvancedSettings;
