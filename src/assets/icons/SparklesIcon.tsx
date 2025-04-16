import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const SparklesIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      fill="none">
      <Path
        fill={color}
        d="M10 2L12.5 7L18 9L12.5 11L10 16L7.5 11L2 9L7.5 7L10 2ZM18.5 9.5L20 13L23.5 14.5L20 16L18.5 19.5L17 16L13.5 14.5L17 13L18.5 9.5ZM6 17.5L7 19.5L9 20L7 21L6 23L5 21L3 20L5 19.5L6 17.5Z"
      />
    </Svg>
  );
};

export default SparklesIcon;
