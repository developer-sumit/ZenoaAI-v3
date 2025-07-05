import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {ViewStyle} from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const GalleryIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Defs>
        <LinearGradient
          id="galleryGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Soft background layers */}
      <Rect
        x="2"
        y="6"
        width="15"
        height="11"
        rx="4"
        ry="4"
        fill={color}
        opacity="0.08"
      />

      <Rect
        x="4"
        y="4"
        width="15"
        height="11"
        rx="4"
        ry="4"
        fill={color}
        opacity="0.15"
      />

      {/* Main image frame with perfect curves */}
      <Rect
        x="6"
        y="2"
        width="16"
        height="14"
        rx="5"
        ry="5"
        fill="url(#galleryGradient)"
      />

      {/* Ultra-smooth landscape with flowing curves */}
      <Path
        d="M6 12C8.5 9 10.5 10.5 13 8C15.5 10.5 17.5 9 20 11C21 9.5 21.5 10.5 22 12V12C22 13.66 20.66 15 19 15H9C7.34 15 6 13.66 6 12Z"
        fill="white"
        opacity="0.95"
      />

      {/* Soft floating sun with gentle glow */}
      <Circle cx="17" cy="7" r="2.2" fill="white" opacity="0.9" />
      <Circle cx="17" cy="7" r="1.5" fill="white" />

      {/* Smooth gallery indicator dots with fade effect */}
      <Circle cx="8" cy="19" r="1.2" fill={color} opacity="0.3" />
      <Circle cx="12" cy="19" r="1.2" fill={color} opacity="0.6" />
      <Circle cx="16" cy="19" r="1.2" fill={color} opacity="1" />

      {/* Subtle corner highlights */}
      <Path
        d="M8 4C7.5 4 7 4.5 7 5"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />
      <Path
        d="M20 4C20.5 4 21 4.5 21 5"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />
    </Svg>
  );
};

export default GalleryIcon;
