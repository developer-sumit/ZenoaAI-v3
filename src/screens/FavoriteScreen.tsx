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
import UserNotFound from '@src/components/UserNotFound';
import ScrollToTop, {useScrollToTop} from '@src/components/ScrollToTop';

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
  const {scrollRef, scrollHandler, registerScrollHandler} = useScrollToTop();

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
    }, [favoriteImages.length, fetchFavoriteImages, user?.uid]),
  );

  const refreshImages = useCallback(async () => {
    if (user?.uid) {
      // Only refresh if logged in
      setRefreshing(true);
      await fetchFavoriteImages(); // Reset to first page
      setRefreshing(false);
      triggerHaptic('success');
    }
  }, [fetchFavoriteImages, user?.uid, triggerHaptic]);

  const loadMoreFavoriteImagesCallback = useCallback(async () => {
    if (user?.uid) {
      await loadMoreFavoriteImages();
    }
  }, [loadMoreFavoriteImages, user?.uid]);

  const LoadingFooter = useMemo(() => {
    if (!isLoadingMoreFavorites) {
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
    [triggerHaptic],
  );

  // Add scroll handler
  const handleScroll = useCallback(
    (event: any) => {
      if (scrollHandler) {
        scrollHandler(event);
      }
    },
    [scrollHandler],
  );

  if (!user || !user.uid) {
    return <UserNotFound />;
  }

  return (
    <View className="flex-1" style={{backgroundColor: theme.background}}>
      {/* Gallery Content */}
      {isLoadingMoreFavorites && !refreshing && favoriteImages.length === 0 ? (
        <MasonrySkeleton />
      ) : (
        <MasonryFlashList
          ref={scrollRef}
          data={favoriteImages}
          keyExtractor={(item, index) =>
            `gallery-${item.id || 'temp'}-${index}`
          }
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          estimatedItemSize={250}
          removeClippedSubviews={true}
          onEndReached={loadMoreFavoriteImagesCallback}
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
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

export default FavoriteScreen;
