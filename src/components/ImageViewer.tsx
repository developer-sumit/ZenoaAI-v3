import React, {useState, useEffect, useRef, useMemo} from 'react';
import RNFS from 'react-native-fs';
import {BlurView} from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ToastAndroid,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Toaster, useToast} from '@masumdev/rn-toast';
import {useNavigation} from '@react-navigation/native';
import ImageView from 'react-native-image-viewing';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from 'react-native-popup-menu';

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
import MoreVertIcon from '@src/assets/icons/MoreVertIcon';
import FlagIcon from '@src/assets/icons/FlagIcon';
import CheckBoxIcon from '@src/assets/icons/CheckBoxIcon';
import CheckBoxOutlineBlankIcon from '@src/assets/icons/CheckBoxOutlineBlankIcon';

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
}

const ImageViewer: React.FC<ImageViewerProps> = ({image, onClose}) => {
  const t = useStrings();
  const {isDark, theme} = useTheme();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();
  const {user} = useAuthStore();
  const {updatePrivacy, deleteImage, toggleFavorite, flagImage} =
    useImageStore();
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

  const storedImage = useImageStore(state =>
    image?.id
      ? state.images.find(img => img.id === image.id) ||
        state.publicImages.find(img => img.id === image.id) ||
        state.popularImages.find(img => img.id === image.id) ||
        state.favoriteImages.find(img => img.id === image.id)
      : null,
  );

  const displayImage = storedImage || image;
  const imageUri = displayImage?.imageUrl || '';

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState(''); // State for custom flag reason
  const [selectedFlagReasons, setSelectedFlagReasons] = useState<string[]>([]); // New state for multiple selected reasons
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
      FastImage.preload([{uri: imageUri, priority: FastImage.priority.high}]);
    }
  }, [imageUri]);

  // Handle back button
  useEffect(() => {
    if (!displayImage) return;

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
      if (showFlagDialog) {
        setShowFlagDialog(false);
        setFlagReason('');
        setSelectedFlagReasons([]); // Clear selections on close
        return true;
      }
      if (displayImage) {
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
  }, [displayImage, onClose, fullscreenMode, showDeleteDialog, showFlagDialog]);

  const toggleFullscreen = () => {
    console.log('Toggling fullscreen mode, current mode:', fullscreenMode);
    setFullscreenMode(!fullscreenMode);
  };

  const handlePrivacyUpdate = async () => {
    triggerHaptic('light');
    if (displayImage) {
      const res = await updatePrivacy(
        displayImage?.id,
        !displayImage.isPrivate,
      );
      if (!res) {
        showToast('Failed to update privacy', 'error');
      }
    }
  };

  const handleDownloadPress = () => {
    if (!displayImage || !imageUri) {
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

  const handleFlagPress = () => {
    setShowFlagDialog(true);
    setFlagReason('');
    setSelectedFlagReasons([]); // Clear selections when opening
  };

  const handleToggleFlagReason = (reason: string) => {
    setSelectedFlagReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason],
    );
  };

  const handleFlagSubmit = async () => {
    if (!displayImage?.id) {
      return;
    }

    let reasonsToSubmit = [...selectedFlagReasons];
    if (flagReason.trim()) {
      reasonsToSubmit.push(`Other: ${flagReason.trim()}`);
    }

    if (reasonsToSubmit.length === 0) {
      showToast('Please select or enter a reason for reporting.', 'error');
      return;
    }

    try {
      const success = await flagImage(
        displayImage.id,
        reasonsToSubmit, // Pass the array of reasons
      );
      if (success) {
        showToast('Image reported successfully', 'success');
        // Close the viewer immediately if flagged successfully, as it's now hidden from public view
        onClose?.();
      } else {
        showToast('Failed to report image', 'error');
      }
    } catch (error) {
      console.error('Error flagging image:', error);
      showToast('Failed to report image', 'error');
    } finally {
      // Always close the dialog whether successful or not, but only clear fields on success or cancel
      setShowFlagDialog(false);
      setFlagReason('');
      setSelectedFlagReasons([]);
    }
  };

  const togglePromptExpansion = () => {
    setExpandedPrompt(!expandedPrompt);
  };

  const handleDeleteImage = async () => {
    if (!user?.uid || !displayImage?.id) {
      return;
    }

    try {
      setDeleting(true);
      const success = await deleteImage(displayImage.id);

      if (success) {
        showToast(t('imageViewer.imageDeleted'), 'success');
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
    if (!displayImage) return;

    try {
      const success = await toggleFavorite(displayImage.id);
      if (!success) {
        showToast(t('gallery.failedToUpdateFavorite'), 'error');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showToast(t('gallery.failedToUpdateFavorite'), 'error');
    }
  };

  const handleRemix = () => {
    if (!displayImage) {
      return;
    }

    // Close the image viewer first
    onClose?.();

    // Navigate to home screen with a slight delay to ensure modal is closed
    setTimeout(() => {
      setPrompt(displayImage.prompt);
      setNegativePrompt(displayImage.negativePrompt || '');
      setEngine(displayImage.engineType);
      setStyles(displayImage.styles || []);
      setImageWidth(displayImage.width);
      setImageHeight(displayImage.height);
      setAspectRatio(displayImage.aspectRatio);

      navigation.navigate(Routes.GENERATE as never);
    }, 100);
  };

  const isModalVisible = useMemo(() => !!displayImage, [displayImage]);

  const reportReasons = [
    t('reportReasons.inappropriateContent'),
    t('reportReasons.spamMisleading'),
    t('reportReasons.copyrightViolation'),
    t('reportReasons.hateSpeechDiscrimination'),
    t('reportReasons.violenceGraphicContent'),
  ];

  return (
    <>
      {!fullscreenMode ? (
        <Modal
          visible={isModalVisible}
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
          <MenuProvider>
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

            <SafeAreaView className="flex-1 p-4">
              {/* Image Display */}
              <View
                className="flex-1 rounded-3xl mb-4 justify-center overflow-hidden"
                style={[expandedPrompt ? {flex: 0.7} : {}]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={toggleFullscreen}
                  onLongPress={handleToggleFavorite}
                  delayLongPress={300}
                  className="w-full h-full justify-center items-center"
                  accessible={true}
                  accessibilityLabel={`Image of ${
                    displayImage?.prompt || 'generated content'
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
                      borderRadius: 24,
                      width: '100%',
                      height: '100%',
                      aspectRatio:
                        displayImage?.aspectRatio.replace(':', '/') || '1/1',
                      backgroundColor: 'transparent',
                    }}
                    resizeMode={FastImage.resizeMode.contain}
                    onLoadStart={() => {
                      console.log('Image load started');
                      setImageLoaded(false);
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
                        uri: displayImage?.userAvatar,
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
                      {displayImage?.userName || 'Anonymous'}
                    </Text>
                  </View>

                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={onClose}
                    className="absolute top-2.5 left-2.5 p-2.5 rounded-full"
                    style={{backgroundColor: theme.surface}}
                    accessible={true}
                    accessibilityLabel={t('imageViewer.closeHint')}>
                    <CloseIcon size={24} color={theme.text} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Menu Button */}
                {imageLoaded && (
                  <View className="absolute top-2 right-2 flex-row">
                    <Menu>
                      <MenuTrigger
                        customStyles={{
                          TriggerTouchableComponent: TouchableOpacity,
                          triggerWrapper: {
                            padding: 10,
                            borderRadius: 28,
                            backgroundColor: theme.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: theme.secondaryText + '40',
                          },
                        }}>
                        <MoreVertIcon size={24} color={theme.text} />
                      </MenuTrigger>
                      <MenuOptions
                        customStyles={{
                          optionsContainer: {
                            padding: 8,
                            borderRadius: 12,
                            backgroundColor: theme.surface,
                          },
                        }}>
                        {displayImage?.userId === user?.uid && (
                          <>
                            <MenuOption onSelect={handleDeletePress}>
                              <View className="flex-row items-center gap-2 py-2">
                                <DeleteOutlineIcon size={20} color="#ef4444" />
                                <Text
                                  className="font-bold"
                                  style={{color: '#ef4444'}}>
                                  {t('common.delete')}
                                </Text>
                              </View>
                            </MenuOption>
                            <MenuOption
                              onSelect={handlePrivacyUpdate}
                              disabled={user?.planType === 'free'}>
                              <View className="flex-row items-center gap-2 py-2">
                                <PrivacyIcon
                                  size={20}
                                  color={
                                    displayImage?.isPrivate
                                      ? '#FF4B8C'
                                      : '#0D9488'
                                  }
                                />
                                <Text
                                  className="font-bold"
                                  style={{
                                    color: displayImage?.isPrivate
                                      ? '#FF4B8C'
                                      : '#0D9488',
                                  }}>
                                  {displayImage?.isPrivate
                                    ? t('imageViewer.private')
                                    : t('imageViewer.public')}
                                </Text>
                                {user?.planType === 'free' && (
                                  <Text
                                    className="font-bold"
                                    style={{
                                      color: theme.secondaryText,
                                      fontSize: 10,
                                      marginLeft: 4,
                                    }}>
                                    (Pro only)
                                  </Text>
                                )}
                              </View>
                            </MenuOption>
                          </>
                        )}
                        {/* Flag/Report Option - Always visible */}
                        <MenuOption onSelect={handleFlagPress}>
                          <View className="flex-row items-center gap-2 py-2">
                            <FlagIcon size={20} color={theme.text} />
                            <Text
                              className="font-bold"
                              style={{color: theme.text}}>
                              {t('common.flagReport')}
                            </Text>
                          </View>
                        </MenuOption>
                      </MenuOptions>
                    </Menu>
                  </View>
                )}

                {/* Loading indicator */}
                {!imageLoaded && !imageLoadFailed && (
                  <View className="absolute inset-0 justify-center items-center">
                    <ActivityIndicator color={theme.primary} size="large" />
                    <Text
                      className="mt-3 text-base"
                      style={{color: theme.text}}>
                      {t('imageViewer.loading')}
                    </Text>
                  </View>
                )}

                {/* Image load error */}
                {imageLoadFailed && (
                  <View className="absolute inset-0 justify-center items-center">
                    <Text
                      style={{color: theme.text}}
                      className="text-base mb-3">
                      {t('imageViewer.loadingError')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('light');
                        setImageLoadFailed(false);
                        setImageLoaded(false);
                        FastImage.preload([
                          {
                            uri: imageUri + '?reload=' + Date.now(),
                            priority: FastImage.priority.high,
                          },
                        ]);
                      }}
                      className="px-4 py-2 rounded-full"
                      style={{backgroundColor: theme.primary + '40'}}>
                      <Text style={{color: theme.primary}}>
                        {t('common.retry')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Metadata Panel */}
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
                    accessibilityLabel={`Prompt: ${displayImage?.prompt || ''}`}
                    accessibilityHint={t('imageViewer.promptHint')}>
                    {displayImage?.prompt || ''}
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
                      onPress={() =>
                        copyToClipboard(displayImage?.prompt || '')
                      }
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
                      displayImage?.engineType
                        ? `${displayImage.engineType}`
                        : 'Quantum'
                    }
                  />
                  {/* Image Dimensions - Top priority */}
                  <MetadataItem
                    icon="dimensions"
                    label={t('imageViewer.dimensions')}
                    value={`${displayImage?.width || 0} x ${
                      displayImage?.height || 0
                    }`}
                  />
                  {/* Privacy Status (for all images, but only editable by owner) */}
                  <MetadataItem
                    icon="privacy"
                    label={t('imageViewer.visibility')}
                    value={displayImage?.isPrivate ? 'Private' : 'Public'}
                  />
                  {/* Seed */}
                  <MetadataItem
                    icon="seed"
                    label={t('advanced.featureInfo.seed.title')}
                    value={displayImage?.seed?.toString() || ''}
                    onCopy={() =>
                      copyToClipboard(displayImage?.seed?.toString() || '')
                    }
                  />
                  {/* Aspect Ratio */}
                  <MetadataItem
                    icon="aspect-ratio"
                    label={t('advanced.featureInfo.aspectRatio.title')}
                    value={displayImage?.aspectRatio || '1:1'}
                  />
                  {/* Created At */}
                  {displayImage?.createdAt && (
                    <MetadataItem
                      icon="privacy"
                      label={t('imageViewer.created')}
                      value={new Date(
                        displayImage.createdAt,
                      ).toLocaleDateString()}
                    />
                  )}
                </View>

                {/* Negative Prompt Section */}
                {displayImage?.negativePrompt &&
                  displayImage.negativePrompt.trim() && (
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
                          {displayImage.negativePrompt}
                        </Text>
                      </View>
                    </View>
                  )}

                {/* Style Chips */}
                {displayImage?.styles && displayImage.styles.length > 0 && (
                  <View className="mt-4">
                    {/* Header with expand/collapse toggle */}
                    <View className="flex-row items-center justify-between mb-2">
                      <Text
                        className="text-sm font-medium"
                        style={{color: theme.text}}>
                        {t('advanced.featureInfo.artStyles.title')} (
                        {displayImage.styles.length})
                      </Text>
                      {displayImage.styles.length > 3 && (
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
                      {displayImage.styles
                        .slice(
                          0,
                          expandedStyles ? displayImage.styles.length : 3,
                        )
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
                      {!expandedStyles && displayImage.styles.length > 3 && (
                        <TouchableOpacity
                          onPress={() => setExpandedStyles(true)}
                          className="flex-row items-center rounded-full px-3 py-1.5"
                          style={{
                            backgroundColor: theme.secondaryText + '20',
                          }}>
                          <Text
                            className="text-sm"
                            style={{color: theme.secondaryText}}>
                            +{displayImage.styles.length - 3} {t('common.more')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row justify-between mt-5 gap-1.5">
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

                  {/* Favorite Button */}
                  <TouchableOpacity
                    onPress={handleToggleFavorite}
                    className="flex-row items-center justify-center rounded-2xl py-3.5 px-4 flex-1 gap-2"
                    style={{backgroundColor: theme.surface}}
                    accessible={true}
                    accessibilityLabel={
                      displayImage?.isFavorite
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }>
                    <HeartIcon
                      size={22}
                      color={displayImage?.isFavorite ? '#FF4B8C' : theme.text}
                      fill={
                        displayImage?.isFavorite ? '#FF4B8C' : 'transparent'
                      }
                    />
                    <Text
                      className="font-bold"
                      style={{
                        color: displayImage?.isFavorite
                          ? '#FF4B8C'
                          : theme.text,
                      }}>
                      {displayImage?.favoriteCount
                        ? displayImage.favoriteCount
                        : 0}
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
            </SafeAreaView>

            <Toaster
              customColors={{
                success: {background: '#E7F5E9', text: '#256029'},
                error: {background: '#FDECEA', text: '#B3261E'},
                info: {background: '#E3F2FD', text: '#1E88E5'},
              }}
            />
          </MenuProvider>
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

      {/* Flag/Report Confirmation Dialog */}
      <Modal visible={showFlagDialog} transparent animationType="fade">
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
                  Report Image
                </Text>
                <Text
                  className="text-base mb-6 text-center leading-6"
                  style={{color: theme.secondaryText}}>
                  Please select a reason(s) for reporting this image:
                </Text>

                <View className="mb-6">
                  {reportReasons.map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      className="flex-row items-center rounded-xl py-3.5 px-4 mb-3"
                      style={{backgroundColor: theme.surface}}
                      onPress={() => handleToggleFlagReason(reason)}
                      accessible={true}
                      accessibilityLabel={`Toggle report reason: ${reason}`}>
                      {selectedFlagReasons.includes(reason) ? (
                        <CheckBoxIcon size={20} color={theme.primary} />
                      ) : (
                        <CheckBoxOutlineBlankIcon
                          size={20}
                          color={theme.secondaryText}
                        />
                      )}
                      <Text
                        className="font-medium ml-3"
                        style={{color: theme.text}}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TextInput
                    placeholder="Other (please specify)"
                    placeholderTextColor={theme.secondaryText + '80'}
                    value={flagReason}
                    onChangeText={setFlagReason}
                    onSubmitEditing={handleFlagSubmit}
                    className="rounded-xl py-3.5 px-4 border"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderColor: theme.secondaryText + '40',
                    }}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    accessibilityLabel="Other report reason"
                  />
                </View>

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1 mr-3"
                    style={{backgroundColor: theme.surface}}
                    onPress={() => {
                      setShowFlagDialog(false);
                      setFlagReason('');
                      setSelectedFlagReasons([]);
                    }}
                    accessible={true}
                    accessibilityLabel="Cancel report">
                    <Text
                      className="text-center font-medium"
                      style={{color: theme.text}}>
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-3.5 px-6 rounded-xl flex-1"
                    style={{backgroundColor: theme.primary}}
                    onPress={handleFlagSubmit}
                    disabled={
                      selectedFlagReasons.length === 0 && !flagReason.trim()
                    }
                    accessible={true}
                    accessibilityLabel="Submit report">
                    <Text className="text-white font-medium text-center">
                      Submit Report
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
