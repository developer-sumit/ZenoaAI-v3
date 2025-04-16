import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const RobotOutlineIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {/* Main robot face/head - premium outline */}
      <Rect
        x="5.5"
        y="6.5"
        width="13"
        height="13"
        rx="4.5"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Left eye */}
      <Circle
        cx="9.5"
        cy="11"
        r="1.5"
        fill={color}
      />

      {/* Right eye */}
      <Circle
        cx="14.5"
        cy="11"
        r="1.5"
        fill={color}
      />

      {/* Small antenna - elegant & minimal */}
      <Path
        d="M12 6.5V4.5M12 4.5C12 3.67 12.67 3 13.5 3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Friendly smile - curved upward */}
      <Path
        d="M9.5 14.5C10.5 15.5 13.5 15.5 14.5 14.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default RobotOutlineIcon;
