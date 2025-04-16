import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const AdUnitsIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path
        d="M17 1H7C5.9 1 5 1.9 5 3V21C5 22.1 5.9 23 7 23H17C18.1 23 19 22.1 19 21V3C19 1.9 18.1 1 17 1ZM17 19H7V5H17V19Z"
        fill={color}
      />
      <Rect x="8" y="6" width="8" height="2" fill={color} />
      <Rect x="8" y="9" width="8" height="2" fill={color} />
      <Rect x="8" y="12" width="4" height="2" fill={color} />
    </Svg>
  );
};

export default AdUnitsIcon;
