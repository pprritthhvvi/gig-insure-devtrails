import React from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import App from './App';
import store from './store/store';

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <App />
      </Provider>
    </GestureHandlerRootView>
  );
}
