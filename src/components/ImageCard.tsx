import React from 'react';
import {TouchableOpacity, Image} from 'react-native';

const ImageCard = ({
  uri,
  onPress,
}: {
  uri: string;
  index?: number;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="w-full h-full aspect-square rounded-2xl bg-gray-200 mb-4 p-1.5">
      <Image
        source={{uri: uri, cache: 'force-cache'}}
        style={{borderRadius: 20, width: '100%', height: '100%'}}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

export default ImageCard;
