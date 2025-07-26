import React from 'react';
import {Text, useWindowDimensions, View} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import GalleryScreen from './GalleryScreen';
import FavoriteScreen from './FavoriteScreen';
import {useStrings} from '@src/hooks/useStrings';
import {useTheme} from '@src/store/themeStore';

const renderScene = SceneMap({
  first: GalleryScreen,
  second: FavoriteScreen,
});

export default function GalleryLayout() {
  const {theme} = useTheme();
  const t = useStrings();
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  const routes = [
    {key: 'first', title: t('gallery.all')},
    {key: 'second', title: t('gallery.favorites')},
  ];

  return (
    <>
      {/* Header */}
      <View className="pt-6 px-6" style={{backgroundColor: theme.background}}>
        <Text
          className="text-3xl font-bold text-center"
          style={{color: theme.text}}>
          {t('gallery.title')}
        </Text>
      </View>

      <TabView
        navigationState={{index, routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}
        style={{backgroundColor: theme.background}}
        renderTabBar={props => (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              paddingTop: 20,
              paddingBottom: 16,
              borderRadius: 24,
              overflow: 'hidden',
            }}>
            <TabBar
              {...props}
              indicatorStyle={{
                backgroundColor: theme.primary,
                height: 3,
                marginHorizontal: 32,
              }}
              style={{
                backgroundColor: theme.surface,
                elevation: 0,
                boxShadow: '0px 2px 20px rgba(0, 0, 0, 0.08)',
                borderRadius: 24,
                marginHorizontal: 32,
                width: '80%',
              }}
              activeColor={theme.primary}
              inactiveColor={theme.secondaryText}
              scrollEnabled={true}
              contentContainerStyle={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
              }}
            />
          </View>
        )}
      />
    </>
  );
}
