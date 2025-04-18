import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { GeneratedImage } from '@src/types';
import { useThemeStore } from '@src/store/themeStore';
import { theme } from '@src/theme/Theme';
import { Animated, Easing } from 'react-native';
import Icon from './Icon';

interface ImageCardProps {
  image: GeneratedImage;
  onPress: () => void;
  style?: ViewStyle;
}

const SyncIndicator = ({ color }: { color: string }) => {
  const rotateValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Icon name="sync" size={16} color={color} />
    </Animated.View>
  );
};

const ImageCard: React.FC<ImageCardProps> = ({ image, onPress, style }) => {
  const { isDark } = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const getAspectRatio = (): number => {
    // Default to 1:1 if there's an issue
    if (!image?.aspectRatio?.ratio) { return 1; }

    try {
      const [width, height] = image.aspectRatio.ratio.split(':').map(Number);
      return width / height;
    } catch (e) {
      console.warn('Error parsing aspect ratio:', e);
      return 1; // Default to square if parsing fails
    }
  };

  const contentStyle = React.useMemo(() => {
    if (image.uri === 'placeholder') {
      // For placeholder, we use flexible height based on aspect ratio
      const aspectRatio = getAspectRatio();

      return { aspectRatio };
    }

    // For loaded images, we just fill the container (which is sized by the parent)
    return {
      width: "100%",
      height: "100%",
      flex: 1,
    } as any;
  }, [image.uri, image.aspectRatio]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="rounded-2xl overflow-hidden"
      style={[{ backgroundColor: '#f0f0f0' }, style]}>
      {isLoading && !loadError && image.uri !== 'placeholder' && (
        <View
          className="absolute inset-0 justify-center items-center z-10"
          style={{ backgroundColor: colors.surface }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {loadError && (
        <View
          className="absolute inset-0 justify-center items-center z-10"
          style={{ backgroundColor: colors.surface }}>
          <Icon name="broken-image" size={32} color="#ef4444" />
          <Text
            className="mt-2 text-xs"
            style={{ color: colors.secondaryText }}>
            Failed to load
          </Text>
        </View>
      )}

      {image.uri !== 'placeholder' ? (
        <FastImage
          source={{ uri: image.uri }}
          style={contentStyle}
          resizeMode={FastImage.resizeMode.cover}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setLoadError(true);
          }}
        />
      ) : (
        <View
          className="justify-center items-center w-full"
          style={[
            contentStyle,
            { backgroundColor: colors.surface },
          ]}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text
            className="mt-2 text-xs"
            style={{ color: colors.secondaryText }}>
            Loading...
          </Text>
        </View>
      )}

      {image.synced === false && (
        <View className="absolute top-2 right-2 bg-black/50 p-1 rounded-xl">
          <SyncIndicator color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ImageCard;
