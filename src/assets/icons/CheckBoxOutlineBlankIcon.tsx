import React from 'react';
import Svg, {Rect} from 'react-native-svg';

interface CheckBoxOutlineBlankIconProps {
  size?: number;
  color?: string;
}

const CheckBoxOutlineBlankIcon: React.FC<CheckBoxOutlineBlankIconProps> = ({
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
  </Svg>
);

export default CheckBoxOutlineBlankIcon;
