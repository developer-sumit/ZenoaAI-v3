import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import FastImage from 'react-native-fast-image';
import {FlashList} from '@shopify/flash-list';

import {useTheme} from '@src/store/themeStore';
import {useImageStore} from '@src/store/imageStore';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import {GeneratedImage} from '@src/types/image';
import CloseIcon from '@src/assets/icons/CloseIcon';
import CheckmarkIcon from '@src/assets/icons/CheckmarkIcon';

const {width, height} = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 3; // 3 columns with padding

interface ImageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({
  visible,
  onClose,
  onSelectImage,
}) => {
  const {theme} = useTheme();
  const t = useStrings();
  const {triggerHaptic} = useHaptics();
  const {
    images,
    isLoading,
    isLoadingMore,
    hasMoreImages,
    fetchImages,
    loadMoreImages,
  } = useImageStore();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  useEffect(() => {
    if (visible) {
      // Always refresh images when modal opens to get latest
      fetchImages(1, 20, true);
    }
  }, [visible, fetchImages]);

  const handleImagePress = (image: GeneratedImage) => {
    triggerHaptic('light');
    setSelectedImageUrl(image.imageUrl);
  };

  const handleConfirmSelection = () => {
    if (selectedImageUrl) {
      triggerHaptic('success');
      onSelectImage(selectedImageUrl);
      onClose();
      setSelectedImageUrl('');
    }
  };

  const handleClose = () => {
    triggerHaptic('light');
    setSelectedImageUrl('');
    onClose();
  };

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreImages) {
      loadMoreImages();
    }
  }, [isLoadingMore, hasMoreImages, loadMoreImages]);

  const renderImageItem = useCallback(
    ({item}: {item: GeneratedImage}) => {
      const isSelected = selectedImageUrl === item.imageUrl;

      return (
        <TouchableOpacity
          style={{
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            margin: 5,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: isSelected ? 3 : 0,
            borderColor: isSelected ? theme.primary : 'transparent',
            shadowColor: isSelected ? theme.primary : 'transparent',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: isSelected ? 0.3 : 0,
            shadowRadius: isSelected ? 4 : 0,
            elevation: isSelected ? 4 : 0,
          }}
          onPress={() => handleImagePress(item)}
          accessible={true}
          accessibilityLabel={`Generated image: ${item.prompt}`}
          accessibilityState={{selected: isSelected}}
          activeOpacity={0.8}>
          <FastImage
            source={{
              uri: item.thumbnailUrl || item.imageUrl,
              priority: FastImage.priority.normal,
            }}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: theme.surface,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />

          {/* Selection indicator with animation effect */}
          {isSelected && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: theme.primary,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: theme.primary,
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.5,
                shadowRadius: 4,
                elevation: 4,
              }}>
              <CheckmarkIcon size={18} color="white" />
            </View>
          )}

          {/* Privacy indicator */}
          {item.isPrivate && (
            <View
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                paddingHorizontal: 6,
                paddingVertical: 3,
                backgroundColor: 'rgba(0,0,0,0.8)',
                borderRadius: 10,
              }}>
              <Text style={{color: 'white', fontSize: 10, fontWeight: '500'}}>
                Private
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedImageUrl, theme.primary, theme.surface, handleImagePress],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) {
      return null;
    }

    return (
      <View style={{paddingVertical: 20, alignItems: 'center'}}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={{color: theme.secondaryText, marginTop: 8, fontSize: 14}}>
          {t('gallery.loading')}
        </Text>
      </View>
    );
  }, [isLoadingMore, theme.primary, theme.secondaryText, t]);

  const renderEmptyState = useCallback(
    () => (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 40,
          minHeight: height * 0.4,
        }}>
        <Text
          style={{
            color: theme.secondaryText,
            textAlign: 'center',
            fontSize: 16,
            fontWeight: '500',
          }}>
          {t('gallery.noImages')}
        </Text>
        <Text
          style={{
            color: theme.secondaryText,
            textAlign: 'center',
            marginTop: 8,
            fontSize: 14,
          }}>
          {t('profile.generateImagesFirst')}
        </Text>
      </View>
    ),
    [theme.secondaryText, t, height],
  );

  const keyExtractor = useCallback(
    (item: GeneratedImage, index: number) => `${item.id}-${index}`,
    [],
  );

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection={['down']}
      style={{
        justifyContent: 'flex-end',
        margin: 0,
      }}
      backdropColor="rgba(0,0,0,0.5)"
      backdropOpacity={1}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={250}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={250}
      useNativeDriverForBackdrop={true}
      hideModalContentWhileAnimating={true}
      propagateSwipe={true}
      avoidKeyboard={true}>
      {/* Main Modal Container */}
      <View
        style={{
          backgroundColor: theme.background,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: height * 0.75,
          paddingTop: 8,
        }}>
        {/* Swipe indicator */}
        <View
          style={{
            alignSelf: 'center',
            width: 40,
            height: 4,
            backgroundColor: theme.secondaryText + '40',
            borderRadius: 2,
            marginBottom: 8,
          }}
        />

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.surface,
          }}>
          <TouchableOpacity
            onPress={handleClose}
            accessible={true}
            accessibilityLabel={t('common.close')}
            style={{
              padding: 4,
              borderRadius: 8,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <CloseIcon size={24} color={theme.text} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.text,
              flex: 1,
              textAlign: 'center',
            }}>
            {t('profile.selectProfileImage')}
          </Text>

          <TouchableOpacity
            onPress={handleConfirmSelection}
            disabled={!selectedImageUrl}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: selectedImageUrl ? theme.primary : theme.surface,
              shadowColor: selectedImageUrl ? theme.primary : 'transparent',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: selectedImageUrl ? 0.2 : 0,
              shadowRadius: selectedImageUrl ? 4 : 0,
              elevation: selectedImageUrl ? 3 : 0,
              minWidth: 80,
              alignItems: 'center',
            }}
            accessible={true}
            accessibilityLabel="Confirm selection"
            accessibilityState={{disabled: !selectedImageUrl}}>
            <Text
              style={{
                color: selectedImageUrl ? 'white' : theme.secondaryText,
                fontWeight: '600',
                fontSize: 14,
              }}>
              {t('common.select')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <View style={{flex: 1, paddingHorizontal: 20, paddingBottom: 20}}>
          {isLoading && images.length === 0 ? (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text
                style={{
                  color: theme.secondaryText,
                  marginTop: 16,
                  fontSize: 16,
                }}>
                {t('gallery.loading')}
              </Text>
            </View>
          ) : (
            <View style={{flex: 1}}>
              {images.length > 0 && (
                <Text
                  style={{
                    fontSize: 16,
                    color: theme.text,
                    marginVertical: 16,
                    textAlign: 'center',
                    fontWeight: '500',
                  }}>
                  {t('profile.selectFromGeneratedImages')}
                </Text>
              )}

              <FlashList
                data={images}
                className="rounded-t-3xl"
                renderItem={renderImageItem}
                keyExtractor={keyExtractor}
                numColumns={3}
                estimatedItemSize={ITEM_SIZE + 10}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: 20,
                }}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                extraData={selectedImageUrl} // Re-render when selection changes
                removeClippedSubviews={true}
                // FlashList specific optimizations
                overrideItemLayout={(layout, item, index) => {
                  // Calculate position for grid layout
                  const columnIndex = index % 3;
                  const rowIndex = Math.floor(index / 3);

                  layout.span = 1;
                  layout.size = ITEM_SIZE + 10;
                }}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ImageSelectionModal;
