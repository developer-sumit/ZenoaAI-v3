import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  ViewStyle,
  Animated,
  Easing,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import {GeneratedImage} from '@src/types';
import {useTheme} from '@src/store/themeStore';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';

// Icons
import SyncIcon from '@src/assets/icons/SyncIcon';
import BrokenImageIcon from '@src/assets/icons/BrokenImageIcon';

interface ImageCardProps {
  image: GeneratedImage;
  onPress: () => void;
  style?: ViewStyle;
}

const SkeletonLoader = ({width, height}: {width: number; height: number}) => {
  const {theme} = useTheme();
  const shimmerOpacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  return (
    <View
      className="justify-center items-center"
      style={{
        width,
        height,
        backgroundColor: theme.surface,
      }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.primary + '20',
          opacity: shimmerOpacity,
        }}
      />
      <ActivityIndicator color={theme.primary} size="large" />
    </View>
  );
};

const SyncIndicator = ({color}: {color: string}) => {
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
    <Animated.View style={{transform: [{rotate}]}}>
      <SyncIcon size={16} color={color} />
    </Animated.View>
  );
};

const ImageCard: React.FC<ImageCardProps> = ({image, onPress, style}) => {
  const strings = useStrings();
  const {theme} = useTheme();
  const {triggerHaptic} = useHaptics();
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  // Check if this is a placeholder/skeleton image
  const isPlaceholder =
    !image.imageUrl ||
    image.imageUrl === 'placeholder' ||
    image.id?.startsWith('placeholder-');

  const getAspectRatio = (): number => {
    // Default to 1:1 if there's an issue
    if (!image?.aspectRatio) {
      return 1;
    }

    try {
      const [width, height] = image.aspectRatio.split(':').map(Number);
      return width / height;
    } catch (e) {
      console.warn('Error parsing aspect ratio:', e);
      return 1; // Default to square if parsing fails
    }
  };

  const contentStyle = React.useMemo(() => {
    if (isPlaceholder) {
      // For placeholder, we use flexible height based on aspect ratio
      const aspectRatio = getAspectRatio();
      return {aspectRatio};
    }

    // For loaded images, we just fill the container (which is sized by the parent)
    return {width: '100%', height: '100%', flex: 1} as any;
  }, [isPlaceholder, image.aspectRatio]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (!isPlaceholder) {
          triggerHaptic('light'); // Add haptic feedback for image tap
          onPress();
        }
      }}
      className="rounded-2xl overflow-hidden bg-[#f0f0f0]"
      style={style}
      disabled={isPlaceholder}
      accessible={true}
      accessibilityLabel={
        isPlaceholder
          ? 'Image is being generated'
          : image.prompt
          ? `Generated image of ${image.prompt}`
          : strings.home.generationSuccess
      }
      accessibilityHint={
        isPlaceholder
          ? 'Please wait while the image is being generated'
          : strings.imageViewer.imageHint
      }>
      {/* Show skeleton for placeholder images */}
      {isPlaceholder ? (
        <SkeletonLoader
          width={(style?.width as number) || 200}
          height={(style?.height as number) || 200}
        />
      ) : (
        <>
          {/* Loading indicator for real images */}
          {isLoading && !loadError && (
            <View
              className="absolute inset-0 justify-center items-center z-10"
              style={{backgroundColor: theme.surface}}
              accessible={true}
              accessibilityLabel={strings.imageViewer.loading}>
              <ActivityIndicator color={theme.primary} />
            </View>
          )}
          {/* Error state */}
          {loadError && (
            <View
              className="absolute inset-0 justify-center items-center z-10"
              style={{backgroundColor: theme.surface}}
              accessible={true}
              accessibilityLabel={strings.imageViewer.loadingError}>
              <BrokenImageIcon size={32} color="#ef4444" />
              <Text
                className="mt-2 text-xs"
                style={{color: theme.secondaryText}}>
                {strings.imageViewer.loadingError}
              </Text>
            </View>
          )}
          {/* The actual image */}
          <FastImage
            source={{uri: image.imageUrl}}
            style={contentStyle}
            resizeMode={FastImage.resizeMode.cover}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
          {/* Sync indicator if needed */}
          {(image as any).synced === false && (
            <View className="absolute top-2 right-2 bg-black/50 p-1 rounded-xl">
              <SyncIndicator color="white" />
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default ImageCard;
