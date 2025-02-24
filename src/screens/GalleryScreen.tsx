import {FlashList} from '@shopify/flash-list';
import React, {Image, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {theme} from '@src/theme/Theme';
import {useThemeStore} from '@src/store/themeStore';

const GalleryScreen = () => {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Your Creations
      </Text>
      <FlashList
        data={[{uri: 'https://picsum.photos/200'}]}
        numColumns={2}
        estimatedItemSize={102}
        contentContainerClassName="pb-4"
        renderItem={({item, index}) => (
          <View className={`w-1/2 p-2 ${index % 2 === 0 ? 'pr-1' : 'pl-1'}`}>
            <Image
              source={{uri: item.uri}}
              className="w-full aspect-square rounded-2xl"
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Icon name="image-remove" size={48} color="#94a3b8" />
            <Text className="text-slate-400 dark:text-slate-500 mt-4">
              No creations yet
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default GalleryScreen;
