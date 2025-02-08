import React from 'react';
import {TouchableOpacity, Image} from 'react-native';

const ImageCard = ({
  uri,
  index,
  onPress,
}: {
  uri: string;
  index: number;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={`w-full h-full aspect-square rounded-2xl bg-gray-200 mb-4 ${
        index % 2 === 0 ? 'mr-4' : ''
      }`}>
      <Image
        source={{uri: uri}}
        style={{borderRadius: 20, width: '100%', height: '100%'}}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

export default ImageCard;
