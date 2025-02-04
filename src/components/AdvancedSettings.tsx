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
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import {BlurView} from '@react-native-community/blur';

import {artStyles} from '@zenoa/data/styles';
import {aspectRatios} from '@zenoa/data/ratio';
import {AdvancedSettingsProps} from '@zenoa/types';
import {FlashList} from '@shopify/flash-list';

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
          <View className="w-12 h-12"></View>
          <Text className="font-bold text-base text-slate-900 dark:text-white">
            Advanced Settings
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="p-2 bg-slate-200 dark:bg-gray-800 rounded-full">
            <Icon name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 m-4 rounded-3xl bg-white"
          style={{elevation: 100}}
          contentContainerClassName="gap-7 rounded-3xl px-4 py-5 bg-white elevation-xl">
          {/* Style Grid */}
          <View className="gap-4">
            <Text className="text-light-text dark:text-dark-text text-lg font-medium">
              Art Styles
            </Text>
            <FlashList
              data={artStyles}
              renderItem={({item, index}) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  className={`w-full h-full mb-2 ${
                    index % 3 === 0 ? 'mr-2' : ''
                  }`}
                  onPress={() => toggleStyle(item.name)}>
                  <View key={index} className="w-full aspect-square">
                    <View
                      className={`rounded-3xl ${
                        selectedStyles.includes(item.name)
                          ? 'elevation-xl rounded-2xl border-4 border-light-primary dark:border-dark-primary'
                          : ''
                      }`}>
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
                      <View className="absolute top-2 right-2 bg-light-primary dark:border-dark-primary p-1 rounded-full">
                        <Icon name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-900 font-medium">{item.name}</Text>
                </TouchableOpacity>
              )}
              numColumns={3}
            />
            {/* <View className="flex-row flex-wrap gap-3 justify-between">
              {artStyles.map((style, index) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="w-[30%]"
                  onPress={() => toggleStyle(style.name)}>
                  <View key={index} className="w-full aspect-square">
                    <View
                      className={`rounded-3xl ${
                        selectedStyles.includes(style.name)
                          ? 'elevation-xl rounded-2xl border-4 border-light-primary dark:border-dark-primary'
                          : ''
                      }`}>
                      <Image
                        // source={{uri: style.image}}
                        source={style.image}
                        style={{
                          borderRadius: 20,
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    </View>
                    {selectedStyles.includes(style.name) && (
                      <View className="absolute top-2 right-2 bg-light-primary dark:border-dark-primary p-1 rounded-full">
                        <Icon name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-900 font-medium">
                    {style.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View> */}
          </View>

          {/* Aspect Ratio Section */}
          <View>
            <Text className="text-light-text dark:text-dark-text text-lg font-medium mb-4">
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
                  className={`px-5 py-3 rounded-2xl ${
                    aspectRatio.ratio === ratio.ratio
                      ? 'elevation-xl bg-light-primary dark:bg-dark-primary'
                      : 'bg-light-secondary dark:bg-dark-secondary'
                  }`}>
                  <Text
                    className={`text-lg ${
                      aspectRatio.ratio === ratio.ratio
                        ? 'text-light-secondary dark:text-dark-secondary'
                        : 'text-light-text dark:text-dark-light'
                    } font-medium`}>
                    {ratio.ratio}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Size Selection */}
          <View>
            <Text className="text-light-text dark:text-dark-text text-lg font-medium mb-3">
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
                  className={`flex-1 p-3 rounded-2xl ${
                    aspectRatio.size === size
                      ? 'elevation-xl bg-light-primary dark:bg-dark-primary'
                      : 'bg-light-secondary dark:bg-dark-secondary'
                  }`}>
                  <Text
                    className={`text-center text-sm ${
                      aspectRatio.size === size
                        ? 'text-light-secondary dark:text-dark-secondary'
                        : 'text-light-text dark:text-dark-light'
                    }`}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                  <Text
                    className={`text-center text-base ${
                      aspectRatio.size === size
                        ? 'text-light-secondary dark:text-dark-secondary'
                        : 'text-light-text dark:text-dark-light'
                    }`}>
                    {resolution}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Batch Count */}
          <View>
            <Text className="text-light-text dark:text-dark-text text-lg font-medium mb-3">
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
                  className={`w-16 h-16 items-center justify-center rounded-2xl ${
                    numberOfImages === count
                      ? 'elevation-xl bg-light-primary dark:bg-dark-primary'
                      : 'bg-light-secondary dark:bg-dark-secondary'
                  }`}>
                  <Text
                    className={`text-lg ${
                      numberOfImages === count
                        ? 'text-light-secondary dark:text-dark-secondary'
                        : 'text-light-text dark:text-dark-light'
                    }`}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row gap-4">
            {/* Quality Picker */}
            <View className="flex-1">
              <Text className="text-light-text dark:text-dark-text text-lg font-medium mb-3">
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
                className="bg-light-secondary dark:bg-dark-secondary p-5 rounded-2xl">
                <Text className="dark:text-white text-lg">
                  {qualityPresets.find(q => q.value === quality)?.label}
                </Text>
              </TouchableOpacity>

              {showQualityPicker && (
                <View className="absolute bottom-0 translate-y-0 w-full z-10 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
                  {qualityPresets.map((q, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        LayoutAnimation.spring();
                        setQuality(q.value);
                        setShowQualityPicker(false);
                      }}
                      className="p-5 border-b border-gray-200 dark:border-gray-700">
                      <Text className="dark:text-white text-lg">{q.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Sampler Picker */}
            <View className="flex-1">
              <Text className="text-light-text dark:text-dark-text text-lg font-medium mb-3">
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
                className="bg-light-secondary dark:bg-dark-secondary p-5 rounded-2xl">
                <Text className="dark:text-white text-lg">{sampler}</Text>
              </TouchableOpacity>

              {showSamplerPicker && (
                <View className="absolute bottom-0 translate-y-0 w-full z-10 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
                  {samplers.map((s, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        LayoutAnimation.spring();
                        setSampler(s);
                        setShowSamplerPicker(false);
                      }}
                      className="p-5 border-b border-gray-200 dark:border-gray-700">
                      <Text className="dark:text-white text-base">{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Seed Input */}
          <View>
            <Text className="text-light-text dark:text-dark-text text-lg font-medium mb-3">
              Seed
            </Text>
            <TextInput
              value={seed}
              onChangeText={setSeed}
              placeholder="Random"
              keyboardType="numeric"
              className="bg-light-secondary dark:bg-dark-secondary p-5 rounded-2xl dark:text-white"
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Negative Prompt */}
          <View>
            <Text className="text-light-text dark:text-dark-text text-lg font-medium mb-3">
              Negative Prompt
            </Text>
            <TextInput
              value={negativePrompt}
              onChangeText={setNegativePrompt}
              placeholder="What to exclude..."
              multiline
              className="bg-light-secondary dark:bg-dark-secondary p-5 rounded-2xl dark:text-white"
              placeholderTextColor="#6B7280"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default AdvancedSettings;
