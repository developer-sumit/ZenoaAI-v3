import React from 'react';
import Svg, {Path, Circle, Ellipse} from 'react-native-svg';
import {ViewStyle} from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const CommunityIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {/* Background soft circles */}
      <Circle cx="12" cy="12" r="10" fill={color} opacity="0.08" />

      {/* Main person - smooth oval head */}
      <Ellipse cx="12" cy="9" rx="3" ry="3.5" fill={color} />

      {/* Main person body - curved shape */}
      <Path
        d="M6 18C6 15.5 8.5 13.5 12 13.5C15.5 13.5 18 15.5 18 18C18 18.83 17.33 19.5 16.5 19.5H7.5C6.67 19.5 6 18.83 6 18Z"
        fill={color}
      />

      {/* Left person - smaller with curves */}
      <Ellipse cx="6" cy="10" rx="2" ry="2.5" fill={color} opacity="0.7" />

      {/* Left person body */}
      <Path
        d="M2 17.5C2 15.8 3.5 14.5 5.5 14.5C6.2 14.5 6.8 14.7 7.3 15C6.5 15.8 6 16.8 6 18V18.5H3C2.45 18.5 2 18.05 2 17.5Z"
        fill={color}
        opacity="0.7"
      />

      {/* Right person - smaller with curves */}
      <Ellipse cx="18" cy="10" rx="2" ry="2.5" fill={color} opacity="0.7" />

      {/* Right person body */}
      <Path
        d="M22 17.5C22 15.8 20.5 14.5 18.5 14.5C17.8 14.5 17.2 14.7 16.7 15C17.5 15.8 18 16.8 18 18V18.5H21C21.55 18.5 22 18.05 22 17.5Z"
        fill={color}
        opacity="0.7"
      />

      {/* Connecting hearts/bonds - soft curves */}
      <Path
        d="M9 11C9.5 10.5 10.5 10.5 11 11C10.5 11.5 9.5 11.5 9 11Z"
        fill={color}
        opacity="0.3"
      />
      <Path
        d="M13 11C13.5 10.5 14.5 10.5 15 11C14.5 11.5 13.5 11.5 13 11Z"
        fill={color}
        opacity="0.3"
      />
    </Svg>
  );
};

export default CommunityIcon;
