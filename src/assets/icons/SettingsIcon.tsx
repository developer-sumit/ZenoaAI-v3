import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const SettingsIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000000',
  style,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Defs>
        <LinearGradient id="settingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </LinearGradient>
        <RadialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </RadialGradient>
      </Defs>

      {/* Soft background glow */}
      <Circle cx="12" cy="12" r="11" fill={color} opacity="0.05" />

      {/* Outer gear ring with smooth curves */}
      <Circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="url(#settingsGradient)"
        strokeWidth="1.5"
        strokeDasharray="2 3"
        opacity="0.3"
      />

      {/* Main gear body with perfect circle */}
      <Circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="url(#settingsGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Inner center hub */}
      <Circle
        cx="12"
        cy="12"
        r="3.5"
        fill="url(#centerGradient)"
      />

      {/* Center highlight */}
      <Circle
        cx="12"
        cy="12"
        r="2.5"
        fill="white"
        opacity="0.25"
      />

      {/* Ultra smooth gear teeth - vertical and horizontal */}
      <Circle cx="12" cy="3" r="1.5" fill="url(#settingsGradient)" />
      <Circle cx="12" cy="21" r="1.5" fill="url(#settingsGradient)" />
      <Circle cx="3" cy="12" r="1.5" fill="url(#settingsGradient)" />
      <Circle cx="21" cy="12" r="1.5" fill="url(#settingsGradient)" />

      {/* Diagonal gear teeth - smooth circles */}
      <Circle cx="6.2" cy="6.2" r="1.2" fill="url(#settingsGradient)" opacity="0.8" />
      <Circle cx="17.8" cy="17.8" r="1.2" fill="url(#settingsGradient)" opacity="0.8" />
      <Circle cx="17.8" cy="6.2" r="1.2" fill="url(#settingsGradient)" opacity="0.8" />
      <Circle cx="6.2" cy="17.8" r="1.2" fill="url(#settingsGradient)" opacity="0.8" />

      {/* Tooth highlights for depth */}
      <Circle cx="12" cy="3" r="0.8" fill="white" opacity="0.4" />
      <Circle cx="12" cy="21" r="0.8" fill="white" opacity="0.4" />
      <Circle cx="3" cy="12" r="0.8" fill="white" opacity="0.4" />
      <Circle cx="21" cy="12" r="0.8" fill="white" opacity="0.4" />

      {/* Central screw indicator */}
      <Circle
        cx="12"
        cy="12"
        r="1"
        fill={color}
        opacity="0.6"
      />

      {/* Screw cross pattern */}
      <Path
        d="M10.5 12L13.5 12M12 10.5L12 13.5"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Rotation motion indicators */}
      <Path
        d="M15.5 8.5C16 9 16.3 9.5 16.5 10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />
      
      <Path
        d="M8.5 15.5C8 15 7.7 14.5 7.5 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />

      {/* Small decorative gears */}
      <Circle cx="19" cy="5" r="0.8" fill={color} opacity="0.3" />
      <Circle cx="5" cy="19" r="0.6" fill={color} opacity="0.4" />
      
      {/* Tiny sparkles for tech feel */}
      <Circle cx="8" cy="8" r="0.3" fill="white" opacity="0.6" />
      <Circle cx="16" cy="16" r="0.3" fill="white" opacity="0.6" />
    </Svg>
  );
};

export default SettingsIcon;
