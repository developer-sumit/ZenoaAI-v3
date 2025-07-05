import React from 'react';
import Svg, {Path, Circle, Ellipse} from 'react-native-svg';
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
      {/* Background soft circle */}
      <Circle cx="12" cy="12" r="11" fill={color} opacity="0.1" />

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

      {/* Settings gear indicators - subtle curved lines */}
      <Path
        d="M18.5 6C19 6 19.5 6.5 19.5 7C19.5 7.5 19 8 18.5 8C18 8 17.5 7.5 17.5 7C17.5 6.5 18 6 18.5 6Z"
        fill={color}
        opacity="0.4"
      />

      <Path
        d="M5.5 6C6 6 6.5 6.5 6.5 7C6.5 7.5 6 8 5.5 8C5 8 4.5 7.5 4.5 7C4.5 6.5 5 6 5.5 6Z"
        fill={color}
        opacity="0.4"
      />

      {/* Smooth curved lines suggesting settings */}
      <Path
        d="M18 5.5C18.5 5.5 19 5.5 19.5 5.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <Path
        d="M4.5 5.5C5 5.5 5.5 5.5 6 5.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
    </Svg>
  );
};

export default PersonIcon;
