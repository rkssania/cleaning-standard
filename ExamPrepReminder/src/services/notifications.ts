import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { EXAM_DAYS } from '../data/exams';
import { SUBJECTS } from '../data/subjects';
import { ExamDay } from '../data/types';
import { reminderDate } from '../utils/date';

const CHANNEL_ID = 'exam-reminders';
const supported = Platform.OS !== 'web';

/** Call once at app start (module scope of the root layout). */
export function configureNotifications() {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensurePermissions(): Promise<boolean> {
  if (!supported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Exam reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

const subjectNames = (day: ExamDay) => day.subjects.map((id) => SUBJECTS[id].name).join(', ');

const contentFor = (day: ExamDay): Notifications.NotificationContentInput => ({
  title: '📚 Exam reminder',
  body: `Tomorrow's Exams: ${subjectNames(day)}. Tap to open revision materials!`,
  data: { dayId: day.id, subjectId: day.subjects[0] },
});

/** Replaces all scheduled reminders with one per future exam day, at 19:00 the evening before. */
export async function scheduleExamReminders(): Promise<number> {
  if (!supported) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!(await ensurePermissions())) return 0;
  const now = Date.now();
  let count = 0;
  for (const day of EXAM_DAYS) {
    const date = reminderDate(day);
    if (date.getTime() <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `reminder-${day.id}`,
      content: contentFor(day),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
    });
    count++;
  }
  return count;
}

export async function cancelExamReminders() {
  if (supported) await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Fires a sample notification (for the next exam day) in a couple of seconds. */
export async function sendTestNotification(): Promise<boolean> {
  if (!(await ensurePermissions())) return false;
  const day = EXAM_DAYS[0];
  await Notifications.scheduleNotificationAsync({
    content: contentFor(day),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: CHANNEL_ID },
  });
  return true;
}

export async function scheduledCount(): Promise<number> {
  return supported ? (await Notifications.getAllScheduledNotificationsAsync()).length : 0;
}
