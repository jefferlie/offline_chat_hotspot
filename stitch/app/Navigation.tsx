import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import HostScreen from '../screens/HostScreen';
import JoinScreen from '../screens/JoinScreen';
import ChatScreen from '../screens/ChatScreen';
import UsersScreen from '../screens/UsersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Host" component={HostScreen} />
        <Stack.Screen name="Join" component={JoinScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Users" component={UsersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;