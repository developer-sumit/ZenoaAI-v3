import clsx from 'clsx';
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
import {Theme, useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useHaptics} from '@src/hooks/useHaptics';
import InfoDialog from '@src/components/InfoDialog';
import {planLimits} from '@src/constants/planLimits';
import {ArtStyleType, ImageSize} from '@src/types/image';
import {useGenerationStore} from '@src/store/generationStore';
import {useImageStore} from '@src/store/imageStore';

// Icons
import ArrowBackIcon from '@src/assets/icons/ArrowBackIcon';
import CheckmarkIcon from '@src/assets/icons/CheckmarkIcon';
import ChevronDownIcon from '@src/assets/icons/ChevronDownIcon';
import InfoIcon from '@src/assets/icons/InfoIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import SearchIcon from '@src/assets/icons/SearchIcon';
import LockIcon from '@src/assets/icons/LockIcon';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
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
    onToggle: (name: string) => void;
    theme: Theme;
  }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="p-1 mb-2 w-full"
      onPress={() => onToggle(item.name)}>
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
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.theme === nextProps.theme
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
    theme: Theme;
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
    theme: Theme;
    isDark: boolean;
    showButton?: boolean;
    onShowAllPress?: () => void;
    numColumns?: number;
    scrollEnabled?: boolean;
  }) => {
    const t = useStrings();

    const renderItem = useCallback(
      ({item}: {item: ArtStyleType}) => (
        <StyleItem
          item={item}
          isSelected={selectedStyles.includes(item.name)}
          onToggle={toggleStyle}
          theme={theme}
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

        {showButton && (
          <TouchableOpacity
            onPress={onShowAllPress}
            style={{backgroundColor: theme.background}}
            className="p-3 mt-2 rounded-2xl flex-row justify-center items-center">
            <Text
              style={{color: theme.primary}}
              className="font-bold text-base">
              {`${t('common.all')} ${t('advanced.featureInfo.artStyles.title')}`}
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
      prevProps.showButton === nextProps.showButton &&
      prevProps.theme === nextProps.theme &&
      prevProps.isDark === nextProps.isDark &&
      prevProps.selectedStyles.length === nextProps.selectedStyles.length &&
      prevProps.selectedStyles.every(
        (val, i) => val === nextProps.selectedStyles[i],
      )
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
    theme: Theme;
    isDark: boolean;
    selectedStyles: string[];
    toggleStyle: (styleName: string) => void;
  }) => {
    const t = useStrings();
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
              {`${t('common.all')} ${t('advanced.featureInfo.artStyles.title')}`}
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
              placeholder={`${t('common.search')} ${t('advanced.featureInfo.artStyles.title')}...`}
              placeholderTextColor={theme.secondaryText}
              className="flex-1 py-3 px-2 h-12 text-lg"
              style={{color: theme.text}}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
              accessible={true}
              accessibilityLabel={`${t('common.search')} ${t('advanced.featureInfo.artStyles.title')}`}
              accessibilityHint={t('advanced.filterArtStylesHint')}
              accessibilityRole="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setSearchQuery('');
                }}
                accessible={true}
                accessibilityLabel={`${t('common.clear')} ${t('advanced.featureInfo.artStyles.title')}`}
                accessibilityRole="button">
                <CloseIcon size={18} color={theme.secondaryText} />
              </TouchableOpacity>
            ) : (
              <></>
            )}
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
          {selectedStyles.length > 0 ? (
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
                  {t('common.done')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <></>
          )}
        </SafeAreaView>
      </Modal>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.visible === nextProps.visible &&
      prevProps.onClose === nextProps.onClose &&
      prevProps.theme === nextProps.theme &&
      prevProps.isDark === nextProps.isDark &&
      prevProps.selectedStyles.length === nextProps.selectedStyles.length &&
      prevProps.selectedStyles.every(
        (val, i) => val === nextProps.selectedStyles[i],
      )
    );
  },
);

const AdvancedSettingsScreen: React.FC = () => {
  const t = useStrings();
  const navigation = useNavigation();
  const {isDark, theme} = useTheme();
  const {triggerHaptic} = useHaptics();
  const {user} = useAuthStore();
  const {getAvailableQuota} = useImageStore();
  const {
    engine,
    aspectRatio,
    imageSize,
    negativePrompt,
    isPrivate,
    isPremium,
    numberOfImages,
    styles,
    seed,
    setEngine,
    setAspectRatio,
    setImageSize,
    setNegativePrompt,
    setIsPrivate,
    setIsPremium,
    setNumberOfImages,
    setStyles,
    setSeed,
  } = useGenerationStore();

  // Refs for TextInputs to maintain focus
  const seedInputRef = useRef<TextInput>(null);
  const negativePromptRef = useRef<TextInput>(null);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState({title: '', message: ''});
  const [artStylesDialogVisible, setArtStylesDialogVisible] = useState(false);

  const limits = planLimits[user?.planType || 'free'];
  const allowedAspectRatios = limits.aspectRatios;
  const allowedSizes = limits.sizes;
  const maxBatch = limits.maxBatch;

  // Get available quota and apply it to batch limits
  const availableQuota = getAvailableQuota();
  const effectiveMaxBatch = Math.min(maxBatch, availableQuota);

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

  const showInfoDialog = useCallback(
    (title: string) => {
      triggerHaptic('light');
      const featureInfo = t('advanced.featureInfo', {
        returnObjects: true,
      }) as any;
      if (title in featureInfo) {
        setDialogContent(featureInfo[title]);
        setDialogVisible(true);
      }
    },
    [t, triggerHaptic],
  );

  const initialStylesToShow = useMemo(() => {
    return artStyles.slice(0, INITIAL_STYLES_TO_SHOW);
  }, []);

  const selectedStylesNotInInitial = useMemo(() => {
    const initialStyleNames = new Set(
      initialStylesToShow.map(style => style.name),
    );
    return artStyles.filter(
      style =>
        !initialStyleNames.has(style.name) && styles.includes(style.name),
    );
  }, [initialStylesToShow, styles]);

  const stylesToShow = useMemo(() => {
    return [...initialStylesToShow, ...selectedStylesNotInInitial];
  }, [initialStylesToShow, selectedStylesNotInInitial]);

  const toggleStyle = useCallback(
    (styleName: string) => {
      triggerHaptic('selection');
      setStyles(prevStyles => {
        if (prevStyles.includes(styleName)) {
          return prevStyles.filter(s => s !== styleName);
        } else {
          return [...prevStyles, styleName];
        }
      });
    },
    [setStyles, triggerHaptic],
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
          accessibilityLabel={t('common.back')}>
          <ArrowBackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold" style={{color: theme.text}}>
          {t('advanced.title')}
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
              title={t('advanced.featureInfo.aiEngine.title')}
              showInfoDialog={() => showInfoDialog('aiEngine')}
              theme={theme}
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setEngine('quantum');
                }}
                style={{
                  backgroundColor:
                    engine === 'quantum' ? theme.primary : theme.background,
                }}
                className={clsx(
                  'flex-1 p-4',
                  engine === 'quantum' ? 'rounded-2xl' : 'rounded-xl',
                )}>
                <Text
                  style={{
                    color:
                      engine === 'quantum'
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
                      engine === 'quantum'
                        ? isDark
                          ? theme.secondaryText
                          : 'white'
                        : theme.secondaryText,
                  }}
                  className="text-xs text-center mt-1">
                  {t('advanced.quantumEngineHint')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setEngine('nebula');
                }}
                style={{
                  backgroundColor:
                    engine === 'nebula' ? theme.primary : theme.background,
                }}
                className={clsx(
                  'flex-1 p-4',
                  engine === 'nebula' ? 'rounded-2xl' : 'rounded-xl',
                )}>
                <Text
                  style={{
                    color:
                      engine === 'nebula'
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
                      engine === 'nebula'
                        ? isDark
                          ? theme.secondaryText
                          : 'white'
                        : theme.secondaryText,
                  }}
                  className="text-xs text-center mt-1">
                  {t('advanced.nebulaEngineHint')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Art Styles Section */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <SectionHeader
              title={t('advanced.featureInfo.artStyles.title')}
              subtitle={t('advanced.featureInfo.artStyles.subtitle')}
              showInfoDialog={() => showInfoDialog('artStyles')}
              theme={theme}
            />
            <StylesGrid
              data={stylesToShow}
              selectedStyles={styles}
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

          {/* Batch Count */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <SectionHeader
              title={t('advanced.featureInfo.batchCount.title')}
              showInfoDialog={() => showInfoDialog('batchCount')}
              theme={theme}
            />

            {/* Quota Warning */}
            {availableQuota < maxBatch && availableQuota > 0 && (
              <View
                className="mb-3 p-3 rounded-xl"
                style={{backgroundColor: '#fef3c7'}}>
                <Text
                  className="text-sm font-medium"
                  style={{color: '#92400e'}}>
                  ⚠️ Only {availableQuota} image
                  {availableQuota !== 1 ? 's' : ''} remaining in your quota
                </Text>
              </View>
            )}

            {user && availableQuota === 0 && (
              <View
                className="mb-4 p-3 rounded-xl"
                style={{backgroundColor: '#fee2e2'}}>
                <Text
                  className="text-sm font-medium"
                  style={{color: '#dc2626'}}>
                  ❌ No image quota remaining. Please upgrade your plan or wait
                  for quota reset.
                </Text>
              </View>
            )}

            <View className="flex-row flex-wrap gap-2">
              {[1, 2, 4, 6, 8, 10].map(count => {
                const isAllowedByPlan = count <= maxBatch;
                const isAllowedByQuota = count <= availableQuota;
                const isAllowed = isAllowedByPlan && isAllowedByQuota;

                return (
                  <TouchableOpacity
                    key={count}
                    onPress={() => {
                      if (!isAllowed) return;
                      triggerHaptic('selection');
                      LayoutAnimation.spring();
                      setNumberOfImages(count);
                    }}
                    disabled={!isAllowed}
                    style={{
                      backgroundColor:
                        numberOfImages === count
                          ? theme.primary
                          : theme.background,
                      minWidth: 55,
                      width: '15%',
                      opacity: isAllowed ? 1 : 0.5,
                    }}
                    className={clsx(
                      'px-5 py-2.5 items-center justify-center flex-row',
                      numberOfImages === count ? 'rounded-2xl' : 'rounded-xl',
                    )}>
                    <Text
                      style={{
                        color:
                          numberOfImages === count
                            ? isDark
                              ? theme.text
                              : 'white'
                            : theme.secondaryText,
                      }}
                      className="text-lg">
                      {count}
                    </Text>
                    {!isAllowed && (
                      <View
                        className="absolute p-2 z-[3] rounded-full border"
                        style={{
                          top: -5,
                          right: -5,
                          backgroundColor: theme.surface + '80',
                        }}
                        pointerEvents="none">
                        <LockIcon
                          width={18}
                          height={18}
                          color={theme.secondaryText}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Auto-adjust selected count if it exceeds quota */}
            {numberOfImages > effectiveMaxBatch && effectiveMaxBatch > 0 && (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setNumberOfImages(effectiveMaxBatch);
                }}
                className="mt-3 p-3 rounded-xl"
                style={{backgroundColor: '#dbeafe'}}>
                <Text
                  className="text-sm font-medium text-center"
                  style={{color: '#1e40af'}}>
                  💡 Tap to adjust to {effectiveMaxBatch} image
                  {effectiveMaxBatch !== 1 ? 's' : ''} (max available)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Aspect Ratio and Size */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <View className="mb-5">
              <SectionHeader
                title={t('advanced.featureInfo.aspectRatio.title')}
                showInfoDialog={() => showInfoDialog('aspectRatio')}
                theme={theme}
              />
              <View className="flex-row flex-wrap gap-2">
                {Object.keys(aspectRatios).map(ratio => {
                  const isAllowed = allowedAspectRatios.includes(ratio);
                  const [width, height] = ratio.split(':').map(Number);
                  const BASE_SIZE = 24;
                  let displayWidth, displayHeight;
                  if (width >= height) {
                    displayWidth = BASE_SIZE;
                    displayHeight = (height / width) * BASE_SIZE;
                  } else {
                    displayHeight = BASE_SIZE;
                    displayWidth = (width / height) * BASE_SIZE;
                  }
                  const SCALE_FACTOR = 1.5;
                  if (displayWidth < 12) displayWidth *= SCALE_FACTOR;
                  if (displayHeight < 12) displayHeight *= SCALE_FACTOR;
                  return (
                    <TouchableOpacity
                      key={ratio}
                      onPress={() => {
                        if (!isAllowed) return;
                        triggerHaptic('selection');
                        LayoutAnimation.spring();
                        setAspectRatio(ratio);
                      }}
                      disabled={!isAllowed}
                      style={{
                        backgroundColor:
                          aspectRatio === ratio
                            ? theme.primary
                            : theme.background,
                        opacity: isAllowed ? 1 : 0.5,
                      }}
                      className={clsx(
                        'px-4 py-3 items-center justify-center',
                        aspectRatio === ratio ? 'rounded-2xl' : 'rounded-xl',
                      )}>
                      <View
                        className="mb-2 items-center justify-center"
                        style={{width: 40, height: 30}}>
                        <View
                          className="border-2 rounded-sm"
                          style={{
                            width: displayWidth,
                            height: displayHeight,
                            borderColor:
                              aspectRatio === ratio
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
                            aspectRatio === ratio
                              ? isDark
                                ? theme.text
                                : 'white'
                              : theme.secondaryText,
                          textAlign: 'center',
                        }}
                        className="text-base font-medium">
                        {ratio}
                      </Text>
                      {!isAllowed && (
                        <View
                          className="absolute p-2 z-[3] rounded-full border"
                          style={{
                            top: -5,
                            right: -5,
                            backgroundColor: theme.surface + '80',
                          }}
                          pointerEvents="none">
                          <LockIcon
                            width={18}
                            height={18}
                            color={theme.secondaryText}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Size Selection */}
            <View>
              <SectionHeader
                title={t('advanced.featureInfo.imageSize.title')}
                showInfoDialog={() => showInfoDialog('imageSize')}
                theme={theme}
              />

              <View className="flex-row gap-2">
                {Object.entries(
                  aspectRatios[aspectRatio as keyof typeof aspectRatios],
                ).map(([size, dim]) => {
                  const isAllowed = allowedSizes.includes(size);
                  return (
                    <TouchableOpacity
                      key={size[0]}
                      onPress={() => {
                        if (!isAllowed) return;
                        triggerHaptic('selection');
                        LayoutAnimation.spring();
                        setImageSize(size as ImageSize);
                      }}
                      disabled={!isAllowed}
                      style={{
                        backgroundColor:
                          imageSize === size ? theme.primary : theme.background,
                        opacity: isAllowed ? 1 : 0.5,
                      }}
                      className={clsx(
                        'flex-1 p-3 items-center justify-center',
                        imageSize === size ? 'rounded-2xl' : 'rounded-xl',
                      )}>
                      <Text
                        style={{
                          color:
                            imageSize === size
                              ? isDark
                                ? theme.text
                                : 'white'
                              : theme.secondaryText,
                        }}
                        className="text-center text-lg">
                        {t(`common.${size.toLowerCase()}`) ||
                          size.charAt(0).toUpperCase() + size.slice(1)}
                      </Text>
                      <Text
                        style={{
                          color:
                            imageSize === size
                              ? isDark
                                ? theme.text
                                : 'white'
                              : theme.secondaryText,
                        }}
                        className="text-center text-sm ml-1">
                        {dim.width}x{dim.height}
                      </Text>
                      {!isAllowed && (
                        <View
                          className="absolute p-2 z-[3] rounded-full border"
                          style={{
                            top: -5,
                            right: -5,
                            backgroundColor: theme.surface + '80',
                          }}
                          pointerEvents="none">
                          <LockIcon
                            width={18}
                            height={18}
                            color={theme.secondaryText}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Privacy Settings */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <SectionHeader
              title={t('advanced.privacy')}
              showInfoDialog={() => showInfoDialog('privacy')}
              theme={theme}
            />
            <View className="flex-row justify-between items-center py-2">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center">
                  <Text style={{color: theme.text}} className="text-lg">
                    {t('advanced.privateImages')}
                  </Text>
                  {user?.planType === 'free' && (
                    <View className="ml-2 bg-yellow-500 px-2 py-1 rounded-full">
                      <Text className="text-yellow-900 text-xs font-medium">
                        Pro Only
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{color: theme.secondaryText}} className="text-xs">
                  {user?.planType === 'free'
                    ? t('advanced.upgradeToMakePrivate')
                    : isPrivate
                      ? t('advanced.imagesWillBePrivate')
                      : t('advanced.imagesWillBePublic')}
                </Text>
              </View>
              <TouchableOpacity
                className="w-14 h-8 rounded-full p-1.5"
                style={{
                  backgroundColor:
                    isPrivate && user?.planType !== 'free'
                      ? theme.primary
                      : '#cbd5e1',
                }}
                disabled={user?.planType === 'free'}
                onPress={() => {
                  if (user?.planType === 'free') {
                    return;
                  }
                  setIsPrivate(!isPrivate);
                }}
                accessible={true}
                accessibilityLabel={t('advanced.privacy')}
                accessibilityRole="switch"
                accessibilityState={{checked: isPrivate}}>
                <View
                  className={`w-5 h-5 rounded-full bg-white ${
                    isPrivate ? 'ml-6' : 'ml-0'
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
              title={t('advanced.featureInfo.quality.title')}
              showInfoDialog={() => showInfoDialog('quality')}
              theme={theme}
            />
            <View className="flex-row justify-between items-center py-2">
              <View className="flex-1">
                <Text style={{color: theme.text}}>
                  {t('advanced.premiumImages')}
                </Text>
                <Text style={{color: theme.secondaryText}} className="text-xs">
                  {isPremium
                    ? t('advanced.imagesWillBePremium')
                    : t('advanced.imagesWillBeStandard')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPremium(!isPremium)}
                className="w-14 h-8 rounded-full p-1.5"
                style={{
                  backgroundColor: isPremium ? theme.primary : '#cbd5e1',
                }}
                accessible={true}
                accessibilityLabel={t('advanced.quality')}
                accessibilityRole="switch"
                accessibilityState={{checked: isPremium}}>
                <View
                  className={`w-5 h-5 rounded-full bg-white ${
                    isPremium ? 'ml-6' : 'ml-0'
                  }`}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Seed and Negative Prompt */}
          <View
            className="py-4 px-3 mt-4 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            <View className="mb-5">
              <SectionHeader
                title={t('advanced.featureInfo.seed.title')}
                showInfoDialog={() => showInfoDialog('seed')}
                theme={theme}
              />
              <TextInput
                ref={seedInputRef}
                value={seed}
                onChangeText={setSeed}
                onFocus={() => triggerHaptic('light')}
                placeholder={t('advanced.seedPlaceholder')}
                keyboardType="numeric"
                className="p-4 rounded-xl text-lg"
                style={{backgroundColor: theme.background, color: theme.text}}
                placeholderTextColor="#6B7280"
                accessible={true}
                accessibilityLabel={t('advanced.featureInfo.seed.title')}
                accessibilityHint={t('advanced.seedHint')}
                blurOnSubmit={false}
                caretHidden={false}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
            </View>
            <View>
              <SectionHeader
                title={t('advanced.featureInfo.negativePrompt.title')}
                showInfoDialog={() => showInfoDialog('negativePrompt')}
                theme={theme}
              />
              <TextInput
                ref={negativePromptRef}
                value={negativePrompt}
                onChangeText={setNegativePrompt}
                onFocus={() => triggerHaptic('light')}
                placeholder={t('advanced.negativePromptPlaceholder')}
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
                accessibilityLabel={t(
                  'advanced.featureInfo.negativePrompt.title',
                )}
                accessibilityHint={t('advanced.negativePromptHint')}
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
        selectedStyles={styles}
        toggleStyle={toggleStyle}
      />
    </SafeAreaView>
  );
};

export default AdvancedSettingsScreen;
