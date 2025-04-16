import React from 'react';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const ImageMultipleIcon: React.FC<IconProps> = ({
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
        {/* Front image with rounded corners */}
        <Path
          d="M21 16V5.5C21 4.12 19.88 3 18.5 3H8.5C7.12 3 6 4.12 6 5.5V16C6 17.38 7.12 18.5 8.5 18.5H18.5C19.88 18.5 21 17.38 21 16Z"
          fill={color}
        />
        {/* Mountain inside image */}
        <Path
          d="M17.25 10L14.75 13.5L12.5 10.75L9.75 14.5H17.25L15 11.5L17.25 10Z"
          fill="white"
          fillOpacity="0.85"
        />
        {/* Sun inside image */}
        <Path
          d="M10.25 9.5C10.94 9.5 11.5 8.94 11.5 8.25C11.5 7.56 10.94 7 10.25 7C9.56 7 9 7.56 9 8.25C9 8.94 9.56 9.5 10.25 9.5Z"
          fill="white"
          fillOpacity="0.9"
        />
        {/* Back image outline */}
        <Path
          d="M3 7V18.5C3 19.88 4.12 21 5.5 21H17V19.75H5.5C4.81 19.75 4.25 19.19 4.25 18.5V7H3Z"
          fill={color}
        />
      </G>
    </Svg>
  );
};

export default ImageMultipleIcon;
