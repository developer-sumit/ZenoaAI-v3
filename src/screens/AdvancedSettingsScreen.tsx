import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  useRef,
} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  LayoutAnimation,
  TouchableOpacity,
  Platform,
  UIManager,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';

import {theme} from '@src/theme/Theme';
import {artStyles} from '@src/data/styles';
import {aspectRatios} from '@src/data/ratio';
import {ArtStyleType, AspectRatioSizeType, AspectRatioType} from '@src/types';
import {useThemeStore} from '@src/store/themeStore';
import InfoDialog from '@src/components/InfoDialog';
import FastImage from 'react-native-fast-image';

// Icons
import ArrowBackIcon from '@src/assets/icons/ArrowBackIcon';
import CheckmarkIcon from '@src/assets/icons/CheckmarkIcon';
import ChevronDownIcon from '@src/assets/icons/ChevronDownIcon';
import InfoIcon from '@src/assets/icons/InfoIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import SearchIcon from '@src/assets/icons/SearchIcon';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const featureInfo = {
  artStyles: {
    title: 'Art Styles',
    message:
      'Art styles define the visual aesthetic of your generated image. Select multiple styles to combine effects, or choose just one for a focused look. Some styles work well together, while others are better alone.',
  },
  quality: {
    title: 'Image Quality',
    message:
      'Premium quality uses 50 inference steps instead of 25, resulting in more detailed and higher quality images.',
  },
  batchCount: {
    title: 'Batch Count',
    message:
      'Generate multiple images at once with the same prompt. This helps you explore variations without entering the same prompt repeatedly.',
  },
  aspectRatio: {
    title: 'Aspect Ratio',
    message:
      'Choose the proportions of your generated image. Different ratios work better for different use cases: 1:1 for profile pictures, 16:9 for landscapes, 9:16 for mobile wallpapers, etc.',
  },
  imageSize: {
    title: 'Image Size',
    message:
      'Determines the resolution of your generated image. Larger sizes show more detail but take longer to generate.',
  },
  sampler: {
    title: 'Sampler',
    message:
      'The sampler algorithm determines how the AI builds up your image. Different samplers have varying strengths - some are better for photorealistic images while others excel at artistic styles.',
  },
  seed: {
    title: 'Seed Value',
    message:
      'A seed is a number that determines the initial randomness in image generation. Using the same seed with identical settings will produce similar results, which is useful if you want to make small adjustments to a previous image.',
  },
  negativePrompt: {
    title: 'Negative Prompt',
    message:
      "Specify what you DON'T want in your image. This helps avoid unwanted elements like extra limbs, distorted faces, or specific objects that might otherwise appear in the generated image.",
  },
};

interface AdvancedSettingsScreenProps {
  route: {
    params: {
      selectedStyles: string[];
      setSelectedStyles: (styles: string[]) => void;
      aspectRatio: AspectRatioType;
      setAspectRatio: (ratio: AspectRatioType) => void;
      numberOfImages: number;
      setNumberOfImages: (count: number) => void;
      quality: number;
      setQuality: (value: number) => void;
      seed: string;
      setSeed: (value: string) => void;
      sampler: string;
      setSampler: (value: string) => void;
      negativePrompt: string;
      setNegativePrompt: (value: string) => void;
      samplers: string[];
    };
  };
}

const INITIAL_STYLES_TO_SHOW = 9; // Show 9 initial styles (3x3 grid)

const StyleItem = memo(
  ({
    item,
    isSelected,
    onToggle,
    colors,
  }: {
    item: ArtStyleType;
    isSelected: boolean;
    onToggle: () => void;
    colors: any;
    isDark: boolean;
  }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="p-1 mb-2 w-full"
      onPress={onToggle}>
      <View className="aspect-square">
        <View
          className="w-full h-full rounded-2xl overflow-hidden"
          style={{
            borderWidth: isSelected ? 3 : 0,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            elevation: isSelected ? 8 : 0,
          }}>
          <FastImage
            style={{
              width: '100%',
              height: '100%',
              borderRadius: isSelected ? 14 : 16,
            }}
            source={item.image}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        {isSelected && (
          <View className="h-full w-full bg-black/30 absolute rounded-2xl items-center justify-center overflow-hidden">
            <View
              style={{backgroundColor: colors.primary}}
              className="rounded-full p-3">
              <CheckmarkIcon size={40} color="white" />
            </View>
          </View>
        )}
      </View>
      <Text
        className="font-medium mt-1 text-center text-base"
        style={{color: colors.text}}>
        {item.name}
      </Text>
    </TouchableOpacity>
  ),
  // Add equality comparison to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.item === nextProps.item &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.colors === nextProps.colors &&
      prevProps.isDark === nextProps.isDark
    );
  },
);

const SectionHeader = memo(
  ({
    title,
    feature,
    subtitle,
    showInfoDialog,
    colors,
  }: {
    title: string;
    feature: keyof typeof featureInfo;
    subtitle?: string;
    showInfoDialog: (feature: keyof typeof featureInfo) => void;
    colors: any;
  }) => (
    <>
      <View className="flex-row items-center mb-2">
        <Text
          style={{color: colors.secondaryText}}
          className="text-lg font-medium mr-2">
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => showInfoDialog(feature)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <InfoIcon size={18} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>
      {subtitle && (
        <Text style={{color: colors.secondaryText}} className="text-sm mb-3">
          {subtitle}
        </Text>
      )}
    </>
  ),
);

const StylesGrid = memo(
  ({
    data,
    selectedStyles,
    toggleStyle,
    colors,
    isDark,
    showButton = false,
    onShowAllPress = () => {},
    numColumns = 3,
    scrollEnabled = false,
  }: {
    data: ArtStyleType[];
    selectedStyles: string[];
    toggleStyle: (name: string) => void;
    colors: any;
    isDark: boolean;
    showButton?: boolean;
    onShowAllPress?: () => void;
    numColumns?: number;
    scrollEnabled?: boolean;
  }) => {
    // Memoize the render item function to prevent recreations
    const renderItem = useCallback(
      ({item}: {item: ArtStyleType}) => (
        <StyleItem
          item={item}
          isSelected={selectedStyles.includes(item.name)}
          onToggle={() => toggleStyle(item.name)}
          colors={colors}
          isDark={isDark}
        />
      ),
      [data, selectedStyles, toggleStyle, colors, isDark],
    );

    const keyExtractor = useCallback((item: ArtStyleType) => item.id, []);

    return (
      <View className="w-full flex-1">
        <FlashList
          data={data}
          extraData={selectedStyles}
          estimatedItemSize={120}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={numColumns}
          contentContainerStyle={{
            paddingVertical: 4,
            paddingBottom: scrollEnabled ? 65 : 4,
          }}
          scrollEnabled={scrollEnabled}
          removeClippedSubviews={true}
        />

        {/* Show button to view all styles if there are more than the initial ones */}
        {showButton && (
          <TouchableOpacity
            onPress={onShowAllPress}
            style={{backgroundColor: colors.background}}
            className="p-3 mt-2 rounded-2xl flex-row justify-center items-center">
            <Text
              style={{color: colors.primary}}
              className="font-bold text-base">
              View All Art Styles
            </Text>
            <ChevronDownIcon size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.selectedStyles === nextProps.selectedStyles &&
      prevProps.colors === nextProps.colors &&
      prevProps.isDark === nextProps.isDark &&
      prevProps.showButton === nextProps.showButton
    );
  },
);

const ArtStylesDialog = memo(
  ({
    visible,
    onClose,
    colors,
    isDark,
    selectedStyles,
    toggleStyle,
  }: {
    visible: boolean;
    onClose: () => void;
    colors: typeof theme.light | typeof theme.dark;
    isDark: boolean;
    selectedStyles: string[];
    toggleStyle: (styleName: string) => void;
  }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStyles = useMemo(() => {
      if (!searchQuery.trim()) {
        return artStyles;
      }

      const query = searchQuery.toLowerCase().trim();
      return artStyles.filter(style =>
        style.name.toLowerCase().includes(query),
      );
    }, [searchQuery, artStyles]);

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={onClose}>
        <SafeAreaView
          className="flex-1"
          style={{backgroundColor: colors.background}}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-4">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{backgroundColor: colors.surface}}>
              <ArrowBackIcon size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={{color: colors.text}} className="font-bold text-xl">
              All Art Styles
            </Text>
            <View style={{width: 40}} />
          </View>

          {/* Search Bar */}
          <View
            className="mx-4 my-3 rounded-xl flex-row items-center px-3"
            style={{backgroundColor: colors.surface}}>
            <SearchIcon size={28} color={colors.secondaryText} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search styles..."
              placeholderTextColor={colors.secondaryText}
              className="flex-1 py-3 px-2 h-12 text-lg"
              style={{color: colors.text}}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
              accessible={true}
              accessibilityLabel="Search art styles"
              accessibilityHint="Type to filter art styles by name"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessible={true}
                accessibilityLabel="Clear search"
                accessibilityRole="button">
                <CloseIcon size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filtered Styles Grid */}
          {filteredStyles.length > 0 ? (
            <StylesGrid
              data={filteredStyles}
              selectedStyles={selectedStyles}
              toggleStyle={toggleStyle}
              colors={colors}
              isDark={isDark}
              scrollEnabled={true}
            />
          ) : (
            <View className="flex-1 justify-center items-center p-4">
              <Text
                style={{color: colors.secondaryText}}
                className="text-lg text-center">
                No styles found matching "{searchQuery}"
              </Text>
            </View>
          )}

          {/* Selected Styles Counter */}
          {selectedStyles.length > 0 && (
            <View className="px-4 py-2.5 bg-orange-500 border border-white flex-row justify-between items-center absolute bottom-5 self-center w-[90%] rounded-2xl">
              <Text className="text-white font-medium">
                {selectedStyles.length}{' '}
                {selectedStyles.length === 1 ? 'style' : 'styles'} selected
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="bg-white py-2.5 px-4 rounded-full">
                <Text style={{color: '#f97316', fontWeight: 'bold'}}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  },
);

const AdvancedSettingsScreen: React.FC<AdvancedSettingsScreenProps> = ({
  route,
}) => {
  const params = route.params;
  const navigation = useNavigation();
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  // Refs for TextInputs to maintain focus
  const seedInputRef = useRef<TextInput>(null);
  const negativePromptRef = useRef<TextInput>(null);

  // Create local state that mirrors the parent state
  const [localSelectedStyles, setLocalSelectedStyles] = useState<string[]>(
    params.selectedStyles,
  );
  const [localAspectRatio, setLocalAspectRatio] = useState<AspectRatioType>(
    params.aspectRatio,
  );
  const [localNumberOfImages, setLocalNumberOfImages] = useState<number>(
    params.numberOfImages,
  );
  const [localQuality, setLocalQuality] = useState<number>(params.quality);
  const [localSeed, setLocalSeed] = useState<string>(params.seed);
  const [localSampler, setLocalSampler] = useState<string>(params.sampler);
  const [localNegativePrompt, setLocalNegativePrompt] = useState<string>(
    params.negativePrompt,
  );

  const [showSamplerPicker, setShowSamplerPicker] = useState(false);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState({title: '', message: ''});
  const [artStylesDialogVisible, setArtStylesDialogVisible] = useState(false);

  // State to track if keyboard is showing
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Memoize expensive functions
  const showInfoDialog = useCallback((feature: keyof typeof featureInfo) => {
    setDialogContent(featureInfo[feature]);
    setDialogVisible(true);
  }, []);

  // Effect to sync parent state changes to local state (if needed)
  useEffect(() => {
    setLocalSelectedStyles(params.selectedStyles);
    setLocalAspectRatio(params.aspectRatio);
    setLocalNumberOfImages(params.numberOfImages);
    setLocalQuality(params.quality);
    setLocalSeed(params.seed);
    setLocalSampler(params.sampler);
    setLocalNegativePrompt(params.negativePrompt);
  }, [params]);

  // Split art styles into initial and selected that aren't in initial
  const initialStylesToShow = useMemo(() => {
    return artStyles.slice(0, INITIAL_STYLES_TO_SHOW);
  }, []);

  const selectedStylesNotInInitial = useMemo(() => {
    const initialStyleNames = initialStylesToShow.map(style => style.name);
    return artStyles.filter(
      style =>
        !initialStyleNames.includes(style.name) &&
        localSelectedStyles.includes(style.name),
    );
  }, [initialStylesToShow, localSelectedStyles]);

  // Styles to show in the main screen
  const stylesToShow = useMemo(() => {
    return [...initialStylesToShow, ...selectedStylesNotInInitial];
  }, [initialStylesToShow, selectedStylesNotInInitial]);

  // Optimized toggle function with useCallback to prevent recreation on each render
  const toggleStyle = useCallback(
    (styleName: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setLocalSelectedStyles(prevStyles => {
        const newStyles = prevStyles.includes(styleName)
          ? prevStyles.filter(s => s !== styleName)
          : [...prevStyles, styleName];

        // Update parent state
        params.setSelectedStyles(newStyles);
        return newStyles;
      });
    },
    [params],
  );

  return (
    <SafeAreaView
      style={{backgroundColor: colors.background}}
      className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between py-3 px-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{backgroundColor: colors.surface}}>
          <ArrowBackIcon size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={{color: colors.text}} className="font-bold text-xl">
          Advanced Settings
        </Text>
        <View style={{width: 40}} />
      </View>

      {/* Wrap the scrollview in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4"
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none" // Don't dismiss on scroll
          contentInsetAdjustmentBehavior="always" // Adjust content inset when keyboard shows
          removeClippedSubviews={false} // Important: Set to false to maintain input state
        >
          {/* Art Styles Section */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: colors.surface}}>
            <SectionHeader
              title="Art Styles"
              feature="artStyles"
              subtitle="Select one or more styles to apply to your image"
              showInfoDialog={showInfoDialog}
              colors={colors}
            />

            <StylesGrid
              data={stylesToShow}
              selectedStyles={localSelectedStyles}
              toggleStyle={toggleStyle}
              colors={colors}
              isDark={isDark}
              showButton={true}
              onShowAllPress={() => setArtStylesDialogVisible(true)}
            />
          </View>

          {/* Quality Toggle */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: colors.surface}}>
            <SectionHeader
              title="Quality"
              feature="quality"
              showInfoDialog={showInfoDialog}
              colors={colors}
            />

            <View className="flex-row justify-between items-center py-2">
              <View>
                <Text style={{color: colors.text}} className="text-lg">
                  Premium Images
                </Text>
                <Text style={{color: colors.secondaryText}} className="text-xs">
                  Generate higher quality images (50 steps)
                </Text>
              </View>

              <TouchableOpacity
                className="w-14 h-8 rounded-full p-1.5"
                style={{
                  backgroundColor:
                    localQuality === 50 ? colors.primary : '#cbd5e1',
                }}
                onPress={() => {
                  LayoutAnimation.spring();
                  const newQuality = localQuality === 50 ? 25 : 50;
                  setLocalQuality(newQuality);
                  params.setQuality(newQuality);
                }}
                accessible={true}
                accessibilityLabel={
                  localQuality === 50
                    ? 'Turn off premium quality'
                    : 'Turn on premium quality'
                }
                accessibilityRole="switch"
                accessibilityState={{checked: localQuality === 50}}>
                <View
                  className={`w-5 h-5 rounded-full bg-white ${
                    localQuality === 50 ? 'ml-6' : 'ml-0'
                  }`}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Batch Count */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: colors.surface}}>
            <SectionHeader
              title="Batch Count"
              feature="batchCount"
              showInfoDialog={showInfoDialog}
              colors={colors}
            />

            <View className="flex-row flex-wrap gap-2">
              {[1, 2, 4, 6, 8, 10].map((count, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    LayoutAnimation.spring();
                    setLocalNumberOfImages(count);
                    params.setNumberOfImages(count);
                  }}
                  style={{
                    backgroundColor:
                      localNumberOfImages === count
                        ? colors.primary
                        : colors.background,
                    shadowColor: colors.primary,
                    elevation: localNumberOfImages === count ? 8 : 0,
                    minWidth: 55,
                    width: '15%',
                  }}
                  className="px-5 py-2.5 items-center justify-center rounded-xl">
                  <Text
                    style={{
                      color:
                        localNumberOfImages === count
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

          {/* Aspect Ratio and Size */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: colors.surface}}>
            {/* Aspect Ratio Section */}
            <View className="mb-5">
              <SectionHeader
                title="Aspect Ratio"
                feature="aspectRatio"
                showInfoDialog={showInfoDialog}
                colors={colors}
              />

              <View className="flex-row flex-wrap gap-2">
                {aspectRatios.map((ratio, index) => {
                  // Parse ratio string (e.g., "16:9" -> {width: 16, height: 9})
                  const [width, height] = ratio.ratio.split(':').map(Number);

                  // Base size for the visual representation
                  const BASE_SIZE = 24;
                  let displayWidth, displayHeight;

                  // Calculate dimensions while maintaining aspect ratio
                  if (width >= height) {
                    // Landscape or square orientation
                    displayWidth = BASE_SIZE;
                    displayHeight = (height / width) * BASE_SIZE;
                  } else {
                    // Portrait orientation
                    displayHeight = BASE_SIZE;
                    displayWidth = (width / height) * BASE_SIZE;
                  }

                  // Scale up smaller dimension for better visibility
                  const SCALE_FACTOR = 1.5;
                  if (displayWidth < 12) displayWidth *= SCALE_FACTOR;
                  if (displayHeight < 12) displayHeight *= SCALE_FACTOR;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        LayoutAnimation.spring();
                        const newRatio = {
                          ...ratio,
                          size: 'medium' as AspectRatioSizeType,
                        };
                        setLocalAspectRatio(newRatio);
                        params.setAspectRatio(newRatio);
                      }}
                      style={{
                        backgroundColor:
                          localAspectRatio.ratio === ratio.ratio
                            ? colors.primary
                            : colors.background,
                        shadowColor: colors.primary,
                        elevation:
                          localAspectRatio.ratio === ratio.ratio ? 8 : 0,
                      }}
                      className="px-4 py-3 rounded-xl">
                      {/* Aspect ratio visual icon */}
                      <View
                        className="mb-2 items-center justify-center"
                        style={{width: 40, height: 30}}>
                        <View
                          style={{
                            width: displayWidth,
                            height: displayHeight,
                            borderWidth: 2,
                            borderColor:
                              localAspectRatio.ratio === ratio.ratio
                                ? isDark
                                  ? colors.text
                                  : 'white'
                                : colors.secondaryText,
                            borderRadius: 3,
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          color:
                            localAspectRatio.ratio === ratio.ratio
                              ? isDark
                                ? colors.text
                                : 'white'
                              : colors.secondaryText,
                          textAlign: 'center',
                        }}
                        className="text-base font-medium">
                        {ratio.ratio}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Size Selection */}
            <View>
              <SectionHeader
                title="Image Size"
                feature="imageSize"
                showInfoDialog={showInfoDialog}
                colors={colors}
              />

              <View className="flex-row gap-2">
                {Object.entries(localAspectRatio.sizes).map(
                  ([size, resolution]) => (
                    <TouchableOpacity
                      key={size}
                      onPress={() => {
                        LayoutAnimation.spring();
                        const newRatio = {
                          ...localAspectRatio,
                          size: size as 'small' | 'medium' | 'large',
                        };
                        setLocalAspectRatio(newRatio);
                        params.setAspectRatio(newRatio);
                      }}
                      style={{
                        backgroundColor:
                          localAspectRatio.size === size
                            ? colors.primary
                            : colors.background,
                        shadowColor: colors.primary,
                        elevation: localAspectRatio.size === size ? 8 : 0,
                      }}
                      className="flex-1 p-3 rounded-xl">
                      <Text
                        style={{
                          color:
                            localAspectRatio.size === size
                              ? isDark
                                ? colors.text
                                : 'white'
                              : colors.secondaryText,
                        }}
                        className="text-center text-lg">
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </Text>
                      <Text
                        style={{
                          color:
                            localAspectRatio.size === size
                              ? isDark
                                ? colors.text
                                : 'white'
                              : colors.secondaryText,
                        }}
                        className="text-center text-sm">
                        {resolution}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>
          </View>

          {/* Sampler, Seed, and Negative Prompt */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: colors.surface}}>
            {/* Sampler Picker */}
            <View className="mb-5">
              <SectionHeader
                title="Sampler"
                feature="sampler"
                showInfoDialog={showInfoDialog}
                colors={colors}
              />

              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setShowSamplerPicker(!showSamplerPicker);
                }}
                style={{backgroundColor: colors.background}}
                className="p-4 rounded-xl flex-row justify-between items-center">
                <Text style={{color: colors.text}} className="text-lg">
                  {localSampler}
                </Text>
                <ChevronDownIcon
                  size={16}
                  color={colors.secondaryText}
                  style={{
                    transform: [
                      {rotate: showSamplerPicker ? '180deg' : '0deg'},
                    ],
                  }}
                />
              </TouchableOpacity>

              {showSamplerPicker && (
                <View
                  style={{backgroundColor: colors.background}}
                  className="mt-2 rounded-xl overflow-hidden">
                  {params.samplers.map((s, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        LayoutAnimation.spring();
                        setLocalSampler(s);
                        params.setSampler(s);
                        setShowSamplerPicker(false);
                      }}
                      className="p-4 border-b"
                      style={{borderColor: colors.surface}}>
                      <Text style={{color: colors.text}} className="text-base">
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Seed Input */}
            <View className="mb-5">
              <SectionHeader
                title="Seed"
                feature="seed"
                showInfoDialog={showInfoDialog}
                colors={colors}
              />

              <TextInput
                ref={seedInputRef}
                value={localSeed}
                onChangeText={text => {
                  setLocalSeed(text);
                  params.setSeed(text);
                }}
                placeholder="Random"
                keyboardType="numeric"
                className="p-4 rounded-xl text-lg"
                style={{backgroundColor: colors.background, color: colors.text}}
                placeholderTextColor="#6B7280"
                accessible={true}
                accessibilityLabel="Seed value input"
                accessibilityHint="Enter a number to create reproducible images or leave empty for random results"
                blurOnSubmit={false}
                caretHidden={false}
                autoCorrect={false}
                spellCheck={false}
              />
            </View>

            {/* Negative Prompt */}
            <View>
              <SectionHeader
                title="Negative Prompt"
                feature="negativePrompt"
                showInfoDialog={showInfoDialog}
                colors={colors}
              />

              <TextInput
                ref={negativePromptRef}
                value={localNegativePrompt}
                onChangeText={text => {
                  setLocalNegativePrompt(text);
                  params.setNegativePrompt(text);
                }}
                placeholder="What to exclude from your image..."
                multiline
                numberOfLines={4}
                className="p-4 rounded-xl text-lg"
                textAlignVertical="top"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  minHeight: 100,
                }}
                placeholderTextColor="#6B7280"
                accessible={true}
                accessibilityLabel="Negative prompt input"
                accessibilityHint="Enter terms to exclude from the generated image"
                blurOnSubmit={false}
                scrollEnabled={true} // For multiline input
                maxLength={500} // Optional, to prevent very long inputs
                returnKeyType="default"
              />
            </View>
          </View>

          {/* Add extra space at the bottom when keyboard is visible */}
          <View className={keyboardVisible ? 'mb-20' : 'mb-4'} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="mb-12" />

      {/* Info Dialog */}
      <InfoDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogContent.title}
        message={dialogContent.message}
      />

      {/* Art Styles Dialog */}
      <ArtStylesDialog
        visible={artStylesDialogVisible}
        onClose={() => setArtStylesDialogVisible(false)}
        colors={colors}
        isDark={isDark}
        selectedStyles={localSelectedStyles}
        toggleStyle={toggleStyle}
      />
    </SafeAreaView>
  );
};

export default AdvancedSettingsScreen;
