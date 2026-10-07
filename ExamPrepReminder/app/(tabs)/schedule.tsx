import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeInCard } from '../../src/components/FadeInCard';
import { EXAM_DAYS, EXAM_START_HOUR } from '../../src/data/exams';
import { SUBJECTS } from '../../src/data/subjects';
import { colors, radius, space } from '../../src/theme';
import { dateOf, label, sameDay, weekdayOf } from '../../src/utils/date';

export default function Schedule() {
  const now = new Date();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {EXAM_DAYS.map((d, i) => {
        const isToday = sameDay(dateOf(d), now);
        const past = dateOf(d, 23, 59) < now;
        return (
          <View key={d.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, isToday && { backgroundColor: colors.primary }, past && { backgroundColor: colors.success }]} />
              {i < EXAM_DAYS.length - 1 && <View style={styles.line} />}
            </View>
            <FadeInCard index={i} style={[styles.card, isToday && { borderColor: colors.primary }]}>
              <Text style={styles.date}>
                {weekdayOf(d)} · {label(d)} {isToday ? ' · TODAY' : past ? ' · done ✓' : ''}
              </Text>
              <Text style={styles.time}>Starts ~{String(EXAM_START_HOUR).padStart(2, '0')}:00</Text>
              {d.subjects.map((id) => (
                <Pressable
                  key={id}
                  style={({ pressed }) => [styles.subject, { borderLeftColor: SUBJECTS[id].color, opacity: pressed ? 0.6 : 1 }]}
                  onPress={() => router.push({ pathname: '/subject/[id]', params: { id } })}
                >
                  <Text style={styles.subjectText}>{SUBJECTS[id].icon} {SUBJECTS[id].name}</Text>
                  <Text style={styles.chev}>›</Text>
                </Pressable>
              ))}
            </FadeInCard>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.md },
  row: { flexDirection: 'row' },
  rail: { width: 24, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border, marginTop: 22 },
  line: { flex: 1, width: 2, backgroundColor: colors.border },
  card: { flex: 1, marginBottom: space.md, marginLeft: 8 },
  date: { color: colors.text, fontSize: 18, fontWeight: '800' },
  time: { color: colors.muted, fontSize: 12, marginBottom: 10 },
  subject: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt, borderLeftWidth: 4, borderRadius: radius.sm, padding: 12, marginTop: 8,
  },
  subjectText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  chev: { color: colors.muted, fontSize: 22 },
});
