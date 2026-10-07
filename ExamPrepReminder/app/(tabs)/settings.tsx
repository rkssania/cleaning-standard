import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { FadeInCard } from '../../src/components/FadeInCard';
import { EXAM_DAYS, REMINDER_HOUR } from '../../src/data/exams';
import { useSettings } from '../../src/hooks/useSettings';
import { scheduledCount, sendTestNotification } from '../../src/services/notifications';
import { colors, radius, space } from '../../src/theme';
import { label, reminderDate } from '../../src/utils/date';

export default function Settings() {
  const { settings, ready, setRemindersEnabled } = useSettings();
  const [count, setCount] = useState(0);
  const refresh = () => scheduledCount().then(setCount);
  useEffect(() => { if (ready) refresh(); }, [ready]);

  const unsupported = Platform.OS === 'web';

  const toggle = async (value: boolean) => {
    const ok = await setRemindersEnabled(value);
    if (!ok) Alert.alert('Notifications unavailable', 'Please allow notifications for this app in system settings (not supported on web).');
    refresh();
  };

  const test = async () => {
    const ok = await sendTestNotification();
    Alert.alert(ok ? 'Test sent' : 'Notifications unavailable', ok ? 'A notification will appear in ~2 seconds.' : 'Please allow notifications in system settings.');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <FadeInCard>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Evening reminders</Text>
            <Text style={styles.sub}>Every day at {REMINDER_HOUR}:00 before an exam day</Text>
          </View>
          <Switch
            value={settings.remindersEnabled}
            onValueChange={toggle}
            disabled={unsupported}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        <Text style={styles.sub}>Scheduled right now: {count}</Text>
      </FadeInCard>

      <Pressable style={styles.btn} onPress={test} disabled={unsupported}>
        <Text style={styles.btnText}>🔔 Send test notification</Text>
      </Pressable>

      <FadeInCard index={1} style={{ marginTop: space.md }}>
        <Text style={styles.title}>Reminder times</Text>
        {EXAM_DAYS.map((d) => (
          <Text key={d.id} style={styles.line}>
            {label({ ...d, day: reminderDate(d).getDate(), month: reminderDate(d).getMonth() + 1 })} {REMINDER_HOUR}:00 → exams on {label(d)}
          </Text>
        ))}
      </FadeInCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.md },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 13, marginTop: 4 },
  btn: { marginTop: space.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  btnText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  line: { color: colors.muted, marginTop: 8 },
});
