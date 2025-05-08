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
import {FlashList} from '@shopify/flash-list';

import {theme} from '@src/theme/Theme';
import {aspectRatios} from '@src/data/ratio';
import appConfig from '@src/config/app.config';
import ImageCard from '@src/components/ImageCard';
import ImageViewer from '@src/components/ImageViewer';
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {generateImage} from '@src/config/api.config';
import {imageService} from '@src/services/imageService';
import {AspectRatioType, GeneratedImage, QualityPresetType} from '../types';
import AdvancedSettings from '@src/components/AdvancedSettings';
import LoadingAnimation from '@src/components/LoadingAnimation';
import PromptSuggestions from '@src/components/PromptSuggestion';
import EmptyState from '@src/components/EmptyState';
import MagicWand from '@src/assets/icons/MagicWandIcon';
import ErrorOutlineIcon from '@src/assets/icons/ErrorOutlineIcon';
import RefreshIcon from '@src/assets/icons/RefreshIcon';
import LightbulbOutlineIcon from '@src/assets/icons/LightbulbOutlineIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import TuneIcon from '@src/assets/icons/TuneIcon';
import {getStylePrompt} from '@src/data/stylePrompts';
import {useToast} from '@masumdev/rn-toast';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 24;
const COLUMN_WIDTH = (SCREEN_WIDTH - PADDING) / 2;

const HomeScreen = () => {
  const {isDark} = useThemeStore();
  const {showToast} = useToast();
  const {user} = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;
  const [showAdvanced, setShowAdvanced] = React.useState(false);
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

  const qualityPresets: QualityPresetType[] = [
    {label: 'Fast', value: 15},
    {label: 'Standard', value: 25},
    {label: 'Premium', value: 50},
  ];

  const samplers = ['k_euler_ancestral', 'k_lms', 'k_heun', 'k_dpm_2'];

  // Load user's images when component mounts
  useEffect(() => {
    if (user?.id) {
      loadUserImages();
    }
  }, [user?.id]);

  const loadUserImages = async () => {
    if (!user?.id) {
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
          img.timestamp !== undefined,
      );
      setGeneratedImages(validImages);
    } catch (error) {
      console.error('Failed to load images:', error);
      showToast('Error fetching images', 'error');
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
      showToast('Please enter a description', 'error');
      return;
    }

    if (!user?.id) {
      showToast('Sign In Required', 'error');
      return;
    }

    setLoading(true);
    const tempImages: GeneratedImage[] = [];

    try {
      const newImages: GeneratedImage[] = [];
      const baseSeed = seed
        ? parseInt(seed, 10)
        : Math.floor(Math.random() * 1000000);
      const generationTimestamp = Date.now();

      // Create placeholder images first
      for (let i = 0; i < numberOfImages; i++) {
        const currentSeed = baseSeed + i;

        // Generate professional style prompts
        const stylePrompts = selectedStyles
          .map(style => getStylePrompt(style))
          .join(', ');
        const userPrompt = prompt.trim();
        const fullPrompt = `${userPrompt}${
          stylePrompts ? ', ' + stylePrompts : ''
        }`;

        const tempImage: GeneratedImage = {
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
        };

        tempImages.push(tempImage);
      }

      // Add placeholders at the beginning
      setGeneratedImages(prev => [...tempImages, ...prev]);

      // Then generate each image and update one by one
      for (let i = 0; i < numberOfImages; i++) {
        const currentSeed = baseSeed + i;

        // Use the same professional prompt construction
        const stylePrompts = selectedStyles
          .map(style => getStylePrompt(style))
          .join(', ');
        const userPrompt = prompt.trim();
        const fullPrompt = `${userPrompt}${
          stylePrompts ? ', ' + stylePrompts : ''
        }`;

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

          const generatedImage: GeneratedImage = {
            uri: response.url,
            prompt: userPrompt, // Original prompt
            fullPrompt: fullPrompt, // Full prompt with promptTemplates
            styles: selectedStyles,
            aspectRatio,
            quality,
            sampler,
            seed: currentSeed,
            timestamp: generationTimestamp,
            loading: false,
            index: i,
          };

          // Save to Firestore and local storage
          if (user?.id) {
            await imageService.saveImage(user.id, generatedImage);
          }

          // Update the generated image in state by replacing the placeholder
          setGeneratedImages(prev =>
            prev.map(img =>
              img.timestamp === generationTimestamp && img.index === i
                ? generatedImage
                : img,
            ),
          );

          newImages.push(generatedImage);
        } catch (error) {
          console.error(`Error generating image ${i}:`, error);

          // Update the error state for this image
          setGeneratedImages(prev =>
            prev.map(img =>
              img.timestamp === generationTimestamp && img.index === i
                ? {...img, loading: false, error: true}
                : img,
            ),
          );

          showToast('Generation Failed', 'error');
        }
      }

      if (newImages.length > 0) {
        showToast('Images Generated', 'success');
      }
    } catch (error) {
      console.error('Generation error:', error);
      showToast('Generation Failed', 'error');

      // Remove all placeholder images
      setGeneratedImages(prev =>
        prev.filter(
          img => !tempImages.some(temp => temp.timestamp === img.timestamp),
        ),
      );
    } finally {
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
      ToastAndroid.show('All cleared', ToastAndroid.SHORT);
    } else {
      showToast('All cleared');
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
          accessibilityLabel="Image generation failed">
          <ErrorOutlineIcon size={40} color="#ef4444" />
          <Text style={{color: colors.secondaryText}} className="text-xs mt-2">
            Generation failed
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
            className="p-2 rounded-full"
            style={{backgroundColor: colors.surface}}
            accessible={true}
            accessibilityLabel="Reuse this prompt and settings"
            accessibilityHint="Applies this prompt and style settings to generate new images">
            <RefreshIcon size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Tags/Styles */}
        {item.parameters.styles.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mb-1.5">
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
                <View className="ml-1.5">
                  <CloseIcon size={12} color={colors.primary} />
                </View>
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
      ToastAndroid.show('All cleared', ToastAndroid.SHORT);
    } else {
      showToast('All cleared');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{backgroundColor: colors.background}}>
      <View className="flex-1">
        {/* Header with Settings */}
        <View className="flex-row justify-between items-center p-4">
          <Text className="text-3xl font-bold" style={{color: colors.text}}>
            {appConfig.name}
          </Text>
        </View>

        {/* Generated Images Grid */}
        <View className="flex-1 pb-5">
          <FlashList
            ref={flashListRef}
            data={groupImagesByParameters(generatedImages)}
            estimatedItemSize={300}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 200}}
            renderItem={renderGroup}
            ListEmptyComponent={<EmptyState colors={colors} />}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
          />
        </View>

        {/* Bottom Input Area */}
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
                placeholder="Describe your vision..."
                placeholderTextColor="#94a3b8"
                className="text-lg p-4 max-h-[120px] flex-1"
                style={{color: colors.text}}
                multiline
                numberOfLines={3}
                accessible={true}
                accessibilityLabel="Image description input"
                accessibilityHint="Enter a description of the image you want to generate"
              />
              {prompt.length === 0 && (
                <TouchableOpacity
                  onPress={() => setShowPromptSuggestions(true)}
                  className="pr-4"
                  accessible={true}
                  accessibilityLabel="Prompt suggestions"
                  accessibilityHint="Opens a list of prompt suggestions to help you get started">
                  <LightbulbOutlineIcon
                    size={24}
                    color={colors.secondaryText}
                  />
                </TouchableOpacity>
              )}
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
                    accessibilityLabel={`Remove ${style} style`}>
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
                accessibilityLabel="Clear all inputs"
                accessibilityState={{
                  disabled: loading || prompt.trim().length === 0,
                }}>
                <RefreshIcon size={20} color={colors.text} />
                <Text style={{color: colors.text}} className="ml-2 font-medium">
                  Clear
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAdvanced(true)}
                className="p-3 rounded-2xl"
                style={{backgroundColor: colors.primary + '20'}}
                accessible={true}
                accessibilityLabel="Advanced settings"
                accessibilityHint="Opens advanced settings for image generation">
                <TuneIcon size={24} color={colors.primary} />
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
                accessibilityLabel="Generate image"
                accessibilityState={{
                  disabled: loading || prompt.trim().length === 0,
                  busy: loading,
                }}
                accessibilityHint="Generates images based on your description and selected settings">
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white mr-2 font-medium">
                      Generate
                    </Text>
                    <MagicWand color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Prompt Suggestions */}
        <PromptSuggestions
          visible={showPromptSuggestions}
          setVisible={setShowPromptSuggestions}
          onSelectPrompt={handleSelectPrompt}
          colors={colors}
        />

        {/* Modals */}
        <AdvancedSettings
          visible={showAdvanced}
          onClose={() => setShowAdvanced(false)}
          selectedStyles={selectedStyles}
          setSelectedStyles={setSelectedStyles}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          numberOfImages={numberOfImages}
          setNumberOfImages={setNumberOfImages}
          quality={quality}
          setQuality={setQuality}
          seed={seed}
          setSeed={setSeed}
          sampler={sampler}
          setSampler={setSampler}
          negativePrompt={negativePrompt}
          setNegativePrompt={setNegativePrompt}
          qualityPresets={qualityPresets}
          samplers={samplers}
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
