import React, {useState, useEffect, useRef} from 'react';
import RNFS from 'react-native-fs';
import {BlurView} from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import {Toaster, useToast} from '@masumdev/rn-toast';
import {useNavigation} from '@react-navigation/native';
import ImageView from 'react-native-image-viewing';

import {GeneratedImage} from '@src/types/image';
import {useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useImageStore} from '@src/store/imageStore';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import Routes from '@src/constants/routes';
import appConfig from '@src/config/app.config';
import {useGenerationStore} from '@src/store/generationStore';

// Icons
import CloseIcon from '@src/assets/icons/CloseIcon';
import ContentCopyIcon from '@src/assets/icons/ContentCopyIcon';
import DownloadIcon from '@src/assets/icons/DownloadIcon';
import DeleteOutlineIcon from '@src/assets/icons/DeleteOutlineIcon';
import PaletteIcon from '@src/assets/icons/PaletteIcon';
import ChevronUpIcon from '@src/assets/icons/ChevronUpIcon';
import ChevronDownIcon from '@src/assets/icons/ChevronDownIcon';
import SeedIcon from '@src/assets/icons/SeedIcon';
import TuneIcon from '@src/assets/icons/TuneIcon';
import AspectRatioIcon from '@src/assets/icons/AspectRatioIcon';
import ChartDonutIcon from '@src/assets/icons/ChartDonutIcon';
import HeartIcon from '@src/assets/icons/HeartIcon';
import PrivacyIcon from '@src/assets/icons/PrivacyIcon';
import RefreshIcon from '@src/assets/icons/RefreshIcon';

type IconName =
  | 'seed'
  | 'tune'
  | 'aspect-ratio'
  | 'chart-donut'
  | 'privacy'
  | 'dimensions';

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
  const t = useStrings();
  const {isDark, theme} = useTheme();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();
  const {user} = useAuthStore();
  const {updatePrivacy, deleteImage, toggleFavorite} = useImageStore();
  const {
    setPrompt,
    setNegativePrompt,
    setEngine,
    setStyles,
    setImageWidth,
    setImageHeight,
    setAspectRatio,
  } = useGenerationStore();
  const navigation = useNavigation();
  const imageUri = image?.imageUrl || '';

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  const [isPrivate, setIsPrivate] = useState(image?.isPrivate || false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expandedStyles, setExpandedStyles] = useState(false);

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
    if (!image) return;

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

  const handlePrivacyUpdate = async () => {
    triggerHaptic('light');
    if (image) {
      const res = await updatePrivacy(image?.id, !image.isPrivate);
      if (res) {
        showToast('Privacy updated successfully', 'success');
        setIsPrivate(!image.isPrivate);
      } else {
        showToast('Failed to update privacy', 'error');
      }
    }
  };

  const handleDownloadPress = () => {
    if (!image || !imageUri) {
      console.log('No image to download');
      return;
    }

    try {
      setDownloading(true);
      downloadImage();
    } catch (error) {
      showToast(t('imageViewer.failedToDownload'), 'error');
      setDownloading(false);
    }
  };

  const handleDeletePress = () => {
    setShowDeleteDialog(true);
  };

  const togglePromptExpansion = () => {
    setExpandedPrompt(!expandedPrompt);
  };

  const handleDeleteImage = async () => {
    if (!user?.uid || !image?.id) {
      return;
    }

    try {
      setDeleting(true);

      // Use the image store to delete the image
      const success = await deleteImage(image.id);

      if (success) {
        showToast(t('imageViewer.imageDeleted'), 'success');

        if (onImageDeleted) {
          onImageDeleted();
        }
        onClose?.();
      } else {
        showToast(t('imageViewer.failedToDelete'), 'error');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast(t('imageViewer.failedToDelete'), 'error');
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

  const downloadImage = async () => {
    console.log('Downloading image:', imageUri);
    try {
      // Only fetch base64 when downloading
      const response = await fetch(imageUri);
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

      showToast(t('imageViewer.imageDownloaded'), 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast(t('imageViewer.failedToDownload'), 'error');
    } finally {
      if (isMounted.current) {
        setDownloading(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show(t('imageViewer.copied'), ToastAndroid.SHORT);
    } else {
      showToast(t('imageViewer.copied'));
    }
  };

  const handleToggleFavorite = async () => {
    triggerHaptic('light');
    if (!image) return;

    try {
      const success = await toggleFavorite(image.id);
      if (success) {
        showToast(
          !image.isFavorite
            ? t('gallery.addedToFavorites')
            : t('gallery.removedFromFavorites'),
          'success',
        );
      } else {
        showToast(t('gallery.failedToUpdateFavorite'), 'error');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showToast(t('gallery.failedToUpdateFavorite'), 'error');
    }
  };

  const handleRemix = () => {
    if (!image) {
      return;
    }

    // Close the image viewer first
    onClose?.();

    // Navigate to home screen with a slight delay to ensure modal is closed
    setTimeout(() => {
      setPrompt(image.prompt);
      setNegativePrompt(image.negativePrompt || '');
      setEngine(image.engineType);
      setStyles(image.styles || []);
      setImageWidth(image.width);
      setImageHeight(image.height);
      setAspectRatio(image.aspectRatio);

      navigation.navigate(Routes.GENERATE as never);
    }, 100);
  };

  return (
    <>
      {!fullscreenMode ? (
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
            {/* Image Display - takes full screen in fullscreen mode */}
            <View
              className={`${
                fullscreenMode ? 'flex-1' : 'flex-1 rounded-3xl mb-4'
              } justify-center overflow-hidden`}
              style={[!fullscreenMode && expandedPrompt ? {flex: 0.7} : {}]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={toggleFullscreen}
                className="w-full h-full justify-center items-center"
                accessible={true}
                accessibilityLabel={`Image of ${
                  image?.prompt || 'generated content'
                }`}
                accessibilityHint="">
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
                    aspectRatio: fullscreenMode
                      ? undefined
                      : image?.aspectRatio.replace(':', '/') || '1/1',
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

                <View
                  style={{backgroundColor: theme.surface}}
                  className="rounded-full overflow-hidden absolute justify-self-center bottom-1.5 flex-row gap-2 px-3 py-1.5 items-center">
                  <FastImage
                    source={{
                      uri: image?.userAvatar,
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                      headers: {'Cache-Control': 'max-age=31536000'},
                    }}
                    style={{width: 32, height: 32, borderRadius: 12}}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <Text
                    className="text-sm font-semibold"
                    style={{color: theme.text}}>
                    {image?.userName || 'Anonymous'}
                  </Text>
                </View>

                {/* Header - only visible in normal mode */}
                {!fullscreenMode && (
                  <TouchableOpacity
                    onPress={onClose}
                    className="absolute top-2.5 left-2.5 p-2.5 rounded-full"
                    style={{backgroundColor: theme.surface}}
                    accessible={true}
                    accessibilityLabel={t('imageViewer.closeHint')}>
                    <CloseIcon size={24} color={theme.text} />
                  </TouchableOpacity>
                )}

                {/* Overlay buttons - only in normal mode */}
                {imageLoaded && !fullscreenMode && (
                  <View className="absolute top-2.5 right-2.5 flex-row gap-2">
                    {/* Favorite Button */}
                    <View className="items-center">
                      <TouchableOpacity
                        onPress={handleToggleFavorite}
                        className="bg-white rounded-2xl px-2.5 py-2 flex-row items-center gap-2 border-2 border-gray-900"
                        accessible={true}
                        accessibilityLabel={
                          image?.isFavorite
                            ? 'Remove from favorites'
                            : 'Add to favorites'
                        }>
                        <HeartIcon
                          size={24}
                          color={image?.isFavorite ? '#FF4B8C' : '#121212'}
                          fill={image?.isFavorite ? '#FF4B8C' : 'transparent'}
                        />
                        <Text
                          className="font-bold text-lg"
                          style={{
                            color: image?.isFavorite ? '#FF4B8C' : '#121212',
                          }}>
                          {image?.favoriteCount ? image.favoriteCount : 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {/* Privacy Button */}
                    {image?.userId === user?.uid &&
                      user?.planType !== 'free' && (
                        <TouchableOpacity
                          className="bg-white rounded-2xl p-2 border-2 border-gray-900 items-center justify-center"
                          onPress={handlePrivacyUpdate}>
                          <Text
                            className="font-bold"
                            style={{
                              color: isPrivate ? '#FF4B8C' : '#14B8A6',
                            }}>
                            {isPrivate
                              ? t('imageViewer.private')
                              : t('imageViewer.public')}
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                )}
              </TouchableOpacity>

              {/* Loading indicator */}
              {!imageLoaded && !imageLoadFailed && (
                <View className="absolute inset-0 justify-center items-center">
                  <ActivityIndicator
                    color={fullscreenMode ? 'white' : theme.primary}
                    size="large"
                  />
                  <Text
                    className="mt-3 text-base"
                    style={{color: fullscreenMode ? 'white' : theme.text}}>
                    {t('imageViewer.loading')}
                  </Text>
                </View>
              )}

              {/* Image load error */}
              {imageLoadFailed && (
                <View className="absolute inset-0 justify-center items-center">
                  <Text
                    style={{color: fullscreenMode ? 'white' : theme.text}}
                    className="text-base mb-3">
                    {t('imageViewer.loadingError')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
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
                        : theme.primary + '40',
                    }}>
                    <Text
                      style={{color: fullscreenMode ? 'white' : theme.primary}}>
                      {t('common.retry')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Exit fullscreen button - only in fullscreen mode */}
            {fullscreenMode && (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  setFullscreenMode(false);
                }}
                className="absolute top-10 right-5 bg-black/50 rounded-3xl p-2 z-10"
                style={{top: StatusBar.currentHeight || 40}}
                accessible={true}
                accessibilityLabel={t('imageViewer.exitFullscreen')}
                accessibilityRole="button">
                <CloseIcon size={28} color="white" />
              </TouchableOpacity>
            )}

            {/* Metadata Panel - only visible in normal mode */}
            {!fullscreenMode && (
              <View
                className="rounded-3xl p-4 mb-4"
                style={{backgroundColor: theme.background}}>
                {/* Prompt with expansion toggle */}
                <View className="flex-row justify-between items-start mb-4">
                  <Text
                    className={`text-base font-semibold flex-1 ${
                      !expandedPrompt ? 'max-h-[66px]' : ''
                    }`}
                    style={{color: theme.primary}}
                    numberOfLines={expandedPrompt ? undefined : 3}
                    onPress={togglePromptExpansion}
                    accessible={true}
                    accessibilityLabel={`Prompt: ${image?.prompt || ''}`}
                    accessibilityHint={t('imageViewer.promptHint')}>
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
                        <ChevronUpIcon size={18} color={theme.secondaryText} />
                      ) : (
                        <ChevronDownIcon
                          size={18}
                          color={theme.secondaryText}
                        />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(image?.prompt || '')}
                      className="p-1 ml-2"
                      accessible={true}
                      accessibilityLabel={t('imageViewer.copyPrompt')}>
                      <ContentCopyIcon size={18} color={theme.secondaryText} />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Metadata Grid */}
                <View className="flex-row flex-wrap gap-3">
                  {/* Engine - Top priority */}
                  <MetadataItem
                    icon="tune"
                    label={t('imageViewer.engine')}
                    value={
                      image?.engineType ? `${image.engineType}` : 'Quantum'
                    }
                  />
                  {/* Image Dimensions - Top priority */}
                  <MetadataItem
                    icon="dimensions"
                    label={t('imageViewer.dimensions')}
                    value={`${image?.width || 0} x ${image?.height || 0}`}
                  />
                  {/* Privacy Status */}
                  <MetadataItem
                    icon="privacy"
                    label={t('imageViewer.visibility')}
                    value={isPrivate ? 'Private' : 'Public'}
                  />
                  {/* Seed */}
                  <MetadataItem
                    icon="seed"
                    label={t('advanced.featureInfo.seed.title')}
                    value={image?.seed.toString() || ''}
                    onCopy={() => copyToClipboard(image?.seed.toString() || '')}
                  />
                  {/* Aspect Ratio */}
                  <MetadataItem
                    icon="aspect-ratio"
                    label={t('advanced.featureInfo.aspectRatio.title')}
                    value={image?.aspectRatio || '1:1'}
                  />
                  {/* Created At */}
                  {image?.createdAt && (
                    <MetadataItem
                      icon="privacy"
                      label={t('imageViewer.created')}
                      value={new Date(image.createdAt).toLocaleDateString()}
                    />
                  )}
                </View>

                {/* Negative Prompt Section */}
                {image?.negativePrompt && image.negativePrompt.trim() && (
                  <View className="mt-4">
                    <Text
                      className="text-sm font-medium mb-2"
                      style={{color: theme.text}}>
                      Negative Prompt
                    </Text>
                    <View
                      className="rounded-2xl p-3"
                      style={{backgroundColor: theme.surface}}>
                      <Text
                        className="text-sm leading-5"
                        style={{color: theme.secondaryText}}>
                        {image.negativePrompt}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Style Chips */}
                {image?.styles && image.styles.length > 0 && (
                  <View className="mt-4">
                    {/* Header with expand/collapse toggle */}
                    <View className="flex-row items-center justify-between mb-2">
                      <Text
                        className="text-sm font-medium"
                        style={{color: theme.text}}>
                        {t('advanced.featureInfo.artStyles.title')} (
                        {image.styles.length})
                      </Text>
                      {image.styles.length > 3 && (
                        <TouchableOpacity
                          onPress={() => setExpandedStyles(!expandedStyles)}
                          className="p-1"
                          accessible={true}
                          accessibilityLabel={
                            expandedStyles ? 'Collapse styles' : 'Expand styles'
                          }>
                          {expandedStyles ? (
                            <ChevronUpIcon
                              size={18}
                              color={theme.secondaryText}
                            />
                          ) : (
                            <ChevronDownIcon
                              size={18}
                              color={theme.secondaryText}
                            />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Style chips */}
                    <View className="flex-row flex-wrap gap-2">
                      {image.styles
                        .slice(0, expandedStyles ? image.styles.length : 3)
                        .map(style => (
                          <View
                            key={style}
                            className="flex-row items-center rounded-full px-3 py-1.5"
                            style={{backgroundColor: theme.primary + '20'}}>
                            <PaletteIcon size={14} color={theme.primary} />
                            <Text
                              className="ml-1 text-sm"
                              style={{color: theme.primary}}>
                              {style}
                            </Text>
                          </View>
                        ))}
                      {/* Show "+X more" indicator when collapsed and there are more than 3 styles */}
                      {!expandedStyles && image.styles.length > 3 && (
                        <TouchableOpacity
                          onPress={() => setExpandedStyles(true)}
                          className="flex-row items-center rounded-full px-3 py-1.5"
                          style={{backgroundColor: theme.secondaryText + '20'}}>
                          <Text
                            className="text-sm"
                            style={{color: theme.secondaryText}}>
                            +{image.styles.length - 3} {t('common.more')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row justify-between mt-5 gap-1.5">
                  {/* Delete Button - Only show if image belongs to current user */}
                  {user?.uid && image?.userId === user.uid && (
                    <TouchableOpacity
                      onPress={handleDeletePress}
                      disabled={deleting}
                      className="flex-row items-center justify-center rounded-2xl py-3.5 px-4 flex-1 gap-2"
                      style={{backgroundColor: theme.surface}}
                      accessible={true}
                      accessibilityLabel={t('imageViewer.deleteImage')}
                      accessibilityState={{disabled: deleting}}
                      accessibilityHint={t('imageViewer.deleteImageHint')}>
                      {deleting ? (
                        <ActivityIndicator color="#ef4444" size="small" />
                      ) : (
                        <>
                          <DeleteOutlineIcon size={22} color="#ef4444" />
                          <Text
                            className="font-bold"
                            style={{color: '#ef4444'}}>
                            {t('common.delete')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Remix Button */}
                  <TouchableOpacity
                    onPress={handleRemix}
                    className="flex-row items-center justify-center rounded-2xl py-3.5 px-4 flex-1 gap-2"
                    style={{backgroundColor: theme.surface}}
                    accessible={true}
                    accessibilityLabel="Remix this image"
                    accessibilityHint="Navigate to home screen with this image's settings to create a similar image">
                    <RefreshIcon size={22} color={theme.text} />
                    <Text className="font-bold" style={{color: theme.text}}>
                      Remix
                    </Text>
                  </TouchableOpacity>

                  {/* Download Button */}
                  <TouchableOpacity
                    onPress={handleDownloadPress}
                    disabled={downloading}
                    className="flex-row items-center justify-center rounded-2xl py-3.5 px-4 flex-1 gap-2"
                    style={{backgroundColor: theme.primary}}
                    accessible={true}
                    accessibilityLabel={t('imageViewer.download')}
                    accessibilityState={{disabled: downloading}}
                    accessibilityHint={t('imageViewer.downloadHint')}>
                    {downloading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <DownloadIcon size={22} color="white" />
                        <Text className="text-white font-bold">
                          {t('common.download')}
                        </Text>
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
      ) : (
        <ImageView
          images={[{uri: imageUri}]}
          imageIndex={0}
          visible={fullscreenMode}
          onRequestClose={() => setFullscreenMode(false)}
        />
      )}

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
                backgroundColor: theme.background,
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
                  style={{color: theme.text}}>
                  {t('imageViewer.deleteImage')}
                </Text>
                <Text
                  className="text-base mb-8 text-center leading-6"
                  style={{color: theme.secondaryText}}>
                  {t('imageViewer.deleteConfirmation')}
                </Text>

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1 mr-3"
                    style={{backgroundColor: theme.surface}}
                    onPress={() => setShowDeleteDialog(false)}
                    accessible={true}
                    accessibilityLabel={t('imageViewer.cancelDelete')}>
                    <Text
                      className="text-center font-medium"
                      style={{color: theme.text}}>
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1"
                    style={{backgroundColor: '#ef4444'}}
                    onPress={handleDeleteImage}
                    accessible={true}
                    accessibilityLabel={t('imageViewer.confirmDelete')}
                    accessibilityHint={t('imageViewer.confirmDeleteHint')}>
                    <Text className="text-white font-medium text-center">
                      {t('imageViewer.confirmDelete')}
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
  const {theme} = useTheme();

  const renderIcon = () => {
    switch (icon) {
      case 'seed':
        return <SeedIcon size={16} color={theme.text} />;
      case 'tune':
        return <TuneIcon size={16} color={theme.text} />;
      case 'aspect-ratio':
        return <AspectRatioIcon size={16} color={theme.text} />;
      case 'chart-donut':
        return <ChartDonutIcon size={16} color={theme.text} />;
      case 'privacy':
        return <PrivacyIcon size={16} color={theme.text} />;
      case 'dimensions':
        return <AspectRatioIcon size={16} color={theme.text} />;
      default:
        return null;
    }
  };

  return (
    <View
      className="flex-row items-center gap-2 rounded-2xl p-2.5 flex-1 min-w-[45%]"
      style={{backgroundColor: theme.surface}}>
      {renderIcon()}
      <View className="flex-1">
        <Text className="text-xs" style={{color: theme.secondaryText}}>
          {label}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm" style={{color: theme.text}}>
            {value}
          </Text>
          {onCopy && (
            <TouchableOpacity onPress={onCopy} className="p-1">
              <ContentCopyIcon size={14} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default ImageViewer;
