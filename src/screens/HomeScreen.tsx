import React from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import AdvancedSettings from '../components/AdvancedSettings';
import {aspectRatios} from '../data/ratio';
import {AspectRatioType, QualityPresetType} from '../types';
import {BlurView} from '@react-native-community/blur';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useToast} from '@zenoa/components/Toast';
import appConfig from '@zenoa/config/app.config';
import FastImage from 'react-native-fast-image';
import {FlashList} from '@shopify/flash-list';

const HomeScreen = () => {
  const toast = useToast();
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

  const generateImage = async () => {
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

        const response = await fetch(
          `https://image.pollinations.ai/prompt/${encodeURIComponent(
            fullPrompt,
          )}` +
            `?width=${aspectRatio.sizes[aspectRatio.size!].split('x')[0]}` +
            `&height=${aspectRatio.sizes[aspectRatio.size!].split('x')[1]}` +
            `&steps=${quality}&sampler=${sampler}` +
            `&seed=${currentSeed}&nologo=true`,
        );

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

  // Add download handler
  const downloadImage = async (base64: string) => {
    try {
      const fileName = `${appConfig.name.replace(
        /\s/g,
        '_',
      )}_${Date.now()}.jpg`;
      const appFolder = appConfig.name.replace(/\s/g, '');
      const path =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/${appFolder}`
          : `${RNFS.PicturesDirectoryPath}/${appFolder}`;

      // Ensure the directory exists
      await RNFS.mkdir(path);

      const filePath = `${path}/${fileName}`;

      await RNFS.writeFile(filePath, base64, 'base64');
      if (Platform.OS === 'android') {
        await RNFS.scanFile(filePath)
          .then(() => {
            console.log('Scan file success');
          })
          .catch((err: Error) => {
            console.log('Scan file error', err);
          });
      }
      toast.success(`Download Complete!`, {
        duration: 2000,
        position: 'top',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image!', {
        duration: 2000,
        position: 'top',
      });
    }
  };

  // Modified image grid render item
  const renderItem = ({item, index}: {item: string; index: number}) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setSelectedImage(item)}
      className={`w-full h-full aspect-square rounded-2xl bg-gray-200 mb-4 ${
        index % 2 === 0 ? 'mr-4' : ''
      }`}>
      <Image
        source={{uri: item}}
        style={{borderRadius: 20, width: '100%', height: '100%'}}
        resizeMode="cover"
      />
      <View className="absolute bottom-4 right-4 flex-row gap-2">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => downloadImage(item.split(',')[1])}
          className="bg-white/90 p-2 aspect-square rounded-full">
          <Icon name="download" size={30} color="#4f46e5" />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedImage(item)}
          className="bg-white/90 p-2 aspect-square rounded-full">
          <Icon name="zoom-in" size={30} color="#4f46e5" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Add fullscreen viewer modal
  const ImageViewer = () => (
    <Modal visible={!!selectedImage} transparent>
      <BlurView
        style={{flex: 1}}
        blurType="dark"
        blurAmount={20}
        reducedTransparencyFallbackColor="white">
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-1 justify-center items-center p-4"
          onPress={() => setSelectedImage(null)}>
          <TouchableOpacity activeOpacity={0.8} className="w-full rounded-3xl">
            <Image
              source={{uri: selectedImage!}}
              style={{borderRadius: 20, width: '100%', height: '100%'}}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="absolute top-4 right-4 bg-white/90 p-2 rounded-full"
            onPress={() => setSelectedImage(null)}>
            <Icon name="close" size={24} color="#4f46e5" />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
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
      <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe your vision..."
          placeholderTextColor="#94a3b8"
          className="p-5 text-lg text-slate-900 dark:text-white"
          multiline
          numberOfLines={3}
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
          onPress={generateImage}
          disabled={loading}
          className={`flex-1 p-5 rounded-xl ${
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
          className="p-4 bg-white dark:bg-gray-800 rounded-xl justify-center items-center shadow-2xl aspect-square">
          <Icon name="settings" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Generated Images Grid */}
      <FlashList
        data={generatedImages}
        numColumns={2}
        contentContainerClassName="pb-4"
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

      {selectedImage && <ImageViewer />}
    </View>
  );
};

export default HomeScreen;
