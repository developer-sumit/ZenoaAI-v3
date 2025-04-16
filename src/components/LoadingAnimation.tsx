import React from 'react';
import {View, Text, Animated, Easing} from 'react-native';
import Icon from './Icon';

interface LoadingAnimationProps {
  color?: string;
  size?: number;
  text?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  color = '#ffffff',
  size = 40,
  text = 'Generating...',
}) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="items-center justify-center">
      <Animated.View
        style={{
          transform: [{rotate: spin}],
          width: size,
          height: size,
        }}>
        <Icon name="refresh" size={size} color={color} />
      </Animated.View>
      <Text className="text-xs mt-3" style={{color}}>
        {text}
      </Text>
    </View>
  );
};

export default LoadingAnimation;
