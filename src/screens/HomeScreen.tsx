import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { theme } from '@src/theme/Theme';
import { aspectRatios } from '@src/data/ratio';
import appConfig from '@src/config/app.config';
import ImageCard from '@src/components/ImageCard';
import ImageViewer from '@src/components/ImageViewer';
import { useThemeStore } from '@src/store/themeStore';
import { useAuthStore } from '@src/store/authStore';
import { generateImage } from '@src/config/api.config';
import { imageService } from '@src/services/imageService';
import { AspectRatioType, GeneratedImage, QualityPresetType } from '../types';
import AdvancedSettings from '@src/components/AdvancedSettings';
import LoadingAnimation from '@src/components/LoadingAnimation';
import PromptSuggestions from '@src/components/PromptSuggestion';
import Toast from 'react-native-toast-message';
import Icon from '@src/components/Icon';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 24; // Total horizontal padding
const COLUMN_WIDTH = (SCREEN_WIDTH - PADDING) / 2;

const HomeScreen = () => {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
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
    { label: 'Fast', value: 15 },
    { label: 'Standard', value: 25 },
    { label: 'Premium', value: 50 },
  ];

  const samplers = ['k_euler_ancestral', 'k_lms', 'k_heun', 'k_dpm_2'];

  // Load user's images when component mounts
  useEffect(() => {
    if (user?.id) {
      loadUserImages();
    }
  }, [user?.id]);

  const loadUserImages = async () => {
    if (!user?.id) return;

    try {
      const images = await imageService.getUserImages(user.id);
      // Explicitly cast to unknown first, then filter and cast to GeneratedImage
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
      Toast.show({
        type: 'error',
        text1: 'Error fetching images',
        text2: 'Please try again later',
      });
    }
  };

  const getAspectRatio = (image: GeneratedImage): number => {
    // Default to 1:1 if there's an issue
    if (!image?.aspectRatio?.ratio) { return 1; }

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
      Toast.show({
        type: 'error',
        text1: 'Please enter a description',
        text2: 'Describe what you want to see in the image',
      });
      return;
    }

    if (!user?.id) {
      Toast.show({
        type: 'error',
        text1: 'Sign In Required',
        text2: 'Please sign in to generate images',
      });
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
        const styleString = selectedStyles.join(', ');
        const fullPrompt = `${prompt}${styleString ? ' ' + styleString : ''}`;

        const tempImage: GeneratedImage = {
          uri: 'placeholder',
          prompt: fullPrompt,
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
        const styleString = selectedStyles.join(', ');
        const fullPrompt = `${prompt}${styleString ? ' ' + styleString : ''}`;

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
            prompt: fullPrompt,
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
                ? { ...img, loading: false, error: true }
                : img,
            ),
          );

          Toast.show({
            type: 'error',
            text1: 'Generation Failed',
            text2: 'An error occurred while generating images',
          });
        }
      }

      if (newImages.length > 0) {
        Toast.show({
          type: 'success',
          text1: 'Images Generated',
          text2: 'Check the grid below for your new images',
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: 'An error occurred while generating images',
      });

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

  const groupImagesByParameters = (images: GeneratedImage[]) => {
    const groups: { [key: string]: GeneratedImage[] } = {};

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
          }}>
          <Icon name="error-outline" size={40} color="#ef4444" />
          <Text style={{ color: colors.secondaryText }} className="text-xs mt-2">
            Generation failed
          </Text>
        </View>
      );
    } else {
      return (
        <ImageCard
          image={image}
          onPress={() => setSelectedImage(image)}
          style={{
            width: '100%',
            height: imageHeight,
          }}
        />
      );
    }
  };

  const renderGroup = ({
    item,
  }: {
    item: ReturnType<typeof groupImagesByParameters>[number];
  }) => (
    <View className="flex-1 mb-8">
      <View className="px-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            style={{ color: colors.text }}
            className="text-lg font-semibold"
            numberOfLines={1}
            ellipsizeMode="tail">
            {item.parameters.prompt}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {item.parameters.styles.map(style => (
            <View
              key={style}
              style={{ backgroundColor: colors.primary + '20' }}
              className="px-2 py-1 rounded-full">
              <Text style={{ color: colors.primary }} className="text-xs">
                {style}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Grid Layout with proper aspect ratio */}
      <View className="px-4">
        <View style={styles.imagesGrid}>
          {item.items.map(image => (
            <View
              key={`${image.uri}_${image.index}_${image.timestamp}`}
              style={styles.imageWrapper}>
              {renderImageContent(image)}
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View className="items-center justify-center py-20 flex-1 h-full">
      <View className="relative w-[120px] h-[120px] items-center justify-center">
        <Icon name="robot-excited" size={80} color={colors.primary} />
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 15,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.primary + '40',
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 15,
            left: 10,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.primary + '40',
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 30,
            left: 5,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.primary + '40',
          }}
        />
      </View>

      <Text
        style={{ color: colors.text }}
        className="text-2xl font-semibold mt-6 mb-3">
        Create your first AI image
      </Text>
      <Text
        style={{ color: colors.secondaryText }}
        className="text-center mx-10 mb-6 text-base">
        Describe what you'd like to see, then tap the Generate button below
      </Text>

      <View className="mt-4 w-full px-8">
        <View
          style={{
            backgroundColor: colors.surface + '80',
            borderWidth: 1,
            borderColor: colors.primary + '30',
          }}
          className="p-4 rounded-xl mb-3">
          <Text style={{ color: colors.text }}>
            <Text style={{ color: colors.primary }}>Tip:</Text> Try adding styles
            like "digital art", "watercolor", "oil painting" or "photorealistic"
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header with Settings */}
        <View className="flex-row justify-between items-center p-4">
          <Text className="text-3xl font-bold" style={{ color: colors.text }}>
            {appConfig.name}
          </Text>
        </View>

        {/* Selected Styles Preview */}
        {selectedStyles.length > 0 && (
          <View className="px-4 mb-4">
            <Text
              style={{ color: colors.secondaryText }}
              className="text-sm mb-2">
              Selected Styles:
            </Text>
            <FlashList
              horizontal
              estimatedItemSize={100}
              data={selectedStyles}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <View
                  style={{ backgroundColor: colors.primary + '20' }}
                  className="px-3 py-1 rounded-full mr-2">
                  <Text style={{ color: colors.primary }}>{item}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Generated Images Grid */}
        <View style={styles.listContainer}>
          <FlashList
            ref={flashListRef}
            data={groupImagesByParameters(generatedImages)}
            estimatedItemSize={300}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContentContainer}
            renderItem={renderGroup}
            ListEmptyComponent={<EmptyState />}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
          />
        </View>

        {/* Bottom Input Area */}
        <View style={styles.inputContainer}>
          <View style={[styles.inputBox, { backgroundColor: colors.surface }]}>
            <View className="flex-row items-center">
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Describe your vision..."
                placeholderTextColor="#94a3b8"
                style={[styles.textInput, { color: colors.text }]}
                multiline
                numberOfLines={3}
              />
              {prompt.length === 0 && (
                <TouchableOpacity
                  onPress={() => setShowPromptSuggestions(true)}
                  className="pr-4">
                  <Icon
                    name="lightbulb-outline"
                    size={24}
                    color={colors.secondaryText}
                  />
                </TouchableOpacity>
              )}
            </View>
            <View
              className="flex-row justify-end p-2 border-t gap-2"
              style={{ borderColor: colors.surface }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAdvanced(true)}
                style={[
                  styles.advancedButton,
                  { backgroundColor: colors.primary + '20' },
                ]}>
                <Icon name="tune" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleImageGeneration}
                disabled={loading}
                style={[
                  styles.generateButton,
                  {
                    backgroundColor: loading
                      ? colors.primary + '20'
                      : colors.primary,
                  },
                ]}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white mr-2 font-medium">
                      Generate
                    </Text>
                    <Icon name="magic-wand" color="white" />
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
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: { flex: 1, paddingBottom: 20 },
  listContentContainer: { paddingBottom: 200 },
  inputContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  inputBox: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 12,
  },
  textInput: {
    fontSize: 18,
    padding: 16,
    maxHeight: 120,
    flex: 1,
  },
  advancedButton: { padding: 12, borderRadius: 16 },
  generateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  imageWrapper: { width: '50%', padding: 6 },
});

export default HomeScreen;
