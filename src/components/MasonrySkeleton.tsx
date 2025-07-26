import React from 'react';
import {View, Animated, Easing, StyleSheet, Dimensions} from 'react-native';
import {MasonryFlashList} from '@shopify/flash-list';
import {BlurView} from '@react-native-community/blur';
import {useTheme} from '@src/store/themeStore';

// Subtle, neutral color palette for skeleton cards
const LIGHT_SKELETON_COLORS = [
  '#f1f5f9', // blue-gray-100
  '#e5e7eb', // gray-200
  '#f3f4f6', // gray-100
  '#e0e7ef', // very light blue
  '#f8fafc', // slate-50
  '#f4f4f5', // zinc-100
  '#f9fafb', // gray-50
  '#e7ecef', // blue-50
];

const DARK_SKELETON_COLORS = [
  '#23272f', // dark blue-gray
  '#1e293b', // slate-800
  '#22223b', // dark indigo
  '#2a2e37', // dark neutral
  '#262a32', // dark slate
  '#1a1c23', // almost black
  '#23272f', // repeat for more variety
  '#20232a',
];

function getRandomColor(index: number, isDark: boolean) {
  const palette = isDark ? DARK_SKELETON_COLORS : LIGHT_SKELETON_COLORS;
  return palette[index % palette.length];
}

interface MasonrySkeletonProps {
  numColumns?: number;
  numItems?: number;
  minHeight?: number;
  maxHeight?: number;
  cardSpacing?: number;
  borderRadius?: number;
}

const MasonrySkeleton: React.FC<MasonrySkeletonProps> = ({
  numColumns = 2,
  numItems = 12,
  minHeight = 120,
  maxHeight = 240,
  cardSpacing = 10,
  borderRadius = 24,
}) => {
  const {isDark} = useTheme();
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  // Calculate card width based on screen width and spacing
  const totalSpacing = cardSpacing * (numColumns + 1);
  const cardWidth = (screenWidth - totalSpacing) / numColumns;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  // Create shimmer gradient effect
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-cardWidth * 2, cardWidth * 2],
  });

  // Generate skeleton data
  const skeletonData = React.useMemo(() => {
    return Array.from({length: numItems}).map((_, i) => ({
      key: `skeleton-${i}`,
      height: Math.floor(
        Math.random() * (maxHeight - minHeight + 1) + minHeight,
      ),
      color: getRandomColor(i, isDark),
    }));
  }, [numItems, minHeight, maxHeight, isDark]);

  const renderItem = ({
    item,
  }: {
    item: {key: string; height: number; color: string};
  }) => (
    <View
      className="relative overflow-hidden"
      style={[{margin: cardSpacing / 2}]}>
      {/* Subtle colored card */}
      <View
        className="overflow-hidden"
        style={{
          width: cardWidth,
          height: item.height,
          borderRadius,
          backgroundColor: item.color,
          overflow: 'hidden',
        }}>
        {/* Blur overlay for glassy effect */}
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={10}
          reducedTransparencyFallbackColor={item.color}
        />
        {/* Animated shimmer overlay */}
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              borderRadius,
              transform: [{translateX: shimmerTranslateX}],
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(255,255,255,0.13)',
            },
          ]}
        />
      </View>
    </View>
  );

  return (
    <MasonryFlashList
      data={skeletonData}
      keyExtractor={item => item.key}
      numColumns={numColumns}
      renderItem={renderItem}
      estimatedItemSize={maxHeight}
      showsVerticalScrollIndicator={false}
      className="flex-1 rounded-t-3xl"
      contentContainerStyle={{paddingBottom: 100}}
    />
  );
};

const styles = StyleSheet.create({
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '50%',
    transform: [{skewX: '-20deg'}],
  },
});

export default MasonrySkeleton;
