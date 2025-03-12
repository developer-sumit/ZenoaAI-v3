import React from 'react';
import RNFS from 'react-native-fs';
import {BlurView} from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {GeneratedImage} from '@src/types';
import {theme} from '@src/theme/Theme';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import {useToast} from './Toast';
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import appConfig from '@src/config/app.config';
import {
  RewardedAd,
  TestIds,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import {imageService} from '@src/services/imageService';

interface ImageViewerProps {
  image: GeneratedImage | null;
  onClose?: () => void;
  onImageDeleted?: () => void;
}

const rewarded = RewardedAd.createForAdRequest(TestIds.REWARDED);

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  onClose,
  onImageDeleted,
}) => {
  const toast = useToast();
  const {isDark} = useThemeStore();
  const {user} = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;

  const [downloading, setDownloading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [isAdLoaded, setIsAdLoaded] = React.useState(false);
  const [rewardReceived, setRewardReceived] = React.useState(false);

  // It will reset states when image changes
  React.useEffect(() => {
    setRewardReceived(false);

    const loadedListener = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setIsAdLoaded(true),
    );

    const rewardListener = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setRewardReceived(true);
        // If user just earned reward, start download now
        console.log('Reward received, downloading image...');
        if (image) {
          downloadImage(image);
        }
      },
    );

    rewarded.load();

    return () => {
      loadedListener();
      rewardListener();
      rewarded.removeAllListeners();
    };
  }, [image]);

  const showRewardedAd = () => {
    if (isAdLoaded) {
      rewarded.show();
    } else {
      // If ad isn't loaded, try loading again
      toast.show('Loading ad, please wait...');
      rewarded.load();

      // Allow download after a timeout if ad still won't load
      setTimeout(() => {
        if (!isAdLoaded && image) {
          setRewardReceived(true);
          toast.show('Ad not available, download enabled');
        }
      }, 5000);
    }
  };

  const handleDownloadPress = () => {
    if (!image) {
      console.log('No image to download');
      return;
    }

    if (rewardReceived) {
      downloadImage(image); // Already rewarded => download
    } else {
      showRewardedAd(); // Show ad if user hasn't earned reward
    }
  };

  const handleDeletePress = () => {
    if (!image || !user?.id) return;

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

  const deleteImage = async (image: GeneratedImage) => {
    if (!user?.id || !image.timestamp || !image.seed) return;

    try {
      setDeleting(true);
      const imageId = `${image.timestamp}_${image.seed}`;
      await imageService.deleteImage(user.id, imageId);

      toast.success('Image deleted');
      if (onImageDeleted) onImageDeleted();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
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

      toast.success('Image saved to gallery!');
    } catch (error) {
      toast.error('Download Failed');
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <Modal visible={!!image} transparent animationType="fade">
      <BlurView
        style={styles.blurViewContainer}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={20}
      />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.iconButton, {backgroundColor: colors.surface}]}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Image Display */}
        <View style={styles.imageContainer}>
          <FastImage
            source={{uri: image?.uri || ''}}
            style={[
              styles.image,
              {
                aspectRatio: image?.aspectRatio.ratio
                  ? parseFloat(image.aspectRatio.ratio.split(':')[0]) /
                    parseFloat(image.aspectRatio.ratio.split(':')[1])
                  : 1,
              },
            ]}
            resizeMode={FastImage.resizeMode.contain}
          />
        </View>

        {/* Metadata Panel */}
        <View
          style={[styles.metadataPanel, {backgroundColor: colors.background}]}>
          <View style={styles.promptContainer}>
            <Text style={[styles.promptText, {color: colors.primary}]}>
              {image?.prompt}
            </Text>
            <TouchableOpacity
              onPress={() => copyToClipboard(image?.prompt || '')}
              style={styles.copyButton}>
              <Icon
                name="content-copy"
                size={18}
                color={colors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          {/* Metadata Grid */}
          <View style={styles.metadataGrid}>
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
          <View style={styles.styleChipsContainer}>
            {image?.styles.map((style, index) => (
              <View
                key={index}
                style={[
                  styles.styleChip,
                  {backgroundColor: colors.primary + '20'},
                ]}>
                <Icon name="palette" size={14} color={colors.primary} />
                <Text style={[styles.styleChipText, {color: colors.primary}]}>
                  {style}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDeletePress}
              disabled={deleting}
              style={[styles.actionButton, {backgroundColor: colors.surface}]}>
              {deleting ? (
                <ActivityIndicator color={colors.secondary} size="small" />
              ) : (
                <>
                  <Icon name="delete-outline" size={22} color="#ef4444" />
                  <Text style={[styles.actionButtonText, {color: '#ef4444'}]}>
                    Delete
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Download Button */}
            <TouchableOpacity
              onPress={handleDownloadPress}
              disabled={downloading}
              style={[
                styles.actionButton,
                styles.downloadButton,
                {backgroundColor: colors.primary},
              ]}>
              {downloading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Icon name="download" size={22} color="white" />
                  <View>
                    <Text style={styles.actionButtonText}>Download HD</Text>
                    {!rewardReceived && (
                      <Text style={styles.adInfo}>Watch an ad</Text>
                    )}
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const MetadataItem = ({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: string;
  label: string;
  value: string;
  onCopy?: () => void;
}) => {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  return (
    <View style={[styles.metadataItem, {backgroundColor: colors.surface}]}>
      <Icon name={icon} size={16} color={colors.text} />
      <View style={styles.metadataContent}>
        <Text style={[styles.metadataLabel, {color: colors.secondaryText}]}>
          {label}
        </Text>
        <View style={styles.metadataValueContainer}>
          <Text style={[styles.metadataValue, {color: colors.text}]}>
            {value}
          </Text>
          {onCopy && (
            <TouchableOpacity
              onPress={onCopy}
              style={styles.metadataCopyButton}>
              <Icon name="content-copy" size={14} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  blurViewContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    padding: 10,
    borderRadius: 50,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 24,
    marginBottom: 16,
  },
  image: {
    borderRadius: 24,
    width: '100%',
  },
  metadataPanel: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  promptContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 10,
    flex: 1,
    minWidth: '45%',
  },
  metadataContent: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
  },
  metadataValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metadataValue: {
    fontSize: 14,
  },
  metadataCopyButton: {
    padding: 4,
  },
  styleChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  styleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  styleChipText: {
    marginLeft: 4,
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flex: 1,
    gap: 8,
  },
  downloadButton: {
    flex: 1.5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 15,
  },
  adInfo: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
});

export default ImageViewer;
