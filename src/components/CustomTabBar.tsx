import React, {Text, TouchableOpacity, View} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Routes from '@zenoa/constants/routes';

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
  return (
    <View className="absolute bottom-5 rounded-[100px] overflow-hidden w-[80%] self-center bg-light-secondary">
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
                className={`${
                  isFocused ? 'bg-white/80 p-3 rounded-full' : ''
                }`}>
                <Icon
                  name={getIconName(route.name, isFocused)}
                  size={28}
                  color={isFocused ? '#4f46e5' : '#64748b'}
                />
              </View>
              {isFocused && (
                <Text className="text-light-text dark:text-dark-text text-xs mt-1 font-medium">
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
