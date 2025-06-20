import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CalendarScreen from './src/screens/CalendarScreen';
import TasksScreen from './src/screens/TasksScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { UserProvider } from './src/context/UserContext';

const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <NavigationContainer>
              <Tab.Navigator
                screenOptions={({ route }) => ({
                  tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Calendar') {
                      iconName = 'calendar-today';
                    } else if (route.name === 'Tasks') {
                      iconName = 'check-circle';
                    } else if (route.name === 'Settings') {
                      iconName = 'settings';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                  },
                  tabBarActiveTintColor: '#2196F3',
                  tabBarInactiveTintColor: 'gray',
                  headerStyle: {
                    backgroundColor: '#2196F3',
                  },
                  headerTintColor: 'white',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                })}
              >
                <Tab.Screen 
                  name="Calendar" 
                  component={CalendarScreen}
                  options={{ title: "Who's Night?" }}
                />
                <Tab.Screen 
                  name="Tasks" 
                  component={TasksScreen}
                  options={{ title: 'Tasks' }}
                />
                <Tab.Screen 
                  name="Settings" 
                  component={SettingsScreen}
                  options={{ title: 'Settings' }}
                />
              </Tab.Navigator>
            </NavigationContainer>
          </UserProvider>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}