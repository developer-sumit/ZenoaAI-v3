import React, {useRef, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Keyboard,
  ToastAndroid,
  Animated,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import FastImage from 'react-native-fast-image';

import ImageCard from '@src/components/ImageCard';
import ImageViewer from '@src/components/ImageViewer';
import {useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useImageStore} from '@src/store/imageStore';
import useToast from '@src/hooks/useToast';
import {useHaptics} from '@src/hooks/useHaptics';
import {useAnimations} from '@src/hooks/useAnimations';
import {GeneratedImage, ImageGenerationRequest} from '@src/types/image';
import PromptSuggestions from '@src/components/PromptSuggestion';
import useAppNavigation from '@src/hooks/useAppNavigation';
import Routes from '@src/constants/routes';
import {SCREEN_HEIGHT} from '@src/constants';
import {useStrings} from '@src/hooks/useStrings';
import {artStyles} from '@src/data/styles';
import {useGenerationStore} from '@src/store/generationStore';
import {useLoginModalStore} from '@src/components/LoginBottomSheet';
import TuneIcon from '@src/assets/icons/TuneIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import MagicWand from '@src/assets/icons/MagicWandIcon';
import RefreshIcon from '@src/assets/icons/RefreshIcon';
import LightbulbOutlineIcon from '@src/assets/icons/LightbulbOutlineIcon';
import ChevronDownIcon from '@src/assets/icons/ChevronDownIcon';
import ChevronUpIcon from '@src/assets/icons/ChevronUpIcon';

const GenerateScreen = () => {
  const t = useStrings();
  const {theme} = useTheme();
  const {showToast} = useToast();
  const {user} = useAuthStore();
  const navigator = useAppNavigation();
  const {triggerHaptic} = useHaptics();
  const {animatePress} = useAnimations();
  const {error, generateImage, validateBatchGeneration, getAvailableQuota} =
    useImageStore();
  const {show} = useLoginModalStore();
  const {
    prompt,
    engine,
    aspectRatio,
    imageSize,
    negativePrompt,
    isPrivate,
    isPremium,
    numberOfImages,
    styles,
    seed,
    setPrompt,
    setStyles,
    imageWidth,
    imageHeight,
    reset,
  } = useGenerationStore();

  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);
  const [showSettingsDetails, setShowSettingsDetails] = useState(false); // New state for toggling settings display

  // Animation values for micro interactions
  const generateButtonScale = useRef(new Animated.Value(1)).current;

  const handleImageGeneration = useCallback(async () => {
    animatePress(generateButtonScale);
    Keyboard.dismiss(); // Dismiss keyboard on generate

    if (!user?.uid) {
      show();
      return;
    }

    if (!prompt.trim()) {
      showToast(t('generate.enterPrompt'), 'error');
      return;
    }

    // Validate quota before generation
    const validation = validateBatchGeneration(numberOfImages);

    if (!validation.canGenerate) {
      showToast(validation.message || 'Cannot generate images', 'error');
      return;
    }

    // Show warning if count was adjusted
    if (validation.message && validation.adjustedCount !== numberOfImages) {
      showToast(validation.message, 'info');
    }

    let tempImages = [];
    for (let i = 0; i < validation.adjustedCount; i++) {
      const placeholderImage: GeneratedImage = {
        id: `placeholder-${i}`,
        userId: user?.uid || '',
        prompt: prompt || '',
        imageUrl: 'placeholder', // Placeholder URL
        thumbnailUrl: '', // Placeholder thumbnail
        engineType: engine,
        styles: styles || [],
        width: imageWidth || 512,
        height: imageHeight || 512,
        seed: seed ? parseInt(seed, 10) : 0,
        imageSize: imageSize,
        aspectRatio: aspectRatio,
        negativePrompt: negativePrompt || '',
        isFavorite: false,
        favoriteCount: 0,
        isPrivate: isPrivate || false,
        createdAt: new Date(),
        userName: user?.profile.name || 'Anonymous',
        userAvatar: user?.profile.avatar || '',
      };
      tempImages.push(placeholderImage);
    }
    setImages(tempImages);

    try {
      setIsGenerating(true); // Start loading
      const apiSettings: ImageGenerationRequest = {
        engineType: engine,
        prompt: prompt.trim(),
        styles: styles ? (Array.isArray(styles) ? styles : [styles]) : [],
        aspectRatio,
        width: imageWidth || 512,
        height: imageHeight || 512,
        imageSize: imageSize,
        seed: seed ? parseInt(seed, 10) : 0,
        negativePrompt,
        isPrivate,
        highQuality: isPremium,
      };

      console.log('Generating with:', {apiSettings});

      const promises = Array.from({length: validation.adjustedCount}, () =>
        generateImage(apiSettings),
      );
      const results = await Promise.all(promises);

      results.forEach((result, i) => {
        const {success, data, message} = result;
        if (!success || !data) {
          showToast(message || t('generate.generationFailed'), 'error');
          return;
        }

        const newData = {
          id: data.id,
          userId: data.userId,
          prompt: prompt || data.prompt,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.imageUrl,
          engineType: data.engineType,
          styles: data.styles,
          width: data.width,
          height: data.height,
          seed: data.seed,
          imageSize: data.imageSize,
          aspectRatio: data.aspectRatio,
          negativePrompt: data.negativePrompt,
          isFavorite: data.isFavorite,
          favoriteCount: data.favoriteCount,
          isPrivate: data.isPrivate,
          createdAt: new Date(),
          userName: data.userName || user?.profile.name || 'Anonymous',
          userAvatar: data.userAvatar || user?.profile.avatar || '',
        };

        setImages(prev =>
          prev.map((img, idx) => (idx === i ? {...newData} : img)),
        );

        triggerHaptic('success');
        showToast(
          t('generate.generationSuccess', {count: numberOfImages}),
          'success',
        );
      });
    } catch (err) {
      console.error('Generation failed:', err);
      triggerHaptic('error'); // Add error haptic feedback
      showToast(error || t('generate.generationFailed'), 'error');
    } finally {
      setIsGenerating(false); // End loading after all images are processed
    }
  }, [
    prompt,
    numberOfImages,
    validateBatchGeneration,
    engine,
    imageSize,
    imageWidth,
    imageHeight,
    styles,
    seed,
    negativePrompt,
    isPrivate,
    isPremium,
    triggerHaptic,
    showToast,
    navigator,
  ]);

  const clearInputs = useCallback(() => {
    triggerHaptic('light');
    reset();

    if (Platform.OS === 'android') {
      ToastAndroid.show(t('generate.allCleared'), ToastAndroid.SHORT);
    } else {
      showToast(t('generate.allCleared'));
    }
  }, [t, reset, triggerHaptic, showToast]);

  const renderItem = useCallback(({item}: {item: GeneratedImage}) => {
    return (
      <View className="items-center justify-center w-full">
        <ImageCard
          image={item}
          onPress={() => setSelectedImage(item)}
          hideFavorite
          style={{width: '95%'}}
        />
      </View>
    );
  }, []);

  const hasSelectedOptions = useMemo(() => {
    return (
      prompt.length > 0 ||
      aspectRatio !== '1:1' || // Assuming 1:1 is default
      styles.length > 0 ||
      numberOfImages > 1 ||
      isPremium ||
      seed ||
      (negativePrompt && negativePrompt.length > 0) ||
      isPrivate // Check if private mode is on
    );
  }, [
    prompt,
    aspectRatio,
    styles,
    numberOfImages,
    isPremium,
    seed,
    negativePrompt,
    isPrivate,
  ]);

  // Get available quota for UI display
  const availableQuota = getAvailableQuota();

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: theme.background}}
      contentContainerStyle={{flexGrow: 1}}
      behavior="position"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <View className="flex-1">
        {/* Modern Header with Avatar and Stats */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text
                className="text-3xl font-bold mb-1"
                style={{color: theme.text, fontFamily: 'Poppins-Bold'}}>
                {t('generate.title')}
              </Text>
              <Text
                className="text-base opacity-70"
                style={{
                  color: theme.secondaryText,
                  fontFamily: 'Poppins-Regular',
                }}>
                Create stunning AI artwork
              </Text>
            </View>
            <View className="flex-row gap-3">
              <View
                className="px-4 py-2.5 rounded-2xl border border-opacity-10"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.primary,
                }}>
                <Text
                  className="font-semibold text-sm"
                  style={{
                    color: theme.primary,
                    fontFamily: 'Poppins-SemiBold',
                  }}>
                  {user?.planType ? user.planType.toUpperCase() : 'FREE'}
                </Text>
              </View>
              <View
                className="px-4 py-2.5 rounded-2xl"
                style={{backgroundColor: theme.surface}}>
                <Text
                  className="font-semibold text-sm"
                  style={{color: theme.text, fontFamily: 'Poppins-SemiBold'}}>
                  {user && user.quota
                    ? `${user.quota.imagesRemaining}${
                        user.quota.planLimits.totalImages
                          ? ` / ${user.quota.planLimits.totalImages}`
                          : ''
                      }`
                    : '0 / ∞'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quota Progress Bar */}
          {user && user.quota && user.quota.planLimits.totalImages && (
            <View className="mb-4">
              <View
                className="h-2 rounded-full overflow-hidden"
                style={{backgroundColor: theme.secondaryText + '20'}}>
                <View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      user.quota.imagesRemaining > 5
                        ? theme.primary
                        : user.quota.imagesRemaining > 0
                          ? '#f59e0b'
                          : '#ef4444',
                    width: `${Math.round((user.quota.imagesRemaining / user.quota.planLimits.totalImages) * 100)}%`,
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Modern Settings Preview Card */}
        {hasSelectedOptions && (
          <View className="mx-6 mb-4">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowSettingsDetails(!showSettingsDetails)}
              className="px-5 py-4 rounded-3xl flex-row items-center justify-between"
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.primary + '15',
              }}>
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                  style={{backgroundColor: theme.primary + '20'}}>
                  <TuneIcon size={20} color={theme.primary} />
                </View>
                <View>
                  <Text
                    className="font-semibold text-base"
                    style={{color: theme.text, fontFamily: 'Poppins-SemiBold'}}>
                    {t('generate.selectedOptions')}
                  </Text>
                  <Text
                    className="text-sm opacity-70"
                    style={{
                      color: theme.secondaryText,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    Tap to {showSettingsDetails ? 'hide' : 'view'} details
                  </Text>
                </View>
              </View>
              <View
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{backgroundColor: theme.background}}>
                {showSettingsDetails ? (
                  <ChevronUpIcon size={18} color={theme.primary} />
                ) : (
                  <ChevronDownIcon size={18} color={theme.primary} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Animated Settings Details */}
        {showSettingsDetails && hasSelectedOptions && (
          <View
            className="mx-6 mb-4 p-5 rounded-3xl border"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.primary + '10',
            }}>
            {prompt.length > 0 && (
              <View
                className="mb-4 p-4 rounded-2xl"
                style={{backgroundColor: theme.background}}>
                <Text
                  className="font-semibold mb-2"
                  style={{color: theme.text, fontFamily: 'Poppins-SemiBold'}}>
                  {t('imageViewer.prompt')}
                </Text>
                <Text
                  className="text-base leading-5"
                  style={{
                    color: theme.secondaryText,
                    fontFamily: 'Poppins-Regular',
                  }}>
                  {prompt.length > 100
                    ? `${prompt.substring(0, 100)}...`
                    : prompt}
                </Text>
              </View>
            )}

            <View className="space-y-3">
              <View className="flex-row items-center justify-between py-2">
                <Text
                  className="font-medium"
                  style={{
                    color: theme.secondaryText,
                    fontFamily: 'Poppins-Medium',
                  }}>
                  {t('advanced.featureInfo.aiEngine.title')}
                </Text>
                <Text
                  className="font-semibold"
                  style={{color: theme.text, fontFamily: 'Poppins-SemiBold'}}>
                  {engine}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-2">
                <Text
                  className="font-medium"
                  style={{
                    color: theme.secondaryText,
                    fontFamily: 'Poppins-Medium',
                  }}>
                  {t('advanced.featureInfo.aspectRatio.title')}
                </Text>
                <Text
                  className="font-semibold"
                  style={{color: theme.text, fontFamily: 'Poppins-SemiBold'}}>
                  {aspectRatio}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-2">
                <Text
                  className="font-medium"
                  style={{
                    color: theme.secondaryText,
                    fontFamily: 'Poppins-Medium',
                  }}>
                  {t('advanced.featureInfo.batchCount.title')}
                </Text>
                <Text
                  className="font-semibold"
                  style={{color: theme.text, fontFamily: 'Poppins-SemiBold'}}>
                  {numberOfImages}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-2">
                <Text
                  className="font-medium"
                  style={{
                    color: theme.secondaryText,
                    fontFamily: 'Poppins-Medium',
                  }}>
                  {t('advanced.premiumImages')}
                </Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: isPremium
                      ? theme.primary + '20'
                      : theme.secondaryText + '20',
                  }}>
                  <Text
                    className="font-semibold text-sm"
                    style={{
                      color: isPremium ? theme.primary : theme.secondaryText,
                      fontFamily: 'Poppins-SemiBold',
                    }}>
                    {isPremium ? t('common.yes') : t('common.no')}
                  </Text>
                </View>
              </View>

              {styles.length > 0 && (
                <View className="py-2">
                  <Text
                    className="font-medium mb-3"
                    style={{
                      color: theme.secondaryText,
                      fontFamily: 'Poppins-Medium',
                    }}>
                    {t('advanced.featureInfo.artStyles.title')}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {styles.map(styleName => {
                      const styleData = artStyles.find(
                        s => s.name === styleName,
                      );
                      return (
                        <View
                          key={styleName}
                          className="flex-row items-center px-3 py-2 rounded-2xl"
                          style={{backgroundColor: theme.primary + '15'}}>
                          {styleData?.image && (
                            <FastImage
                              source={{uri: styleData.image}}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                marginRight: 8,
                              }}
                            />
                          )}
                          <Text
                            className="font-medium text-sm"
                            style={{
                              color: theme.primary,
                              fontFamily: 'Poppins-Medium',
                            }}>
                            {styleName}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {seed && (
                <View className="flex-row items-center justify-between py-2">
                  <Text
                    className="font-medium"
                    style={{
                      color: theme.secondaryText,
                      fontFamily: 'Poppins-Medium',
                    }}>
                    {t('advanced.featureInfo.seed.title')}
                  </Text>
                  <Text
                    className="font-semibold"
                    style={{color: theme.text, fontFamily: 'Poppins-SemiBold'}}>
                    {seed}
                  </Text>
                </View>
              )}

              {negativePrompt && negativePrompt.length > 0 && (
                <View className="py-2">
                  <Text
                    className="font-medium mb-2"
                    style={{
                      color: theme.secondaryText,
                      fontFamily: 'Poppins-Medium',
                    }}>
                    {t('advanced.negativePrompt')}
                  </Text>
                  <Text
                    className="text-sm"
                    style={{color: theme.text, fontFamily: 'Poppins-Regular'}}>
                    {negativePrompt.length > 80
                      ? `${negativePrompt.substring(0, 80)}...`
                      : negativePrompt}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center justify-between py-2">
                <Text
                  className="font-medium"
                  style={{
                    color: theme.secondaryText,
                    fontFamily: 'Poppins-Medium',
                  }}>
                  {t('advanced.privateImages')}
                </Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: isPrivate
                      ? theme.primary + '20'
                      : theme.secondaryText + '20',
                  }}>
                  <Text
                    className="font-semibold text-sm"
                    style={{
                      color: isPrivate ? theme.primary : theme.secondaryText,
                      fontFamily: 'Poppins-SemiBold',
                    }}>
                    {isPrivate ? t('common.yes') : t('common.no')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Modern Quota Warning */}
        {user && availableQuota === 0 && (
          <View
            className="mx-6 mb-4 p-5 rounded-3xl border-2"
            style={{
              backgroundColor: '#fef2f2',
              borderColor: '#fecaca',
            }}>
            <View className="flex-row items-center mb-2">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                style={{backgroundColor: '#fee2e2'}}>
                <Text className="text-xl">⚠️</Text>
              </View>
              <Text
                className="font-semibold text-lg"
                style={{color: '#dc2626', fontFamily: 'Poppins-SemiBold'}}>
                No quota remaining
              </Text>
            </View>
            <Text
              className="text-base"
              style={{color: '#991b1b', fontFamily: 'Poppins-Regular'}}>
              Upgrade your plan or wait for quota reset to continue generating
              images
            </Text>
          </View>
        )}

        {/* Modern Images Grid */}
        <View className="flex-1 px-6">
          <FlashList
            data={images}
            keyExtractor={(_, index) => index.toString()}
            estimatedItemSize={300}
            className="rounded-3xl"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 215, paddingHorizontal: 4}}
            renderItem={renderItem}
            numColumns={2}
            ListEmptyComponent={
              <View
                style={{minHeight: SCREEN_HEIGHT / 3}}
                className="items-center justify-center">
                <View
                  className="w-24 h-24 rounded-3xl items-center justify-center mb-4"
                  style={{backgroundColor: theme.surface}}>
                  <MagicWand size={36} color={theme.primary} />
                </View>
                <Text
                  className="text-2xl font-bold mb-2"
                  style={{color: theme.text, fontFamily: 'Poppins-Bold'}}>
                  {t('generate.noImages')}
                </Text>
                <Text
                  className="text-base text-center opacity-70 leading-6"
                  style={{
                    color: theme.secondaryText,
                    fontFamily: 'Poppins-Regular',
                  }}>
                  {t('generate.startCreating')}
                </Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            extraData={images}
          />
        </View>

        {/* Modern Bottom Input Area */}
        <View className="absolute bottom-28 left-0 right-0 px-6 py-2 z-10">
          <View
            className="rounded-3xl border"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.primary + '15',
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 8},
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                },
                android: {
                  elevation: 16,
                },
              }),
            }}>
            {/* Input Section */}
            <View className="px-5 py-4">
              <View className="flex-row items-end">
                <View className="flex-1">
                  <TextInput
                    value={prompt}
                    onChangeText={setPrompt}
                    placeholder={t('generate.promptPlaceholder')}
                    placeholderTextColor={theme.secondaryText + '80'}
                    className="text-lg max-h-[120px] min-h-[48px]"
                    style={{
                      color: theme.text,
                      fontFamily: 'Poppins-Regular',
                      textAlignVertical: 'top',
                    }}
                    multiline
                    numberOfLines={3}
                    accessible={true}
                    accessibilityLabel={t('generate.imageDescription')}
                    accessibilityHint={t('generate.imageDescriptionHint')}
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setShowPromptSuggestions(!showPromptSuggestions)
                  }
                  className="ml-3 w-12 h-12 rounded-2xl items-center justify-center"
                  style={{
                    backgroundColor:
                      prompt.length === 0
                        ? theme.primary + '20'
                        : theme.background,
                  }}
                  accessible={true}
                  accessibilityLabel={t('generate.promptSuggestions')}
                  accessibilityHint={t('generate.promptSuggestionsHint')}
                  accessibilityRole="button">
                  <LightbulbOutlineIcon
                    size={24}
                    color={
                      prompt.length === 0 ? theme.primary : theme.secondaryText
                    }
                  />
                </TouchableOpacity>
              </View>

              {/* Selected Styles Pills */}
              {styles.length > 0 && (
                <View
                  className="flex-row flex-wrap gap-2 mt-4 pt-4"
                  style={{borderTopWidth: 1, borderTopColor: theme.background}}>
                  {styles.map(style => (
                    <TouchableOpacity
                      key={style}
                      style={{backgroundColor: theme.primary + '15'}}
                      onPress={() => {
                        const newStyles = styles.filter(s => s !== style);
                        setStyles(newStyles);
                      }}
                      className="py-2 px-4 rounded-2xl flex-row items-center"
                      accessible={true}
                      accessibilityLabel={t(
                        'advanced.featureInfo.artStyles.title',
                      )}
                      accessibilityRole="button"
                      accessibilityHint={t(
                        'advanced.featureInfo.artStyles.message',
                      )}>
                      <Text
                        style={{
                          color: theme.primary,
                          fontFamily: 'Poppins-Medium',
                        }}
                        className="text-sm">
                        {style}
                      </Text>
                      <View className="ml-2">
                        <CloseIcon size={14} color={theme.primary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View
              className="flex-row p-4 border-t"
              style={{borderColor: theme.background}}>
              <TouchableOpacity
                onPress={clearInputs}
                disabled={
                  isGenerating || (prompt.length === 0 && styles.length === 0)
                }
                style={{
                  opacity:
                    isGenerating || (prompt.length === 0 && styles.length === 0)
                      ? 0.4
                      : 1,
                  backgroundColor: theme.background,
                }}
                className="py-4 px-6 rounded-2xl flex-row items-center justify-center"
                accessible={true}
                accessibilityLabel={t('generate.clearInputs')}
                accessibilityState={{
                  disabled:
                    isGenerating ||
                    (prompt.length === 0 && styles.length === 0),
                }}
                accessibilityRole="button"
                accessibilityHint={t('generate.clearInputsHint')}>
                <RefreshIcon size={20} color={theme.text} />
                <Text
                  style={{color: theme.text, fontFamily: 'Poppins-Medium'}}
                  className="ml-2">
                  {t('common.clear')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('light');
                  navigator.navigate({route: Routes.ADVANCED_SETTINGS});
                }}
                className="w-14 h-14 ml-3 rounded-2xl items-center justify-center"
                style={{backgroundColor: theme.primary + '20'}}
                accessible={true}
                accessibilityLabel={t('advanced.title')}
                accessibilityRole="button"
                accessibilityHint={t('advanced.title')}>
                <TuneIcon size={24} color={theme.primary} />
              </TouchableOpacity>

              <Animated.View
                className="flex-1 ml-3"
                style={{transform: [{scale: generateButtonScale}]}}>
                <TouchableOpacity
                  onPress={handleImageGeneration}
                  disabled={isGenerating || prompt.trim().length === 0}
                  style={{
                    opacity:
                      isGenerating || prompt.trim().length === 0 ? 0.5 : 1,
                    backgroundColor: theme.primary,
                  }}
                  className="py-4 px-6 rounded-2xl flex-row items-center justify-center"
                  accessible={true}
                  accessibilityLabel={t('generate.titleImage')}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isGenerating || prompt.trim().length === 0,
                    busy: isGenerating,
                  }}
                  accessibilityHint={t('generate.titleImageHint')}>
                  {isGenerating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text
                        className="text-white mr-3 font-semibold text-base"
                        style={{fontFamily: 'Poppins-SemiBold'}}>
                        {t('generate.title')}
                      </Text>
                      <MagicWand color="white" size={20} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>

        <PromptSuggestions
          visible={showPromptSuggestions}
          setVisible={setShowPromptSuggestions}
          onSelectPrompt={selectedPrompt => setPrompt(selectedPrompt)}
          theme={theme}
        />

        {selectedImage && (
          <ImageViewer
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default GenerateScreen;
