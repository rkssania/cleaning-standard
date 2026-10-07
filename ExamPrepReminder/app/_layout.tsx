import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { isSubjectId } from '../src/data/subjects';
import { configureNotifications, scheduleExamReminders } from '../src/services/notifications';
import { loadSettings } from '../src/services/storage';
import { colors } from '../src/theme';

configureNotifications();

function openFromNotification(response: Notifications.NotificationResponse | null | undefined) {
  const id = response?.notification.request.content.data?.subjectId;
  if (typeof id === 'string' && isSubjectId(id)) {
    router.push({ pathname: '/subject/[id]', params: { id } });
  } else if (response) {
    router.push('/schedule');
  }
}

export default function RootLayout() {
  useEffect(() => {
    // keep reminders in sync on every launch
    loadSettings().then((s) => { if (s.remindersEnabled) scheduleExamReminders(); });

    if (Platform.OS === 'web') return;
    // app opened by tapping a notification while it was closed
    Notifications.getLastNotificationResponseAsync().then(openFromNotification);
    // app running / backgrounded
    const sub = Notifications.addNotificationResponseReceivedListener(openFromNotification);
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="subject/[id]" options={{ title: 'Study hub' }} />
      </Stack>
    </>
  );
}
