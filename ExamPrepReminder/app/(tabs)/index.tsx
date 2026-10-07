import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Countdown } from '../../src/components/Countdown';
import { FadeInCard } from '../../src/components/FadeInCard';
import { SubjectChip } from '../../src/components/SubjectChip';
import { EXAM_DAYS } from '../../src/data/exams';
import { SUBJECTS } from '../../src/data/subjects';
import { colors, radius, space } from '../../src/theme';
import { addDays, dateOf, examStart, label, sameDay, weekdayOf } from '../../src/utils/date';
import { useNow } from '../../src/hooks/useNow';

export default function Home() {
  const now = useNow();

  const { today, tomorrow, next, upcoming } = useMemo(() => {
    const tomorrowDate = addDays(now, 1);
    return {
      today: EXAM_DAYS.find((d) => sameDay(dateOf(d), now)),
      tomorrow: EXAM_DAYS.find((d) => sameDay(dateOf(d), tomorrowDate)),
      // first exam day that has not finished yet
      next: EXAM_DAYS.find((d) => dateOf(d, 23, 59) > now),
      // first exam day strictly after today – what we should be revising for
      upcoming: EXAM_DAYS.find((d) => dateOf(d) > now && !sameDay(dateOf(d), now)),
    };
  }, [now]);

  const ms = next ? examStart(next).getTime() - now.getTime() : 0;
  const startId = (upcoming ?? next ?? EXAM_DAYS[0]).subjects[0];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <FadeInCard index={0}>
        {next ? (
          <>
            <Text style={styles.kicker}>{today ? 'EXAMS ARE TODAY' : 'NEXT EXAM DAY'}</Text>
            <Text style={styles.title}>
              {weekdayOf(next)}, {label(next)}
            </Text>
            {ms > 0 ? <Countdown ms={ms} /> : <Text style={styles.sub}>Good luck! You've got this 💪</Text>}
          </>
        ) : (
          <>
            <Text style={styles.title}>All exams are done 🎉</Text>
            <Text style={styles.sub}>Time to rest — you earned it!</Text>
          </>
        )}
      </FadeInCard>

      <Pressable
        style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => router.push({ pathname: '/subject/[id]', params: { id: startId } })}
      >
        <Text style={styles.ctaText}>🚀 Quick start: {SUBJECTS[startId].name}</Text>
      </Pressable>

      {today && (
        <FadeInCard index={1} style={styles.gap}>
          <Text style={styles.cardTitle}>📝 Exams today</Text>
          <View style={styles.chips}>{today.subjects.map((id) => <SubjectChip key={id} id={id} />)}</View>
        </FadeInCard>
      )}

      {upcoming && (
        <FadeInCard index={2} style={styles.gap}>
          <Text style={styles.cardTitle}>📚 Today's review plan ({label(upcoming)})</Text>
          {upcoming.subjects.map((id) => (
            <Pressable
              key={id}
              style={styles.planRow}
              onPress={() => router.push({ pathname: '/subject/[id]', params: { id } })}
            >
              <Text style={styles.planName}>{SUBJECTS[id].icon} {SUBJECTS[id].name}</Text>
              <Text style={styles.planHint}>Summary → Flashcards → Quiz</Text>
            </Pressable>
          ))}
        </FadeInCard>
      )}

      <FadeInCard index={3} style={styles.gap}>
        <Text style={styles.cardTitle}>⏰ Tomorrow's exams</Text>
        {tomorrow ? (
          <View style={styles.chips}>{tomorrow.subjects.map((id) => <SubjectChip key={id} id={id} />)}</View>
        ) : (
          <Text style={styles.sub}>No exams tomorrow.</Text>
        )}
      </FadeInCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: space.xl },
  gap: { marginTop: space.md },
  kicker: { color: colors.primary, fontSize: 12, letterSpacing: 1.5, fontWeight: '700' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 },
  sub: { color: colors.muted, fontSize: 15, marginTop: 8 },
  cta: { marginTop: space.md, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center' },
  ctaText: { color: '#0B1020', fontSize: 17, fontWeight: '800' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  planRow: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  planName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  planHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
