import * as React from 'react';
import Svg, {Path, Rect} from 'react-native-svg';

interface EmailIconProps {
  size?: number;
  color?: string;
}

const EmailIcon = ({size = 24, color = '#6366F1'}: EmailIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="4"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M2 8L9.60993 13.2191C10.4588 13.8302 11.1688 14.1357 12 14.1357C12.8312 14.1357 13.5412 13.8302 14.3901 13.2191L22 8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default EmailIcon;
