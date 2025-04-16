import React from 'react';
import RNFS from 'react-native-fs';
import {BlurView} from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
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
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import appConfig from '@src/config/app.config';
import {imageService} from '@src/services/imageService';
import Toast from 'react-native-toast-message';
import Icon, {IconName} from './Icon';

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
  const {user} = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;

  const [downloading, setDownloading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleDownloadPress = () => {
    if (!image) {
      console.log('No image to download');
      return;
    }

    downloadImage(image);
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

      Toast.show({
        type: 'success',
        text1: 'Image deleted',
        visibilityTime: 2000,
      });
      if (onImageDeleted) onImageDeleted();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error deleting image:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to delete image',
        visibilityTime: 2000,
      });
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

      Toast.show({
        type: 'success',
        text1: 'Image downloaded',
        visibilityTime: 2000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to download image',
        visibilityTime: 2000,
      });
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Toast.show({
      type: 'info',
      text1: 'Copied to clipboard',
      visibilityTime: 1000,
    });
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
  icon: IconName;
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
});

export default ImageViewer;
