import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  TextInput,
  RefreshControl,
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
import {useStrings} from '@src/hooks/useStrings';

// Icons
import SearchIcon from '@src/assets/icons/SearchIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import CommunityIcon from '@src/assets/icons/CommunityIcon';
import PersonIcon from '@src/assets/icons/PersonIcon';
import HeartIcon from '@src/assets/icons/HeartIcon';

// Constants
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 2;
const SPACING = 12;
const TOTAL_SPACING = SPACING * (NUM_COLUMNS + 1);
const COLUMN_WIDTH = (SCREEN_WIDTH - TOTAL_SPACING) / NUM_COLUMNS;

const CommunityScreen = () => {
  const {theme} = useTheme();
  const {showToast} = useToast();
  const strings = useStrings();
  const {publicImages, isLoadingPublic, fetchPublicImages, toggleFavorite} =
    useImageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredImages, setFilteredImages] = useState<GeneratedImage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (publicImages.length === 0) {
        fetchPublicImages(1, 20);
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
          const searchablePrompt = img.originalPrompt || img.prompt || '';
          const finalPrompt = img.finalPrompt || '';
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
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    try {
      await fetchPublicImages(1, 20);
    } catch (error) {
      console.error('Failed to refresh community images:', error);
      showToast('Failed to refresh community images', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPublicImages, showToast]);

  const handleLoadMore = useCallback(async () => {
    if (!isLoadingPublic && hasMore && publicImages.length > 0) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      try {
        const prevLength = publicImages.length;
        await fetchPublicImages(nextPage, 20);
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
    showToast,
  ]);

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
    if (item.aspectRatio?.ratio) {
      try {
        const parts = item.aspectRatio.ratio.split(':');
        if (parts.length === 2) {
          const width = parseFloat(parts[0]);
          const height = parseFloat(parts[1]);
          if (!isNaN(width) && !isNaN(height) && height > 0) {
            const calculatedHeight = COLUMN_WIDTH / (width / height);
            console.log(
              `Image ${item.id}: ratio ${item.aspectRatio.ratio} -> height: ${calculatedHeight}`,
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
          onPress={() => setSelectedImage(item)}
          activeOpacity={0.9}
          accessible={true}
          accessibilityLabel={`Community image ${item.id}`}
          accessibilityRole="button">
          <FastImage
            source={{uri: item.uri}}
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
            style={{backgroundColor: theme.surface + '90'}}>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <PersonIcon size={16} color={theme.text} />{' '}
                <Text
                  className="text-xs font-medium ml-1.5"
                  style={{color: theme.text}}>
                  {item.userName || 'Anonymous'}
                </Text>
              </View>
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
      <View
        className="mt-10 px-5 gap-4"
        style={{backgroundColor: theme.background}}>
        <Text
          className="text-3xl font-bold text-center"
          style={{color: theme.text}}>
          {strings.community.title}
        </Text>

        {/* Search Bar */}
        <View
          className="flex-row items-center px-4 py-3 rounded-2xl"
          style={{backgroundColor: theme.surface}}>
          <SearchIcon size={20} color={theme.secondaryText} />
          <TextInput
            className="flex-1 ml-3 text-base"
            style={{color: theme.text}}
            placeholder={strings.gallery.searchAll}
            placeholderTextColor={theme.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="p-1"
              accessible={true}
              accessibilityLabel="Clear search"
              accessibilityRole="button">
              <CloseIcon size={16} color={theme.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
          numColumns={NUM_COLUMNS}
          renderItem={renderImageItem}
          estimatedItemSize={200}
          className="rounded-3xl"
          contentContainerStyle={{
            paddingHorizontal: SPACING,
            paddingBottom: 100,
            paddingTop: 15,
          }}
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
