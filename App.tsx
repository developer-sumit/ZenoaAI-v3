import './global.css';

import React, {StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import {ToastProvider} from './src/components/Toast';
import CustomTabBar from './src/components/CustomTabBar';
import Routes from '@src/constants/routes';
import {useThemeStore} from '@src/store/themeStore';
import {theme} from '@src/theme/Theme';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      initialRouteName={Routes.HOME}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name={Routes.HOME} component={HomeScreen} />
      <Tab.Screen name={Routes.GALLERY} component={GalleryScreen} />
      <Tab.Screen name={Routes.PROFILE} component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function App() {
  const {isDark} = useThemeStore();
  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: isDark
          ? theme.dark.background
          : theme.light.background,
      }}>
      <StatusBar hidden barStyle="light-content" />
      <ToastProvider>
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaView>
  );
}

export default App;
