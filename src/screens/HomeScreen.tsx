import clsx from 'clsx';
import React, {useState, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
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
  const {
    publicImages,
    trendingImages,
    popularImages,
    isLoadingPublic,
    fetchPublicImages,
  } = useImageStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    DEFAULT_COMMUNITY_FILTER,
  );

  // Initialize filter states with all possible filter options
  const [filterStates, setFilterStates] = useState<
    Record<
      FilterType,
      {
        loaded: boolean;
        currentPage: number;
        hasMore: boolean;
        lastFetchTime: number;
      }
    >
  >(() => {
    // Initialize all filter options to prevent undefined errors
    const initialStates = {} as Record<
      FilterType,
      {
        loaded: boolean;
        currentPage: number;
        hasMore: boolean;
        lastFetchTime: number;
      }
    >;

    COMMUNITY_FILTER_OPTIONS.forEach(option => {
      initialStates[option.id as FilterType] = {
        loaded: false,
        currentPage: 1,
        hasMore: true,
        lastFetchTime: 0,
      };
    });
    return initialStates;
  });

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;

  // Determine which images to show based on filter
  const imagesToShow = useMemo(() => {
    switch (activeFilter) {
      case 'popular':
        return popularImages;
      case 'trending':
        return trendingImages;
      case 'latest':
      default:
        return publicImages;
    }
  }, [activeFilter, popularImages, trendingImages, publicImages]);

  // Get current filter state with safe fallback
  const currentFilterState = useMemo(() => {
    return (
      filterStates[activeFilter] || {
        loaded: false,
        currentPage: 1,
        hasMore: true,
        lastFetchTime: 0,
      }
    );
  }, [filterStates, activeFilter]);

  // Check if data needs to be fetched (cache validity: 5 minutes)
  const shouldFetchData = useCallback(
    (filter: FilterType) => {
      const filterState = filterStates[filter];
      if (!filterState) return true; // If no state exists, fetch data

      const now = Date.now();
      const cacheAge = now - filterState.lastFetchTime;
      const maxCacheAge = 5 * 60 * 1000; // 5 minutes

      // Get the correct images array based on filter
      let images: GeneratedImage[];
      switch (filter) {
        case 'popular':
          images = popularImages;
          break;
        case 'trending':
          images = trendingImages;
          break;
        case 'latest':
        default:
          images = publicImages;
          break;
      }

      return (
        !filterState.loaded || cacheAge > maxCacheAge || images.length === 0
      );
    },
    [filterStates, popularImages, trendingImages, publicImages],
  );

  // Update filter state
  const updateFilterState = useCallback(
    (
      filter: FilterType,
      updates: Partial<(typeof filterStates)[FilterType]>,
    ) => {
      setFilterStates(prev => ({
        ...prev,
        [filter]: {
          ...(prev[filter] || {
            loaded: false,
            currentPage: 1,
            hasMore: true,
            lastFetchTime: 0,
          }),
          ...updates,
        },
      }));
    },
    [],
  );

  // Smooth transition animation
  const animateTransition = useCallback(() => {
    Animated.sequence([
      Animated.timing(contentOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [contentOpacity, contentTranslateY]);

  const handleFilterChange = useCallback(
    async (newFilter: FilterType) => {
      if (newFilter === activeFilter) return;

      triggerHaptic('selection');
      animateTransition();
      setActiveFilter(newFilter);

      // Only fetch if data is not cached or cache is stale
      if (shouldFetchData(newFilter)) {
        console.log(`Fetching fresh data for filter: ${newFilter}`);
        try {
          await fetchPublicImages(1, 20, newFilter);
          updateFilterState(newFilter, {
            loaded: true,
            currentPage: 1,
            lastFetchTime: Date.now(),
          });
        } catch (error) {
          console.error(`Failed to fetch data for filter ${newFilter}:`, error);
        }
      } else {
        console.log(`Using cached data for filter: ${newFilter}`);
      }
    },
    [
      activeFilter,
      triggerHaptic,
      animateTransition,
      filterStates,
      shouldFetchData,
      fetchPublicImages,
      updateFilterState,
    ],
  );

  // Initial data loading
  useFocusEffect(
    useCallback(() => {
      if (shouldFetchData(activeFilter)) {
        console.log(`Initial load for filter: ${activeFilter}`);
        fetchPublicImages(1, 20, activeFilter).then(() => {
          updateFilterState(activeFilter, {
            loaded: true,
            currentPage: 1,
            lastFetchTime: Date.now(),
          });
        });
      }
    }, [activeFilter, shouldFetchData, fetchPublicImages, updateFilterState]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    // Reset filter state
    updateFilterState(activeFilter, {
      currentPage: 1,
      hasMore: true,
      lastFetchTime: Date.now(),
    });

    try {
      await fetchPublicImages(1, 20, activeFilter);
      triggerHaptic('success');
    } catch (error) {
      console.error('Failed to refresh community images:', error);
      triggerHaptic('error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPublicImages, activeFilter, triggerHaptic, updateFilterState]);

  const handleLoadMore = useCallback(async () => {
    if (
      !isLoadingPublic &&
      currentFilterState?.hasMore &&
      imagesToShow.length > 0
    ) {
      setLoadingMore(true);
      const nextPage = currentFilterState.currentPage + 1;

      try {
        const prevLength = imagesToShow.length;
        await fetchPublicImages(nextPage, 20, activeFilter);

        // Update filter state
        updateFilterState(activeFilter, {
          currentPage: nextPage,
          lastFetchTime: Date.now(),
        });

        // Check if we reached the end by comparing lengths after a short delay
        setTimeout(() => {
          // Get the correct images array for length comparison
          let newLength: number;
          switch (activeFilter) {
            case 'popular':
              newLength = useImageStore.getState().popularImages.length;
              break;
            case 'trending':
              newLength = useImageStore.getState().trendingImages.length;
              break;
            case 'latest':
            default:
              newLength = useImageStore.getState().publicImages.length;
              break;
          }

          if (newLength === prevLength) {
            updateFilterState(activeFilter, {hasMore: false});
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
    currentFilterState?.hasMore,
    currentFilterState?.currentPage,
    imagesToShow.length,
    fetchPublicImages,
    activeFilter,
    updateFilterState,
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
    [],
  );

  const LoadingFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View className="py-5 items-center">
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }, [loadingMore, theme.primary]);

  const EmptyComponent = useMemo(
    () => (
      <EmptyState
        icon={<CommunityIcon size={64} color={theme.secondaryText} />}
        title={t('community.noImages')}
        description={t('community.noImagesDescription')}
      />
    ),
    [theme.secondaryText, t],
  );

  const FilterButtons = useMemo(
    () =>
      COMMUNITY_FILTER_OPTIONS.map(option => (
        <TouchableOpacity
          key={option.id}
          onPress={() => handleFilterChange(option.id)}
          className="px-5 py-3 rounded-full mt-2 mb-3"
          accessible={true}
          accessibilityLabel={t('community.filterBy', {type: option.label})}
          accessibilityRole="button"
          style={{
            backgroundColor:
              activeFilter === option.id ? theme.surface : 'transparent',
          }}>
          <Text
            style={{
              color: activeFilter === option.id ? theme.primary : theme.text,
              fontWeight: activeFilter === option.id ? 'bold' : 'normal',
              fontSize: 16,
            }}>
            {t(`community.filters.${option.id.toLowerCase()}`)}
          </Text>
        </TouchableOpacity>
      )),
    [
      activeFilter,
      theme.surface,
      theme.primary,
      theme.text,
      t,
      handleFilterChange,
    ],
  );

  // Show loading skeleton only when switching filters and no images for current filter
  const shouldShowSkeleton = isLoadingPublic && imagesToShow.length === 0;

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
          style={{backgroundColor: theme.surface}}
          accessible={true}
          accessibilityLabel={`Version ${appConfig.version}`}>
          <Text className="text-xs font-bold" style={{color: theme.text}}>
            v{appConfig.version}
          </Text>
        </View>
      </View>

      {/* Filter Menu */}
      <View className="flex-row rounded-3xl items-center pl-4">
        {FilterButtons}
      </View>

      {/* Animated Content Container */}
      <Animated.View
        style={{
          flex: 1,
          opacity: contentOpacity,
          transform: [{translateY: contentTranslateY}],
        }}>
        {/* Images Grid */}
        {shouldShowSkeleton ? (
          <MasonrySkeleton />
        ) : imagesToShow.length > 0 ? (
          <MasonryFlashList
            data={imagesToShow}
            keyExtractor={(item, index) =>
              `community-${activeFilter}-${item.id}-${index}`
            }
            numColumns={NUM_COLUMNS}
            renderItem={renderItem}
            estimatedItemSize={200}
            removeClippedSubviews={true}
            getItemType={() => 'image'}
            className="rounded-3xl mx-4 mt-2"
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
            ListFooterComponent={LoadingFooter}
            extraData={activeFilter}
          />
        ) : (
          EmptyComponent
        )}
      </Animated.View>

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
