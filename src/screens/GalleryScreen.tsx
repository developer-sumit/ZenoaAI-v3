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
import ImageViewer from '@src/components/ImageViewer';
import MasonrySkeleton from '@src/components/MasonrySkeleton';

const NUM_COLUMNS = 2;

const GalleryScreen = () => {
  const t = useStrings();
  const {theme} = useTheme();
  const {user} = useAuthStore();
  const {triggerHaptic} = useHaptics();
  const {
    images,
    isLoading,
    isLoadingMore,
    hasMoreImages,
    fetchImages,
    loadMoreImages,
  } = useImageStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      if (user?.uid && images.length === 0) {
        console.log('Gallery: Loading images for the first time');
        fetchImages(1, 20, true); // Load first page
      } else if (user?.uid) {
        console.log('Gallery: Using cached images, count:', images.length);
      }
    }, [images.length, user?.uid, fetchImages]),
  );

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreImages) {
      loadMoreImages();
    }
  }, [isLoadingMore, hasMoreImages, loadMoreImages]);

  const LoadingFooter = useMemo(() => {
    if (!isLoadingMore) {
      return null;
    }

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={{color: theme.secondaryText}} className="text-sm mt-2">
          {t('gallery.loading')}
        </Text>
      </View>
    );
  }, [isLoadingMore, theme.primary, theme.secondaryText, t]);

  const refreshImages = useCallback(async () => {
    setRefreshing(true);
    await fetchImages(1, 20, true); // Reset to first page
    setRefreshing(false);
  }, [fetchImages]);

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
    [triggerHaptic],
  );

  return (
    <View className="flex-1" style={{backgroundColor: theme.background}}>
      {/* Gallery Content */}
      {isLoading && !refreshing && images.length === 0 ? (
        <MasonrySkeleton />
      ) : (
        <MasonryFlashList
          data={images}
          keyExtractor={(item, index) => `gallery-${item.id}-${index}`}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          estimatedItemSize={250}
          removeClippedSubviews={true}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerClassName="pb-24"
          className="rounded-t-3xl mx-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshImages}
              colors={[theme.primary]}
              tintColor={theme.primary}
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
        />
      )}
    </View>
  );
};

export default GalleryScreen;
