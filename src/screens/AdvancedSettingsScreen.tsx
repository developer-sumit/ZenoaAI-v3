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
import FastImage from 'react-native-fast-image';

import {artStyles} from '@src/data/styles';
import {aspectRatios} from '@src/data/ratio';
import {useStrings} from '@src/hooks/useStrings';
import {useTheme} from '@src/store/themeStore';
import {useHaptics} from '@src/hooks/useHaptics';
import {ArtStyleType, ImageSize, AspectRatio} from '@src/types/image';
import InfoDialog from '@src/components/InfoDialog';

// Icons
import ArrowBackIcon from '@src/assets/icons/ArrowBackIcon';
import CheckmarkIcon from '@src/assets/icons/CheckmarkIcon';
import ChevronDownIcon from '@src/assets/icons/ChevronDownIcon';
import InfoIcon from '@src/assets/icons/InfoIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import SearchIcon from '@src/assets/icons/SearchIcon';
import clsx from 'clsx';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface AdvancedSettingsScreenProps {
  route: {
    params: {
      selectedStyles: string[];
      setSelectedStyles: (styles: string[]) => void;
      aspectRatio: AspectRatio;
      setAspectRatio: (ratio: AspectRatio) => void;
      numberOfImages: number;
      setNumberOfImages: (count: number) => void;
      quality: number;
      setQuality: (value: number) => void;
      seed: string;
      setSeed: (value: string) => void;
      negativePrompt: string;
      setNegativePrompt: (value: string) => void;
      imagesPrivateByDefault?: boolean;
      setImagesPrivateByDefault?: (value: boolean) => void;
      engine?: 'quantum' | 'nebula';
      setEngine?: (engine: 'quantum' | 'nebula') => void;
      guidance?: number;
      setGuidance?: (guidance: number) => void;
      steps?: number;
      setSteps?: (steps: number) => void;
    };
  };
}

const INITIAL_STYLES_TO_SHOW = 9; // Show 9 initial styles (3x3 grid)

const StyleItem = memo(
  ({
    item,
    isSelected,
    onToggle,
    theme,
  }: {
    item: ArtStyleType;
    isSelected: boolean;
    onToggle: () => void;
    theme: any;
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
            borderColor: theme.primary,
          }}>
          <FastImage
            style={{
              width: '100%',
              height: '100%',
              borderRadius: isSelected ? 14 : 16,
            }}
            source={{uri: item.image, cache: FastImage.cacheControl.immutable}}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        {isSelected && (
          <View className="h-full w-full bg-black/30 absolute rounded-2xl items-center justify-center overflow-hidden">
            <View
              style={{backgroundColor: theme.primary}}
              className="rounded-full p-3">
              <CheckmarkIcon size={40} color="white" />
            </View>
          </View>
        )}
      </View>
      <Text
        className="font-medium mt-1 text-center text-base"
        style={{color: theme.text}}>
        {item.name}
      </Text>
    </TouchableOpacity>
  ),
  // Add equality comparison to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.item === nextProps.item &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.theme === nextProps.theme &&
      prevProps.isDark === nextProps.isDark
    );
  },
);

const SectionHeader = memo(
  ({
    title,
    subtitle,
    showInfoDialog,
    theme,
  }: {
    title: string;
    subtitle?: string;
    showInfoDialog: (title: string) => void;
    theme: any;
  }) => (
    <>
      <View className="flex-row items-center mb-2">
        <Text
          style={{color: theme.secondaryText}}
          className="text-lg font-medium mr-2">
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => showInfoDialog(title)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <InfoIcon size={18} color={theme.secondaryText} />
        </TouchableOpacity>
      </View>
      {subtitle && (
        <Text style={{color: theme.secondaryText}} className="text-sm mb-3">
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
    theme,
    isDark,
    showButton = false,
    onShowAllPress = () => {},
    numColumns = 3,
    scrollEnabled = false,
  }: {
    data: ArtStyleType[];
    selectedStyles: string[];
    toggleStyle: (name: string) => void;
    theme: any;
    isDark: boolean;
    showButton?: boolean;
    onShowAllPress?: () => void;
    numColumns?: number;
    scrollEnabled?: boolean;
  }) => {
    const strings = useStrings();

    // Memoize the render item function to prevent recreations
    const renderItem = useCallback(
      ({item}: {item: ArtStyleType}) => (
        <StyleItem
          item={item}
          isSelected={selectedStyles.includes(item.name)}
          onToggle={() => toggleStyle(item.name)}
          theme={theme}
          isDark={isDark}
        />
      ),
      [selectedStyles, toggleStyle, theme, isDark],
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
            style={{backgroundColor: theme.background}}
            className="p-3 mt-2 rounded-2xl flex-row justify-center items-center">
            <Text
              style={{color: theme.primary}}
              className="font-bold text-base">
              {`${strings.common.all} ${strings.advancedSettings.featureInfo.artStyles.title}`}
            </Text>
            <ChevronDownIcon size={16} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.selectedStyles === nextProps.selectedStyles &&
      prevProps.theme === nextProps.theme &&
      prevProps.isDark === nextProps.isDark &&
      prevProps.showButton === nextProps.showButton
    );
  },
);

const ArtStylesDialog = memo(
  ({
    visible,
    onClose,
    theme,
    isDark,
    selectedStyles,
    toggleStyle,
  }: {
    visible: boolean;
    onClose: () => void;
    theme: any;
    isDark: boolean;
    selectedStyles: string[];
    toggleStyle: (styleName: string) => void;
  }) => {
    const strings = useStrings();
    const {triggerHaptic} = useHaptics();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStyles = useMemo(() => {
      if (!searchQuery.trim()) {
        return artStyles;
      }

      const query = searchQuery.toLowerCase().trim();
      return artStyles.filter(style =>
        style.name.toLowerCase().includes(query),
      );
    }, [searchQuery]);

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={onClose}>
        <SafeAreaView
          className="flex-1"
          style={{backgroundColor: theme.background}}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-4">
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                onClose();
              }}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{backgroundColor: theme.surface}}>
              <ArrowBackIcon size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={{color: theme.text}} className="font-bold text-xl">
              {`${strings.common.all} ${strings.advancedSettings.featureInfo.artStyles.title}`}
            </Text>
            <View style={{width: 40}} />
          </View>

          {/* Search Bar */}
          <View
            className="mx-4 my-3 rounded-xl flex-row items-center px-3"
            style={{backgroundColor: theme.surface}}>
            <SearchIcon size={28} color={theme.secondaryText} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => triggerHaptic('light')}
              placeholder={`${strings.common.search} ${strings.advancedSettings.featureInfo.artStyles.title}...`}
              placeholderTextColor={theme.secondaryText}
              className="flex-1 py-3 px-2 h-12 text-lg"
              style={{color: theme.text}}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
              accessible={true}
              accessibilityLabel={`${strings.common.search} ${strings.advancedSettings.featureInfo.artStyles.title}`}
              accessibilityHint={strings.advancedSettings.filterArtStylesHint}
              accessibilityRole="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setSearchQuery('');
                }}
                accessible={true}
                accessibilityLabel={`${strings.common.clear} ${strings.advancedSettings.featureInfo.artStyles.title}`}
                accessibilityRole="button">
                <CloseIcon size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filtered Styles Grid */}
          {filteredStyles.length > 0 ? (
            <StylesGrid
              data={filteredStyles}
              selectedStyles={selectedStyles}
              toggleStyle={toggleStyle}
              theme={theme}
              isDark={isDark}
              scrollEnabled={true}
            />
          ) : (
            <View className="flex-1 justify-center items-center p-4">
              <Text
                style={{color: theme.secondaryText}}
                className="text-lg text-center">
                No styles found matching "{searchQuery}"
              </Text>
            </View>
          )}

          {/* Selected Styles Counter */}
          {selectedStyles.length > 0 && (
            <View className="px-4 py-2.5 bg-orange-500 border border-white flex-row justify-between items-center absolute bottom-5 self-center w-[90%] rounded-2xl">
              <Text className="text-white font-medium">
                {selectedStyles.length}&nbsp;
                {selectedStyles.length === 1 ? 'style' : 'styles'} selected
              </Text>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('success');
                  onClose();
                }}
                className="bg-white py-2.5 px-4 rounded-full">
                <Text className="font-bold text-[#f97316]">
                  {strings.common.done}
                </Text>
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
  const strings = useStrings();
  const navigation = useNavigation();
  const {isDark, theme} = useTheme();
  const {triggerHaptic} = useHaptics();

  // Refs for TextInputs to maintain focus
  const seedInputRef = useRef<TextInput>(null);
  const negativePromptRef = useRef<TextInput>(null);
  // Create local state that mirrors the parent state
  const [localSelectedStyles, setLocalSelectedStyles] = useState<string[]>(
    params.selectedStyles,
  );
  const [localAspectRatio, setLocalAspectRatio] = useState<AspectRatio>(
    params.aspectRatio,
  );
  const [localNumberOfImages, setLocalNumberOfImages] = useState<number>(
    params.numberOfImages,
  );
  const [localQuality, setLocalQuality] = useState<number>(params.quality);
  const [localSeed, setLocalSeed] = useState<string>(params.seed);
  const [localNegativePrompt, setLocalNegativePrompt] = useState<string>(
    params.negativePrompt,
  );

  // Add new local state for advanced settings
  const [localEngine, setLocalEngine] = useState<'quantum' | 'nebula'>(
    params.engine || 'quantum',
  );

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState({title: '', message: ''});
  const [artStylesDialogVisible, setArtStylesDialogVisible] = useState(false);

  // State to track if keyboard is showing
  const [_, setKeyboardVisible] = useState(false);

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
  const showInfoDialog = useCallback(
    (title: string) => {
      triggerHaptic('light');
      const featureInfo = strings.advancedSettings.featureInfo;
      if (title in featureInfo) {
        setDialogContent(featureInfo[title as keyof typeof featureInfo]);
        setDialogVisible(true);
      }
    },
    [strings.advancedSettings.featureInfo],
  );

  // Effect to sync parent state changes to local state (if needed)
  useEffect(() => {
    setLocalSelectedStyles(params.selectedStyles);
    setLocalAspectRatio(params.aspectRatio);
    setLocalNumberOfImages(params.numberOfImages);
    setLocalQuality(params.quality);
    setLocalSeed(params.seed);
    setLocalNegativePrompt(params.negativePrompt); // Sync new parameters
    setLocalEngine(params.engine || 'quantum');
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
      triggerHaptic('selection');
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
      style={{backgroundColor: theme.background}}
      className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between py-3 px-4">
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('selection');
            navigation.goBack();
          }}
          className="p-2"
          accessible={true}
          accessibilityLabel={strings.common.goBack}>
          <ArrowBackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold" style={{color: theme.text}}>
          {strings.advancedSettings.title}
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
          keyboardDismissMode="none"
          contentInsetAdjustmentBehavior="always"
          removeClippedSubviews={false}>
          {/* Engine Selection */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <SectionHeader
              title="AI Engine"
              showInfoDialog={() => showInfoDialog('AI Engine')}
              theme={theme}
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setLocalEngine('quantum');
                  if (params.setEngine) {
                    params.setEngine('quantum');
                  }
                }}
                style={{
                  backgroundColor:
                    localEngine === 'quantum'
                      ? theme.primary
                      : theme.background,
                }}
                className={clsx(
                  'flex-1 p-4',
                  localEngine === 'quantum' ? 'rounded-2xl' : 'rounded-xl',
                )}>
                <Text
                  style={{
                    color:
                      localEngine === 'quantum'
                        ? isDark
                          ? theme.text
                          : 'white'
                        : theme.text,
                  }}
                  className="text-lg font-medium text-center">
                  Quantum
                </Text>
                <Text
                  style={{
                    color:
                      localEngine === 'quantum'
                        ? isDark
                          ? theme.secondaryText
                          : 'white'
                        : theme.secondaryText,
                  }}
                  className="text-xs text-center mt-1">
                  Fast & efficient
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setLocalEngine('nebula');
                  if (params.setEngine) {
                    params.setEngine('nebula');
                  }
                }}
                style={{
                  backgroundColor:
                    localEngine === 'nebula' ? theme.primary : theme.background,
                }}
                className={clsx(
                  'flex-1 p-4',
                  localEngine === 'nebula' ? 'rounded-2xl' : 'rounded-xl',
                )}>
                <Text
                  style={{
                    color:
                      localEngine === 'nebula'
                        ? isDark
                          ? theme.text
                          : 'white'
                        : theme.text,
                  }}
                  className="text-lg font-medium text-center">
                  Nebula
                </Text>
                <Text
                  style={{
                    color:
                      localEngine === 'nebula'
                        ? isDark
                          ? theme.secondaryText
                          : 'white'
                        : theme.secondaryText,
                  }}
                  className="text-xs text-center mt-1">
                  Advanced control
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Art Styles Section */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <SectionHeader
              title={strings.advancedSettings.featureInfo.artStyles.title}
              subtitle={strings.advancedSettings.artStylesSubtitle}
              showInfoDialog={() => showInfoDialog('artStyles')}
              theme={theme}
            />
            <StylesGrid
              data={stylesToShow}
              selectedStyles={localSelectedStyles}
              toggleStyle={toggleStyle}
              theme={theme}
              isDark={isDark}
              showButton={true}
              onShowAllPress={() => {
                triggerHaptic('light');
                setArtStylesDialogVisible(true);
              }}
            />
          </View>

          {/* Quality Toggle */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <SectionHeader
              title={strings.advancedSettings.featureInfo.quality.title}
              showInfoDialog={() => showInfoDialog('quality')}
              theme={theme}
            />

            <View className="flex-row justify-between items-center py-2">
              <View>
                <Text style={{color: theme.text}} className="text-lg">
                  {strings.advancedSettings.premiumImages}
                </Text>
                <Text style={{color: theme.secondaryText}} className="text-xs">
                  {strings.advancedSettings.generateHigherQualityImages}
                </Text>
              </View>

              <TouchableOpacity
                className="w-14 h-8 rounded-full p-1.5"
                style={{
                  backgroundColor:
                    localQuality === 50 ? theme.primary : '#cbd5e1',
                }}
                onPress={() => {
                  triggerHaptic('selection');
                  LayoutAnimation.spring();
                  const newQuality = localQuality === 50 ? 25 : 50;
                  setLocalQuality(newQuality);
                  params.setQuality(newQuality);
                }}
                accessible={true}
                accessibilityLabel={
                  localQuality === 50
                    ? strings.advancedSettings.turnOffPremiumHint
                    : strings.advancedSettings.turnOnPremiumHint
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
            style={{backgroundColor: theme.surface}}>
            <SectionHeader
              title={strings.advancedSettings.featureInfo.batchCount.title}
              showInfoDialog={() => showInfoDialog('batchCount')}
              theme={theme}
            />
            <View className="flex-row flex-wrap gap-2">
              {[1, 2, 4, 6, 8, 10].map(count => (
                <TouchableOpacity
                  key={count}
                  onPress={() => {
                    triggerHaptic('selection');
                    LayoutAnimation.spring();
                    setLocalNumberOfImages(count);
                    params.setNumberOfImages(count);
                  }}
                  style={{
                    backgroundColor:
                      localNumberOfImages === count
                        ? theme.primary
                        : theme.background,
                    minWidth: 55,
                    width: '15%',
                  }}
                  className={clsx(
                    'px-5 py-2.5 items-center justify-center',
                    localNumberOfImages === count
                      ? 'rounded-2xl'
                      : 'rounded-xl',
                  )}>
                  <Text
                    style={{
                      color:
                        localNumberOfImages === count
                          ? isDark
                            ? theme.text
                            : 'white'
                          : theme.secondaryText,
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
            style={{backgroundColor: theme.surface}}>
            {/* Aspect Ratio Section */}
            <View className="mb-5">
              <SectionHeader
                title={strings.advancedSettings.featureInfo.aspectRatio.title}
                showInfoDialog={() => showInfoDialog('aspectRatio')}
                theme={theme}
              />
              <View className="flex-row flex-wrap gap-2">
                {aspectRatios.map(ratio => {
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
                  if (displayWidth < 12) {
                    displayWidth *= SCALE_FACTOR;
                  }
                  if (displayHeight < 12) {
                    displayHeight *= SCALE_FACTOR;
                  }
                  return (
                    <TouchableOpacity
                      key={ratio.ratio}
                      onPress={() => {
                        triggerHaptic('selection');
                        LayoutAnimation.spring();
                        const newRatio = {
                          ...ratio,
                          size: 'medium' as ImageSize,
                        };
                        setLocalAspectRatio(newRatio);
                        params.setAspectRatio(newRatio);
                      }}
                      style={{
                        backgroundColor:
                          localAspectRatio.ratio === ratio.ratio
                            ? theme.primary
                            : theme.background,
                      }}
                      className={clsx(
                        'px-4 py-3',
                        localAspectRatio.ratio === ratio.ratio
                          ? 'rounded-2xl'
                          : 'rounded-xl',
                      )}>
                      {/* Aspect ratio visual icon */}
                      <View
                        className="mb-2 items-center justify-center"
                        style={{width: 40, height: 30}}>
                        <View
                          className="border-2 rounded-sm"
                          style={{
                            width: displayWidth,
                            height: displayHeight,
                            borderColor:
                              localAspectRatio.ratio === ratio.ratio
                                ? isDark
                                  ? theme.text
                                  : 'white'
                                : theme.secondaryText,
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          color:
                            localAspectRatio.ratio === ratio.ratio
                              ? isDark
                                ? theme.text
                                : 'white'
                              : theme.secondaryText,
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
                title={strings.advancedSettings.featureInfo.imageSize.title}
                showInfoDialog={() => showInfoDialog('imageSize')}
                theme={theme}
              />

              <View className="flex-row gap-2">
                {Object.entries(localAspectRatio.sizes).map(
                  ([size, resolution]) => (
                    <TouchableOpacity
                      key={size}
                      onPress={() => {
                        triggerHaptic('selection');
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
                            ? theme.primary
                            : theme.background,
                      }}
                      className={clsx(
                        'flex-1 p-3',
                        localAspectRatio.size === size
                          ? 'rounded-2xl'
                          : 'rounded-xl',
                      )}>
                      <Text
                        style={{
                          color:
                            localAspectRatio.size === size
                              ? isDark
                                ? theme.text
                                : 'white'
                              : theme.secondaryText,
                        }}
                        className="text-center text-lg">
                        {strings.common[size as keyof typeof strings.common] ||
                          size.charAt(0).toUpperCase() + size.slice(1)}
                      </Text>
                      <Text
                        style={{
                          color:
                            localAspectRatio.size === size
                              ? isDark
                                ? theme.text
                                : 'white'
                              : theme.secondaryText,
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

          {/* Seed and Negative Prompt */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            {/* Seed Input */}
            <View className="mb-5">
              <SectionHeader
                title={strings.advancedSettings.featureInfo.seed.title}
                showInfoDialog={() => showInfoDialog('seed')}
                theme={theme}
              />
              <TextInput
                ref={seedInputRef}
                value={localSeed}
                onChangeText={text => {
                  setLocalSeed(text);
                  params.setSeed(text);
                }}
                onFocus={() => triggerHaptic('light')}
                placeholder={strings.advancedSettings.seedPlaceholder}
                keyboardType="numeric"
                className="p-4 rounded-xl text-lg"
                style={{backgroundColor: theme.background, color: theme.text}}
                placeholderTextColor="#6B7280"
                accessible={true}
                accessibilityLabel={
                  strings.advancedSettings.featureInfo.seed.title
                }
                accessibilityHint={strings.advancedSettings.seedHint}
                blurOnSubmit={false}
                caretHidden={false}
                autoCorrect={false}
                spellCheck={false}
              />
            </View>

            {/* Negative Prompt */}
            <View>
              <SectionHeader
                title={
                  strings.advancedSettings.featureInfo.negativePrompt.title
                }
                showInfoDialog={() => showInfoDialog('negativePrompt')}
                theme={theme}
              />
              <TextInput
                ref={negativePromptRef}
                value={localNegativePrompt}
                onChangeText={text => {
                  setLocalNegativePrompt(text);
                  params.setNegativePrompt(text);
                }}
                onFocus={() => triggerHaptic('light')}
                placeholder={strings.advancedSettings.negativePromptPlaceholder}
                multiline
                numberOfLines={4}
                className="p-4 rounded-xl text-lg"
                textAlignVertical="top"
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  minHeight: 100,
                }}
                placeholderTextColor="#6B7280"
                accessible={true}
                accessibilityLabel={
                  strings.advancedSettings.featureInfo.negativePrompt.title
                }
                accessibilityHint={strings.advancedSettings.negativePromptHint}
                blurOnSubmit={false}
                scrollEnabled={true}
                maxLength={500}
                returnKeyType="default"
              />
            </View>
          </View>

          {/* Add extra space at the bottom when keyboard is visible */}
          <View className="mb-16" />
        </ScrollView>
      </KeyboardAvoidingView>

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
        theme={theme}
        isDark={isDark}
        selectedStyles={localSelectedStyles}
        toggleStyle={toggleStyle}
      />
    </SafeAreaView>
  );
};

export default AdvancedSettingsScreen;
