import React from 'react';
import RNFS from 'react-native-fs';
import {BlurView} from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import {GeneratedImage} from '@src/types';
import {theme} from '@src/theme/Theme';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Clipboard,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar,
  Image,
  ToastAndroid,
} from 'react-native';
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import appConfig from '@src/config/app.config';
import {imageService} from '@src/services/imageService';
import {SafeAreaView} from 'react-native-safe-area-context';

import CloseIcon from '@src/assets/icons/CloseIcon';
import ContentCopyIcon from '@src/assets/icons/ContentCopyIcon';
import DownloadIcon from '@src/assets/icons/DownloadIcon';
import FullscreenIcon from '@src/assets/icons/FullscreenIcon';
import DeleteOutlineIcon from '@src/assets/icons/DeleteOutlineIcon';
import PaletteIcon from '@src/assets/icons/PaletteIcon';
import ChevronUpIcon from '@src/assets/icons/ChevronUpIcon';
import ChevronDownIcon from '@src/assets/icons/ChevronDownIcon';
import SeedIcon from '@src/assets/icons/SeedIcon';
import TuneIcon from '@src/assets/icons/TuneIcon';
import AspectRatioIcon from '@src/assets/icons/AspectRatioIcon';
import ChartDonutIcon from '@src/assets/icons/ChartDonutIcon';
import {Toaster, useToast} from '@masumdev/rn-toast';

type IconName = 'seed' | 'tune' | 'aspect-ratio' | 'chart-donut';

interface ImageViewerProps {
  image: GeneratedImage | null;
  onClose?: () => void;
  onImageDeleted?: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  onClose,
  onImageDeleted,
}) => {
  const {isDark} = useThemeStore();
  const {showToast} = useToast();
  const {user} = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;
  const imageUri = image?.uri || '';

  const [downloading, setDownloading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [expandedPrompt, setExpandedPrompt] = React.useState(false);
  const [fullscreenMode, setFullscreenMode] = React.useState(false);

  const [imageLoaded, setImageLoaded] = React.useState(false);

  React.useEffect(() => {
    const backAction = () => {
      if (fullscreenMode) {
        setFullscreenMode(false);
        return true;
      }
      if (image) {
        onClose?.();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [image, onClose, fullscreenMode]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreenMode(!fullscreenMode);
  };

  const handleDownloadPress = () => {
    if (!image || !image?.uri) {
      console.log('No image to download');
      return;
    }

    try {
      setDownloading(true);

      downloadImage(image);
      showToast('Image downloaded', 'success');
    } catch (error) {
      showToast('Failed to download image', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleDeletePress = () => {
    if (!image || !user?.id) {
      return;
    }

    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteImage(image),
        },
      ],
    );
  };

  const togglePromptExpansion = () => {
    setExpandedPrompt(!expandedPrompt);
  };

  const deleteImage = async (image: GeneratedImage) => {
    if (!user?.id || !image.timestamp || !image.seed) {
      return;
    }

    try {
      setDeleting(true);
      const imageId = `${image.timestamp}_${image.seed}`;
      await imageService.deleteImage(user.id, imageId);

      showToast('Image deleted', 'success');

      if (onImageDeleted) {
        onImageDeleted();
      }
      onClose?.();
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Failed to delete image', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const downloadImage = async (image: GeneratedImage) => {
    console.log('Downloading image:', image);
    try {
      setDownloading(true);

      // Only fetch base64 when downloading
      const response = await fetch(image.uri);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      const fileName = `${appConfig.name.replace(
        /\s/g,
        '_',
      )}_${Date.now()}.jpg`;
      const path =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/${appConfig.name.replace(/\s/g, '')}`
          : `${RNFS.PicturesDirectoryPath}/${appConfig.name.replace(
              /\s/g,
              '',
            )}`;

      await RNFS.mkdir(path);
      const filePath = `${path}/${fileName}`;

      await RNFS.writeFile(filePath, base64.split(',')[1], 'base64');

      if (Platform.OS === 'android') {
        await RNFS.scanFile(filePath);
      }

      showToast('Image downloaded', 'success');
    } catch (error) {
      showToast('Failed to download image', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show('All cleared', ToastAndroid.SHORT);
    } else {
      showToast('Copied to clipboard');
    }
  };

  // Calculate aspect ratio safely
  const getAspectRatio = () => {
    if (!image?.aspectRatio.ratio) {
      return 1;
    }

    try {
      const parts = image.aspectRatio.ratio.split(':');
      if (parts.length !== 2) {
        return 1;
      }

      const width = parseFloat(parts[0]);
      const height = parseFloat(parts[1]);

      if (isNaN(width) || isNaN(height) || height === 0) {
        return 1;
      }

      return width / height;
    } catch (error) {
      console.error('Error calculating aspect ratio:', error);
      return 1;
    }
  };

  // Fullscreen modal
  if (fullscreenMode) {
    return (
      <Modal
        visible={true}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullscreenMode(false)}
        statusBarTranslucent>
        <View className="flex-1 bg-black justify-center items-center">
          <Image
            source={{uri: imageUri}}
            style={{
              width: screenWidth,
              height: screenHeight,
            }}
            resizeMode="contain"
            onLoadStart={() => console.log('Fullscreen image loading started')}
            onLoad={() => console.log('Fullscreen image loaded')}
            onError={() => console.error('Fullscreen image error')}
          />
          <TouchableOpacity
            onPress={() => setFullscreenMode(false)}
            className="absolute top-10 right-5 bg-black/50 rounded-3xl p-2 z-10"
            style={{top: StatusBar.currentHeight || 40}}>
            <CloseIcon size={28} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={!!image}
      transparent
      animationType="fade"
      onRequestClose={() => onClose?.()}
      statusBarTranslucent>
      <BlurView
        style={{
          flex: 1,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={20}
      />

      <SafeAreaView className="flex-1 p-4 pt-0">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity
            onPress={onClose}
            className="p-2.5 rounded-full"
            style={{backgroundColor: colors.surface}}>
            <CloseIcon size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Image Display */}
        <View
          className="flex-1 justify-center overflow-hidden rounded-3xl mb-4 bg-black/5"
          style={expandedPrompt ? {flex: 0.7} : {}}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleFullscreen}
            className="w-full h-full justify-center items-center">
            <FastImage
              source={{uri: imageUri}}
              style={{
                borderRadius: 24,
                width: '100%',
                height: '100%',
                aspectRatio: getAspectRatio(),
              }}
              resizeMode={FastImage.resizeMode.contain}
              onLoadStart={() => setImageLoaded(false)}
              onLoad={() => setImageLoaded(true)}
              onError={() => console.error('Image error')}
            />
            {imageLoaded && (
              <View className="absolute top-2.5 right-2.5 bg-black/40 rounded-3xl p-2">
                <FullscreenIcon size={24} color="white" />
              </View>
            )}
          </TouchableOpacity>

          {!imageLoaded && (
            <View className="absolute inset-0 justify-center items-center">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text className="mt-3 text-base" style={{color: colors.text}}>
                Loading image...
              </Text>
            </View>
          )}
        </View>

        {/* Metadata Panel */}
        <View
          className="rounded-3xl p-4 mb-4"
          style={{backgroundColor: colors.background}}>
          {/* Prompt with expansion toggle */}
          <View className="flex-row justify-between items-start mb-4">
            <Text
              className={`text-base font-semibold flex-1 ${
                !expandedPrompt ? 'max-h-[66px]' : ''
              }`}
              style={{color: colors.primary}}
              numberOfLines={expandedPrompt ? undefined : 3}
              onPress={togglePromptExpansion}>
              {image?.prompt || ''}
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={togglePromptExpansion} className="p-1">
                {expandedPrompt ? (
                  <ChevronUpIcon size={18} color={colors.secondaryText} />
                ) : (
                  <ChevronDownIcon size={18} color={colors.secondaryText} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  copyToClipboard(image?.fullPrompt || image?.prompt || '')
                }
                className="p-1 ml-2">
                <ContentCopyIcon size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Metadata Grid */}
          <View className="flex-row flex-wrap gap-3">
            <MetadataItem
              icon="seed"
              label="Seed"
              value={image?.seed.toString() || ''}
              onCopy={() => copyToClipboard(image?.seed.toString() || '')}
            />
            <MetadataItem
              icon="tune"
              label="Sampler"
              value={image?.sampler || ''}
            />
            <MetadataItem
              icon="aspect-ratio"
              label="Aspect Ratio"
              value={image?.aspectRatio.ratio || ''}
            />
            <MetadataItem
              icon="chart-donut"
              label="Quality"
              value={`${image?.quality} steps`}
            />
          </View>

          {/* Style Chips */}
          <View className="flex-row flex-wrap gap-2 mt-4">
            {image?.styles.map((style, index) => (
              <View
                key={index}
                className="flex-row items-center rounded-full px-3 py-1.5"
                style={{backgroundColor: colors.primary + '20'}}>
                <PaletteIcon size={14} color={colors.primary} />
                <Text className="ml-1 text-sm" style={{color: colors.primary}}>
                  {style}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mt-5 gap-1.5">
            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDeletePress}
              disabled={deleting}
              className="flex-row items-center justify-center rounded-2xl py-3.5 px-4 flex-1 gap-2"
              style={{backgroundColor: colors.surface}}>
              {deleting ? (
                <ActivityIndicator color={colors.secondary} size="small" />
              ) : (
                <>
                  <DeleteOutlineIcon size={22} color="#ef4444" />
                  <Text className="font-bold" style={{color: '#ef4444'}}>
                    Delete
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Fullscreen Button */}
            <TouchableOpacity
              onPress={toggleFullscreen}
              className="flex-row items-center justify-center rounded-2xl py-3.5 px-4 flex-1 gap-2"
              style={{backgroundColor: colors.surface}}>
              <FullscreenIcon size={22} color={colors.text} />
              <Text className="font-bold" style={{color: colors.text}}>
                Fullscreen
              </Text>
            </TouchableOpacity>

            {/* Download Button */}
            <TouchableOpacity
              onPress={handleDownloadPress}
              disabled={downloading}
              className="flex-row items-center justify-center rounded-2xl py-3.5 px-4 flex-1 gap-2"
              style={{backgroundColor: colors.primary}}>
              {downloading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <DownloadIcon size={22} color="white" />
                  <Text className="text-white font-bold">Download</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <Toaster
        customColors={{
          success: {background: '#E7F5E9', text: '#256029'},
          error: {background: '#FDECEA', text: '#B3261E'},
          info: {background: '#E3F2FD', text: '#1E88E5'},
        }}
      />
    </Modal>
  );
};

const MetadataItem = ({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: IconName;
  label: string;
  value: string;
  onCopy?: () => void;
}) => {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  const renderIcon = () => {
    switch (icon) {
      case 'seed':
        return <SeedIcon size={16} color={colors.text} />;
      case 'tune':
        return <TuneIcon size={16} color={colors.text} />;
      case 'aspect-ratio':
        return <AspectRatioIcon size={16} color={colors.text} />;
      case 'chart-donut':
        return <ChartDonutIcon size={16} color={colors.text} />;
      default:
        return null;
    }
  };

  return (
    <View
      className="flex-row items-center gap-2 rounded-2xl p-2.5 flex-1 min-w-[45%]"
      style={{backgroundColor: colors.surface}}>
      {renderIcon()}
      <View className="flex-1">
        <Text className="text-xs" style={{color: colors.secondaryText}}>
          {label}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm" style={{color: colors.text}}>
            {value}
          </Text>
          {onCopy && (
            <TouchableOpacity onPress={onCopy} className="p-1">
              <ContentCopyIcon size={14} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export default ImageViewer;
