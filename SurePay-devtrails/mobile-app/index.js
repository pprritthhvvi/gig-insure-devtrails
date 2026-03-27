import { registerRootComponent } from 'expo';
import React from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import App from './src/App';
import store from './src/store/store';

function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <App />
      </Provider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(Root);
