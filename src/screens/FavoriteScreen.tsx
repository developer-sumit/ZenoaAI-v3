import clsx from 'clsx';
import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, ActivityIndicator, RefreshControl} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MasonryFlashList} from '@shopify/flash-list';

import {useTheme} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useImageStore} from '@src/store/imageStore';
import {GeneratedImage} from '@src/types/image';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import ImageCard from '@src/components/ImageCard';
import EmptyState from '@src/components/EmptyState';
import ImageViewer from '@src/components/ImageViewer';
import BookmarkIcon from '@src/assets/icons/BookmarkIcon';
import MasonrySkeleton from '@src/components/MasonrySkeleton';

// Constants
const NUM_COLUMNS = 2;

const FavoriteScreen = () => {
  const t = useStrings();
  const {theme} = useTheme();
  const {user} = useAuthStore();
  const {triggerHaptic} = useHaptics();
  const {
    favoriteImages,
    fetchFavoriteImages,
    loadMoreFavoriteImages,
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
    ({item, index}: {item: GeneratedImage; index: number}) => {
      return (
        <View
          className={clsx(
            'mb-2.5',
            index % NUM_COLUMNS === 0 ? 'mr-1' : 'ml-1',
          )}>
          <ImageCard
            image={item}
            onPress={() => {
              triggerHaptic('light');
              setSelectedImage(item);
            }}
          />
        </View>
      );
    },
    [triggerHaptic, setSelectedImage],
  );

  return (
    <View className="flex-1" style={{backgroundColor: theme.background}}>
      {/* Gallery Content */}
      {isLoadingMoreFavorites && !refreshing && favoriteImages.length === 0 ? (
        <MasonrySkeleton />
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
          className="rounded-t-3xl mx-4"
          contentContainerClassName="pb-24"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshImages}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<BookmarkIcon size={60} color={theme.primary} />}
              title={t('gallery.noFavorites')}
              description={t('gallery.tapHeart')}
            />
          }
          ListFooterComponent={LoadingFooter}
        />
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onImageDeleted={fetchFavoriteImages}
        />
      )}
    </View>
  );
};

export default FavoriteScreen;
