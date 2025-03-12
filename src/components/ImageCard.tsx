import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {GeneratedImage} from '@src/types';
import {useThemeStore} from '@src/store/themeStore';
import {theme} from '@src/theme/Theme';
import {Animated, Easing} from 'react-native';

interface ImageCardProps {
  image: GeneratedImage;
  onPress: () => void;
  style?: ViewStyle;
}

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
      <Icon name="sync" size={16} color={color} />
    </Animated.View>
  );
};

const ImageCard: React.FC<ImageCardProps> = ({image, onPress, style}) => {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const getAspectRatio = (): number => {
    // Default to 1:1 if there's an issue
    if (!image?.aspectRatio?.ratio) return 1;

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

      return {
        aspectRatio,
      };
    }

    // For loaded images, we just fill the container (which is sized by the parent)
    return {
      width: '100%' as any,
      height: '100%' as any,
      flex: 1,
    };
  }, [image.uri, image.aspectRatio]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, style]}>
      {isLoading && !loadError && image.uri !== 'placeholder' && (
        <View style={[styles.overlay, {backgroundColor: colors.surface}]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {loadError && (
        <View style={[styles.overlay, {backgroundColor: colors.surface}]}>
          <Icon name="broken-image" size={32} color="#ef4444" />
          <Text style={[styles.errorText, {color: colors.secondaryText}]}>
            Failed to load
          </Text>
        </View>
      )}

      {image.uri !== 'placeholder' ? (
        <FastImage
          source={{uri: image.uri}}
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
          style={[
            styles.placeholderContainer,
            contentStyle,
            {backgroundColor: colors.surface},
          ]}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, {color: colors.secondaryText}]}>
            Loading...
          </Text>
        </View>
      )}

      {image.synced === false && (
        <View style={styles.syncIndicator}>
          <SyncIndicator color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
  },
  syncIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    borderRadius: 12,
  },
});

export default ImageCard;
