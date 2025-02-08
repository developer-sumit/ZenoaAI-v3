import './global.css';

import React, {SafeAreaView, StatusBar} from 'react-native';
import GalleryScreen from './src/screens/GalleryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import {ToastProvider} from './src/components/Toast';
import CustomTabBar from './src/components/CustomTabBar';
import Routes from '@zenoa/constants/routes';

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
  return (
    <SafeAreaView className="flex-1">
      <ToastProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaView>
  );
}

export default App;
