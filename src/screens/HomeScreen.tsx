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
import NetInfo from '@react-native-community/netinfo';

import {theme} from '@src/theme/Theme';
import {aspectRatios} from '@src/data/ratio';
import appConfig from '@src/config/app.config';
import ImageCard from '@src/components/ImageCard';
import ImageViewer from '@src/components/ImageViewer';
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {generateImage} from '@src/config/api.config';
import {imageService} from '@src/services/imageService';
import {AspectRatioType, GeneratedImage} from '../types';
import LoadingAnimation from '@src/components/LoadingAnimation';
import PromptSuggestions from '@src/components/PromptSuggestion';
import EmptyState from '@src/components/EmptyState';
import {getStylePrompt} from '@src/data/stylePrompts';
import useAppNavigation from '@src/hooks/useAppNavigation';
import Routes from '@src/constants/routes';

// Icons
import TipIcon from '@src/assets/icons/TipIcon';
import InfoIcon from '@src/assets/icons/InfoIcon';
import TuneIcon from '@src/assets/icons/TuneIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import MagicWand from '@src/assets/icons/MagicWandIcon';
import RefreshIcon from '@src/assets/icons/RefreshIcon';
import ErrorOutlineIcon from '@src/assets/icons/ErrorOutlineIcon';
import LightbulbOutlineIcon from '@src/assets/icons/LightbulbOutlineIcon';
import {useStrings} from '@src/hooks/useStrings';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 24;
const COLUMN_WIDTH = (SCREEN_WIDTH - PADDING) / 2;

const HomeScreen = () => {
  const strings = useStrings();
  const {isDark} = useThemeStore();
  const {showToast} = useToast();
  const {user} = useAuthStore();
  const navigator = useAppNavigation();
  const colors = isDark ? theme.dark : theme.light;
  const [isLoadingImages, setIsLoadingImages] = React.useState(true);
  const [showPromptSuggestions, setShowPromptSuggestions] =
    React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [prompt, setPrompt] = React.useState('');
  const [selectedStyles, setSelectedStyles] = React.useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatioType>({
    ratio: aspectRatios[0].ratio,
    sizes: aspectRatios[0].sizes,
    size: 'medium',
  });
  const [numberOfImages, setNumberOfImages] = React.useState(1);
  const [quality, setQuality] = React.useState(25);
  const [seed, setSeed] = React.useState('');
  const [sampler, setSampler] = React.useState('k_euler_ancestral');
  const [negativePrompt, setNegativePrompt] = React.useState('');
  const [generatedImages, setGeneratedImages] = React.useState<
    GeneratedImage[]
  >([]);
  const [selectedImage, setSelectedImage] =
    React.useState<GeneratedImage | null>(null);

  const flashListRef = useRef(null);

  const samplers = ['k_euler_ancestral', 'k_lms', 'k_heun', 'k_dpm_2'];

  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Load user's images when component mounts
  useEffect(() => {
    if (user?.id) {
      // Set loading to true before fetching
      setIsLoadingImages(true);
      loadUserImages();
    } else {
      // If no user, we're not loading anything
      setIsLoadingImages(false);
    }
  }, [user?.id]);

  const loadUserImages = async () => {
    if (!user?.id) {
      setIsLoadingImages(false);
      return;
    }

    try {
      const images = await imageService.getUserImages(user.id);
      const typedImages = images as unknown as Partial<GeneratedImage>[];
      const validImages = typedImages.filter(
        (img): img is GeneratedImage =>
          !!img.uri &&
          !!img.prompt &&
          !!img.styles &&
          !!img.aspectRatio &&
          img.quality !== undefined &&
          img.timestamp !== undefined &&
          !img.isDeleted,
      );
      setGeneratedImages(validImages);
    } catch (error) {
      console.error('Failed to load images:', error);
      showToast(strings.home.imageLoadFailed, 'error');
    } finally {
      // Set loading to false when done, regardless of success or failure
      setIsLoadingImages(false);
    }
  };

  const getAspectRatio = (image: GeneratedImage): number => {
    // Default to 1:1 if there's an issue
    if (!image?.aspectRatio?.ratio) {
      return 1;
    }

    const [width, height] = image.aspectRatio.ratio.split(':').map(Number);
    return width / height;
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

    if (!user?.id) {
      showToast(strings.home.signInRequired, 'error');
      return;
    }

    setLoading(true);
    const generationTimestamp = Date.now();
    const baseSeed = seed
      ? parseInt(seed, 10)
      : Math.floor(Math.random() * 1000000);
    const tempImages: GeneratedImage[] = [];

    const determineConcurrency = async () => {
      // Check network type/speed
      const connectionInfo = await NetInfo.fetch();

      // Base concurrency on connection type and memory
      if (connectionInfo.type === 'wifi') {
        return Math.min(8, numberOfImages); // Higher on WiFi
      } else if (connectionInfo.type === 'cellular') {
        return connectionInfo.details.isConnectionExpensive ? 3 : 5;
      }
      return 4; // Default fallback
    };

    // Create a connection pool for better request management
    const connectionPool = new Set();
    const MAX_CONCURRENT_REQUESTS = await determineConcurrency();

    try {
      // Step 1: Create placeholder images for all generations
      for (let i = 0; i < numberOfImages; i++) {
        const currentSeed = baseSeed + i;
        const stylePrompts = selectedStyles
          .map(style => getStylePrompt(style))
          .join(', ');
        const userPrompt = prompt.trim();
        const fullPrompt = `${userPrompt}${
          stylePrompts ? ', ' + stylePrompts : ''
        }`;

        tempImages.push({
          uri: 'placeholder',
          prompt: userPrompt,
          fullPrompt: fullPrompt,
          styles: selectedStyles,
          aspectRatio,
          quality,
          sampler,
          seed: currentSeed,
          timestamp: generationTimestamp,
          loading: true,
          index: i,
        });
      }

      // Step 2: Add placeholders to state immediately
      setGeneratedImages(prev => [...tempImages, ...prev]);

      // Step 3: Generate images with controlled concurrency
      const generateWithControl = async () => {
        const results: (GeneratedImage | Error)[] = new Array(
          tempImages.length,
        );
        let completedCount = 0;

        // Create a queue of indexes to process
        const queue = tempImages.map((_, index) => index);

        // Process function that takes items from the queue
        const processQueue = async () => {
          while (queue.length > 0) {
            const index = queue.shift()!;
            const tempImage = tempImages[index];

            try {
              // Track this connection in the pool
              const connectionId = `connection_${index}_${Date.now()}`;
              connectionPool.add(connectionId);

              // Configure request with timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

              // Prepare generation parameters
              const fullPrompt = tempImage.fullPrompt || '';
              const currentSeed = tempImage.seed;

              console.time(`image_gen_${index}`);

              // Generate image via API with better error handling
              try {
                const response = await generateImage({
                  prompt: fullPrompt,
                  width: aspectRatio.sizes[aspectRatio.size!].split('x')[0],
                  height: aspectRatio.sizes[aspectRatio.size!].split('x')[1],
                  negativePrompt,
                  quality,
                  sampler,
                  seed: currentSeed,
                });

                console.timeEnd(`image_gen_${index}`);
                clearTimeout(timeoutId);

                // Create final image object with API response
                const generatedImage: GeneratedImage = {
                  ...tempImage,
                  uri: response.url,
                  loading: false,
                };

                // Update UI immediately with this specific image
                setGeneratedImages(prev =>
                  prev.map(img =>
                    img.timestamp === generationTimestamp && img.index === index
                      ? generatedImage
                      : img,
                  ),
                );

                // Save image in background without waiting
                if (user?.id) {
                  // Fire and forget with error handling
                  imageService
                    .saveImage(user.id, generatedImage)
                    .catch(err =>
                      console.error(`Error saving image ${index}:`, err),
                    );
                }

                // Store result
                results[index] = generatedImage;
              } catch (error) {
                // Handle API errors
                console.error(`Error generating image ${index}:`, error);

                // Update the error state for this image
                setGeneratedImages(prev =>
                  prev.map(img =>
                    img.timestamp === generationTimestamp && img.index === index
                      ? {...img, loading: false, error: true}
                      : img,
                  ),
                );

                // Store error
                results[index] =
                  error instanceof Error ? error : new Error(String(error));
              } finally {
                // Always remove from connection pool
                connectionPool.delete(connectionId);
                completedCount++;
              }
            } catch (error) {
              console.error(`Unexpected error for image ${index}:`, error);
              results[index] =
                error instanceof Error ? error : new Error(String(error));
              completedCount++;
            }
          }
        };

        // Start multiple processors based on MAX_CONCURRENT_REQUESTS
        const processors = Array(
          Math.min(MAX_CONCURRENT_REQUESTS, tempImages.length),
        )
          .fill(0)
          .map(() => processQueue());

        // Wait for all processors to complete
        await Promise.all(processors);

        return results;
      };

      // Execute the controlled generation
      const results = await generateWithControl();

      // Show appropriate toast based on results
      const successCount = results.filter(r => !(r instanceof Error)).length;
      if (successCount > 0) {
        showToast(
          `${successCount} ${strings.home.generationSuccess}`,
          'success',
        );
      } else {
        showToast(strings.home.generationFailed, 'error');
      }
    } catch (error) {
      console.error('Generation error:', error);
      showToast(strings.home.generationFailed, 'error');

      // Clean up placeholders if overall process fails
      setGeneratedImages(prev =>
        prev.filter(
          img => !tempImages.some(temp => temp.timestamp === img.timestamp),
        ),
      );
    } finally {
      // Clean up any remaining connections
      connectionPool.clear();
      setLoading(false);
    }
  };

  const reusePromptAndSettings = (item: {
    parameters: {
      prompt: string;
      styles: string[];
      aspectRatio: AspectRatioType;
    };
  }) => {
    setPrompt(item.parameters.prompt);
    setSelectedStyles(item.parameters.styles);
    setAspectRatio(item.parameters.aspectRatio);

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

  const groupImagesByParameters = (images: GeneratedImage[]) => {
    const groups: {[key: string]: GeneratedImage[]} = {};

    images.forEach(image => {
      // Group by timestamp to keep generation batches separate
      const groupKey = [
        image.prompt,
        image.styles.join(','),
        image.aspectRatio.ratio,
        image.quality,
        image.timestamp,
      ].join('|');

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(image);
    });

    return Object.entries(groups).map(([key, items]) => ({
      key,
      items,
      parameters: {
        prompt: items[0].prompt,
        styles: items[0].styles,
        aspectRatio: items[0].aspectRatio,
        quality: items[0].quality,
        timestamp: items[0].timestamp,
      },
    }));
  };

  // Render a placeholder or loading image
  const renderImageContent = (image: GeneratedImage) => {
    const imageHeight = getImageHeight(image);

    if (image.loading) {
      return (
        <View
          className="rounded-2xl overflow-hidden items-center justify-center"
          style={{
            backgroundColor: colors.surface,
            width: '100%',
            height: imageHeight,
          }}>
          <LoadingAnimation color={colors.primary} />
        </View>
      );
    } else if (image.error) {
      return (
        <View
          className="rounded-2xl overflow-hidden items-center justify-center"
          style={{
            backgroundColor: colors.surface,
            width: '100%',
            height: imageHeight,
          }}
          accessible={true}
          accessibilityLabel={strings.home.generationFailed}>
          <ErrorOutlineIcon size={40} color="#ef4444" />
          <Text style={{color: colors.secondaryText}} className="text-xs mt-2">
            {strings.home.generationFailed}
          </Text>
        </View>
      );
    } else {
      return (
        <ImageCard
          image={image}
          onPress={() => setSelectedImage(image)}
          style={{width: '100%', height: imageHeight}}
        />
      );
    }
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
          <Text
            style={{color: colors.text}}
            className="text-lg font-semibold mb-2 flex-1"
            numberOfLines={1}
            ellipsizeMode="tail">
            {item.parameters.prompt}
          </Text>

          <TouchableOpacity
            onPress={() => reusePromptAndSettings(item)}
            className="py-2 px-3 rounded-lg flex-row items-center"
            style={{backgroundColor: colors.surface}}
            accessible={true}
            accessibilityLabel={strings.home.reusePrompt}
            accessibilityHint={strings.home.reusePromptHint}>
            <RefreshIcon size={16} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
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
                style={{backgroundColor: colors.primary + '15'}}
                onPress={() =>
                  setSelectedStyles(styles => styles.filter(s => s !== style))
                }
                className="py-1 px-3 rounded-full flex-row items-center"
                accessible={true}
                accessibilityLabel={`Remove ${style} style`}>
                <Text style={{color: colors.primary}} className="text-xs">
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
          {item.items.map(image => (
            <View
              key={`${image.uri}_${image.index}_${image.timestamp}`}
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
          <TipIcon size={20} color={colors.primary} />
          <Text className="text-lg font-bold ml-2" style={{color: colors.text}}>
            {strings.home.gettingStartedGuide}
          </Text>
        </View>
        <Text style={{color: colors.secondaryText, fontSize: 13}}>
          {showOnboarding ? strings.home.hide : strings.home.show}
        </Text>
      </TouchableOpacity>

      {/* Collapsible content */}
      {showOnboarding && (
        <View
          className="rounded-3xl p-5 mb-2"
          style={{backgroundColor: colors.surface}}>
          <Text
            className="text-base mb-4"
            style={{color: colors.text, lineHeight: 22}}
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
              style={{backgroundColor: colors.primary}}
              importantForAccessibility="no">
              <Text className="text-white font-bold">1</Text>
            </View>
            <Text style={{color: colors.text, flex: 1}}>
              {strings.home.step1}
            </Text>
          </View>

          <View
            className="flex-row items-center mb-3"
            accessible={true}
            accessibilityLabel={`${strings.home.step} 1: ${strings.home.step2}`}>
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{backgroundColor: colors.primary}}
              importantForAccessibility="no">
              <Text className="text-white font-bold">2</Text>
            </View>
            <Text style={{color: colors.text, flex: 1}}>
              {strings.home.step2}
            </Text>
          </View>

          <View
            className="flex-row items-center mb-4"
            accessible={true}
            accessibilityLabel={`${strings.home.step} 1: ${strings.home.step3}`}>
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{backgroundColor: colors.primary}}
              importantForAccessibility="no">
              <Text className="text-white font-bold">3</Text>
            </View>
            <Text style={{color: colors.text, flex: 1}}>
              {strings.home.step3}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowPromptSuggestions(true)}
            className="py-3 rounded-xl items-center"
            style={{backgroundColor: colors.primary + '20'}}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={strings.home.promptSuggestions}
            accessibilityHint={strings.home.promptSuggestionsHint}>
            <Text style={{color: colors.primary, fontWeight: '600'}}>
              {strings.home.needIdeas}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderLoading = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="text-base mt-4" style={{color: colors.text}}>
        {strings.home.loadingImages}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{backgroundColor: colors.background}}>
      <View className="flex-1">
        {/* Header with App Name, Version Badge and Help Icon */}
        <View className="flex-row justify-between items-center p-4">
          <Text
            className="text-3xl font-bold"
            style={{color: colors.text}}
            accessibilityRole="header">
            {appConfig.name}
          </Text>

          <View className="flex-row items-center gap-3">
            {/* Version badge */}
            <View
              className="py-1 px-3 rounded-full"
              style={{backgroundColor: colors.primary}}
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
              style={{backgroundColor: colors.surface}}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                showOnboarding
                  ? strings.home.hide + strings.home.gettingStartedGuide
                  : strings.home.show + strings.home.gettingStartedGuide
              }
              accessibilityHint={strings.home.toggleGettingStartedHint}>
              <InfoIcon size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Generated Images Grid with optional Getting Started for new users */}
        <View className="flex-1 pb-5">
          {isLoadingImages ? (
            renderLoading()
          ) : (
            <FlashList
              ref={flashListRef}
              data={groupImagesByParameters(generatedImages)}
              estimatedItemSize={300}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 200}}
              renderItem={renderGroup}
              ListEmptyComponent={<EmptyState colors={colors} />}
              ListHeaderComponent={
                generatedImages.length > 0 && showOnboarding
                  ? renderGettingStarted()
                  : null
              }
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
            />
          )}
        </View>

        <View className="absolute bottom-[85px] left-0 right-0 px-4 py-2 z-10">
          <View
            className="rounded-3xl shadow-md"
            style={{
              backgroundColor: colors.surface,
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
                style={{color: colors.text}}
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
                    prompt.length === 0 ? colors.primary : colors.secondaryText
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
                    style={{backgroundColor: colors.primary + '15'}}
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
                    <Text style={{color: colors.primary}} className="text-xs">
                      {style}
                    </Text>
                    <View className="ml-1.5">
                      <CloseIcon size={12} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View
              className="flex-row justify-end p-2 border-t gap-2"
              style={{borderColor: colors.surface}}>
              <TouchableOpacity
                onPress={clearInputs}
                disabled={loading || prompt.trim().length === 0}
                style={{
                  opacity: loading || prompt.trim().length === 0 ? 0.5 : 1,
                  backgroundColor: colors.surface,
                }}
                className="py-3.5 px-5 rounded-2xl flex-row items-center justify-center"
                accessible={true}
                accessibilityLabel={strings.home.clearInputs}
                accessibilityState={{
                  disabled: loading || prompt.trim().length === 0,
                }}
                accessibilityRole="button"
                accessibilityHint={strings.home.clearInputsHint}>
                <RefreshIcon size={20} color={colors.text} />
                <Text style={{color: colors.text}} className="ml-2 font-medium">
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
                      setAspectRatio: (ratio: AspectRatioType) =>
                        setAspectRatio(ratio),
                      numberOfImages,
                      setNumberOfImages: (count: number) =>
                        setNumberOfImages(count),
                      quality,
                      setQuality: (value: number) => setQuality(value),
                      seed,
                      setSeed: (value: string) => setSeed(value),
                      sampler,
                      setSampler: (value: string) => setSampler(value),
                      negativePrompt,
                      setNegativePrompt: (value: string) =>
                        setNegativePrompt(value),
                      samplers,
                    },
                  })
                }
                className="p-3 rounded-2xl"
                style={{backgroundColor: colors.primary + '20'}}
                accessible={true}
                accessibilityLabel={strings.advancedSettings.title}
                accessibilityRole="button"
                accessibilityHint={strings.advancedSettings.title}>
                <TuneIcon size={24} color={colors.primary} />
                {/* <View
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                  style={{backgroundColor: colors.primary}}
                  accessibilityLabel="New feature"></View> */}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImageGeneration}
                disabled={loading || prompt.trim().length === 0}
                style={{
                  opacity: loading || prompt.trim().length === 0 ? 0.5 : 1,
                  backgroundColor: colors.primary,
                }}
                className="py-3.5 px-5 rounded-2xl flex-row items-center justify-center flex-1"
                accessible={true}
                accessibilityLabel={strings.home.generateImage}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: loading || prompt.trim().length === 0,
                  busy: loading,
                }}
                accessibilityHint={strings.home.generateImageHint}>
                {loading ? (
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
          colors={colors}
        />

        {selectedImage && (
          <ImageViewer
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            onImageDeleted={loadUserImages}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;
