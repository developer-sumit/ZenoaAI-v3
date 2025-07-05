import React, {useEffect, useRef, useState} from 'react';
import {View, Animated, Text} from 'react-native';

import {useTheme} from '@src/store/themeStore';

interface ImageSkeletonProps {
  width: number;
  height: number;
  borderRadius?: number;
  showTimer?: boolean;
}

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  width,
  height,
  borderRadius = 16,
  showTimer = true,
}) => {
  const {theme} = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();

    // Timer for seconds
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      animation.stop();
      clearInterval(timer);
    };
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.surface, theme.background],
  });

  const pulseScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <Animated.View
      className="overflow-hidden items-center justify-center"
      style={{width, height, backgroundColor, borderRadius}}>
      {/* Animated pulse indicator */}
      <Animated.View
        className="items-center justify-center"
        style={{transform: [{scale: pulseScale}]}}>
        {/* Timer display */}
        {showTimer && (
          <View className="items-center">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mb-2"
              style={{backgroundColor: theme.primary + '30'}}>
              <View
                className="w-4 h-4 rounded-full"
                style={{backgroundColor: theme.primary}}
              />
            </View>
            <Text
              className="text-xs font-medium"
              style={{color: theme.primary}}>
              {seconds}s
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Corner accent */}
      <View
        className="absolute top-2 right-2 w-2 h-2 rounded-md"
        style={{backgroundColor: theme.primary + '20'}}
      />
    </Animated.View>
  );
};

export default ImageSkeleton;
