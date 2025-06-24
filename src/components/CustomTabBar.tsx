import React from 'react';
import {View, TouchableOpacity, Text, Platform} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useStrings} from '@src/hooks/useStrings';
import {useTheme} from '@src/store/themeStore';

// Icons
import RobotIcon from '@src/assets/icons/RobotIcon';
import PersonIcon from '@src/assets/icons/PersonIcon';
import CommunityIcon from '@src/assets/icons/CommunityIcon';
import PhotoLibraryIcon from '@src/assets/icons/PhotoLibraryIcon';

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const strings = useStrings();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const iconColor = isFocused ? theme.primary : theme.secondaryText + 'bb';
    const size = 24;

    switch (routeName) {
      case 'Home':
        return <RobotIcon size={size} color={iconColor} />;
      case 'Gallery':
        return <PhotoLibraryIcon size={size} color={iconColor} />;
      case 'Community':
        return <CommunityIcon size={size} color={iconColor} />;
      case 'Settings':
        return <PersonIcon size={size} color={iconColor} />;
      default:
        return null;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return strings.home.title;
      case 'Gallery':
        return strings.gallery.title;
      case 'Community':
        return strings.community.title;
      case 'Settings':
        return strings.settings.title;
      default:
        return routeName;
    }
  };

  return (
    <View
      className="flex-row shadow-lg"
      style={{
        backgroundColor: theme.surface,
        paddingVertical: Platform.OS === 'ios' ? insets.bottom : 7,
      }}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
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

        const onLongPress = () => {
          navigation.emit({type: 'tabLongPress', target: route.key});
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? {selected: true} : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            className="flex-1 items-center justify-center py-2">
            {getTabIcon(route.name, isFocused)}
            <Text
              className="mt-1 text-sm"
              style={{
                color: isFocused ? theme.primary : theme.secondaryText + 'bb',
                fontWeight: isFocused ? '600' : '400',
              }}>
              {getTabLabel(route.name)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomTabBar;
