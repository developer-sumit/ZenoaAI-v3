import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  TextInput,
  RefreshControl,
  Animated,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MasonryFlashList} from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import {useToast} from '@masumdev/rn-toast';

import {useTheme} from '@src/store/themeStore';
import {useImageStore} from '@src/store/imageStore';
import {GeneratedImage} from '@src/types';
import ImageViewer from '@src/components/ImageViewer';
import EmptyState from '@src/components/EmptyState';
import UserAvatar from '@src/components/UserAvatar';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import {useAnimations} from '@src/hooks/useAnimations';

// Icons
import SearchIcon from '@src/assets/icons/SearchIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import CommunityIcon from '@src/assets/icons/CommunityIcon';
import HeartIcon from '@src/assets/icons/HeartIcon';

// Constants
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 2;
const SPACING = 12;
const TOTAL_SPACING = SPACING * (NUM_COLUMNS + 1);
const COLUMN_WIDTH = (SCREEN_WIDTH - TOTAL_SPACING) / NUM_COLUMNS;

// Hardcoded filter options
const FILTER_OPTIONS = [
  {id: 'latest', label: 'Latest'},
  {id: 'popular', label: 'Popular'},
] as const;

type FilterType = (typeof FILTER_OPTIONS)[number]['id'];

const CommunityScreen = () => {
  const {theme} = useTheme();
  const {showToast} = useToast();
  const strings = useStrings();
  const {publicImages, isLoadingPublic, fetchPublicImages, toggleFavorite} =
    useImageStore();
  const {triggerHaptic} = useHaptics();
  const {animatePress} = useAnimations();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredImages, setFilteredImages] = useState<GeneratedImage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, _] = useState<FilterType>('latest');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate screen entrance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      if (publicImages.length === 0) {
        fetchPublicImages(1, 20, activeFilter);
      }
    }, [fetchPublicImages, publicImages.length]),
  );

  // Filter images based on search query
  useEffect(() => {
    if (publicImages.length > 0) {
      let filtered = [...publicImages];

      // Apply search query filter - search by prompt, ID, or user name
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(img => {
          const searchablePrompt = img.prompt || '';
          const finalPrompt = img.prompt || '';
          const userName = img.userName || 'Anonymous';

          return (
            img.id.toLowerCase().includes(query) ||
            searchablePrompt.toLowerCase().includes(query) ||
            finalPrompt.toLowerCase().includes(query) ||
            userName.toLowerCase().includes(query)
          );
        });
      }

      setFilteredImages(filtered);
    } else {
      setFilteredImages([]);
    }
  }, [publicImages, searchQuery]);

  const handleRefresh = useCallback(async () => {
    triggerHaptic('light');
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    try {
      await fetchPublicImages(1, 20, activeFilter);
      triggerHaptic('success');
    } catch (error) {
      console.error('Failed to refresh community images:', error);
      triggerHaptic('error');
      showToast('Failed to refresh community images', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPublicImages, activeFilter, triggerHaptic, showToast]);

  const handleLoadMore = useCallback(async () => {
    if (!isLoadingPublic && hasMore && publicImages.length > 0) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      try {
        const prevLength = publicImages.length;
        await fetchPublicImages(nextPage, 20, activeFilter);
        setCurrentPage(nextPage);

        // Check if we reached the end by comparing lengths after a short delay
        // to allow the store to update
        setTimeout(() => {
          const newLength = useImageStore.getState().publicImages.length;
          if (newLength === prevLength) {
            setHasMore(false);
          }
        }, 100);
      } catch (error) {
        console.error('Failed to load more community images:', error);
        showToast('Failed to load more images', 'error');
      } finally {
        setLoadingMore(false);
      }
    }
  }, [
    isLoadingPublic,
    hasMore,
    publicImages.length,
    currentPage,
    fetchPublicImages,
    activeFilter,
    showToast,
  ]);

  // const handleFilterChange = useCallback(
  //   async (newFilter: FilterType) => {
  //     if (newFilter === activeFilter) {
  //       return;
  //     }

  //     triggerHaptic('selection');
  //     setActiveFilter(newFilter);
  //     setCurrentPage(1);
  //     setHasMore(true);

  //     try {
  //       await fetchPublicImages(1, 20, newFilter);
  //     } catch (error) {
  //       console.error('Failed to fetch images with new filter:', error);
  //       showToast('Failed to load images', 'error');
  //     }
  //   },
  //   [activeFilter, fetchPublicImages, triggerHaptic, showToast],
  // );

  const calculateImageHeight = (item: GeneratedImage) => {
    // Use actual aspect ratio if available
    if (item.width && item.height) {
      const calculatedHeight = COLUMN_WIDTH / (item.width / item.height);
      console.log(
        `Image ${item.id}: ${item.width}x${item.height} -> height: ${calculatedHeight}`,
      );
      return calculatedHeight;
    }

    // Use aspectRatio field if available
    if (item.aspectRatio) {
      try {
        const parts = item.aspectRatio.split(':');
        if (parts.length === 2) {
          const width = parseFloat(parts[0]);
          const height = parseFloat(parts[1]);
          if (!isNaN(width) && !isNaN(height) && height > 0) {
            const calculatedHeight = COLUMN_WIDTH / (width / height);
            console.log(
              `Image ${item.id}: ratio ${item.aspectRatio} -> height: ${calculatedHeight}`,
            );
            return calculatedHeight;
          }
        }
      } catch (error) {
        console.error('Error parsing aspect ratio:', error);
      }
    }

    // Default aspect ratio
    const aspectRatio = 0.75; // Default 3:4 aspect ratio
    const defaultHeight = COLUMN_WIDTH / aspectRatio;
    console.log(`Image ${item.id}: using default height: ${defaultHeight}`);
    return defaultHeight;
  };

  const renderImageItem = ({item}: {item: GeneratedImage}) => {
    const imageHeight = calculateImageHeight(item);

    return (
      <View
        className="rounded-xl overflow-hidden mb-3"
        style={{width: COLUMN_WIDTH}}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setSelectedImage(item);
          }}
          activeOpacity={0.9}
          accessible={true}
          accessibilityLabel={`Community image ${item.id}`}
          accessibilityRole="button">
          <FastImage
            source={{uri: item.imageUrl}}
            className="rounded-xl"
            style={{
              width: COLUMN_WIDTH,
              height: imageHeight,
              backgroundColor: theme.surface,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />

          {/* Image overlay with basic info */}
          <View
            className="absolute bottom-0 left-0 right-0 p-3"
            style={{backgroundColor: theme.surface + 'df'}}>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <UserAvatar
                  size={18}
                  userName={item.userName || 'Anonymous'}
                  userAvatar={item.userAvatar}
                  backgroundColor={theme.primary}
                  textColor="#ffffff"
                />
                <Text
                  className="text-sm font-semibold ml-1.5"
                  style={{color: theme.text}}>
                  {item.userName || 'Anonymous'}
                </Text>
              </View>

              {/* Favorite count */}
              {(item.favoriteCount || 0) > 0 && (
                <View className="flex-row items-center">
                  <HeartIcon size={14} color="#FF6B6B" fill="#FF6B6B" />
                  <Text
                    className="text-sm font-medium ml-1"
                    style={{color: theme.text}}>
                    {item.favoriteCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Favorite indicator */}
          {item.isFavorite && (
            <View className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-xl p-1">
              <HeartIcon size={16} color="#FF6B6B" fill="#FF6B6B" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon={<CommunityIcon size={64} color={theme.secondaryText} />}
      title="No Community Images"
      description={
        searchQuery
          ? 'No images found matching your search. Try different keywords or clear your search.'
          : 'Community images will appear here when users share their creations.'
      }
    />
  );

  return (
    <View className="flex-1" style={{backgroundColor: theme.background}}>
      {/* Header */}
      <Animated.View
        className="mt-10 px-5 gap-4"
        style={{backgroundColor: theme.background, opacity: fadeAnim}}>
        <Text
          className="text-3xl font-bold text-center"
          style={{color: theme.text}}>
          {strings.community.title}
        </Text>
        {/* Search Bar */}
        <Animated.View
          className="flex-row items-center px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: theme.surface,
            transform: [{scale: searchScale}],
          }}>
          <SearchIcon size={20} color={theme.secondaryText} />
          <TextInput
            className="flex-1 ml-3 text-base"
            style={{color: theme.text}}
            placeholder={strings.gallery.searchAll}
            placeholderTextColor={theme.secondaryText}
            value={searchQuery}
            onChangeText={text => {
              if (text.length === 1 && searchQuery.length === 0) {
                triggerHaptic('light');
                animatePress(searchScale, 100);
              }
              setSearchQuery(text);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setSearchQuery('');
              }}
              className="p-1"
              accessible={true}
              accessibilityLabel="Clear search"
              accessibilityRole="button">
              <CloseIcon size={16} color={theme.secondaryText} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filter Tabs */}
        {/* <View
          className="flex-row bg-opacity-50 rounded-2xl p-1"
          style={{backgroundColor: theme.surface}}>
          {FILTER_OPTIONS.map(filter => {
            const isActive = activeFilter === filter.id;
            const buttonBg = isActive ? theme.primary : 'transparent';
            const textColor = isActive ? '#ffffff' : theme.text;

            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => handleFilterChange(filter.id)}
                className={`flex-1 py-3 px-4 rounded-xl ${
                  isActive ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: buttonBg,
                }}
                accessible={true}
                accessibilityLabel={`Filter by ${filter.label}`}
                accessibilityRole="button">
                <Text
                  className={`text-center font-semibold ${
                    isActive ? 'text-white' : ''
                  }`}
                  style={{
                    color: textColor,
                  }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View> */}
      </Animated.View>

      {/* Images Grid */}
      {isLoadingPublic && filteredImages.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-base mt-4" style={{color: theme.secondaryText}}>
            Loading community images...
          </Text>
        </View>
      ) : filteredImages.length > 0 ? (
        <MasonryFlashList
          data={filteredImages}
          keyExtractor={(item, index) =>
            `community-${item.id || 'temp'}-${index}`
          }
          numColumns={NUM_COLUMNS}
          renderItem={renderImageItem}
          estimatedItemSize={200}
          className="rounded-3xl"
          contentContainerStyle={{paddingHorizontal: SPACING}}
          contentContainerClassName="pb-24 pt-6"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-5 items-center">
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        renderEmptyState()
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onImageDeleted={() => {
            // Refresh the public images list when an image is deleted
            setSelectedImage(null);
            handleRefresh();
          }}
          onToggleFavorite={async () => {
            if (selectedImage) {
              const success = await toggleFavorite(selectedImage.id);
              if (success) {
                // Update the selected image to reflect the new favorite status
                setSelectedImage(prev =>
                  prev ? {...prev, isFavorite: !prev.isFavorite} : null,
                );
                // Refresh the images list to get updated data
                handleRefresh();
              }
            }
          }}
        />
      )}
    </View>
  );
};

export default CommunityScreen;
