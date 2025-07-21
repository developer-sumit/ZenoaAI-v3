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

import {GeneratedImage} from '@src/types/image';
import {useTheme} from '@src/store/themeStore';
import {useStrings} from '@src/hooks/useStrings';
import {useHaptics} from '@src/hooks/useHaptics';

// Icons
import SyncIcon from '@src/assets/icons/SyncIcon';
import BrokenImageIcon from '@src/assets/icons/BrokenImageIcon';
import UserAvatar from './UserAvatar';
import HeartIcon from '@src/assets/icons/HeartIcon';

interface ImageCardProps {
  image: GeneratedImage;
  onPress?: () => void;
  style?: ViewStyle;
}

const SkeletonLoader = ({width, height}: {width?: number; height?: number}) => {
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
        width: width || '100%',
        height: height || '100%',
        backgroundColor: theme.surface,
      }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // backgroundColor: theme.primary + '20',
          // opacity: shimmerOpacity,
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

const BaseImageCard: React.FC<ImageCardProps> = ({image, onPress, style}) => {
  const strings = useStrings();
  const {theme} = useTheme();
  const {triggerHaptic} = useHaptics();
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  // Check if this is a placeholder/skeleton image
  const isPlaceholder =
    image.imageUrl === 'placeholder' || image.id?.startsWith('placeholder-');

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (!isPlaceholder) {
          triggerHaptic('light'); // Add haptic feedback for image tap
          onPress && onPress();
        }
      }}
      style={[
        {
          aspectRatio: image.aspectRatio.replace(':', '/') || '1/1',
          backgroundColor: isPlaceholder ? theme.surface : 'transparent',
          marginBottom: 10,
        },
        style,
      ]}
      className="rounded-3xl overflow-hidden"
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
        <SkeletonLoader />
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
            style={{width: '100%', height: '100%'}}
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

      {!isPlaceholder && (
        <View
          className="absolute bottom-0 left-0 right-0 p-3"
          style={{backgroundColor: theme.surface}}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <UserAvatar
                size={18}
                userName={image.userName || 'Anonymous'}
                userAvatar={image.userAvatar}
                backgroundColor={theme.primary}
                textColor="#ffffff"
              />
              <Text
                className="text-sm font-semibold ml-1.5"
                style={{color: theme.text}}>
                {image.userName || 'Anonymous'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Favorite indicator */}
      {!isPlaceholder && (
        <TouchableOpacity
          className="flex-row absolute top-3 right-3 p-2.5 rounded-2xl gap-1 bg-white"
          hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
          accessible={true}
          accessibilityLabel={
            image.isFavorite
              ? strings.imageViewer.removeFavourite
              : strings.imageViewer.addFavourite
          }
          accessibilityRole="button">
          <HeartIcon size={16} color="#FF6B6B" fill="#FF6B6B" />
          <Text className="text-sm font-medium ml-1 text-[#121212]">
            {image.favoriteCount ? image.favoriteCount : 0}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const ImageCard = React.memo(BaseImageCard, (prevProps, nextProps) => {
  // Only re-render if the image URL, aspect ratio, and style dimensions change
  return (
    prevProps.image.imageUrl === nextProps.image.imageUrl &&
    prevProps.image.aspectRatio === nextProps.image.aspectRatio &&
    prevProps.style?.width === nextProps.style?.width &&
    prevProps.style?.height === nextProps.style?.height
  );
});

export default ImageCard;
