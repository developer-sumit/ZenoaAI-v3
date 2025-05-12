import React from 'react';
import {BlurView} from '@react-native-community/blur';
import {Text, TouchableOpacity, View} from 'react-native';

import {theme} from '@src/theme/Theme';
import Routes from '@src/constants/routes';
import {useThemeStore} from '@src/store/themeStore';

import RobotIcon from '@src/assets/icons/RobotIcon';
import RobotOutlineIcon from '@src/assets/icons/RobotOutlineIcon';
import ImageMultipleIcon from '@src/assets/icons/ImageMultipleIcon';
import ImageMultipleOutlineIcon from '@src/assets/icons/ImageMultipleOutlineIcon';
import AccountIcon from '@src/assets/icons/AccountIcon';
import AccountOutlineIcon from '@src/assets/icons/AccountOutlineIcon';

const getIcon = (
  routeName: string,
  focused: boolean,
  size: number,
  color: string,
) => {
  switch (routeName) {
    case Routes.HOME:
      return focused ? (
        <RobotIcon size={size} color={color} />
      ) : (
        <RobotOutlineIcon size={size} color={color} />
      );
    case Routes.GALLERY:
      return focused ? (
        <ImageMultipleIcon size={size} color={color} />
      ) : (
        <ImageMultipleOutlineIcon size={size} color={color} />
      );
    case Routes.SETTINGS:
      return focused ? (
        <AccountIcon size={size} color={color} />
      ) : (
        <AccountOutlineIcon size={size} color={color} />
      );
    default:
      return null;
  }
};

export default function CustomTabBar({state, navigation}: any) {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  return (
    <View
      className="absolute bottom-0 w-full overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 10,
      }}>
      <BlurView
        style={{position: 'absolute', height: '100%', width: '100%'}}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={20}
        overlayColor="transparent"
      />

      <View className="flex-row w-full py-2">
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
              className="flex-1 items-center justify-center"
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={route.name}
              accessibilityRole="tab"
              accessibilityState={{selected: isFocused}}
              accessibilityHint={`Go to ${route.name} screen`}>
              <View
                className="w-14 h-14 rounded-full items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: isFocused
                    ? colors.primary + '15'
                    : 'transparent',
                }}>
                {getIcon(
                  route.name,
                  isFocused,
                  28,
                  isFocused ? colors.primary : '#64748b',
                )}
              </View>

              {isFocused && (
                <Text
                  className="text-xs mt-1 font-medium"
                  style={{color: colors.text}}>
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
