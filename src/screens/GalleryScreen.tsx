import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
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
import Toast from 'react-native-toast-message';
import Icon from '@src/components/Icon';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 2;
const SPACING = 12; // Spacing between columns
// Total spacing (outer edges + between columns)
const TOTAL_SPACING = SPACING * (NUM_COLUMNS + 1);
const COLUMN_WIDTH = (SCREEN_WIDTH - TOTAL_SPACING) / NUM_COLUMNS;

const GalleryScreen = () => {
  const {isDark} = useThemeStore();
  const {user} = useAuthStore();
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
    if (!user?.id) return;

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
        dimensions: {width: number; height: number; aspectRatio: number};
      };
    }) => (
      <TouchableOpacity
        style={styles.imageWrapper}
        onPress={() => setSelectedImage(item)}>
        <View
          style={[
            styles.imageContainer,
            {
              width: item.dimensions.width,
              height: item.dimensions.height,
            },
          ]}>
          <FastImage
            source={{uri: item.uri}}
            style={styles.image}
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
      <View style={styles.emptyContainer}>
        <Icon name="photo-library" size={60} color={colors.primary} />
        <Text style={[styles.emptyTitle, {color: colors.text}]}>
          No images yet
        </Text>
        <Text style={[styles.emptyText, {color: colors.secondaryText}]}>
          Images you generate will appear here
        </Text>
      </View>
    ),
    [colors],
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.text}]}>Gallery</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text}]}>
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
            ...styles.gridContainer,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gridContainer: {
    paddingBottom: 100,
    paddingTop: SPACING,
  },
  imageWrapper: {
    marginBottom: SPACING,
  },
  imageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default GalleryScreen;
