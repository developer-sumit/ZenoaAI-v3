import React, {useEffect, useRef} from 'react';
import {View, Animated} from 'react-native';

import {useTheme} from '@src/store/themeStore';

interface ImageSkeletonProps {
  width: number;
  height: number;
  borderRadius?: number;
}

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  width,
  height,
  borderRadius = 16,
}) => {
  const {theme} = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.surface, theme.background],
  });

  return (
    <Animated.View
      className="overflow-hidden"
      style={{width, height, backgroundColor, borderRadius}}>
      {/* Inner shimmer effect */}
      <View
        className="absolute top-1/2 left-1/2 w-6 h-6 rounded-xl"
        style={{
          transform: [{translateX: -12}, {translateY: -12}],
          backgroundColor: theme.primary + '30',
        }}
      />

      {/* Corner accent */}
      <View
        className="absolute top-2 right-2 w-2 h-2 rounded-md"
        style={{backgroundColor: theme.primary + '20'}}
      />
    </Animated.View>
  );
};

export default ImageSkeleton;
