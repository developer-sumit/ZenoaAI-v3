import React from 'react';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const AccountIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Defs>
        <RadialGradient
          id="profileGradient"
          cx="12"
          cy="12"
          r="10"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={color} stopOpacity="0.95" />
          <Stop offset="1" stopColor={color} />
        </RadialGradient>
      </Defs>

      <G>
        {/* Premium outer circle with subtle gradient */}
        <Circle
          cx="12"
          cy="12"
          r="10"
          fill="url(#profileGradient)"
        />

        {/* Person silhouette - elegant and minimal */}
        <G>
          {/* Head with refined shape */}
          <Circle
            cx="12"
            cy="9.5"
            r="3"
            fill="white"
          />

          {/* Body with premium shape */}
          <Path
            d="M12 13.5C9.33 13.5 7 15.15 7 17.25V18.5C7 18.78 7.22 19 7.5 19H16.5C16.78 19 17 18.78 17 18.5V17.25C17 15.15 14.67 13.5 12 13.5Z"
            fill="white"
          />
        </G>
      </G>
    </Svg>
  );
};

export default AccountIcon;
