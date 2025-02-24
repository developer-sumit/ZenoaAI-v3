import {BlurView} from '@react-native-community/blur';
import React, {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {theme} from '@src/theme/Theme';
import Routes from '@src/constants/routes';
import {useThemeStore} from '@src/store/themeStore';

const getIconName = (routeName: string, focused: boolean) => {
  switch (routeName) {
    case Routes.HOME:
      return focused ? 'robot' : 'robot-outline';
    case Routes.GALLERY:
      return focused ? 'image-multiple' : 'image-multiple-outline';
    case Routes.PROFILE:
      return focused ? 'account' : 'account-outline';
    default:
      return 'circle';
  }
};

export default function CustomTabBar({state, navigation}: any) {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  return (
    <View
      className="absolute bottom-5 rounded-[100px] overflow-hidden w-[80%] self-center"
      style={{backgroundColor: colors.surface}}>
      <BlurView
        style={{flex: 1, position: 'absolute', height: '100%', width: '100%'}}
        blurType="light"
        blurAmount={20}
        overlayColor="transparent"
      />
      <View style={{flex: 1, flexDirection: 'row', width: '100%'}}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.name}
              onPress={onPress}
              className="flex-1 p-3 items-center justify-center h-full">
              <View
                style={{backgroundColor: isFocused ? colors.surface : ''}}
                className="p-3 rounded-[999px]">
                <Icon
                  name={getIconName(route.name, isFocused)}
                  size={28}
                  color={isFocused ? colors.primary : '#64748b'}
                />
              </View>
              {isFocused && (
                <Text
                  style={{color: colors.text}}
                  className="text-xs mt-1 font-medium">
                  {route.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
