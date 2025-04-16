import React from 'react';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const ImageMultipleOutlineIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Defs>
        <ClipPath id="clip0">
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip0)">
        {/* Front image outline */}
        <Path
          d="M18.5 18.5H8.5C7.12 18.5 6 17.38 6 16V5.5C6 4.12 7.12 3 8.5 3H18.5C19.88 3 21 4.12 21 5.5V16C21 17.38 19.88 18.5 18.5 18.5Z"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        {/* Mountain inside image */}
        <Path
          d="M17.25 10L14.75 13.5L12.5 10.75L9.75 14.5H17.25"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Sun inside image */}
        <Path
          d="M10.25 9.5C10.94 9.5 11.5 8.94 11.5 8.25C11.5 7.56 10.94 7 10.25 7C9.56 7 9 7.56 9 8.25C9 8.94 9.56 9.5 10.25 9.5Z"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        {/* Back image outline */}
        <Path
          d="M3 7V18.5C3 19.88 4.12 21 5.5 21H17"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
};

export default ImageMultipleOutlineIcon;
