import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MasonryFlashList} from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import {useToast} from '@masumdev/rn-toast';

import {theme} from '@src/theme/Theme';
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {useImageStore} from '@src/store/imageStore';
import {GeneratedImage} from '@src/types';
import {useStrings} from '@src/hooks/useStrings';
import ImageViewer from '@src/components/ImageViewer';

// Icons
import PhotoLibraryIcon from '@src/assets/icons/PhotoLibraryIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import SearchIcon from '@src/assets/icons/SearchIcon';
import HeartIcon from '@src/assets/icons/HeartIcon';
import BookmarkIcon from '@src/assets/icons/BookmarkIcon';

// Constants
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 2;
const SPACING = 12;
const TOTAL_SPACING = SPACING * (NUM_COLUMNS + 1);
const COLUMN_WIDTH = (SCREEN_WIDTH - TOTAL_SPACING) / NUM_COLUMNS;

const GalleryScreen = () => {
  const strings = useStrings();
  const {isDark} = useThemeStore();
  const {user} = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;
  const {showToast} = useToast();

  // Image store
  const {
    images,
    isLoading,
    fetchImages,
    toggleFavorite: storeToggleFavorite,
  } = useImageStore();

  // Animation for tab indicator
  const tabIndicatorAnim = useState(new Animated.Value(0))[0];

  // State
  const [filteredImages, setFilteredImages] = useState<GeneratedImage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null); // Load user's images when focused - but only if we don't have any cached images
  useFocusEffect(
    useCallback(() => {
      if (user?.uid && images.length === 0) {
        console.log('Gallery: Loading images for the first time');
        fetchImages();
      } else if (user?.uid) {
        console.log('Gallery: Using cached images, count:', images.length);
      }
    }, [user?.uid, fetchImages, images.length]),
  );

  // Filter images based on search and active tab
  useEffect(() => {
    if (images.length > 0) {
      let filtered = [...images];

      // Apply favorites filter if on favorites tab
      if (activeTab === 'favorites') {
        filtered = filtered.filter(img => img.isFavorite);
      }

      // Apply search query filter - search by prompt or ID
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(img => {
          const searchablePrompt = img.originalPrompt || img.prompt || '';
          return (
            img.id.toLowerCase().includes(query) ||
            searchablePrompt.toLowerCase().includes(query) ||
            (img.finalPrompt && img.finalPrompt.toLowerCase().includes(query))
          );
        });
      }

      // Apply style filter if selected
      if (selectedFilter) {
        filtered = filtered.filter(
          img => img.styles && img.styles.includes(selectedFilter),
        );
      }

      setFilteredImages(filtered);
    } else {
      setFilteredImages([]);
    }
  }, [images, searchQuery, activeTab, selectedFilter]);

  const refreshImages = useCallback(async () => {
    setRefreshing(true);
    await fetchImages();
    setRefreshing(false);
  }, [fetchImages]);

  const handleRefresh = useCallback(() => {
    refreshImages();
  }, [refreshImages]);

  const handleToggleFavorite = useCallback(
    async (image: GeneratedImage) => {
      if (!user?.uid) {
        showToast('Please log in to favorite images', 'error');
        return;
      }

      try {
        const success = await storeToggleFavorite(image.id);

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
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        showToast('Failed to update favorite', 'error');
      }
    },
    [user?.uid, storeToggleFavorite, selectedImage, showToast],
  );

  // Switch between All and Favorites tabs
  const switchTab = useCallback(
    (tab: 'all' | 'favorites') => {
      setActiveTab(tab);
      console.log(
        `Switched to ${tab} tab, favorites count: ${
          images.filter(img => img.isFavorite).length
        }`,
      );

      // Animate tab indicator
      Animated.spring(tabIndicatorAnim, {
        toValue: tab === 'all' ? 0 : 1,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    },
    [images, tabIndicatorAnim],
  );

  // Extract unique styles from all images for filtering
  const uniqueStyles = useCallback(() => {
    const styles = new Set<string>();
    images.forEach(img => {
      if (img.styles && Array.isArray(img.styles)) {
        img.styles.forEach(style => styles.add(style));
      }
    });
    return Array.from(styles);
  }, [images]);

  // Calculate dimensions for each image based on aspect ratio
  const getItemDimensions = (item: GeneratedImage) => {
    try {
      // Use width and height from the image data with fallbacks
      const imageWidth = item.width || 512;
      const imageHeight = item.height || 512;
      const aspectRatio = imageHeight / imageWidth;
      const calculatedHeight = COLUMN_WIDTH * aspectRatio;

      // Limit extreme aspect ratios for better layout
      const minHeight = COLUMN_WIDTH * 0.5;
      const maxHeight = COLUMN_WIDTH * 2;
      const finalHeight = Math.max(
        minHeight,
        Math.min(maxHeight, calculatedHeight),
      );

      return {
        width: COLUMN_WIDTH,
        height: finalHeight,
        aspectRatio,
      };
    } catch (error) {
      console.warn('Error calculating dimensions for image:', item.id, error);
      return {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH,
        aspectRatio: 1,
      };
    }
  };

  const preparedData = React.useMemo(() => {
    return filteredImages.map(image => ({
      ...image,
      dimensions: getItemDimensions(image),
    }));
  }, [filteredImages]);

  // Calculate stats for the tabs
  const stats = useMemo(
    () => ({
      total: images.length,
      favorites: images.filter(img => img.isFavorite).length,
    }),
    [images],
  );

  // Render individual image card
  const renderItem = useCallback(
    ({
      item,
    }: {
      item: GeneratedImage & {
        dimensions: {width: number; height: number; aspectRatio: number};
      };
    }) => {
      // Get display prompt
      const displayPrompt =
        item.originalPrompt || item.prompt || 'Unknown prompt';

      return (
        <View className="mb-3">
          {/* Image Card */}
          <TouchableOpacity
            onPress={() => setSelectedImage(item)}
            accessible={true}
            accessibilityLabel={`Image generated from prompt: ${displayPrompt}`}
            accessibilityHint={strings.imageViewer.imageHint}>
            <View
              className="overflow-hidden rounded-2xl"
              style={{
                width: item.dimensions.width,
                height: item.dimensions.height,
                backgroundColor: colors.surface,
              }}>
              {item.uri ? (
                <FastImage
                  source={{uri: item.uri}}
                  style={{width: '100%', height: '100%'}}
                  resizeMode={FastImage.resizeMode.cover}
                  onError={() => {
                    console.warn('Image loading error');
                  }}
                />
              ) : (
                <View
                  className="flex-1 justify-center items-center"
                  style={{backgroundColor: colors.surface}}>
                  <PhotoLibraryIcon size={40} color={colors.secondaryText} />
                  <Text
                    className="text-xs mt-2 text-center px-2"
                    style={{color: colors.secondaryText}}>
                    Image not available
                  </Text>
                </View>
              )}

              {/* Image Overlay for Style Tag */}
              <View
                className="absolute bottom-0 left-0 right-0 p-2 flex-row justify-between items-center"
                style={{backgroundColor: 'rgba(0,0,0,0.3)'}}>
                {/* Style Tag */}
                {item.styles && item.styles.length > 0 && (
                  <Text className="text-xs text-white">
                    {item.styles[0]}
                    {item.styles.length > 1
                      ? ` +${item.styles.length - 1}`
                      : ''}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity
            onPress={() => handleToggleFavorite(item)}
            className="absolute top-2 right-2 p-2.5 rounded-full"
            style={{backgroundColor: 'rgba(0,0,0,0.4)'}}
            hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
            accessible={true}
            accessibilityLabel={
              item.isFavorite
                ? strings.imageViewer.removeFavourite
                : strings.imageViewer.addFavourite
            }
            accessibilityRole="button">
            <HeartIcon
              size={20}
              color="white"
              fill={item.isFavorite ? '#FF4B8C' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      );
    },
    [colors, handleToggleFavorite, strings],
  );

  // Empty state component
  const EmptyState = useCallback(
    () => (
      <View className="flex-1 justify-center items-center px-8">
        {activeTab === 'favorites' ? (
          <>
            <BookmarkIcon size={60} color={colors.primary} />
            <Text
              className="text-xl font-bold mt-4 mb-2"
              style={{color: colors.text}}>
              {strings.gallery.noFavorites}
            </Text>
            <Text
              className="text-base text-center"
              style={{color: colors.secondaryText}}>
              {strings.gallery.tapHeart}
            </Text>
            <TouchableOpacity
              className="mt-6 py-2.5 px-6 rounded-xl"
              style={{backgroundColor: colors.primary}}
              onPress={() => switchTab('all')}
              accessible={true}
              accessibilityLabel={strings.gallery.viewAllImages}>
              <Text className="text-white font-medium">
                {strings.gallery.viewAllImages}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <PhotoLibraryIcon size={60} color={colors.primary} />
            <Text
              className="text-xl font-bold mt-4 mb-2"
              style={{color: colors.text}}>
              {searchQuery || selectedFilter
                ? strings.gallery.noMatchingImages
                : strings.gallery.noImages}
            </Text>
            <Text
              className="text-base text-center"
              style={{color: colors.secondaryText}}>
              {searchQuery || selectedFilter
                ? strings.gallery.tryAdjusting
                : strings.gallery.imagesAppearHere}
            </Text>

            {(searchQuery || selectedFilter) && (
              <TouchableOpacity
                className="mt-6 py-2.5 px-6 rounded-xl"
                style={{backgroundColor: colors.primary}}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedFilter(null);
                }}
                accessible={true}
                accessibilityLabel={strings.gallery.clearFilters}>
                <Text className="text-white font-medium">
                  {strings.gallery.clearFilters}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    ),
    [colors, searchQuery, selectedFilter, activeTab, switchTab, strings],
  );

  // Animation for tab indicator position
  const translateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH / 2 - 32],
  });

  return (
    <View className="flex-1" style={{backgroundColor: colors.background}}>
      {/* Header with persistent search */}
      <View className="pt-6 pb-2 px-6">
        <Text className="text-2xl font-bold mb-4" style={{color: colors.text}}>
          {strings.gallery.title}
        </Text>

        {/* Tab Bar */}
        <View className="mb-4">
          <View className="flex-row border-b border-gray-200 dark:border-gray-800">
            <TouchableOpacity
              className="flex-1 py-3"
              onPress={() => switchTab('all')}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{selected: activeTab === 'all'}}
              accessibilityLabel={strings.gallery.viewAllImages}>
              <Text
                className="text-center font-medium"
                style={{
                  color:
                    activeTab === 'all' ? colors.primary : colors.secondaryText,
                }}>
                {strings.common.all} ({stats.total})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3"
              onPress={() => switchTab('favorites')}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{selected: activeTab === 'favorites'}}
              accessibilityLabel={strings.gallery.viewAllFavorites}>
              <Text
                className="text-center font-medium"
                style={{
                  color:
                    activeTab === 'favorites'
                      ? colors.primary
                      : colors.secondaryText,
                }}>
                {strings.imageViewer.favorite} ({stats.favorites})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Animated indicator */}
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              width: SCREEN_WIDTH / 2 - 32,
              height: 3,
              backgroundColor: colors.primary,
              borderRadius: 3,
              transform: [{translateX}],
              left: 0,
            }}
          />
        </View>

        {/* Search Bar */}
        <View
          className="flex-row rounded-2xl overflow-hidden mb-3"
          style={{backgroundColor: colors.surface}}>
          <View className="px-3 justify-center">
            <SearchIcon size={20} color={colors.secondaryText} />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              activeTab === 'favorites'
                ? strings.gallery.searchFavorites
                : strings.gallery.searchAll
            }
            placeholderTextColor={colors.secondaryText}
            className="flex-1 py-3 h-14"
            style={{color: colors.text}}
            accessible={true}
            accessibilityLabel={strings.gallery.searchImages}
            accessibilityHint={strings.gallery.searchHint}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="px-3 justify-center"
              accessible={true}
              accessibilityLabel={strings.gallery.clearSearch}>
              <CloseIcon size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Style Filters */}
        {images.length > 0 && uniqueStyles().length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pb-2"
            contentContainerStyle={{paddingHorizontal: 2}}>
            {uniqueStyles().map(style => (
              <TouchableOpacity
                key={style}
                onPress={() => {
                  if (selectedFilter === style) {
                    setSelectedFilter(null);
                  } else {
                    setSelectedFilter(style);
                  }
                }}
                className="mr-2 py-2 px-3 rounded-full"
                style={{
                  backgroundColor:
                    selectedFilter === style ? colors.primary : colors.surface,
                }}
                accessible={true}
                accessibilityLabel={`Filter by ${style} style`}
                accessibilityState={{selected: selectedFilter === style}}
                accessibilityHint={
                  selectedFilter === style
                    ? strings.gallery.tapToRemoveFilter
                    : strings.gallery.tapToApplyFilter
                }>
                <Text
                  style={{
                    color:
                      selectedFilter === style ? 'white' : colors.secondaryText,
                  }}>
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Gallery Content */}
      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3" style={{color: colors.text}}>
            {strings.imageViewer.loading}
          </Text>
        </View>
      ) : filteredImages.length === 0 ? (
        <EmptyState />
      ) : (
        <MasonryFlashList
          data={preparedData}
          keyExtractor={item => item.id}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          estimatedItemSize={250}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: SPACING,
            paddingHorizontal: SPACING,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          extraData={[isDark, searchQuery, selectedFilter, activeTab]}
        />
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onImageDeleted={fetchImages}
          onToggleFavorite={() => handleToggleFavorite(selectedImage)}
        />
      )}
    </View>
  );
};

export default GalleryScreen;
