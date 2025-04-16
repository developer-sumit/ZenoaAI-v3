import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const AccountOutlineIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {/* Elegant circle outline */}
      <Circle
        cx="12"
        cy="12"
        r="9.25"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Head with subtle details */}
      <Path
        d="M12 8C13.1046 8 14 8.89543 14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Elegant body shape */}
      <Path
        d="M7.5 18.5C7.5 15.7386 9.23858 14 12 14C14.7614 14 16.5 15.7386 16.5 18.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};

export default AccountOutlineIcon;
