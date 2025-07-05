import React from 'react';
import {View, TouchableOpacity, Text, Platform, Animated} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useStrings} from '@src/hooks/useStrings';
import {useTheme} from '@src/store/themeStore';
import {useHaptics} from '@src/hooks/useHaptics';
import {useAnimations} from '@src/hooks/useAnimations';

// Icons
import HomeIcon from '@src/assets/icons/HomeIcon';
import SettingsIcon from '@src/assets/icons/SettingsIcon';
import CommunityIcon from '@src/assets/icons/CommunityIcon';
import GalleryIcon from '@src/assets/icons/GalleryIcon';

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const strings = useStrings();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const {triggerHaptic} = useHaptics();
  const {animatePress} = useAnimations();

  // Animation values for each tab
  const tabAnimations = React.useRef(
    state.routes.map(() => new Animated.Value(1)),
  ).current;

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const iconColor = isFocused ? theme.primary : theme.secondaryText + 'bb';
    const size = 24;

    switch (routeName) {
      case 'Home':
        return <HomeIcon size={size} color={iconColor} />;
      case 'Gallery':
        return <GalleryIcon size={size} color={iconColor} />;
      case 'Community':
        return <CommunityIcon size={size} color={iconColor} />;
      case 'Settings':
        return <SettingsIcon size={size} color={iconColor} />;
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

  const handleTabPress = (index: number, onPress: () => void) => {
    // Haptic feedback
    triggerHaptic('selection');

    // Micro animation - scale effect
    animatePress(tabAnimations[index], 200);

    // Execute the original onPress
    onPress();
  };

  return (
    <View
      className="absolute bottom-0 flex-row shadow-lg rounded-t-3xl"
      style={{
        backgroundColor: theme.surface,
        paddingVertical: Platform.OS === 'ios' ? insets.bottom : 7,
        shadowColor: theme.primary,
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 15,
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
          <Animated.View
            key={route.key}
            style={{
              flex: 1,
              transform: [{scale: tabAnimations[index]}],
            }}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={() => handleTabPress(index, onPress)}
              onLongPress={onLongPress}
              className="flex-1 items-center justify-center py-3"
              style={{
                backgroundColor: isFocused
                  ? theme.primary + '10'
                  : 'transparent',
                borderRadius: 16,
                marginHorizontal: 4,
              }}>
              <View
                style={{transform: [{scale: isFocused ? 1.1 : 1}]}}
                className="transition-transform duration-200">
                {getTabIcon(route.name, isFocused)}
              </View>
              <Text
                className="mt-1 text-xs font-medium"
                style={{
                  color: isFocused ? theme.primary : theme.secondaryText + 'bb',
                  fontWeight: isFocused ? '600' : '400',
                }}>
                {getTabLabel(route.name)}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default CustomTabBar;
