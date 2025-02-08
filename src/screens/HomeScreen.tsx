import React from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AdvancedSettings from '../components/AdvancedSettings';
import {aspectRatios} from '../data/ratio';
import {AspectRatioType, QualityPresetType} from '../types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import appConfig from '@zenoa/config/app.config';
import {FlashList} from '@shopify/flash-list';
import ImageViewer from '@zenoa/components/ImageViewer';
import ImageCard from '@zenoa/components/ImageCard';
import {generateImage} from '@zenoa/config/api.config';

const HomeScreen = () => {
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
    <View className="flex-1 bg-slate-50 dark:bg-gray-900 p-4 gap-4">
      {/* Header */}
      <View>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">
          {appConfig.name}
        </Text>
      </View>

      {/* Prompt Input */}
      <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl h-44 px-4 overflow-hidden">
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe your vision..."
          placeholderTextColor="#94a3b8"
          className="text-lg text-slate-900 dark:text-white h-full w-full text-start"
          multiline
          numberOfLines={6}
        />
      </View>

      {/* Selected Styles Preview */}
      {selectedStyles.length > 0 && (
        <View>
          <Text className="text-slate-600 dark:text-slate-300 text-sm mb-2">
            Selected Styles:
          </Text>
          <FlashList
            horizontal
            data={selectedStyles}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <View className="bg-light-primary/20 dark:border-dark-primary/20 px-3 py-1 rounded-full mr-2">
                <Text className="text-light-primary dark:text-dark-primary">
                  {item}
                </Text>
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
          className={`flex-1 p-5 rounded-2xl ${
            loading ? 'bg-light-primary/30' : 'bg-light-primary'
          } items-center justify-center`}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Generate</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAdvanced(true)}
          className="p-4 bg-white dark:bg-gray-800 rounded-3xl justify-center items-center shadow-2xl aspect-square">
          <Icon name="settings" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Generated Images Grid */}
      <FlashList
        data={generatedImages}
        numColumns={2}
        contentContainerStyle={{paddingBottom: 100}}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-slate-400 dark:text-slate-500">
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
