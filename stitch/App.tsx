import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './app/Navigation';
import { ChatProvider } from './app/ChatContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ChatProvider>
        <Navigation />
      </ChatProvider>
    </SafeAreaProvider>
  );
}