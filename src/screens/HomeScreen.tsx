import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  ToastAndroid,
} from 'react-native';
import {useToast} from '@masumdev/rn-toast';
import {FlashList} from '@shopify/flash-list';
import {useRoute} from '@react-navigation/native';

import {aspectRatios} from '@src/data/ratio';
import appConfig from '@src/config/app.config';
import ImageCard from '@src/components/ImageCard';
import ImageSkeleton from '@src/components/ImageSkeleton';
import ImageViewer from '@src/components/ImageViewer';
import {useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useImageStore} from '@src/store/imageStore';
import {useQuota} from '@src/hooks/useQuota';
import {GeneratedImage} from '../types';
import {AspectRatio} from '../types/image';
import PromptSuggestions from '@src/components/PromptSuggestion';
import EmptyState from '@src/components/EmptyState';
import useAppNavigation from '@src/hooks/useAppNavigation';
import Routes from '@src/constants/routes';
import {contentFilter} from '@src/utils/contentFilter';
import {useStrings} from '@src/hooks/useStrings';
import {useAndroidQuickActions} from '@src/hooks/useAndroidQuickActions';

// Icons
import TipIcon from '@src/assets/icons/TipIcon';
import InfoIcon from '@src/assets/icons/InfoIcon';
import TuneIcon from '@src/assets/icons/TuneIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import MagicWand from '@src/assets/icons/MagicWandIcon';
import RefreshIcon from '@src/assets/icons/RefreshIcon';
import LightbulbOutlineIcon from '@src/assets/icons/LightbulbOutlineIcon';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 24;
const COLUMN_WIDTH = (SCREEN_WIDTH - PADDING) / 2;

const HomeScreen = () => {
  const strings = useStrings();
  const {theme} = useTheme();
  const {showToast} = useToast();
  const {user} = useAuthStore();
  const navigator = useAppNavigation();
  const route = useRoute();
  const {
    images: generatedImages,
    currentGenerationBatch,
    isLoading: imageLoading,
    fetchImages,
    generateBatch,
  } = useImageStore();
  const {hasImageQuota, refetch: refetchQuota} = useQuota();

  const [showPromptSuggestions, setShowPromptSuggestions] =
    React.useState(false);
  const [prompt, setPrompt] = React.useState('');
  const [selectedStyles, setSelectedStyles] = React.useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>({
    ratio: aspectRatios[0].ratio,
    sizes: aspectRatios[0].sizes,
    size: 'medium',
  });
  const [numberOfImages, setNumberOfImages] = React.useState(1);
  const [quality, setQuality] = React.useState(25);
  const [seed, setSeed] = React.useState('');
  const [negativePrompt, setNegativePrompt] = React.useState('');
  const [selectedImage, setSelectedImage] =
    React.useState<GeneratedImage | null>(null);

  // New advanced settings
  const [engine, setEngine] = React.useState<'quantum' | 'nebula'>('quantum');
  const [guidance, setGuidance] = React.useState<number>(7.5);
  const [steps, setSteps] = React.useState<number>(30);
  const flashListRef = useRef<FlashList<any>>(null);

  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Combined function to update both quota and profile
  const updateQuotaAndProfile = async () => {
    await refetchQuota();
  };

  // Load user's images when component mounts
  useEffect(() => {
    if (user?.uid) {
      fetchImages(1, 20, true); // Load first page
    }
  }, [user?.uid, fetchImages]);

  // Handle remix data from navigation params
  useEffect(() => {
    const params = route.params as any;
    if (params?.remixData) {
      const remix = params.remixData; // Apply the remix settings
      setPrompt(remix.prompt || '');
      setNegativePrompt(remix.negativePrompt || '');
      setEngine(remix.engine || 'quantum');
      setGuidance(remix.guidance || 7.5);
      setSteps(remix.steps || 30);
      setSeed(remix.seed?.toString() || '');
      setSelectedStyles(remix.styles || []);

      // Set aspect ratio based on dimensions
      if (remix.width && remix.height) {
        const ratio = `${remix.width}:${remix.height}`;
        const foundRatio = aspectRatios.find(ar => ar.ratio === ratio);
        if (foundRatio) {
          setAspectRatio({
            ratio: foundRatio.ratio,
            sizes: foundRatio.sizes,
            size: 'medium',
          });
        }
      }
      showToast('Settings applied from remixed image!', 'success');
    }
  }, [route.params]);

  const getAspectRatio = (image: GeneratedImage): number => {
    // Use actual image dimensions if available
    if (image.width && image.height) {
      return image.width / image.height;
    } // Fall back to aspectRatio if dimensions not available
    if (image?.aspectRatio) {
      const [width, height] = image.aspectRatio.split(':').map(Number);
      return width / height;
    }

    // Default to 1:1 if nothing available
    return 1;
  };

  // Get the height for an image based on its aspect ratio
  const getImageHeight = (image: GeneratedImage): number => {
    const ratio = getAspectRatio(image);
    return COLUMN_WIDTH / ratio;
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const handleImageGeneration = async () => {
    if (!prompt.trim()) {
      showToast(strings.home.enterDescription, 'error');
      return;
    }

    // Check for inappropriate content
    if (!contentFilter.isClean(prompt)) {
      showToast(contentFilter.getErrorMessage(), 'error');
      return;
    }

    // Also check negative prompt if provided
    if (negativePrompt && !contentFilter.isClean(negativePrompt)) {
      showToast(
        'Negative prompt contains inappropriate content. Please revise and try again.',
        'error',
      );
      return;
    }

    if (!user?.uid) {
      showToast(strings.home.signInRequired, 'error');
      return;
    }

    // Check quota
    if (!hasImageQuota) {
      showToast('Image generation quota exceeded', 'error');
      return;
    }
    try {
      console.log('Generating with:', {prompt, selectedStyles, aspectRatio});

      // Convert our settings to the API format (matching web)
      const apiSettings = {
        engine, // Use current engine setting
        style: selectedStyles?.[0] || 'photorealistic',
        aspectRatio: aspectRatio.ratio,
        imageSize: aspectRatio.size || 'medium',
        quality: 'standard' as const,
        guidance, // Use current guidance setting
        steps, // Use current steps setting
        seed: seed ? parseInt(seed, 10) : undefined,
        negativePrompt,
        isPrivate: false,
      };

      // Generate the batch using the store
      const success = await generateBatch(
        prompt,
        apiSettings,
        numberOfImages,
        updateQuotaAndProfile,
      );

      if (success) {
        console.log('Image generated successfully!');
        // Scroll to top if needed
        if (flashListRef.current) {
          // @ts-ignore
          flashListRef.current.scrollToOffset({offset: 0, animated: true});
        }
      } else {
        console.error('Image generation failed');
        showToast('Failed to generate image', 'error');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      showToast('Failed to generate image', 'error');
    }
  };

  const reusePromptAndSettings = (item: {
    parameters: {
      prompt: string;
      styles: string[];
      aspectRatio: string;
    };
  }) => {
    setPrompt(item.parameters.prompt);
    setSelectedStyles(item.parameters.styles);

    // Find the matching AspectRatio object from aspectRatios
    const aspectRatioObj =
      aspectRatios.find(ar => ar.ratio === item.parameters.aspectRatio) ||
      aspectRatios[0];
    setAspectRatio(aspectRatioObj);

    // Auto scroll to input
    setTimeout(() => {
      if (flashListRef.current) {
        flashListRef.current.scrollToOffset({offset: 0, animated: true});
      }
    }, 300);

    if (Platform.OS === 'android') {
      ToastAndroid.show(strings.home.promptApplied, ToastAndroid.SHORT);
    } else {
      showToast(strings.home.promptApplied, 'success');
    }
  };

  const getCombinedImages = () => {
    // Show current generation batch at the top if there are any
    const combinedImages = [...currentGenerationBatch, ...generatedImages];
    return combinedImages;
  };

  const groupImagesByParameters = (images: GeneratedImage[]) => {
    const groups: {[key: string]: GeneratedImage[]} = {};

    images.forEach(image => {
      // Group batch images by their exact batchTimestamp (for images generated together)
      // or by a time window for images from different sessions
      let groupingIdentifier;

      if (image.batchTimestamp) {
        // For batch images, use the exact batchTimestamp (they should all have the same timestamp)
        // But also include prompt to separate different batches with same timestamp
        groupingIdentifier = `${image.batchTimestamp.getTime()}-${
          image.prompt || ''
        }`;
      } else if (image.createdAt) {
        // For server images, use a 30-second window
        const createdTime = new Date(image.createdAt).getTime();
        const timeWindow = Math.floor(createdTime / 30000) * 30000;
        groupingIdentifier = `${timeWindow}-${image.prompt || ''}`;
      } else {
        // Fallback
        groupingIdentifier = `${Date.now()}-${image.prompt || ''}`;
      }

      // Create grouping key based on prompt and basic generation settings
      const groupKey = [
        image.prompt || '',
        (image.styles || []).sort().join(','),
        image.engineType || 'quantum',
        groupingIdentifier,
      ].join('|');

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(image);
    });

    return Object.entries(groups)
      .map(([key, items]) => ({
        key,
        items: items.sort((a, b) => {
          // Sort by batchTimestamp or createdAt, newest first
          const timeA = a.batchTimestamp
            ? a.batchTimestamp.getTime()
            : new Date(a.createdAt).getTime() || 0;
          const timeB = b.batchTimestamp
            ? b.batchTimestamp.getTime()
            : new Date(b.createdAt).getTime() || 0;
          return timeB - timeA;
        }),
        parameters: {
          prompt: items[0].prompt || '',
          styles: items[0].styles || [],
          aspectRatio: items[0].aspectRatio || '1:1',
          timestamp: items[0].batchTimestamp
            ? items[0].batchTimestamp.getTime()
            : new Date(items[0].createdAt).getTime(),
        },
      }))
      .sort((a, b) => b.parameters.timestamp - a.parameters.timestamp); // Sort groups by timestamp, newest first
  };

  // Render a placeholder or loading image
  const renderImageContent = (image: GeneratedImage) => {
    const imageHeight = getImageHeight(image);
    const imageWidth = COLUMN_WIDTH - 12; // Account for padding (p-1.5 = 6px on each side)

    // Show skeleton for loading images (images without imageUrl or with temp IDs)
    if (
      !image.imageUrl ||
      image.id?.startsWith('temp-') ||
      image.id?.startsWith('loading-')
    ) {
      return (
        <ImageSkeleton
          width={imageWidth}
          height={imageHeight}
          borderRadius={16}
          showTimer={true}
        />
      );
    }

    // For loaded images, show the ImageCard
    return (
      <ImageCard
        image={image}
        onPress={() => setSelectedImage(image)}
        style={{width: imageWidth, height: imageHeight}}
      />
    );
  };

  const renderGroup = ({
    item,
  }: {
    item: ReturnType<typeof groupImagesByParameters>[number];
  }) => (
    <View className="mb-8">
      {/* Header with Prompt Info and Action Buttons */}
      <View className="px-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text
              style={{color: theme.text}}
              className="text-lg font-semibold mb-1"
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.parameters.prompt}
            </Text>
            {item.items.length > 1 && (
              <Text style={{color: theme.secondaryText}} className="text-xs">
                {item.items.length} images generated
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => reusePromptAndSettings(item)}
            className="py-2 px-3 rounded-lg flex-row items-center"
            style={{backgroundColor: theme.surface}}
            accessible={true}
            accessibilityLabel={strings.home.reusePrompt}
            accessibilityHint={strings.home.reusePromptHint}>
            <RefreshIcon size={16} color={theme.primary} />
            <Text
              style={{
                color: theme.primary,
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 13,
              }}>
              {strings.home.reuse}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tags/Styles */}
        {item.parameters.styles.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 my-2">
            {item.parameters.styles.map(style => (
              <TouchableOpacity
                key={style}
                style={{backgroundColor: theme.primary + '15'}}
                onPress={() =>
                  setSelectedStyles(styles => styles.filter(s => s !== style))
                }
                className="py-1 px-3 rounded-full flex-row items-center"
                accessible={true}
                accessibilityLabel={`Remove ${style} style`}>
                <Text style={{color: theme.primary}} className="text-xs">
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {/* Grid Layout with proper aspect ratio */}
      <View className="px-4">
        <View className="flex-row flex-wrap">
          {item.items.map((image, index) => (
            <View
              key={`${image.id || 'temp'}-${index}-${item.key}`}
              className="w-1/2 p-1.5">
              {renderImageContent(image)}
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const clearInputs = () => {
    setPrompt('');
    setSelectedStyles([]);
    // Optionally reset other settings to defaults
    setAspectRatio({
      ratio: aspectRatios[0].ratio,
      sizes: aspectRatios[0].sizes,
      size: 'medium',
    });
    setSeed('');
    setNegativePrompt('');

    if (Platform.OS === 'android') {
      ToastAndroid.show(strings.home.allCleared, ToastAndroid.SHORT);
    } else {
      showToast(strings.home.allCleared);
    }
  };

  // Render getting started section with collapsible UI
  const renderGettingStarted = () => (
    <View
      className="px-4 py-2 mb-2"
      accessible={true}
      accessibilityLabel={strings.home.gettingStartedGuide}>
      {/* Collapsible header */}
      <TouchableOpacity
        onPress={() => setShowOnboarding(!showOnboarding)}
        className="flex-row items-center justify-between mb-2"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${
          showOnboarding ? strings.home.hide : strings.home.show
        } ${strings.home.gettingStartedGuide}`}
        accessibilityHint={strings.home.toggleGettingStartedHint}>
        <View className="flex-row items-center">
          <TipIcon size={20} color={theme.primary} />
          <Text className="text-lg font-bold ml-2" style={{color: theme.text}}>
            {strings.home.gettingStartedGuide}
          </Text>
        </View>
        <Text style={{color: theme.secondaryText, fontSize: 13}}>
          {showOnboarding ? strings.home.hide : strings.home.show}
        </Text>
      </TouchableOpacity>

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
  ); // Android Quick Actions
  useAndroidQuickActions();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{backgroundColor: theme.background}}>
      <View className="flex-1">
        {/* Header with App Name, Version Badge and Help Icon */}
        <View className="flex-row justify-between items-center p-4">
          <Text
            className="text-3xl font-bold"
            style={{color: theme.text}}
            accessibilityRole="header">
            {appConfig.name}
          </Text>

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

        {/* Generated Images Grid with optional Getting Started for new users */}
        <View className="flex-1 pb-5">
          <FlashList
            ref={flashListRef}
            data={groupImagesByParameters(getCombinedImages())}
            keyExtractor={(item, index) => `home-group-${item.key}-${index}`}
            estimatedItemSize={300}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 200}}
            renderItem={renderGroup}
            ListEmptyComponent={
              <View style={{minHeight: SCREEN_HEIGHT - 150}}>
                {showOnboarding && renderGettingStarted()}
                <EmptyState
                  icon={<MagicWand size={48} color={theme.primary} />}
                  title="No images yet"
                  description="Start creating your first AI-generated image"
                />
              </View>
            }
            ListHeaderComponent={
              getCombinedImages().length > 0 && showOnboarding
                ? renderGettingStarted()
                : null
            }
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
          />
        </View>

        <View className="absolute bottom-[85px] left-0 right-0 px-4 py-2 z-10">
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
              <TouchableOpacity
                onPress={() => setShowPromptSuggestions(true)}
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
            </View>

            {/* Selected Styles Pills */}
            {selectedStyles.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 px-4 pb-2">
                {selectedStyles.map(style => (
                  <TouchableOpacity
                    key={style}
                    style={{backgroundColor: theme.primary + '15'}}
                    onPress={() =>
                      setSelectedStyles(styles =>
                        styles.filter(s => s !== style),
                      )
                    }
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
                disabled={imageLoading || prompt.trim().length === 0}
                style={{
                  opacity: imageLoading || prompt.trim().length === 0 ? 0.5 : 1,
                  backgroundColor: theme.surface,
                }}
                className="py-3.5 px-5 rounded-2xl flex-row items-center justify-center"
                accessible={true}
                accessibilityLabel={strings.home.clearInputs}
                accessibilityState={{
                  disabled: imageLoading || prompt.trim().length === 0,
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
                onPress={() =>
                  navigator.navigate({
                    route: Routes.ADVANCED_SETTINGS,
                    params: {
                      selectedStyles,
                      setSelectedStyles: (styles: string[]) =>
                        setSelectedStyles(styles),
                      aspectRatio,
                      setAspectRatio: (ratio: AspectRatio) =>
                        setAspectRatio(ratio),
                      numberOfImages,
                      setNumberOfImages: (count: number) =>
                        setNumberOfImages(count),
                      quality,
                      setQuality: (value: number) => setQuality(value),
                      seed,
                      setSeed: (value: string) => setSeed(value),
                      negativePrompt,
                      setNegativePrompt: (value: string) =>
                        setNegativePrompt(value),
                      // Add new parameters
                      engine,
                      setEngine: (eng: 'quantum' | 'nebula') => setEngine(eng),
                      guidance,
                      setGuidance: (g: number) => setGuidance(g),
                      steps,
                      setSteps: (s: number) => setSteps(s),
                    },
                  })
                }
                className="p-3 rounded-2xl"
                style={{backgroundColor: theme.primary + '20'}}
                accessible={true}
                accessibilityLabel={strings.advancedSettings.title}
                accessibilityRole="button"
                accessibilityHint={strings.advancedSettings.title}>
                <TuneIcon size={24} color={theme.primary} />
                {/* <View
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                  style={{backgroundColor: theme.primary}}
                  accessibilityLabel="New feature"></View> */}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleImageGeneration}
                disabled={imageLoading || prompt.trim().length === 0}
                style={{
                  opacity: imageLoading || prompt.trim().length === 0 ? 0.5 : 1,
                  backgroundColor: theme.primary,
                }}
                className="py-3.5 px-5 rounded-2xl flex-row items-center justify-center flex-1"
                accessible={true}
                accessibilityLabel={strings.home.generateImage}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: imageLoading || prompt.trim().length === 0,
                  busy: imageLoading,
                }}
                accessibilityHint={strings.home.generateImageHint}>
                {imageLoading ? (
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
            </View>
          </View>
        </View>

        <PromptSuggestions
          visible={showPromptSuggestions}
          setVisible={setShowPromptSuggestions}
          onSelectPrompt={handleSelectPrompt}
          theme={theme}
        />
        {selectedImage && (
          <ImageViewer
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            onImageDeleted={fetchImages}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;
