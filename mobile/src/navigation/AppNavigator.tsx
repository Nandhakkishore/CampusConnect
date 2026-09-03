import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ProjectBoardScreen } from '../screens/ProjectBoardScreen';
import { ProjectDetailScreen } from '../screens/ProjectDetailScreen';
import { CreateProjectScreen } from '../screens/CreateProjectScreen';
import { TeamApplicantsScreen } from '../screens/TeamApplicantsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ChatRoomScreen } from '../screens/ChatRoomScreen';
import { GigsScreen } from '../screens/GigsScreen';
import { CreateGigScreen } from '../screens/CreateGigScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
  let icon = '💡';
  if (label === 'Gigs') icon = '💼';
  if (label === 'Chat') icon = '💬';
  if (label === 'Notifications') icon = '🔔';
  if (label === 'Profile') icon = '👤';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? '700' : '400',
          color: focused ? colors.primary : colors.textDim,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectBoardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Ideas" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="GigsTab"
        component={GigsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Gigs" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Chat" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Notifications" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
              options={{ title: 'Project Details' }}
            />
            <Stack.Screen
              name="CreateProject"
              component={CreateProjectScreen}
              options={{ title: 'New Idea Pitch' }}
            />
            <Stack.Screen
              name="TeamApplicants"
              component={TeamApplicantsScreen}
              options={{ title: 'Review Applicants' }}
            />
            <Stack.Screen
              name="CreateGig"
              component={CreateGigScreen}
              options={{ title: 'Post Internal Gig' }}
            />
            <Stack.Screen
              name="ChatRoom"
              component={ChatRoomScreen}
              options={({ route }: any) => ({
                title: route.params?.title || 'Chat',
              })}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Edit Student Profile' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
