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
import {useAuthStore} from '@src/store/authStore';
import {userService} from '@src/services/userService';
import {useTheme} from '@src/store/themeStore';
import {ArtStyleType, AspectRatioSize, AspectRatio} from '@src/types';
import InfoDialog from '@src/components/InfoDialog';

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
      sampler: string;
      setSampler: (value: string) => void;
      negativePrompt: string;
      setNegativePrompt: (value: string) => void;
      samplers: string[];
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
            shadowColor: theme.primary,
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
      [data, selectedStyles, toggleStyle, theme, isDark],
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
          style={{backgroundColor: theme.background}}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-4">
            <TouchableOpacity
              onPress={onClose}
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
                onPress={() => setSearchQuery('')}
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
                {selectedStyles.length}
                {selectedStyles.length === 1 ? 'style' : 'styles'} selected
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="bg-white py-2.5 px-4 rounded-full">
                <Text style={{color: '#f97316', fontWeight: 'bold'}}>
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
  const {user, updateUser} = useAuthStore();

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
  const [localSampler, setLocalSampler] = useState<string>(params.sampler);
  const [localNegativePrompt, setLocalNegativePrompt] = useState<string>(
    params.negativePrompt,
  );

  // Add new local state for advanced settings
  const [localEngine, setLocalEngine] = useState<'quantum' | 'nebula'>(
    params.engine || 'quantum',
  );
  const [localGuidance, setLocalGuidance] = useState<number>(
    params.guidance || 7.5,
  );
  const [localSteps, setLocalSteps] = useState<number>(params.steps || 30);

  // Add privacy state
  const [localImagesPrivateByDefault, setLocalImagesPrivateByDefault] =
    useState<boolean>(params.imagesPrivateByDefault || false);

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
  const showInfoDialog = useCallback((title: string) => {
    const featureInfo = strings.advancedSettings.featureInfo;
    if (title in featureInfo) {
      setDialogContent(featureInfo[title as keyof typeof featureInfo]);
      setDialogVisible(true);
    }
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
    setLocalImagesPrivateByDefault(params.imagesPrivateByDefault || false);
    // Sync new parameters
    setLocalEngine(params.engine || 'quantum');
    setLocalGuidance(params.guidance || 7.5);
    setLocalSteps(params.steps || 30);
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
      style={{backgroundColor: theme.background}}
      className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between py-3 px-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
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
              showInfoDialog={showInfoDialog}
              theme={theme}
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
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
                  shadowColor: theme.primary,
                  elevation: localEngine === 'quantum' ? 8 : 0,
                }}
                className="flex-1 p-4 rounded-xl">
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
                  setLocalEngine('nebula');
                  if (params.setEngine) {
                    params.setEngine('nebula');
                  }
                }}
                style={{
                  backgroundColor:
                    localEngine === 'nebula' ? theme.primary : theme.background,
                  shadowColor: theme.primary,
                  elevation: localEngine === 'nebula' ? 8 : 0,
                }}
                className="flex-1 p-4 rounded-xl">
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
              feature="artStyles"
              subtitle={strings.advancedSettings.artStylesSubtitle}
              showInfoDialog={showInfoDialog}
              theme={theme}
            />

            <StylesGrid
              data={stylesToShow}
              selectedStyles={localSelectedStyles}
              toggleStyle={toggleStyle}
              theme={theme}
              isDark={isDark}
              showButton={true}
              onShowAllPress={() => setArtStylesDialogVisible(true)}
            />
          </View>

          {/* Privacy Settings */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <SectionHeader
              title={strings.advancedSettings.privacy}
              feature="defaultPrivacy"
              showInfoDialog={showInfoDialog}
              theme={theme}
            />

            <View className="flex-row justify-between items-center py-2">
              <View className="flex-1 mr-4">
                <Text style={{color: theme.text}} className="text-lg">
                  {strings.advancedSettings.privateByDefault}
                </Text>
                <Text style={{color: theme.secondaryText}} className="text-xs">
                  {strings.advancedSettings.privateByDefaultDescription}
                </Text>
              </View>

              <TouchableOpacity
                className="w-14 h-8 rounded-full p-1.5"
                style={{
                  backgroundColor: localImagesPrivateByDefault
                    ? theme.primary
                    : '#cbd5e1',
                }}
                onPress={async () => {
                  LayoutAnimation.spring();
                  const newValue = !localImagesPrivateByDefault;
                  setLocalImagesPrivateByDefault(newValue);

                  // Update parent component if callback exists
                  if (params.setImagesPrivateByDefault) {
                    params.setImagesPrivateByDefault(newValue);
                  }

                  // Update user profile
                  if (user) {
                    try {
                      const updatedUser = await userService.updateProfile(
                        user.id,
                        {imagesPrivateByDefault: newValue},
                      );
                      if (updatedUser) {
                        updateUser(updatedUser);
                      }
                    } catch (error) {
                      console.error('Failed to update privacy setting:', error);
                    }
                  }
                }}
                accessible={true}
                accessibilityLabel={
                  localImagesPrivateByDefault
                    ? strings.advancedSettings.turnOffPrivateHint
                    : strings.advancedSettings.turnOnPrivateHint
                }
                accessibilityRole="switch"
                accessibilityState={{checked: localImagesPrivateByDefault}}>
                <View
                  className={`w-5 h-5 rounded-full bg-white ${
                    localImagesPrivateByDefault ? 'ml-6' : 'ml-0'
                  }`}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quality Toggle */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <SectionHeader
              title={strings.advancedSettings.featureInfo.quality.title}
              feature="quality"
              showInfoDialog={showInfoDialog}
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
                        ? theme.primary
                        : theme.background,
                    shadowColor: theme.primary,
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
                          size: 'medium' as AspectRatioSize,
                        };
                        setLocalAspectRatio(newRatio);
                        params.setAspectRatio(newRatio);
                      }}
                      style={{
                        backgroundColor:
                          localAspectRatio.ratio === ratio.ratio
                            ? theme.primary
                            : theme.background,
                        shadowColor: theme.primary,
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
                                  ? theme.text
                                  : 'white'
                                : theme.secondaryText,
                            borderRadius: 3,
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
                        shadowColor: theme.primary,
                        elevation: localAspectRatio.size === size ? 8 : 0,
                      }}
                      className="flex-1 p-3 rounded-xl">
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

          {/* Sampler, Seed, and Negative Prompt */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            {/* Sampler Picker */}
            <View className="mb-5">
              <SectionHeader
                title={strings.advancedSettings.featureInfo.sampler.title}
                showInfoDialog={() => showInfoDialog('sampler')}
                theme={theme}
              />

              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setShowSamplerPicker(!showSamplerPicker);
                }}
                style={{backgroundColor: theme.background}}
                className="p-4 rounded-xl flex-row justify-between items-center">
                <Text style={{color: theme.text}} className="text-lg">
                  {localSampler}
                </Text>
                <ChevronDownIcon
                  size={16}
                  color={theme.secondaryText}
                  style={{
                    transform: [
                      {rotate: showSamplerPicker ? '180deg' : '0deg'},
                    ],
                  }}
                />
              </TouchableOpacity>

              {showSamplerPicker && (
                <View
                  style={{backgroundColor: theme.background}}
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
                      style={{borderColor: theme.surface}}>
                      <Text style={{color: theme.text}} className="text-base">
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

          {/* Advanced Controls - Only show for Nebula engine */}
          {localEngine === 'nebula' && (
            <View
              className="py-4 px-3 mt-4 rounded-2xl"
              style={{backgroundColor: theme.surface}}>
              <SectionHeader
                title="Advanced Controls"
                showInfoDialog={showInfoDialog}
                theme={theme}
              />
              {/* Guidance Scale */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    style={{color: theme.text}}
                    className="text-base font-medium">
                    Guidance Scale
                  </Text>
                  <Text
                    style={{color: theme.primary}}
                    className="text-base font-medium">
                    {localGuidance}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={event => {
                    // Simple touch-based slider
                    const touchX = event.nativeEvent.locationX;
                    const sliderWidth = 300; // Approximate width
                    const percentage = Math.max(
                      0,
                      Math.min(1, touchX / sliderWidth),
                    );
                    const newGuidance =
                      Math.round((1 + percentage * 19) * 10) / 10;
                    setLocalGuidance(newGuidance);
                    if (params.setGuidance) {
                      params.setGuidance(newGuidance);
                    }
                  }}>
                  <View
                    className="h-1.5 rounded-full"
                    style={{backgroundColor: theme.background}}>
                    <View
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: theme.primary,
                        width: `${((localGuidance - 1) / 19) * 100}%`,
                      }}
                    />
                  </View>
                </TouchableOpacity>
                <View className="flex-row justify-between mt-1">
                  <Text
                    style={{color: theme.secondaryText}}
                    className="text-xs">
                    1
                  </Text>
                  <Text
                    style={{color: theme.secondaryText}}
                    className="text-xs">
                    20
                  </Text>
                </View>
              </View>
              {/* Steps */}
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    style={{color: theme.text}}
                    className="text-base font-medium">
                    Steps
                  </Text>
                  <Text
                    style={{color: theme.primary}}
                    className="text-base font-medium">
                    {localSteps}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={event => {
                    // Simple touch-based slider
                    const touchX = event.nativeEvent.locationX;
                    const sliderWidth = 300; // Approximate width
                    const percentage = Math.max(
                      0,
                      Math.min(1, touchX / sliderWidth),
                    );
                    const newSteps = Math.round(10 + percentage * 90);
                    setLocalSteps(newSteps);
                    if (params.setSteps) {
                      params.setSteps(newSteps);
                    }
                  }}>
                  <View
                    className="h-1.5 rounded-full"
                    style={{backgroundColor: theme.background}}>
                    <View
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: theme.primary,
                        width: `${((localSteps - 10) / 90) * 100}%`,
                      }}
                    />
                  </View>
                </TouchableOpacity>
                <View className="flex-row justify-between mt-1">
                  <Text
                    style={{color: theme.secondaryText}}
                    className="text-xs">
                    10
                  </Text>
                  <Text
                    style={{color: theme.secondaryText}}
                    className="text-xs">
                    100
                  </Text>
                </View>
              </View>
            </View>
          )}

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
        theme={theme}
        isDark={isDark}
        selectedStyles={localSelectedStyles}
        toggleStyle={toggleStyle}
      />
    </SafeAreaView>
  );
};

export default AdvancedSettingsScreen;
