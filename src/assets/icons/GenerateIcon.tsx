import React from 'react';
import Svg, {Path, G, Defs, ClipPath, Rect} from 'react-native-svg';

interface GenerateIconProps {
  size?: number;
  color?: string;
}

const GenerateIcon: React.FC<GenerateIconProps> = ({
  size = 24,
  color = '#6366F1',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G>
      <Path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8a4 4 0 100 8 4 4 0 000-8z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color + '22'}
      />
    </G>
  </Svg>
);

export default GenerateIcon;
