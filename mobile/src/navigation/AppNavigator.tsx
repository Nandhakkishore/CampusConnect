import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity, Platform } from 'react-native';

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

const HeaderBrand = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Text style={{ fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.4 }}>
      Campus<Text style={{ color: colors.primary }}>Connect</Text>
    </Text>
    <View
      style={{
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: 'rgba(5, 150, 105, 0.25)',
      }}
    >
      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>HUB</Text>
    </View>
  </View>
);

const SignOutButton = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const userInitials = (user?.profile?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  const handleSignOut = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Sign out of your CampusConnect session?')) {
        logout();
      }
    } else {
      logout();
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
      <TouchableOpacity
        onPress={handleSignOut}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceLight,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 20,
          paddingVertical: 4,
          paddingHorizontal: 10,
          gap: 6,
        }}
        activeOpacity={0.75}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
            {userInitials}
          </Text>
        </View>
        <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 12 }}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
  let icon = '💡';
  if (label === 'Gigs') icon = '💼';
  if (label === 'Chat') icon = '💬';
  if (label === 'Alerts') icon = '🔔';
  if (label === 'Profile') icon = '👤';

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: focused ? colors.primaryLight : 'transparent',
      }}
    >
      <Text style={{ fontSize: 17, opacity: focused ? 1 : 0.65 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? '800' : '500',
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
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
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
          tabBarIcon: ({ focused }) => <TabIcon label="Alerts" focused={focused} />,
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
          headerRight: () => <SignOutButton />,
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
              options={{
                headerShown: true,
                headerTitle: () => <HeaderBrand />,
                headerShadowVisible: false,
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerRight: () => <SignOutButton />,
              }}
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
