import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const BrokenImageIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path
        d="M21 5V19.01C21 19.01 20.99 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H20C21 4 21 5 21 5ZM19 5H4V18H19.99L19 5ZM19 5H4V18H19.99L19.28 7.5L15.5 12L12 8L8 13.5L4 10V5H19Z"
        fill={color}
      />
    </Svg>
  );
};

export default BrokenImageIcon;
