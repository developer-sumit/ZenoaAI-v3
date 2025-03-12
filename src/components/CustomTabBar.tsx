import React from 'react';
import {BlurView} from '@react-native-community/blur';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';
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
    case Routes.SETTINGS:
      return focused ? 'account' : 'account-outline';
    default:
      return 'circle';
  }
};

export default function CustomTabBar({state, navigation}: any) {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  return (
    <View style={[styles.tabBarContainer, {backgroundColor: colors.surface}]}>
      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={20}
        overlayColor="transparent"
      />
      <View style={styles.tabsWrapper}>
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
              style={styles.tabButton}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isFocused
                      ? colors.primary + '15'
                      : 'transparent',
                  },
                ]}>
                <Icon
                  name={getIconName(route.name, isFocused)}
                  size={28}
                  color={isFocused ? colors.primary : '#64748b'}
                />
              </View>
              {isFocused && (
                <Text style={[styles.tabLabel, {color: colors.text}]}>
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

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
  },
  blurView: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  tabsWrapper: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
