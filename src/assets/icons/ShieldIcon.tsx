import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

const ShieldIcon: React.FC<IconProps> = ({size = 24, color = '#000'}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM19 11C19 15.52 15.87 19.72 12 20.94C8.13 19.72 5 15.52 5 11V6.3L12 3.19L19 6.3V11ZM7.91 10.08L6.5 11.5L11 16L17.5 9.5L16.09 8.08L11 13.17L7.91 10.08Z"
        fill={color}
      />
    </Svg>
  );
};

export default ShieldIcon;
