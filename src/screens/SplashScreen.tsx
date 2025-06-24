import React from 'react';
import {View, ActivityIndicator} from 'react-native';

import {useTheme} from '@src/store/themeStore';

const SplashScreen = () => {
  const {theme} = useTheme();

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{backgroundColor: theme.background}}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
};

export default SplashScreen;
