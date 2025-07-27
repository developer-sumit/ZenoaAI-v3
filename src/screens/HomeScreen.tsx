import clsx from 'clsx';
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {MasonryFlashList} from '@shopify/flash-list';
import {useFocusEffect} from '@react-navigation/native';

import appConfig from '@src/config/app.config';
import {useTheme} from '@src/store/themeStore';
import {useImageStore} from '@src/store/imageStore';
import {GeneratedImage} from '@src/types/image';
import ImageCard from '@src/components/ImageCard';
import ImageViewer from '@src/components/ImageViewer';
import EmptyState from '@src/components/EmptyState';
import MasonrySkeleton from '@src/components/MasonrySkeleton';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import CommunityIcon from '@src/assets/icons/CommunityIcon';
import {
  COMMUNITY_FILTER_OPTIONS,
  DEFAULT_COMMUNITY_FILTER,
} from '@src/constants';

const NUM_COLUMNS = 2;
type FilterType = (typeof COMMUNITY_FILTER_OPTIONS)[number]['id'];

const HomeScreen = () => {
  const t = useStrings();
  const {isDark, theme} = useTheme();
  const {triggerHaptic} = useHaptics();
  const {publicImages, popularImages, isLoadingPublic, fetchPublicImages} =
    useImageStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    DEFAULT_COMMUNITY_FILTER,
  );

  // Determine which images to show based on filter
  const imagesToShow =
    activeFilter === 'popular' ? popularImages : publicImages;

  useFocusEffect(
    useCallback(() => {
      if (activeFilter === 'popular') {
        if (popularImages.length === 0) {
          fetchPublicImages(1, 20, activeFilter);
        }
      } else {
        if (publicImages.length === 0) {
          fetchPublicImages(1, 20, activeFilter);
        }
      }
    }, [
      fetchPublicImages,
      publicImages.length,
      popularImages.length,
      activeFilter,
    ]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    try {
      await fetchPublicImages(1, 20, activeFilter);
      triggerHaptic('success');
    } catch (error) {
      console.error('Failed to refresh community images:', error);
      triggerHaptic('error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPublicImages, activeFilter]);

  const handleLoadMore = useCallback(async () => {
    if (!isLoadingPublic && hasMore && imagesToShow.length > 0) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      try {
        const prevLength = imagesToShow.length;
        await fetchPublicImages(nextPage, 20, activeFilter);
        setCurrentPage(nextPage);

        // Check if we reached the end by comparing lengths after a short delay
        setTimeout(() => {
          const newLength =
            activeFilter === 'popular'
              ? useImageStore.getState().popularImages.length
              : useImageStore.getState().publicImages.length;
          if (newLength === prevLength) {
            setHasMore(false);
          }
        }, 100);
      } catch (error) {
        console.error('Failed to load more community images:', error);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [
    isLoadingPublic,
    hasMore,
    imagesToShow.length,
    currentPage,
    fetchPublicImages,
    activeFilter,
  ]);

  const renderItem = useCallback(
    ({item, index}: {item: GeneratedImage; index: number}) => {
      return (
        <View
          className={clsx('mb-2', index % NUM_COLUMNS === 0 ? 'mr-1' : 'ml-1')}>
          <ImageCard image={item} onPress={() => setSelectedImage(item)} />
        </View>
      );
    },
    [setSelectedImage],
  );

  return (
    <View className="flex-1" style={{backgroundColor: theme.background}}>
      {/* Header */}
      <View className="flex-row justify-between items-center p-4">
        <View className="flex-row items-center gap-2.5">
          <FastImage
            source={isDark ? appConfig.lightFavicon : appConfig.darkFavicon}
            style={{
              width: 32,
              height: 32,
              borderWidth: 1,
              borderColor: theme.text,
              borderRadius: 10,
              backgroundColor: isDark ? 'white' : '#121212',
            }}
            resizeMode="contain"
            accessible={true}
            accessibilityLabel={appConfig.name}
            accessibilityRole="image"
            importantForAccessibility="yes"
          />
          <Text
            className="text-xl font-bold"
            style={{color: theme.text}}
            accessibilityRole="header">
            {appConfig.name}
          </Text>
        </View>

        <View
          className="py-1 px-3 rounded-full"
          style={{backgroundColor: theme.primary}}
          accessible={true}
          accessibilityLabel={`Version ${appConfig.version}`}>
          <Text className="text-xs font-medium text-white">
            v{appConfig.version}
          </Text>
        </View>
      </View>

      {/* Filter Menu Modal */}
      <View className="flex-row rounded-3xl items-center pl-4">
        {COMMUNITY_FILTER_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.id}
            onPress={() => {
              triggerHaptic('selection');
              setActiveFilter(option.id);
              setCurrentPage(1);
              setHasMore(true);
              fetchPublicImages(1, 20, option.id);
            }}
            className="px-2.5 pb-4 pt-5"
            accessible={true}
            accessibilityLabel={t('community.filterBy', {type: option.label})}
            accessibilityRole="button">
            <Text
              style={{
                color: activeFilter === option.id ? theme.primary : theme.text,
                fontWeight: activeFilter === option.id ? 'bold' : 'normal',
                fontSize: 16,
              }}>
              {t(`community.filters.${option.id.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Images Grid */}
      {isLoadingPublic && imagesToShow.length === 0 ? (
        <MasonrySkeleton />
      ) : imagesToShow.length > 0 ? (
        <MasonryFlashList
          data={imagesToShow}
          keyExtractor={(item, index) => `community-${item.id}-${index}`}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          estimatedItemSize={200}
          removeClippedSubviews={true}
          className="rounded-3xl mx-4"
          contentContainerClassName="pb-24"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-5 items-center">
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : (
              <></>
            )
          }
          extraData={{imagesToShow}}
        />
      ) : (
        <EmptyState
          icon={<CommunityIcon size={64} color={theme.secondaryText} />}
          title={t('community.noImages')}
          description={t('community.noImagesDescription')}
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

export default HomeScreen;
