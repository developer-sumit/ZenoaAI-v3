import React from 'react';
import Svg, {Rect, Path} from 'react-native-svg';

interface CheckBoxIconProps {
  size?: number;
  color?: string;
}

const CheckBoxIcon: React.FC<CheckBoxIconProps> = ({
  size = 24,
  color = '#121212',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={4}
      y={4}
      width={16}
      height={16}
      rx={4}
      stroke={color}
      strokeWidth={2}
      fill="none"
    />
    <Path
      d="M8 12.5l3 3 5-5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export default CheckBoxIcon;
