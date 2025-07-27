import React from 'react';
import Svg, {Circle} from 'react-native-svg';

interface MoreVertIconProps {
  size?: number;
  color?: string;
}

const MoreVertIcon: React.FC<MoreVertIconProps> = ({
  size = 24,
  color = '#121212',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="2" fill={color} />
    <Circle cx="12" cy="12" r="2" fill={color} />
    <Circle cx="12" cy="19" r="2" fill={color} />
  </Svg>
);

export default MoreVertIcon;
