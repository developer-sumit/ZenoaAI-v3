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
import EmptyState from '@src/components/EmptyState';
import useAppNavigation from '@src/hooks/useAppNavigation';
import Routes from '@src/constants/routes';
import {contentFilter} from '@src/utils/contentFilter';
import {SCREEN_HEIGHT} from '@src/constants';
import {useStrings} from '@src/hooks/useStrings';
import {useAndroidQuickActions} from '@src/hooks/useAndroidQuickActions';
import {artStyles} from '@src/data/styles';
import {useGenerationStore} from '@src/store/generationStore';
import {useLoginModalStore} from '@src/components/LoginBottomSheet';

// Icons
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

  // Android Quick Actions
  useAndroidQuickActions();

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

    // Check for inappropriate content
    if (!contentFilter.isClean(prompt)) {
      showToast(contentFilter.getErrorMessage(), 'error');
      return;
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
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-3xl font-bold" style={{color: theme.text}}>
            {t('generate.title')}
          </Text>
          <View className="flex-row items-center gap-2">
            <View
              className="rounded-full px-4 py-2.5"
              style={{backgroundColor: theme.surface}}>
              <Text className="font-bold text-base" style={{color: theme.text}}>
                <Text style={{color: theme.primary}}>
                  {user?.planType ? user.planType.toUpperCase() : 'FREE'}
                </Text>
              </Text>
            </View>
            <View
              className="rounded-full px-4 py-2.5"
              style={{backgroundColor: theme.surface}}>
              <Text className="font-bold text-base" style={{color: theme.text}}>
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

        {/* Selected Options Display (Collapsible) */}
        {hasSelectedOptions && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowSettingsDetails(!showSettingsDetails)}
            className="mx-4 mb-3 px-3 py-5 rounded-2xl flex-row items-center justify-between"
            style={{backgroundColor: theme.surface}}>
            <Text className="text-sm font-semibold" style={{color: theme.text}}>
              {t('generate.selectedOptions')}
            </Text>
            {showSettingsDetails ? (
              <ChevronUpIcon color={theme.secondaryText} />
            ) : (
              <ChevronDownIcon color={theme.secondaryText} />
            )}
          </TouchableOpacity>
        )}

        {showSettingsDetails && hasSelectedOptions && (
          <View
            className="mx-4 p-3 rounded-2xl"
            style={{backgroundColor: theme.surface}}>
            {prompt.length > 0 && (
              <Text
                className="text-lg mb-1"
                style={{color: theme.secondaryText}}>
                -&nbsp;
                <Text className="font-bold" style={{color: theme.text}}>
                  {t('imageViewer.prompt')}:
                </Text>
                &nbsp;
                {prompt.length > 70 ? `${prompt.substring(0, 70)}...` : prompt}
              </Text>
            )}
            <Text className="text-lg mb-1" style={{color: theme.secondaryText}}>
              -&nbsp;
              <Text className="font-bold" style={{color: theme.text}}>
                {t('advanced.featureInfo.aiEngine.title')}:
              </Text>
              &nbsp;
              {engine}
            </Text>
            <Text className="text-lg mb-1" style={{color: theme.secondaryText}}>
              -&nbsp;
              <Text className="font-bold" style={{color: theme.text}}>
                {t('advanced.featureInfo.aspectRatio.title')}:
              </Text>
              &nbsp;
              {aspectRatio}
            </Text>
            {styles.length > 0 && (
              <View className="mb-1">
                <Text className="text-lg" style={{color: theme.secondaryText}}>
                  -&nbsp;
                  <Text className="font-bold" style={{color: theme.text}}>
                    {t('advanced.featureInfo.artStyles.title')}:
                  </Text>
                </Text>
                <View className="flex-row flex-wrap mt-1 mx-4">
                  {styles.map(styleName => {
                    const styleData = artStyles.find(s => s.name === styleName);
                    return (
                      <View
                        key={styleName}
                        className="justify-center items-center mr-3 mb-2">
                        {styleData?.image && (
                          <FastImage
                            source={{uri: styleData.image}}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              marginRight: 5,
                            }}
                          />
                        )}
                        <Text style={{color: theme.primary}}>{styleName}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
            <Text className="text-lg mb-1" style={{color: theme.secondaryText}}>
              -&nbsp;
              <Text className="font-bold" style={{color: theme.text}}>
                {t('advanced.featureInfo.batchCount.title')}:
              </Text>
              &nbsp;
              {numberOfImages}
            </Text>
            <Text className="text-lg mb-1" style={{color: theme.secondaryText}}>
              -&nbsp;
              <Text className="font-bold" style={{color: theme.text}}>
                {t('advanced.premiumImages')}:
              </Text>
              &nbsp;
              {isPremium ? t('common.yes') : t('common.no')}
            </Text>
            {seed && (
              <Text
                className="text-lg mb-1"
                style={{color: theme.secondaryText}}>
                -&nbsp;
                <Text className="font-bold" style={{color: theme.text}}>
                  {t('advanced.featureInfo.seed.title')}:
                </Text>
                &nbsp;
                {seed}
              </Text>
            )}
            {negativePrompt && negativePrompt.length > 0 && (
              <Text
                className="text-lg mb-1"
                style={{color: theme.secondaryText}}>
                -&nbsp;
                <Text className="font-bold" style={{color: theme.text}}>
                  {t('advanced.negativePrompt')}:
                </Text>
                &nbsp;
                {negativePrompt.length > 70
                  ? `${negativePrompt.substring(0, 70)}...`
                  : negativePrompt}
              </Text>
            )}

            <Text className="text-lg mb-1" style={{color: theme.secondaryText}}>
              -&nbsp;
              <Text className="font-bold" style={{color: theme.text}}>
                {t('advanced.privateImages')}:
              </Text>
              &nbsp;
              {isPrivate ? t('common.yes') : t('common.no')}
            </Text>
          </View>
        )}

        {/* Generate Button */}
        {user && availableQuota === 0 && (
          <View
            className="py-4 mx-4 rounded-2xl"
            style={{backgroundColor: '#fee2e2'}}>
            <Text
              className="text-center font-medium"
              style={{color: '#dc2626'}}>
              No image quota remaining
            </Text>
            <Text
              className="text-center text-sm mt-1"
              style={{color: '#991b1b'}}>
              Upgrade your plan or wait for quota reset
            </Text>
          </View>
        )}

        {/* Generated Images Grid */}
        <View className="flex-1 mt-3">
          <FlashList
            data={images}
            keyExtractor={(_, index) => index.toString()}
            estimatedItemSize={300}
            className="rounded-3xl mx-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 215, paddingHorizontal: 10}}
            renderItem={renderItem}
            numColumns={2}
            ListEmptyComponent={
              <View style={{minHeight: SCREEN_HEIGHT / 2}}>
                <EmptyState
                  icon={<MagicWand size={48} color={theme.primary} />}
                  title={t('generate.noImages')}
                  description={t('generate.startCreating')}
                />
              </View>
            }
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            extraData={images}
          />
        </View>

        {/* Bottom Input Area */}
        <View className="absolute bottom-28 left-0 right-0 px-4 py-2 z-10">
          <View
            className="rounded-3xl shadow-md"
            style={{
              backgroundColor: theme.surface,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                },
                android: {
                  elevation: 12,
                },
              }),
            }}>
            <View className="flex-row items-center">
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder={t('generate.promptPlaceholder')}
                placeholderTextColor="#94a3b8"
                className="text-lg p-4 max-h-[120px] flex-1"
                style={{color: theme.text}}
                multiline
                numberOfLines={3}
                accessible={true}
                accessibilityLabel={t('generate.imageDescription')}
                accessibilityHint={t('generate.imageDescriptionHint')}
              />
              <Animated.View>
                <TouchableOpacity
                  onPress={() =>
                    setShowPromptSuggestions(!showPromptSuggestions)
                  }
                  className="pr-4"
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
              </Animated.View>
            </View>

            {/* Selected Styles Pills (if any) */}
            {styles.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 px-4 pb-2">
                {styles.map(style => (
                  <TouchableOpacity
                    key={style}
                    style={{backgroundColor: theme.primary + '15'}}
                    onPress={() => {
                      const newStyles = styles.filter(s => s !== style);
                      setStyles(newStyles);
                    }}
                    className="py-1 px-3 rounded-full flex-row items-center"
                    accessible={true}
                    accessibilityLabel={t(
                      'advanced.featureInfo.artStyles.title',
                    )}
                    accessibilityRole="button"
                    accessibilityHint={t(
                      'advanced.featureInfo.artStyles.message',
                    )}>
                    <Text style={{color: theme.primary}} className="text-xs">
                      {style}
                    </Text>
                    <View className="ml-1.5">
                      <CloseIcon size={12} color={theme.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View
              className="flex-row justify-end p-2 border-t gap-2"
              style={{borderColor: theme.surface}}>
              <TouchableOpacity
                onPress={clearInputs}
                disabled={
                  isGenerating || (prompt.length === 0 && styles.length === 0)
                }
                style={{
                  opacity:
                    isGenerating || (prompt.length === 0 && styles.length === 0)
                      ? 0.5
                      : 1,
                  backgroundColor: theme.surface,
                }}
                className="py-3.5 px-5 rounded-2xl flex-row items-center justify-center"
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
                <Text style={{color: theme.text}} className="ml-2 font-medium">
                  {t('common.clear')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('light'); // Add haptic feedback for navigation
                  navigator.navigate({route: Routes.ADVANCED_SETTINGS});
                }}
                className="p-3 rounded-2xl"
                style={{backgroundColor: theme.primary + '20'}}
                accessible={true}
                accessibilityLabel={t('advanced.title')}
                accessibilityRole="button"
                accessibilityHint={t('advanced.title')}>
                <TuneIcon size={24} color={theme.primary} />
              </TouchableOpacity>
              <Animated.View
                className="flex-1"
                style={{transform: [{scale: generateButtonScale}]}}>
                <TouchableOpacity
                  onPress={handleImageGeneration}
                  disabled={isGenerating || prompt.trim().length === 0}
                  style={{
                    opacity:
                      isGenerating || prompt.trim().length === 0 ? 0.5 : 1,
                    backgroundColor: theme.primary,
                  }}
                  className="py-3.5 px-5 rounded-2xl flex-row items-center justify-center flex-1"
                  accessible={true}
                  accessibilityLabel={t('generate.titleImage')}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isGenerating || prompt.trim().length === 0,
                    busy: isGenerating,
                  }}
                  accessibilityHint={t('generate.titleImageHint')}>
                  {isGenerating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white mr-2 font-medium">
                        {t('generate.title')}
                      </Text>
                      <MagicWand color="white" />
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
