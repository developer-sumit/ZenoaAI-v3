import React, {useRef} from 'react';
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
import {useToast} from '@masumdev/rn-toast';
import {FlashList} from '@shopify/flash-list';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';

import appConfig from '@src/config/app.config';
import ImageCard from '@src/components/ImageCard';
import ImageViewer from '@src/components/ImageViewer';
import {useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useImageStore} from '@src/store/imageStore';
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

// Icons
import InfoIcon from '@src/assets/icons/InfoIcon';
import TuneIcon from '@src/assets/icons/TuneIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import MagicWand from '@src/assets/icons/MagicWandIcon';
import RefreshIcon from '@src/assets/icons/RefreshIcon';
import LightbulbOutlineIcon from '@src/assets/icons/LightbulbOutlineIcon';
import {useGenerationStore} from '@src/store/generationStore';
import FastImage from 'react-native-fast-image';

const HomeScreen = () => {
  const strings = useStrings();
  const {isDark, theme} = useTheme();
  const {showToast} = useToast();
  const {user} = useAuthStore();
  const navigator = useAppNavigation();
  const {triggerHaptic} = useHaptics();
  const {animatePress} = useAnimations();
  const {error, generateImage} = useImageStore();
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

  const [images, setImages] = React.useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showPromptSuggestions, setShowPromptSuggestions] =
    React.useState(false);
  const [selectedImage, setSelectedImage] =
    React.useState<GeneratedImage | null>(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  // Animation values for micro interactions
  const generateButtonScale = useRef(new Animated.Value(1)).current;
  const promptSuggestionsButtonScale = useRef(new Animated.Value(1)).current;

  // Android Quick Actions
  useAndroidQuickActions();

  const handleImageGeneration = async () => {
    let tempImages = [];
    for (let i = 0; i < numberOfImages; i++) {
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
        seed: seed ? parseInt(seed, 10) : Math.floor(Math.random() * 1000000),
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

    // Haptic feedback for generation start
    triggerHaptic('medium');

    if (!prompt.trim()) {
      showToast(strings.home.enterDescription, 'error');
      return;
    }

    // Check for inappropriate content
    if (!contentFilter.isClean(prompt)) {
      showToast(contentFilter.getErrorMessage(), 'error');
      return;
    }

    if (!user?.uid) {
      showToast(strings.home.signInRequired, 'error');
      return;
    }

    setIsGenerating(true); // Start loading

    try {
      const apiSettings: ImageGenerationRequest = {
        engineType: engine,
        prompt: prompt.trim(),
        styles: styles ? (Array.isArray(styles) ? styles : [styles]) : [],
        aspectRatio,
        width: imageWidth || 512,
        height: imageHeight || 512,
        imageSize: imageSize,
        seed: seed ? parseInt(seed, 10) : Math.floor(Math.random() * 1000000),
        negativePrompt,
        isPrivate,
        highQuality: isPremium,
      };

      console.log('Generating with:', {apiSettings});

      const promises = Array.from({length: numberOfImages}, () =>
        generateImage(apiSettings),
      );
      const results = await Promise.all(promises);

      results.forEach((result, i) => {
        const {success, data, message} = result;
        if (!success || !data) {
          showToast(message || strings.home.generationFailed, 'error');
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
        showToast(strings.home.generationSuccess, 'success');
      });
    } catch (err) {
      console.error('Generation failed:', err);
      triggerHaptic('error'); // Add error haptic feedback
      showToast(error || 'Failed to generate image', 'error');
    } finally {
      setIsGenerating(false); // End loading after all images are processed
    }
  };

  const clearInputs = () => {
    triggerHaptic('light');
    reset();

    if (Platform.OS === 'android') {
      ToastAndroid.show(strings.home.allCleared, ToastAndroid.SHORT);
    } else {
      showToast(strings.home.allCleared);
    }
  };

  // Render getting started section with collapsible UI
  const renderGettingStarted = () => (
    <View
      className="py-2 mb-2"
      accessible={true}
      accessibilityLabel={strings.home.gettingStartedGuide}>
      {/* Collapsible content */}
      {showOnboarding && (
        <View
          className="rounded-3xl p-5 mb-2"
          style={{backgroundColor: theme.surface}}>
          <Text
            className="text-base mb-4"
            style={{color: theme.text, lineHeight: 22}}
            accessible={true}
            accessibilityRole="text">
            {strings.home.createStunningImages}
          </Text>

          <View
            className="flex-row items-center mb-3"
            accessible={true}
            accessibilityLabel={`${strings.home.step} 1: ${strings.home.step1}`}>
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{backgroundColor: theme.primary}}
              importantForAccessibility="no">
              <Text className="text-white font-bold">1</Text>
            </View>
            <Text style={{color: theme.text, flex: 1}}>
              {strings.home.step1}
            </Text>
          </View>

          <View
            className="flex-row items-center mb-3"
            accessible={true}
            accessibilityLabel={`${strings.home.step} 1: ${strings.home.step2}`}>
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{backgroundColor: theme.primary}}
              importantForAccessibility="no">
              <Text className="text-white font-bold">2</Text>
            </View>
            <Text style={{color: theme.text, flex: 1}}>
              {strings.home.step2}
            </Text>
          </View>

          <View
            className="flex-row items-center mb-4"
            accessible={true}
            accessibilityLabel={`${strings.home.step} 1: ${strings.home.step3}`}>
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{backgroundColor: theme.primary}}
              importantForAccessibility="no">
              <Text className="text-white font-bold">3</Text>
            </View>
            <Text style={{color: theme.text, flex: 1}}>
              {strings.home.step3}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowPromptSuggestions(true)}
            className="py-3 rounded-xl items-center"
            style={{backgroundColor: theme.primary + '20'}}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={strings.home.promptSuggestions}
            accessibilityHint={strings.home.promptSuggestionsHint}>
            <Text style={{color: theme.primary, fontWeight: '600'}}>
              {strings.home.needIdeas}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderItem = ({item}: {item: GeneratedImage}) => {
    return (
      <View className="items-center justify-center w-full">
        <ImageCard
          image={item}
          onPress={() => setSelectedImage(item)}
          style={{width: '95%'}}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: theme.background}}
      contentContainerStyle={{flexGrow: 1}}
      behavior="position"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <View className="flex-1">
        {/* Header with App Name, Version Badge and Help Icon */}
        <View className="flex-row justify-between items-center p-4">
          <View className="flex-row items-center gap-2.5">
            <FastImage
              source={isDark ? appConfig.lightFavicon : appConfig.darkFavicon}
              style={{
                width: 40,
                height: 40,
                borderWidth: 1,
                borderColor: theme.text,
                borderRadius: 12,
                backgroundColor: isDark ? 'white' : '#121212',
              }}
              resizeMode="contain"
              accessible={true}
              accessibilityLabel={appConfig.name}
              accessibilityRole="image"
              importantForAccessibility="yes"
            />
            <Text
              className="text-3xl font-bold"
              style={{color: theme.text}}
              accessibilityRole="header">
              {appConfig.name}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            {/* Version badge */}
            <View
              className="py-1 px-3 rounded-full"
              style={{backgroundColor: theme.primary}}
              accessible={true}
              accessibilityLabel={`Version ${appConfig.version}`}>
              <Text className="text-xs font-medium text-white">
                v{appConfig.version}
              </Text>
            </View>

            {/* Help button to show/hide onboarding */}
            <TouchableOpacity
              onPress={() => setShowOnboarding(!showOnboarding)}
              className="p-2 rounded-full"
              style={{backgroundColor: theme.surface}}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                showOnboarding
                  ? strings.home.hide + strings.home.gettingStartedGuide
                  : strings.home.show + strings.home.gettingStartedGuide
              }
              accessibilityHint={strings.home.toggleGettingStartedHint}>
              <InfoIcon size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Generated Images Grid */}
        <View className="flex-1 pb-5">
          <FlashList
            data={images}
            keyExtractor={item => item.id}
            estimatedItemSize={300}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 215, paddingHorizontal: 10}}
            renderItem={renderItem}
            numColumns={2}
            ListEmptyComponent={
              <View style={{minHeight: SCREEN_HEIGHT - 150}}>
                <EmptyState
                  icon={<MagicWand size={48} color={theme.primary} />}
                  title="No images yet"
                  description="Start creating your first AI-generated image"
                />
              </View>
            }
            ListHeaderComponent={showOnboarding ? renderGettingStarted() : null}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            extraData={{images, isGenerating}}
          />
        </View>

        {/* Bottom Input Area */}
        <View className="absolute bottom-28 left-0 right-0 px-4 py-2 z-10">
          <View
            className="rounded-3xl shadow-md"
            style={{
              backgroundColor: theme.surface,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 12,
            }}>
            <View className="flex-row items-center">
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder={strings.home.generatePrompt}
                placeholderTextColor="#94a3b8"
                className="text-lg p-4 max-h-[120px] flex-1"
                style={{color: theme.text}}
                multiline
                numberOfLines={3}
                accessible={true}
                accessibilityLabel={strings.home.imageDescription}
                accessibilityHint={strings.home.imageDescriptionHint}
              />
              <Animated.View
                style={{transform: [{scale: promptSuggestionsButtonScale}]}}>
                <TouchableOpacity
                  onPress={() => {
                    // Haptic feedback
                    triggerHaptic('light');
                    animatePress(promptSuggestionsButtonScale);
                    setShowPromptSuggestions(true);
                  }}
                  className="pr-4"
                  accessible={true}
                  accessibilityLabel={strings.home.promptSuggestions}
                  accessibilityHint={strings.home.promptSuggestionsHint}
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

            {/* Selected Styles Pills */}
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
                    accessibilityLabel={`Remove ${style} style`}
                    accessibilityRole="button"
                    accessibilityHint={`Tap to remove the ${style} style`}>
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
                accessibilityLabel={strings.home.clearInputs}
                accessibilityState={{
                  disabled:
                    isGenerating ||
                    (prompt.length === 0 && styles.length === 0),
                }}
                accessibilityRole="button"
                accessibilityHint={strings.home.clearInputsHint}>
                <RefreshIcon size={20} color={theme.text} />
                <Text style={{color: theme.text}} className="ml-2 font-medium">
                  {strings.common.clear}
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
                accessibilityLabel={strings.advancedSettings.title}
                accessibilityRole="button"
                accessibilityHint={strings.advancedSettings.title}>
                <TuneIcon size={24} color={theme.primary} />
              </TouchableOpacity>
              <Animated.View
                className="flex-1"
                style={{transform: [{scale: generateButtonScale}]}}>
                <TouchableOpacity
                  onPress={() => {
                    animatePress(generateButtonScale);
                    handleImageGeneration();
                  }}
                  disabled={isGenerating || prompt.trim().length === 0}
                  style={{
                    opacity:
                      isGenerating || prompt.trim().length === 0 ? 0.5 : 1,
                    backgroundColor: theme.primary,
                  }}
                  className="py-3.5 px-5 rounded-2xl flex-row items-center justify-center flex-1"
                  accessible={true}
                  accessibilityLabel={strings.home.generateImage}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isGenerating || prompt.trim().length === 0,
                    busy: isGenerating,
                  }}
                  accessibilityHint={strings.home.generateImageHint}>
                  {isGenerating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white mr-2 font-medium">
                        {strings.home.generate}
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
            // onImageDeleted={fetchImages}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;
