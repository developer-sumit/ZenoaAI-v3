import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MasonryFlashList} from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';

import {theme} from '@src/theme/Theme';
import {useThemeStore} from '@src/store/themeStore';
import {useAuthStore} from '@src/store/authStore';
import {imageService} from '@src/services/imageService';
import {GeneratedImage} from '@src/types';
import ImageViewer from '@src/components/ImageViewer';
import PhotoLibraryIcon from '@src/assets/icons/PhotoLibraryIcon';
import CloseIcon from '@src/assets/icons/CloseIcon';
import SearchIcon from '@src/assets/icons/SearchIcon';
import {useToast} from '@masumdev/rn-toast';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 2;
const SPACING = 12;
const TOTAL_SPACING = SPACING * (NUM_COLUMNS + 1);
const COLUMN_WIDTH = (SCREEN_WIDTH - TOTAL_SPACING) / NUM_COLUMNS;

const GalleryScreen = () => {
  const {isDark} = useThemeStore();
  const {user} = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;
  const {showToast} = useToast();

  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );

  // Search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchUserImages();
      }
    }, [user?.id]),
  );

  useFocusEffect(
    useCallback(() => {
      // Filter images based on search query and selected filter
      if (images.length > 0) {
        let filtered = [...images];

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
    }, [images, searchQuery, selectedFilter]),
  );

  const fetchUserImages = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userImages = await imageService.getUserImages(user.id);
      const typedImages = userImages as GeneratedImage[];
      setImages(typedImages);
      setFilteredImages(typedImages);
    } catch (error) {
      console.error('Failed to load images:', error);
      showToast('Error fetching images', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserImages();
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
  const getItemDimensions = (item: GeneratedImage) => {
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

  const preparedData = React.useMemo(() => {
    return filteredImages.map(image => ({
      ...image,
      dimensions: getItemDimensions(image),
    }));
  }, [filteredImages]);

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: GeneratedImage & {
        dimensions: {width: number; height: number; aspectRatio: number};
      };
    }) => (
      <TouchableOpacity
        className="mb-3"
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

          {/* Show first style tag on image */}
          {item.styles.length > 0 && (
            <View
              className="absolute bottom-2 left-2 px-2 py-1 rounded-md"
              style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
              <Text className="text-xs text-white">
                {item.styles[0]}
                {item.styles.length > 1 ? ` +${item.styles.length - 1}` : ''}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    ),
    [colors],
  );

  const EmptyState = useCallback(
    () => (
      <View className="flex-1 justify-center items-center px-8">
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
      </View>
    ),
    [colors, searchQuery, selectedFilter],
  );

  return (
    <View className="flex-1" style={{backgroundColor: colors.background}}>
      {/* Header with persistent search */}
      <View className="pt-6 pb-2 px-6">
        <Text className="text-2xl font-bold mb-4" style={{color: colors.text}}>
          Gallery
        </Text>

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
            placeholder="Search by prompt or style..."
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
          extraData={[isDark, searchQuery, selectedFilter]}
        />
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onImageDeleted={fetchUserImages}
        />
      )}
    </View>
  );
};

export default GalleryScreen;
