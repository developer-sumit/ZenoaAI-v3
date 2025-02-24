import React from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {theme} from '@src/theme/Theme';
import {aspectRatios} from '@src/data/ratio';
import appConfig from '@src/config/app.config';
import ImageCard from '@src/components/ImageCard';
import ImageViewer from '@src/components/ImageViewer';
import {useThemeStore} from '@src/store/themeStore';
import {generateImage} from '@src/config/api.config';
import {AspectRatioType, QualityPresetType} from '../types';
import AdvancedSettings from '@src/components/AdvancedSettings';

const HomeScreen = () => {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;
  const [showAdvanced, setShowAdvanced] = React.useState(false);
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
  const [generatedImages, setGeneratedImages] = React.useState<string[]>([]);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const qualityPresets: QualityPresetType[] = [
    {label: 'Fast', value: 15},
    {label: 'Standard', value: 25},
    {label: 'Premium', value: 50},
  ];

  const samplers = ['k_euler_ancestral', 'k_lms', 'k_heun', 'k_dpm_2'];

  const blobToBase64 = (blob: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleImageGeneration = async () => {
    setLoading(true);
    try {
      const newImages: string[] = [];
      const baseSeed = seed
        ? parseInt(seed, 10)
        : Math.floor(Math.random() * 1000000);

      for (let i = 0; i < numberOfImages; i++) {
        const currentSeed = seed
          ? baseSeed + i
          : Math.floor(Math.random() * 1000000);
        const styleString = selectedStyles.join(', ');
        const fullPrompt = `${prompt} ${styleString} ${
          negativePrompt ? `negative: ${negativePrompt}` : ''
        }`;

        const response = await generateImage({
          prompt: fullPrompt,
          width: aspectRatio.sizes[aspectRatio.size!].split('x')[0],
          height: aspectRatio.sizes[aspectRatio.size!].split('x')[1],
          negativePrompt,
          quality,
          sampler,
          currentSeed,
        });

        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        newImages.push(base64 as string); // Remove the manual data URL prefix
      }
      setGeneratedImages(prev => [...newImages, ...prev]);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Modified image grid render item
  const renderItem = ({item, index}: {item: string; index: number}) => (
    <ImageCard
      uri={item}
      index={index}
      onPress={() => setSelectedImage(item)}
    />
  );

  return (
    <View
      style={{backgroundColor: colors.background}}
      className="flex-1 p-4 gap-4">
      {/* Header */}
      <View>
        <Text className="text-3xl font-bold" style={{color: colors.text}}>
          {appConfig.name}
        </Text>
      </View>

      {/* Prompt Input */}
      <View
        style={{backgroundColor: colors.surface}}
        className="rounded-2xl shadow-2xl h-44 px-4 overflow-hidden">
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe your vision..."
          placeholderTextColor="#94a3b8"
          style={{color: colors.text}}
          className="text-lg h-full w-full text-start"
          multiline
          numberOfLines={6}
        />
      </View>

      {/* Selected Styles Preview */}
      {selectedStyles.length > 0 && (
        <View>
          <Text style={{color: colors.secondaryText}} className="text-sm mb-2">
            Selected Styles:
          </Text>
          <FlashList
            horizontal
            estimatedItemSize={100}
            data={selectedStyles}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <View
                style={{backgroundColor: colors.primary + '20'}}
                className="px-3 py-1 rounded-full mr-2">
                <Text style={{color: colors.primary}}>{item}</Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Controls */}
      <View className="flex-row gap-4">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleImageGeneration}
          disabled={loading}
          className="flex-1 p-5 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: loading ? colors.primary + '20' : colors.primary,
          }}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Generate</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAdvanced(true)}
          style={{backgroundColor: colors.surface}}
          className="p-4 rounded-3xl justify-center items-center shadow-2xl aspect-square">
          <Icon name="settings" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Generated Images Grid */}
      <FlashList
        data={generatedImages}
        numColumns={2}
        estimatedItemSize={100}
        contentContainerStyle={{paddingBottom: 100}}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text style={{color: colors.secondaryText}}>
              No images generated yet
            </Text>
          </View>
        }
      />

      {/* Advanced Settings Modal */}
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
          uri={selectedImage}
          onPress={() => setSelectedImage(null)}
        />
      )}
    </View>
  );
};

export default HomeScreen;
