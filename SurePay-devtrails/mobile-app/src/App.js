import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { setAuth } from './store/authSlice';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import PoliciesScreen from './screens/PoliciesScreen';
import ClaimsScreen from './screens/ClaimsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PolicyDetailScreen from './screens/PolicyDetailScreen';
import ClaimDetailScreen from './screens/ClaimDetailScreen';
import FileClaimScreen from './screens/FileClaimScreen';
import BuyPolicyScreen from './screens/BuyPolicyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1976D2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="PolicyDetail"
        component={PolicyDetailScreen}
        options={{ title: 'Policy Details' }}
      />
    </Stack.Navigator>
  );
}

function PoliciesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1976D2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="PoliciesList"
        component={PoliciesScreen}
        options={{ title: 'My Policies' }}
      />
      <Stack.Screen
        name="PolicyDetail"
        component={PolicyDetailScreen}
        options={{ title: 'Policy Details' }}
      />
      <Stack.Screen
        name="BuyPolicy"
        component={BuyPolicyScreen}
        options={{ title: 'Buy Policy' }}
      />
    </Stack.Navigator>
  );
}

function ClaimsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1976D2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="ClaimsList"
        component={ClaimsScreen}
        options={{ title: 'My Claims' }}
      />
      <Stack.Screen
        name="ClaimDetail"
        component={ClaimDetailScreen}
        options={{ title: 'Claim Details' }}
      />
      <Stack.Screen
        name="FileClaim"
        component={FileClaimScreen}
        options={{ title: 'File New Claim' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1976D2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="ProfileView"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = 'home';
          } else if (route.name === 'PoliciesTab') {
            iconName = 'description';
          } else if (route.name === 'ClaimsTab') {
            iconName = 'assignment';
          } else if (route.name === 'ProfileTab') {
            iconName = 'person';
          }

          return (
            <MaterialIcons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#BDBDBD',
        tabBarStyle: {
          backgroundColor: '#fafafa',
          borderTopColor: '#EEEEEE',
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="PoliciesTab"
        component={PoliciesStack}
        options={{ title: 'Policies' }}
      />
      <Tab.Screen
        name="ClaimsTab"
        component={ClaimsStack}
        options={{ title: 'Claims' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        dispatch(setAuth({ isAuthenticated: true, token }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="LoginStack"
            component={LoginScreen}
            options={{ animationEnabled: false }}
          />
        ) : (
          <Stack.Screen
            name="MainApp"
            component={MainTabs}
            options={{ animationEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
