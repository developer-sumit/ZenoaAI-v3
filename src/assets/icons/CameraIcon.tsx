import * as React from 'react';
import Svg, {Path, Circle} from 'react-native-svg';

interface CameraIconProps {
  size?: number;
  color?: string;
}

const CameraIcon = ({size = 24, color = '#FFFFFF'}: CameraIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 8.37722C2 6.85672 3.23122 5.62549 4.75172 5.62549H5.91031C7.06166 5.62549 8.11665 4.99281 8.67142 3.97194L8.89214 3.56784C9.44691 2.54696 10.5019 1.91428 11.6533 1.91428H12.3467C13.4981 1.91428 14.5531 2.54696 15.1079 3.56784L15.3286 3.97194C15.8834 4.99281 16.9383 5.62549 18.0897 5.62549H19.2483C20.7688 5.62549 22 6.85672 22 8.37722V17.8484C22 19.3689 20.7688 20.6001 19.2483 20.6001H4.75172C3.23122 20.6001 2 19.3689 2 17.8484V8.37722Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
};

export default CameraIcon;
