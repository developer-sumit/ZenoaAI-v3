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

const BrokenImageIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Defs>
        <LinearGradient id="brokenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Soft background for broken image frame */}
      <Rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="5"
        ry="5"
        fill={color}
        opacity="0.08"
      />

      {/* Main image frame with smooth curves */}
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="4"
        ry="4"
        fill="none"
        stroke="url(#brokenGradient)"
        strokeWidth="2"
        strokeDasharray="1 1"
        opacity="0.6"
      />

      {/* Broken crack lines with smooth curves */}
      <Path
        d="M7 8C9 10 11 9 13 11C15 9 17 10 19 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      <Path
        d="M5 14C7 12 9 13 11 11C13 13 15 12 17 14C19 12 20 13 21 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* Broken pieces with smooth edges */}
      <Path
        d="M8 6C8.5 6.5 9 7 9.5 6.5C10 7 10.5 6.5 11 7L10 8C9.5 7.5 9 8 8.5 7.5C8 8 7.5 7.5 7 8L8 6Z"
        fill={color}
        opacity="0.3"
      />

      <Path
        d="M15 16C15.5 15.5 16 15 16.5 15.5C17 15 17.5 15.5 18 15L17 17C16.5 16.5 16 17 15.5 16.5C15 17 14.5 16.5 14 17L15 16Z"
        fill={color}
        opacity="0.3"
      />

      {/* Soft warning indicator with smooth circle */}
      <Circle cx="12" cy="12" r="3" fill={color} opacity="0.15" />

      <Circle cx="12" cy="12" r="1.5" fill={color} opacity="0.6" />

      {/* Smooth exclamation mark */}
      <Path
        d="M12 9.5V11.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <Circle cx="12" cy="13.5" r="0.5" fill="white" />

      {/* Decorative corner damage with curves */}
      <Path
        d="M19 7C19.5 7.5 20 8 20 8.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />

      <Path
        d="M5 15C4.5 15.5 4 16 4 16.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Subtle scattered pixels effect */}
      <Circle cx="6" cy="10" r="0.5" fill={color} opacity="0.3" />
      <Circle cx="18" cy="13" r="0.5" fill={color} opacity="0.3" />
      <Circle cx="9" cy="16" r="0.5" fill={color} opacity="0.3" />
      <Circle cx="16" cy="9" r="0.5" fill={color} opacity="0.3" />
    </Svg>
  );
};

export default BrokenImageIcon;
