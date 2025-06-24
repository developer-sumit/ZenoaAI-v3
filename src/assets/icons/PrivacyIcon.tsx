import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface PrivacyIconProps {
  size?: number;
  color?: string;
}

const PrivacyIcon: React.FC<PrivacyIconProps> = ({
  size = 24,
  color = '#000',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4zM12 7c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2zm0 6c2.67 0 8 1.34 8 4v3H4v-3c0-2.66 5.33-4 8-4z"
        fill={color}
      />
    </Svg>
  );
};

export default PrivacyIcon;
