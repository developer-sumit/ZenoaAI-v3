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
import UserNotFound from '@src/components/UserNotFound';
import EmptyState from '@src/components/EmptyState';
import GalleryIcon from '@src/assets/icons/GalleryIcon';
import ScrollToTop, {useScrollToTop} from '@src/components/ScrollToTop';

const NUM_COLUMNS = 2;

const GalleryScreen = () => {
  const t = useStrings();
  const {theme} = useTheme();
  const {user} = useAuthStore();
  const {triggerHaptic} = useHaptics();
  const {images, isLoading, isLoadingMore, fetchImages, loadMoreImages} =
    useImageStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );
  const {scrollRef, scrollHandler, registerScrollHandler} = useScrollToTop();

  useFocusEffect(
    useCallback(() => {
      if (user?.uid && images.length === 0) {
        console.log('Gallery: Loading images for the first time');
        fetchImages();
      } else if (user?.uid) {
        console.log('Gallery: Using cached images, count:', images.length);
      }
    }, [images.length, fetchImages, user?.uid]),
  );

  const refreshImages = useCallback(async () => {
    if (user?.uid) {
      // Only refresh if logged in
      setRefreshing(true);
      await fetchImages(); // Reset to first page
      setRefreshing(false);
      triggerHaptic('success');
    }
  }, [fetchImages, user?.uid, triggerHaptic]);

  const handleLoadMore = useCallback(async () => {
    if (user?.uid && !isLoading && images.length > 0) {
      // Only load more if logged in and not already loading
      console.log('Gallery: Loading more images');
      await loadMoreImages();
    }
  }, [loadMoreImages, user?.uid, isLoading, images.length]);

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
  }, [isLoading, theme.primary, theme.secondaryText]);

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

  const handleScroll = useCallback(
    (event: any) => {
      if (scrollHandler) {
        scrollHandler(event);
      }
    },
    [scrollHandler],
  );

  if (!user || !user?.uid) {
    return <UserNotFound />;
  }

  return (
    <View className="flex-1" style={{backgroundColor: theme.background}}>
      {/* Gallery Content */}
      {isLoading && !refreshing && images.length === 0 ? (
        <MasonrySkeleton />
      ) : (
        <MasonryFlashList
          ref={scrollRef}
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <EmptyState
              icon={<GalleryIcon size={60} color={theme.primary} />}
              title={t('gallery.noImages')}
              description={t('gallery.startCreating')}
            />
          }
          ListFooterComponent={LoadingFooter}
        />
      )}

      <ScrollToTop
        scrollRef={scrollRef}
        registerScrollHandler={registerScrollHandler}
      />

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
