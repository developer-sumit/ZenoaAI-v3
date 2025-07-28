import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface FlagIconProps {
  size?: number;
  color?: string;
}

const FlagIcon: React.FC<FlagIconProps> = ({size = 24, color = '#121212'}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 4v16M5 4h13l-2 6 2 6H5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export default FlagIcon;
