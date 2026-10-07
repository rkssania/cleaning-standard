import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { colors } from '../../src/theme';

const icon = (name: React.ComponentProps<typeof Ionicons>['name']) =>
  ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('notifications') }} />
    </Tabs>
  );
}
