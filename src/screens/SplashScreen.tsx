import React from 'react';
import {View, ActivityIndicator} from 'react-native';

import {theme} from '@src/theme/Theme';
import {useThemeStore} from '@src/store/themeStore';

const SplashScreen = () => {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{backgroundColor: colors.background}}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

export default SplashScreen;
