import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, ActivityIndicator, RefreshControl} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MasonryFlashList} from '@shopify/flash-list';
import {useToast} from '@masumdev/rn-toast';

import {useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useImageStore} from '@src/store/imageStore';
import {GeneratedImage} from '@src/types/image';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import ImageCard from '@src/components/ImageCard';
import ImageViewer from '@src/components/ImageViewer';

// Icons
import BookmarkIcon from '@src/assets/icons/BookmarkIcon';

// Constants
const NUM_COLUMNS = 2;
const SPACING = 12;

const FavoriteScreen = () => {
  const strings = useStrings();
  const {theme} = useTheme();
  const {user} = useAuthStore();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();
  const {
    favoriteImages,
    fetchFavoriteImages,
    loadMoreFavoriteImages,
    toggleFavorite,
    isLoadingMoreFavorites,
  } = useImageStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      if (user?.uid && favoriteImages.length === 0) {
        console.log('Gallery: Loading images for the first time');
        fetchFavoriteImages();
      } else if (user?.uid) {
        console.log(
          'Gallery: Using cached images, count:',
          favoriteImages.length,
        );
      }
    }, [favoriteImages.length]),
  );

  const refreshImages = useCallback(async () => {
    setRefreshing(true);
    await fetchFavoriteImages(); // Reset to first page
    setRefreshing(false);
  }, [fetchFavoriteImages]);

  const handleToggleFavorite = useCallback(
    async (image: GeneratedImage) => {
      // Haptic feedback for favorite action
      triggerHaptic(image.isFavorite ? 'light' : 'medium');

      if (!user?.uid) {
        showToast('Please log in to favorite images', 'error');
        return;
      }

      if (selectedImage?.id === image.id) {
        setSelectedImage({
          ...selectedImage,
          favoriteCount: selectedImage.favoriteCount
            ? selectedImage.favoriteCount + (image.isFavorite ? -1 : 1)
            : 1,
          isFavorite: !selectedImage.isFavorite,
        });
      }

      try {
        const success = await toggleFavorite(image.id);

        if (success) {
          // Update the selected image if it's the same one
          if (selectedImage?.id === image.id) {
            setSelectedImage({
              ...selectedImage,
              isFavorite: !selectedImage.isFavorite,
            });
          }

          showToast(
            !image.isFavorite ? 'Added to favorites' : 'Removed from favorites',
            'success',
          );
        } else {
          showToast('Failed to update favorite', 'error');
          if (selectedImage?.id === image.id) {
            setSelectedImage({
              ...selectedImage,
              isFavorite: !selectedImage.isFavorite,
            });
          }
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        showToast('Failed to update favorite', 'error');
        if (selectedImage?.id === image.id) {
          setSelectedImage({
            ...selectedImage,
            isFavorite: !selectedImage.isFavorite,
          });
        }
      }
    },
    [user?.uid, toggleFavorite, selectedImage],
  );

  const LoadingFooter = useMemo(() => {
    if (!isLoadingMoreFavorites) {
      return null;
    }

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={{color: theme.secondaryText}} className="text-sm mt-2">
          Loading more images...
        </Text>
      </View>
    );
  }, [isLoadingMoreFavorites, theme.primary, theme.secondaryText]);

  const renderItem = useCallback(
    ({item}: {item: GeneratedImage}) => {
      return (
        <ImageCard
          image={item}
          onPress={() => {
            triggerHaptic('light');
            setSelectedImage(item);
          }}
        />
      );
    },
    [triggerHaptic, setSelectedImage],
  );

  const EmptyState = useCallback(
    () => (
      <View className="flex-1 justify-center items-center px-8">
        <BookmarkIcon size={60} color={theme.primary} />
        <Text
          className="text-xl font-bold mt-4 mb-2"
          style={{color: theme.text}}>
          {strings.gallery.noFavorites}
        </Text>
        <Text
          className="text-base text-center"
          style={{color: theme.secondaryText}}>
          {strings.gallery.tapHeart}
        </Text>
      </View>
    ),
    [theme, strings],
  );

  return (
    <View className="flex-1" style={{backgroundColor: theme.background}}>
      {/* Gallery Content */}
      {isLoadingMoreFavorites && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="mt-3" style={{color: theme.text}}>
            {strings.imageViewer.loading}
          </Text>
        </View>
      ) : (
        <MasonryFlashList
          data={favoriteImages}
          keyExtractor={(item, index) =>
            `gallery-${item.id || 'temp'}-${index}`
          }
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          estimatedItemSize={250}
          removeClippedSubviews={true}
          onEndReached={loadMoreFavoriteImages}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: SPACING,
            paddingHorizontal: SPACING,
          }}
          className="rounded-t-3xl"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshImages}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={EmptyState}
          ListFooterComponent={LoadingFooter}
        />
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onImageDeleted={fetchFavoriteImages}
          onToggleFavorite={() => handleToggleFavorite(selectedImage)}
        />
      )}
    </View>
  );
};

export default FavoriteScreen;
