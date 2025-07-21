import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MasonryFlashList} from '@shopify/flash-list';
import {useToast} from '@masumdev/rn-toast';

import {useTheme} from '@src/store/themeStore';
import {useImageStore} from '@src/store/imageStore';
import {GeneratedImage} from '@src/types/image';
import ImageCard from '@src/components/ImageCard';
import ImageViewer from '@src/components/ImageViewer';
import EmptyState from '@src/components/EmptyState';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';
import {useAnimations} from '@src/hooks/useAnimations';
import {
  COMMUNITY_FILTER_OPTIONS,
  DEFAULT_COMMUNITY_FILTER,
} from '@src/constants';

// Icons
import SearchIcon from '@src/assets/icons/SearchIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import CommunityIcon from '@src/assets/icons/CommunityIcon';
import TuneIcon from '@src/assets/icons/TuneIcon';

const NUM_COLUMNS = 2;
const SPACING = 12;

type FilterType = (typeof COMMUNITY_FILTER_OPTIONS)[number]['id'];

const CommunityScreen = () => {
  const {theme} = useTheme();
  const strings = useStrings();
  const {showToast} = useToast();
  const {triggerHaptic} = useHaptics();
  const {animatePress} = useAnimations();
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
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    DEFAULT_COMMUNITY_FILTER,
  );

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

      // Apply search query filter - search by prompt, or user name
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(img => {
          const prompt = img.prompt || '';
          const userName = img.userName || '';

          return (
            prompt.toLowerCase().includes(query) ||
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
      await fetchPublicImages(1, 20, activeFilter);
      triggerHaptic('success');
    } catch (error) {
      console.error('Failed to refresh community images:', error);
      triggerHaptic('error');
      showToast('Failed to refresh community images', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPublicImages, activeFilter]);

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
  ]);

  const renderItem = useCallback(
    ({item}: {item: GeneratedImage}) => {
      return <ImageCard image={item} onPress={() => setSelectedImage(item)} />;
    },
    [publicImages, setSelectedImage],
  );

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
          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => setShowFilterMenu(!showFilterMenu)}
            className="p-3 ml-2 rounded-xl"
            accessible={true}
            accessibilityLabel="Open filter menu"
            accessibilityRole="button"
            style={{backgroundColor: theme.primary + '22'}}>
            <TuneIcon size={20} color={theme.primary} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Filter Menu Modal */}
      {showFilterMenu && (
        <View
          className="absolute top-40 right-5 p-2.5 rounded-2xl bg-opacity-50 flex-1 justify-center items-center z-50"
          style={{
            backgroundColor: theme.surface,
            elevation: 5,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 10,
          }}>
          {COMMUNITY_FILTER_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              onPress={() => {
                triggerHaptic('selection');
                setShowFilterMenu(false);
                setActiveFilter(option.id);
                setCurrentPage(1);
                setHasMore(true);
                fetchPublicImages(1, 20, option.id);
              }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                backgroundColor:
                  activeFilter === option.id
                    ? theme.primary + '22'
                    : 'transparent',
                borderRadius: 12,
                marginVertical: 2,
              }}
              accessible={true}
              accessibilityLabel={`Filter by ${option.label}`}
              accessibilityRole="button">
              <Text
                style={{
                  color:
                    activeFilter === option.id ? theme.primary : theme.text,
                  fontWeight: activeFilter === option.id ? 'bold' : 'normal',
                  fontSize: 16,
                }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
          renderItem={renderItem}
          estimatedItemSize={200}
          removeClippedSubviews={true}
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
