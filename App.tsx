import './global.css';

import React from 'react';
import {SafeAreaView, StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import {ToastProvider} from '@zenoa/components/Toast';

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1">
      <ToastProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{headerShown: false}}>
            <Tab.Screen name="Home" component={HomeScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaView>
  );
}

export default App;
