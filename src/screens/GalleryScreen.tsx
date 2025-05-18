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
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MasonryFlashList} from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import {MMKV} from 'react-native-mmkv';

import {theme} from '@src/theme/Theme';
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {imageService} from '@src/services/imageService';
import {GeneratedImage} from '@src/types';
import ImageViewer from '@src/components/ImageViewer';
import PhotoLibraryIcon from '@src/assets/icons/PhotoLibraryIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import SearchIcon from '@src/assets/icons/SearchIcon';
import HeartIcon from '@src/assets/icons/HeartIcon';
import BookmarkIcon from '@src/assets/icons/BookmarkIcon';
import {useToast} from '@masumdev/rn-toast';

// Initialize MMKV storage
export const storage = new MMKV();

// Constants
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 2;
const SPACING = 12;
const TOTAL_SPACING = SPACING * (NUM_COLUMNS + 1);
const COLUMN_WIDTH = (SCREEN_WIDTH - TOTAL_SPACING) / NUM_COLUMNS;
const FAVORITES_STORAGE_KEY = 'zenoa_favorite_images';

// Extended image type with favorites
interface ImageWithFavorite extends GeneratedImage {
  isFavorite: boolean;
}

const GalleryScreen = () => {
  const {isDark} = useThemeStore();
  const {user} = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;
  const {showToast} = useToast();

  // State
  const [images, setImages] = useState<ImageWithFavorite[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageWithFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageWithFavorite | null>(
    null,
  );

  // Search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  // Animation for tab indicator
  const tabIndicatorAnim = useState(new Animated.Value(0))[0];

  // Load favorites from storage when component mounts
  useEffect(() => {
    loadFavorites();
  }, []);

  // Load user's images when focused
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchUserImages();
      }
    }, [user?.id]),
  );

  // Filter images based on current filters and search
  useFocusEffect(
    useCallback(() => {
      if (images.length > 0) {
        let filtered = [...images];

        // Apply favorites filter if on favorites tab
        if (activeTab === 'favorites') {
          filtered = filtered.filter(img => img.isFavorite);
          console.log(`Filtered to ${filtered.length} favorite images`);
        }

        // Apply search query filter
        if (searchQuery) {
          filtered = filtered.filter(
            img =>
              img.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
              img.styles.some(style =>
                style.toLowerCase().includes(searchQuery.toLowerCase()),
              ),
          );
        }

        // Apply style filter
        if (selectedFilter) {
          filtered = filtered.filter(img =>
            img.styles.includes(selectedFilter),
          );
        }

        setFilteredImages(filtered);
      } else {
        setFilteredImages([]);
      }
    }, [images, searchQuery, selectedFilter, activeTab]),
  );

  // Load favorites from MMKV
  const loadFavorites = () => {
    try {
      const favoritesJson = storage.getString(FAVORITES_STORAGE_KEY);
      return favoritesJson ? JSON.parse(favoritesJson) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  };

  // Save favorites to MMKV
  const saveFavorites = (favoriteIds: string[]) => {
    try {
      storage.set(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // Replace the fetchUserImages function
  const fetchUserImages = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('Fetching images for user:', user.id);

      // Get images from service
      const userImages = await imageService.getUserImages(user.id);
      console.log(`Fetched ${userImages.length} images`);

      // Load local favorites
      const localFavoriteIds = loadFavorites();
      console.log(
        `Loaded ${localFavoriteIds.length} local favorites:`,
        localFavoriteIds,
      );

      // Map to include isFavorite property from Firestore or local storage
      const imagesWithFavorites = (userImages as GeneratedImage[]).map(img => {
        const imageId = `${img.timestamp}_${img.seed}`;

        // Check if the image has the isFavorite field from Firestore
        const isFavoriteInFirestore = img.isFavorite === true;

        // Check if in local favorites
        const isInLocalFavorites = localFavoriteIds.includes(imageId);

        // Use Firestore value but fall back to local storage if not available
        const isFavorite = isFavoriteInFirestore || isInLocalFavorites;

        console.log(
          `Image ${imageId}: Firestore=${isFavoriteInFirestore}, Local=${isInLocalFavorites}, Final=${isFavorite}`,
        );

        return {
          ...img,
          isFavorite: isFavorite,
        };
      });

      // Update local storage with favorites from combined sources
      const favoriteIds = imagesWithFavorites
        .filter(img => img.isFavorite)
        .map(img => `${img.timestamp}_${img.seed}`);

      console.log(
        `Saving ${favoriteIds.length} favorites to local storage:`,
        favoriteIds,
      );
      saveFavorites(favoriteIds);

      setImages(imagesWithFavorites);
      setFilteredImages(imagesWithFavorites);
    } catch (error) {
      console.error('Failed to load images:', error);
      showToast('Error fetching images', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserImages();
  };

  // Replace the existing toggleFavorite function with this enhanced version
  const toggleFavorite = async (image: ImageWithFavorite) => {
    if (!user?.id) {
      showToast('Please log in to favorite images', 'error');
      return;
    }

    try {
      const imageId = `${image.timestamp}_${image.seed}`;
      const newFavoriteState = !image.isFavorite;

      console.log(
        `Toggling favorite for image ${imageId} to ${newFavoriteState}`,
      );

      // Update UI immediately for responsiveness
      setImages(prevImages =>
        prevImages.map(img =>
          img.timestamp === image.timestamp && img.seed === image.seed
            ? {...img, isFavorite: newFavoriteState}
            : img,
        ),
      );

      // Update filtered images as well to ensure UI consistency
      setFilteredImages(prevImages =>
        prevImages.map(img =>
          img.timestamp === image.timestamp && img.seed === image.seed
            ? {...img, isFavorite: newFavoriteState}
            : img,
        ),
      );

      // Update selected image if needed
      if (
        selectedImage &&
        selectedImage.timestamp === image.timestamp &&
        selectedImage.seed === image.seed
      ) {
        setSelectedImage({...selectedImage, isFavorite: newFavoriteState});
      }

      // Get existing local favorites
      const favoriteIds = loadFavorites();
      let newFavorites: string[];

      // Update local favorites list
      if (newFavoriteState) {
        // Add to favorites if not already in the list
        if (!favoriteIds.includes(imageId)) {
          newFavorites = [...favoriteIds, imageId];
          console.log(`Added ${imageId} to local favorites`);
        } else {
          newFavorites = favoriteIds;
          console.log(`${imageId} already in local favorites`);
        }
      } else {
        // Remove from favorites
        newFavorites = favoriteIds.filter((id: string) => id !== imageId);
        console.log(`Removed ${imageId} from local favorites`);
      }

      // Save to local storage
      saveFavorites(newFavorites);

      // Update in Firestore
      console.log(
        `Updating favorite status in Firestore to ${newFavoriteState}`,
      );
      const success = await imageService.toggleFavoriteStatus(
        user.id,
        imageId,
        newFavoriteState,
      );

      if (success) {
        showToast(
          newFavoriteState ? 'Added to favorites' : 'Removed from favorites',
          'success',
        );
      } else {
        showToast('Failed to update favorite status', 'error');
        // Revert UI changes on failure
        setImages(prevImages =>
          prevImages.map(img =>
            img.timestamp === image.timestamp && img.seed === image.seed
              ? {...img, isFavorite: !newFavoriteState}
              : img,
          ),
        );

        // Update filtered images on failure too
        setFilteredImages(prevImages =>
          prevImages.map(img =>
            img.timestamp === image.timestamp && img.seed === image.seed
              ? {...img, isFavorite: !newFavoriteState}
              : img,
          ),
        );

        if (
          selectedImage &&
          selectedImage.timestamp === image.timestamp &&
          selectedImage.seed === image.seed
        ) {
          setSelectedImage({...selectedImage, isFavorite: !newFavoriteState});
        }
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
      showToast('Error updating favorites', 'error');
    }
  };

  // Switch between All and Favorites tabs
  const switchTab = (tab: 'all' | 'favorites') => {
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
  };

  // Extract unique styles from all images for filtering
  const uniqueStyles = useCallback(() => {
    const styles = new Set<string>();
    images.forEach(img => {
      img.styles.forEach(style => styles.add(style));
    });
    return Array.from(styles);
  }, [images]);

  // Calculate dimensions for each image based on aspect ratio
  const getItemDimensions = (item: ImageWithFavorite) => {
    try {
      const [width, height] = item.aspectRatio.sizes[
        item.aspectRatio.size || 'medium'
      ]
        .split('x')
        .map(Number);

      const aspectRatio = height / width;
      const imageHeight = COLUMN_WIDTH * aspectRatio;

      return {
        width: COLUMN_WIDTH,
        height: imageHeight,
        aspectRatio,
      };
    } catch (error) {
      return {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH,
        aspectRatio: 1,
      };
    }
  };

  // Prepare image data with dimensions
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
      item: ImageWithFavorite & {
        dimensions: {width: number; height: number; aspectRatio: number};
      };
    }) => (
      <View className="mb-3">
        {/* Image Card */}
        <TouchableOpacity
          onPress={() => setSelectedImage(item)}
          accessible={true}
          accessibilityLabel={`Image of ${item.prompt}`}
          accessibilityHint="Double tap to view image details">
          <View
            className="overflow-hidden rounded-2xl"
            style={{
              width: item.dimensions.width,
              height: item.dimensions.height,
              backgroundColor: colors.surface,
            }}>
            <FastImage
              source={{uri: item.uri}}
              style={{width: '100%', height: '100%'}}
              resizeMode={FastImage.resizeMode.cover}
            />

            {/* Image Overlay for Style Tag */}
            <View
              className="absolute bottom-0 left-0 right-0 p-2 flex-row justify-between items-center"
              style={{backgroundColor: 'rgba(0,0,0,0.3)'}}>
              {/* Style Tag */}
              {item.styles.length > 0 && (
                <Text className="text-xs text-white">
                  {item.styles[0]}
                  {item.styles.length > 1 ? ` +${item.styles.length - 1}` : ''}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Favorite Button - separate touchable for better interaction */}
        <TouchableOpacity
          onPress={() => toggleFavorite(item)}
          className="absolute top-2 right-2 p-2.5 rounded-full"
          style={{backgroundColor: 'rgba(0,0,0,0.4)'}}
          hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
          accessible={true}
          accessibilityLabel={
            item.isFavorite ? 'Remove from favorites' : 'Add to favorites'
          }
          accessibilityRole="button">
          <HeartIcon
            size={20}
            color="white"
            fill={item.isFavorite ? '#FF4B8C' : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    ),
    [colors, toggleFavorite],
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
              No favorites yet
            </Text>
            <Text
              className="text-base text-center"
              style={{color: colors.secondaryText}}>
              Tap the heart icon on images you want to save as favorites
            </Text>
            <TouchableOpacity
              className="mt-6 py-2.5 px-6 rounded-xl"
              style={{backgroundColor: colors.primary}}
              onPress={() => switchTab('all')}
              accessible={true}
              accessibilityLabel="View all images">
              <Text className="text-white font-medium">View All Images</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <PhotoLibraryIcon size={60} color={colors.primary} />
            <Text
              className="text-xl font-bold mt-4 mb-2"
              style={{color: colors.text}}>
              {searchQuery || selectedFilter
                ? 'No matching images'
                : 'No images yet'}
            </Text>
            <Text
              className="text-base text-center"
              style={{color: colors.secondaryText}}>
              {searchQuery || selectedFilter
                ? 'Try adjusting your search or filters'
                : 'Images you generate will appear here'}
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
                accessibilityLabel="Clear all filters">
                <Text className="text-white font-medium">Clear Filters</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    ),
    [colors, searchQuery, selectedFilter, activeTab, switchTab],
  );

  // Animation for tab indicator position
  const translateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH / 2 - 32], // Adjust for padding
  });

  return (
    <View className="flex-1" style={{backgroundColor: colors.background}}>
      {/* Header with persistent search */}
      <View className="pt-6 pb-2 px-6">
        <Text className="text-2xl font-bold mb-4" style={{color: colors.text}}>
          Gallery
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
              accessibilityLabel="All images tab">
              <Text
                className="text-center font-medium"
                style={{
                  color:
                    activeTab === 'all' ? colors.primary : colors.secondaryText,
                }}>
                All ({stats.total})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3"
              onPress={() => switchTab('favorites')}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{selected: activeTab === 'favorites'}}
              accessibilityLabel="Favorites tab">
              <Text
                className="text-center font-medium"
                style={{
                  color:
                    activeTab === 'favorites'
                      ? colors.primary
                      : colors.secondaryText,
                }}>
                Favorites ({stats.favorites})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Animated indicator */}
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              width: SCREEN_WIDTH / 2 - 32, // Adjust for padding
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
                ? 'Search in favorites...'
                : 'Search by prompt or style...'
            }
            placeholderTextColor={colors.secondaryText}
            className="flex-1 py-3 h-14"
            style={{color: colors.text}}
            accessible={true}
            accessibilityLabel="Search images"
            accessibilityHint="Enter text to search images by prompt or style"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="px-3 justify-center"
              accessible={true}
              accessibilityLabel="Clear search">
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
                    ? 'Double tap to remove filter'
                    : 'Double tap to filter by this style'
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
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3" style={{color: colors.text}}>
            Loading images...
          </Text>
        </View>
      ) : filteredImages.length === 0 ? (
        <EmptyState />
      ) : (
        <MasonryFlashList
          data={preparedData}
          keyExtractor={item => `${item.timestamp}_${item.seed}`}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          estimatedItemSize={250}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: SPACING,
            paddingHorizontal: SPACING,
          }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          extraData={[isDark, searchQuery, selectedFilter, activeTab]}
        />
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onImageDeleted={fetchUserImages}
          onToggleFavorite={() => toggleFavorite(selectedImage)}
        />
      )}
    </View>
  );
};

export default GalleryScreen;
