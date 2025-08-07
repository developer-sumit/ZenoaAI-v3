import React from 'react';
import Svg, {Path, Ellipse} from 'react-native-svg';
import {ViewStyle} from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const PersonIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {/* Person head - smooth oval with gradient feel */}
      <Ellipse cx="12" cy="8.5" rx="4" ry="4.5" fill={color} />

      {/* Soft highlight on head */}
      <Ellipse
        cx="10.5"
        cy="7.5"
        rx="1.5"
        ry="1.8"
        fill="white"
        opacity="0.2"
      />

      {/* Person body - curved shoulders and smooth shape */}
      <Path
        d="M4 20C4 16 7.5 13 12 13C16.5 13 20 16 20 20C20 20.55 19.55 21 19 21H5C4.45 21 4 20.55 4 20Z"
        fill={color}
      />

      {/* Soft body highlight */}
      <Path
        d="M7 19C7 17 9 15.5 11.5 15.5C12.5 15.5 13.4 15.7 14.2 16C13.1 16.8 12.5 17.8 12.5 19V20H7.5C7.22 20 7 19.78 7 19Z"
        fill="white"
        opacity="0.15"
      />
    </Svg>
  );
};

export default PersonIcon;
