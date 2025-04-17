import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface ChevronDownIconProps {
    size?: number;
    color?: string;
    style?: ViewStyle;
}

const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({
    size = 24,
    color = '#000',
    style,
}) => {
    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={style}>
            <Path
                d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
                fill={color}
            />
        </Svg>
    );
};

export default ChevronDownIcon;