import React from 'react';
import { BlurView } from '@react-native-community/blur';
import { Text, TouchableOpacity, View } from 'react-native';

import Icon from './Icon';
import { theme } from '@src/theme/Theme';
import Routes from '@src/constants/routes';
import { useThemeStore } from '@src/store/themeStore';

const getIconName = (routeName: string, focused: boolean) => {
  switch (routeName) {
    case Routes.HOME:
      return focused ? 'robot' : 'robot-outline';
    case Routes.GALLERY:
      return focused ? 'image-multiple' : 'image-multiple-outline';
    case Routes.SETTINGS:
      return focused ? 'account' : 'account-outline';
    default:
      return 'circle';
  }
};

export default function CustomTabBar({ state, navigation }: any) {
  const { isDark } = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  return (
    <View
      className="absolute bottom-0 w-full overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 10,
      }}
    >
      <BlurView
        style={{ position: 'absolute', height: '100%', width: '100%', }}
        blurType="light"
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
            >
              <View
                className="w-14 h-14 aspect-square rounded-full items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: isFocused
                    ? colors.primary + '15'
                    : 'transparent',
                }}
              >
                <Icon
                  name={getIconName(route.name, isFocused)}
                  size={28}
                  color={isFocused ? colors.primary : '#64748b'}
                />
              </View>

              {isFocused && (
                <Text
                  className="text-xs mt-1 font-medium"
                  style={{ color: colors.text }}
                >
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
