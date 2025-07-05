import React from 'react';
import Svg, {Path, Defs, LinearGradient, Stop, Circle} from 'react-native-svg';
import {ViewStyle} from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const BookmarkIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Defs>
        <LinearGradient
          id="bookmarkGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Soft background glow */}
      <Path
        d="M7 3C5.34 3 4 4.34 4 6V20C4 20.83 4.67 21.5 5.5 21.5C5.78 21.5 6.05 21.39 6.24 21.2L12 16.5L17.76 21.2C17.95 21.39 18.22 21.5 18.5 21.5C19.33 21.5 20 20.83 20 20V6C20 4.34 18.66 3 17 3H7Z"
        fill={color}
        opacity="0.1"
      />

      {/* Main bookmark body with smooth curves */}
      <Path
        d="M7 3C5.34 3 4 4.34 4 6V19C4 19.55 4.45 20 5 20C5.18 20 5.35 19.93 5.47 19.81L12 14.5L18.53 19.81C18.65 19.93 18.82 20 19 20C19.55 20 20 19.55 20 19V6C20 4.34 18.66 3 17 3H7Z"
        fill="url(#bookmarkGradient)"
      />

      {/* Soft inner highlight */}
      <Path
        d="M7 4C6.45 4 6 4.45 6 5V17.5L11.5 13.2C11.78 13 12.22 13 12.5 13.2L18 17.5V5C18 4.45 17.55 4 17 4H7Z"
        fill="white"
        opacity="0.15"
      />

      {/* Smooth bookmark corner fold */}
      <Path
        d="M16 3C16.55 3 17 3.45 17 4L15.5 5.5C15.22 5.78 14.78 5.78 14.5 5.5L16 3Z"
        fill="white"
        opacity="0.2"
      />

      {/* Decorative bookmark ribbon effect */}
      <Circle cx="12" cy="7" r="1.5" fill="white" opacity="0.3" />

      {/* Soft bottom curve indicator */}
      <Path
        d="M10 17C10.67 16.5 11.33 16.5 12 16.5C12.67 16.5 13.33 16.5 14 17"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />
    </Svg>
  );
};

export default BookmarkIcon;
