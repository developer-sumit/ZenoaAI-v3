import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MasonryFlashList } from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';

import { theme } from '@src/theme/Theme';
import { useThemeStore } from '@src/store/themeStore';
import { useAuthStore } from '@src/store/authStore';
import { imageService } from '@src/services/imageService';
import { GeneratedImage } from '@src/types';
import ImageViewer from '@src/components/ImageViewer';
import Toast from 'react-native-toast-message';
import Icon from '@src/components/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const SPACING = 12; // Spacing between columns
// Total spacing (outer edges + between columns)
const TOTAL_SPACING = SPACING * (NUM_COLUMNS + 1);
const COLUMN_WIDTH = (SCREEN_WIDTH - TOTAL_SPACING) / NUM_COLUMNS;

const GalleryScreen = () => {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const colors = isDark ? theme.dark : theme.light;

  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null,
  );

  // Load images when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchUserImages();
      }
    }, [user?.id]),
  );

  const fetchUserImages = async () => {
    if (!user?.id) { return; }

    try {
      setLoading(true);
      const userImages = await imageService.getUserImages(user.id);
      // Type cast or transform the data to match GeneratedImage type
      setImages(userImages as unknown as GeneratedImage[]);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error fetching images',
        text2: 'Please try again later',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserImages();
  };

  // Calculate dimensions for each image based on aspect ratio
  const getItemDimensions = (item: GeneratedImage) => {
    try {
      // Extract width and height from the aspect ratio
      const [width, height] = item.aspectRatio.sizes[
        item.aspectRatio.size || 'medium'
      ]
        .split('x')
        .map(Number);

      // Calculate aspect ratio and dimensions
      const aspectRatio = height / width;
      const imageHeight = COLUMN_WIDTH * aspectRatio;

      return {
        width: COLUMN_WIDTH,
        height: imageHeight,
        aspectRatio,
      };
    } catch (error) {
      // Fallback dimensions if there's an issue with the aspect ratio
      return {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH,
        aspectRatio: 1,
      };
    }
  };

  // Prepare data for better performance with MasonryFlashList
  const preparedData = useMemo(() => {
    return images.map(image => ({
      ...image,
      dimensions: getItemDimensions(image),
    }));
  }, [images]);

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: GeneratedImage & {
        dimensions: { width: number; height: number; aspectRatio: number };
      };
    }) => (
      <TouchableOpacity
        className="mb-3"
        onPress={() => setSelectedImage(item)}>
        <View
          className="overflow-hidden rounded-[20px]"
          style={{
            width: item.dimensions.width,
            height: item.dimensions.height,
            backgroundColor: '#f0f0f0',
          }}>
          <FastImage
            source={{ uri: item.uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={FastImage.resizeMode.cover}
          />
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  // Empty state when no images are available
  const EmptyState = useCallback(
    () => (
      <View className="flex-1 justify-center items-center px-8">
        <Icon name="photo-library" size={60} color={colors.primary} />
        <Text className="text-xl font-bold mt-4 mb-2" style={{ color: colors.text }}>
          No images yet
        </Text>
        <Text className="text-base text-center" style={{ color: colors.secondaryText }}>
          Images you generate will appear here
        </Text>
      </View>
    ),
    [colors],
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          Gallery
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-base" style={{ color: colors.text }}>
            Loading your images...
          </Text>
        </View>
      ) : images.length === 0 ? (
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
          extraData={isDark}
          ListEmptyComponent={EmptyState}
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

export default GalleryScreen;