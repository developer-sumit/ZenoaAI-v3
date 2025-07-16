import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
import {SvgProps} from 'react-native-svg';

const LockIcon = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M5 8V6a5 5 0 0110 0v2"
      stroke={props.color || '#A0A0A0'}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.5 8h13a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0116.5 18h-13A1.5 1.5 0 012 16.5v-7A1.5 1.5 0 013.5 8z"
      stroke={props.color || '#A0A0A0'}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <Path
      d="M10 13.5v1"
      stroke={props.color || '#A0A0A0'}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

export default LockIcon;
