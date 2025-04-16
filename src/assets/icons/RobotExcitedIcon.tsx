import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const RobotExcitedIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Rect
        x="4"
        y="7"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M8 11C8.55228 11 9 11.4477 9 12C9 12.5523 8.55228 13 8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11Z"
        fill={color}
      />
      <Path
        d="M16 11C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13C15.4477 13 15 12.5523 15 12C15 11.4477 15.4477 11 16 11Z"
        fill={color}
      />
      <Path
        d="M9 15H15V16C15 16.5523 14.5523 17 14 17H10C9.44772 17 9 16.5523 9 16V15Z"
        fill={color}
      />
      <Path
        d="M9 3L15 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M12 3L12 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default RobotExcitedIcon;
