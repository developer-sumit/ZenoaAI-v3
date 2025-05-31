import React, {useState, useEffect, useRef} from 'react';
import RNFS from 'react-native-fs';
import {BlurView} from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import {GeneratedImage} from '@src/types';
import {theme} from '@src/theme/Theme';
import {
  ActivityIndicator,
  BackHandler,
  Clipboard,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import appConfig from '@src/config/app.config';
import {imageService} from '@src/services/imageService';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Toaster, useToast} from '@masumdev/rn-toast';

// Icons
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
import HeartIcon from '@src/assets/icons/HeartIcon';

type IconName = 'seed' | 'tune' | 'aspect-ratio' | 'chart-donut';

interface ImageViewerProps {
  image: GeneratedImage | null;
  onClose?: () => void;
  onImageDeleted?: () => void;
  onToggleFavorite?: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  onClose,
  onImageDeleted,
  onToggleFavorite,
}) => {
  const {isDark} = useThemeStore();
  const {showToast} = useToast();
  const {user} = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;
  const imageUri = image?.uri || '';

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  // Add state to track if image failed to load
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Pre-cache images for faster loading
  useEffect(() => {
    if (imageUri) {
      console.log('Preloading image:', imageUri);

      // Configure FastImage to preload and cache this image
      FastImage.preload([{uri: imageUri, priority: FastImage.priority.high}]);
    }
  }, [imageUri]);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (fullscreenMode) {
        console.log(
          'Back pressed in fullscreen mode, returning to normal view',
        );
        setFullscreenMode(false);
        return true;
      }
      if (showDeleteDialog) {
        setShowDeleteDialog(false);
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
  }, [image, onClose, fullscreenMode, showDeleteDialog]);

  const toggleFullscreen = () => {
    console.log('Toggling fullscreen mode, current mode:', fullscreenMode);
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
    } catch (error) {
      showToast('Failed to download image', 'error');
      setDownloading(false);
    }
  };

  const handleDeletePress = () => {
    setShowDeleteDialog(true);
  };

  const togglePromptExpansion = () => {
    setExpandedPrompt(!expandedPrompt);
  };

  const deleteImage = async (img: GeneratedImage) => {
    if (!user?.id || !img.timestamp || !img.seed) {
      return;
    }

    try {
      setDeleting(true);
      const imageId = `${img.timestamp}_${img.seed}`;

      // Instead of fully deleting, just mark as deleted
      await imageService.markImageAsDeleted(user.id, imageId);

      showToast('Image deleted', 'success');

      if (onImageDeleted) {
        onImageDeleted();
      }
      onClose?.();
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Failed to delete image', 'error');
    } finally {
      if (isMounted.current) {
        setDeleting(false);
        setShowDeleteDialog(false);
      }
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

  const downloadImage = async (img: GeneratedImage) => {
    console.log('Downloading image:', img.uri);
    try {
      // Only fetch base64 when downloading
      const response = await fetch(img.uri);
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
      console.error('Download error:', error);
      showToast('Failed to download image', 'error');
    } finally {
      if (isMounted.current) {
        setDownloading(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
    } else {
      showToast('Copied to clipboard');
    }
  };

  // Calculate aspect ratio safely
  const getAspectRatio = () => {
    // Fallback to ratio from metadata
    if (image?.aspectRatio?.ratio) {
      try {
        const parts = image.aspectRatio.ratio.split(':');
        if (parts.length === 2) {
          const width = parseFloat(parts[0]);
          const height = parseFloat(parts[1]);

          if (!isNaN(width) && !isNaN(height) && height > 0) {
            return width / height;
          }
        }
      } catch (error) {
        console.error('Error parsing aspect ratio:', error);
      }
    }

    // Default fallback
    return 1;
  };

  return (
    <>
      <Modal
        visible={!!image}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (fullscreenMode) {
            setFullscreenMode(false);
          } else {
            onClose?.();
          }
        }}
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
          blurAmount={fullscreenMode ? 0 : 20}
        />

        <SafeAreaView
          className="flex-1"
          style={{
            padding: fullscreenMode ? 0 : 16,
            paddingTop: fullscreenMode ? 0 : 0,
            backgroundColor: fullscreenMode ? 'black' : 'transparent',
          }}>
          {/* Header - only visible in normal mode */}
          {!fullscreenMode && (
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity
                onPress={onClose}
                className="p-2.5 rounded-full"
                style={{backgroundColor: colors.surface}}
                accessible={true}
                accessibilityLabel="Close image viewer">
                <CloseIcon size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}

          {/* Image Display - takes full screen in fullscreen mode */}
          <View
            className={`${
              fullscreenMode ? 'flex-1' : 'flex-1 rounded-3xl mb-4 bg-black/5'
            } justify-center overflow-hidden`}
            style={[
              !fullscreenMode && expandedPrompt ? {flex: 0.7} : {},
              !fullscreenMode
                ? {borderWidth: 1, borderColor: colors.background}
                : {},
            ]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={toggleFullscreen}
              className="w-full h-full justify-center items-center"
              accessible={true}
              accessibilityLabel={`Image of ${
                image?.prompt || 'generated content'
              }`}
              accessibilityHint="Double tap to toggle fullscreen view">
              <FastImage
                source={{
                  uri: imageUri,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                  headers: {'Cache-Control': 'max-age=31536000'},
                }}
                style={{
                  borderRadius: fullscreenMode ? 0 : 24,
                  width: '100%',
                  height: '100%',
                  aspectRatio: fullscreenMode ? undefined : getAspectRatio(),
                  backgroundColor: 'transparent',
                }}
                resizeMode={FastImage.resizeMode.contain}
                onLoadStart={() => {
                  console.log('Image load started');
                  if (!imageLoaded) {
                    setImageLoaded(false);
                  }
                }}
                onLoad={() => {
                  console.log('Image loaded successfully');
                  setImageLoaded(true);
                  setImageLoadFailed(false);
                }}
                onError={() => {
                  console.error('Image load error!');
                  setImageLoadFailed(true);
                  setImageLoaded(false);
                }}
              />

              {/* Fullscreen icon overlay - only in normal mode */}
              {imageLoaded && !fullscreenMode && (
                <View className="absolute top-2.5 right-2.5 bg-black/40 rounded-3xl p-2">
                  <FullscreenIcon size={24} color="white" />
                </View>
              )}
            </TouchableOpacity>

            {/* Loading indicator */}
            {!imageLoaded && !imageLoadFailed && (
              <View className="absolute inset-0 justify-center items-center">
                <ActivityIndicator
                  color={fullscreenMode ? 'white' : colors.primary}
                  size="large"
                />
                <Text
                  className="mt-3 text-base"
                  style={{color: fullscreenMode ? 'white' : colors.text}}>
                  Loading image...
                </Text>
              </View>
            )}

            {/* Image load error */}
            {imageLoadFailed && (
              <View className="absolute inset-0 justify-center items-center">
                <Text
                  style={{color: fullscreenMode ? 'white' : colors.text}}
                  className="text-base mb-3">
                  Failed to load image
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setImageLoadFailed(false);
                    setImageLoaded(false);
                    // Force reload
                    FastImage.preload([
                      {
                        uri: imageUri + '?reload=' + Date.now(),
                        priority: FastImage.priority.high,
                      },
                    ]);
                  }}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: fullscreenMode
                      ? 'white/20'
                      : colors.primary + '40',
                  }}>
                  <Text
                    style={{color: fullscreenMode ? 'white' : colors.primary}}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Exit fullscreen button - only in fullscreen mode */}
          {fullscreenMode && (
            <TouchableOpacity
              onPress={() => setFullscreenMode(false)}
              className="absolute top-10 right-5 bg-black/50 rounded-3xl p-2 z-10"
              style={{top: StatusBar.currentHeight || 40}}
              accessible={true}
              accessibilityLabel="Exit fullscreen view"
              accessibilityRole="button">
              <CloseIcon size={28} color="white" />
            </TouchableOpacity>
          )}

          {/* Metadata Panel - only visible in normal mode */}
          {!fullscreenMode && (
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
                  onPress={togglePromptExpansion}
                  accessible={true}
                  accessibilityLabel={`Prompt: ${image?.prompt || ''}`}
                  accessibilityHint="Double tap to expand or collapse prompt">
                  {image?.prompt || ''}
                </Text>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={togglePromptExpansion}
                    className="p-1"
                    accessible={true}
                    accessibilityLabel={
                      expandedPrompt ? 'Collapse prompt' : 'Expand prompt'
                    }>
                    {expandedPrompt ? (
                      <ChevronUpIcon size={18} color={colors.secondaryText} />
                    ) : (
                      <ChevronDownIcon size={18} color={colors.secondaryText} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(image?.prompt || '')}
                    className="p-1 ml-2"
                    accessible={true}
                    accessibilityLabel="Copy prompt to clipboard">
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
                    <Text
                      className="ml-1 text-sm"
                      style={{color: colors.primary}}>
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
                  style={{backgroundColor: colors.surface}}
                  accessible={true}
                  accessibilityLabel="Delete image"
                  accessibilityState={{disabled: deleting}}
                  accessibilityHint="Will open a dialog to confirm image deletion">
                  {deleting ? (
                    <ActivityIndicator color="#ef4444" size="small" />
                  ) : (
                    <>
                      <DeleteOutlineIcon size={22} color="#ef4444" />
                      <Text className="font-bold" style={{color: '#ef4444'}}>
                        Delete
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Favorite Button */}
                <TouchableOpacity
                  onPress={() => {
                    if (onToggleFavorite) {
                      onToggleFavorite();
                    } else {
                      console.warn('No onToggleFavorite handler provided');
                    }
                  }}
                  className="flex-row items-center justify-center rounded-2xl py-3.5 px-4 flex-1 gap-2"
                  style={{backgroundColor: colors.surface}}
                  accessible={true}
                  accessibilityLabel={
                    image?.isFavorite
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                  }
                  accessibilityHint={
                    image?.isFavorite
                      ? 'Removes this image from your favorites'
                      : 'Adds this image to your favorites'
                  }>
                  <HeartIcon
                    size={22}
                    color={image?.isFavorite ? '#FF4B8C' : colors.text}
                    fill={image?.isFavorite ? '#FF4B8C' : 'transparent'}
                  />
                  <Text
                    className="font-bold"
                    style={{
                      color: image?.isFavorite ? '#FF4B8C' : colors.text,
                    }}>
                    {image?.isFavorite ? 'Favorited' : 'Favorite'}
                  </Text>
                </TouchableOpacity>

                {/* Download Button */}
                <TouchableOpacity
                  onPress={handleDownloadPress}
                  disabled={downloading}
                  className="flex-row items-center justify-center rounded-2xl py-3.5 px-4 flex-1 gap-2"
                  style={{backgroundColor: colors.primary}}
                  accessible={true}
                  accessibilityLabel="Download image"
                  accessibilityState={{disabled: downloading}}
                  accessibilityHint="Saves image to your device">
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
          )}
        </SafeAreaView>

        <Toaster
          customColors={{
            success: {background: '#E7F5E9', text: '#256029'},
            error: {background: '#FDECEA', text: '#B3261E'},
            info: {background: '#E3F2FD', text: '#1E88E5'},
          }}
        />
      </Modal>

      {/* Custom Delete Confirmation Dialog */}
      <Modal visible={showDeleteDialog} transparent animationType="fade">
        <BlurView
          style={{flex: 1}}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={10}>
          <View className="flex-1 justify-center items-center p-6">
            <View
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                backgroundColor: colors.background,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 10},
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
              }}>
              <View
                className="w-full h-1.5"
                style={{backgroundColor: '#ef4444'}}
              />
              <View className="p-6">
                <Text
                  className="text-2xl font-semibold mb-3 text-center"
                  style={{color: colors.text}}>
                  Delete Image?
                </Text>
                <Text
                  className="text-base mb-8 text-center leading-6"
                  style={{color: colors.secondaryText}}>
                  This image will be permanently removed. This action cannot be
                  undone.
                </Text>

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1 mr-3"
                    style={{backgroundColor: colors.surface}}
                    onPress={() => setShowDeleteDialog(false)}
                    accessible={true}
                    accessibilityLabel="Cancel image deletion">
                    <Text
                      className="text-center font-medium"
                      style={{color: colors.text}}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1"
                    style={{backgroundColor: '#ef4444'}}
                    onPress={() => deleteImage(image!)}
                    accessible={true}
                    accessibilityLabel="Confirm image deletion"
                    accessibilityHint="Permanently deletes this image">
                    <Text className="text-white font-medium text-center">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
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

export default ImageViewer;
