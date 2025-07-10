import React from 'react';
import {View, Text} from 'react-native';
import FastImage from 'react-native-fast-image';

interface UserAvatarProps {
  size?: number;
  userName?: string;
  userAvatar?: string;
  backgroundColor?: string;
  textColor?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 32,
  userName = 'Anonymous',
  userAvatar,
  backgroundColor = '#6366f1',
  textColor = '#ffffff',
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  if (userAvatar) {
    return (
      <FastImage
        source={{uri: userAvatar}}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor + '20',
        }}
        resizeMode={FastImage.resizeMode.cover}
      />
    );
  }

  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
      }}>
      <Text style={{color: textColor, fontSize: size * 0.4}}>
        {getInitials(userName)}
      </Text>
    </View>
  );
};

export default UserAvatar;
