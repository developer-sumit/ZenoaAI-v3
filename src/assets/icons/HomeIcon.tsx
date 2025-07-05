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

const HomeIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Defs>
        <LinearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Soft background glow */}
      <Circle cx="12" cy="13" r="10" fill={color} opacity="0.06" />

      {/* House roof with smooth curves */}
      <Path
        d="M12 3C12.3 3 12.6 3.1 12.8 3.3L21.8 10.8C22.1 11 22.2 11.4 22 11.7C21.8 12 21.4 12.1 21.1 11.9L20 11V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V11L2.9 11.9C2.6 12.1 2.2 12 2 11.7C1.8 11.4 1.9 11 2.2 10.8L11.2 3.3C11.4 3.1 11.7 3 12 3Z"
        fill="url(#homeGradient)"
      />

      {/* House body with rounded corners */}
      <Rect
        x="5"
        y="11"
        width="14"
        height="9"
        rx="2"
        ry="2"
        fill={color}
        opacity="0.9"
      />

      {/* Soft inner highlight */}
      <Rect
        x="6"
        y="12"
        width="12"
        height="7"
        rx="1.5"
        ry="1.5"
        fill="white"
        opacity="0.15"
      />

      {/* Door with smooth curves */}
      <Rect
        x="10"
        y="15"
        width="4"
        height="5"
        rx="2"
        ry="2"
        fill="white"
        opacity="0.9"
      />

      {/* Door handle */}
      <Circle cx="13" cy="17.5" r="0.5" fill={color} opacity="0.8" />

      {/* Windows with rounded corners */}
      <Rect
        x="6.5"
        y="13"
        width="2.5"
        height="2.5"
        rx="0.8"
        ry="0.8"
        fill="white"
        opacity="0.8"
      />

      <Rect
        x="15"
        y="13"
        width="2.5"
        height="2.5"
        rx="0.8"
        ry="0.8"
        fill="white"
        opacity="0.8"
      />

      {/* Chimney with smooth top */}
      <Rect
        x="16"
        y="6"
        width="2"
        height="4"
        rx="0.5"
        ry="0.5"
        fill={color}
        opacity="0.7"
      />

      {/* Smoke with curvy path */}
      <Path
        d="M17 6C17.5 5.5 17.8 5 18.2 4.8C18.5 4.5 18.8 4.8 18.5 5.2C18.2 5.5 17.8 5.8 18 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </Svg>
  );
};

export default HomeIcon;
