import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeInCard } from '../../src/components/FadeInCard';
import { Flashcards } from '../../src/components/Flashcards';
import { NotesEditor } from '../../src/components/NotesEditor';
import { Quiz } from '../../src/components/Quiz';
import { SUBJECTS, isSubjectId } from '../../src/data/subjects';
import { colors, radius, space } from '../../src/theme';

const TABS = ['Summary', 'Cards', 'Quiz', 'Notes'] as const;
type Tab = (typeof TABS)[number];

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('Summary');

  if (!isSubjectId(id)) return <Text style={styles.missing}>Subject not found.</Text>;
  const s = SUBJECTS[id];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: s.name }} />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && { backgroundColor: s.color }]}>
            <Text style={[styles.tabText, tab === t && { color: '#0B1020' }]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab === 'Summary' && (
          <>
            <FadeInCard>
              <Text style={styles.h}>{s.icon} Quick summary</Text>
              {s.summary.map((line, i) => <Text key={i} style={styles.p}>• {line}</Text>)}
            </FadeInCard>
            <FadeInCard index={1} style={{ marginTop: space.md }}>
              <Text style={styles.h}>Key formulas & facts</Text>
              {s.formulas.map((f, i) => <Text key={i} style={styles.formula}>{f}</Text>)}
            </FadeInCard>
          </>
        )}
        {tab === 'Cards' && <Flashcards cards={s.flashcards} />}
        {tab === 'Quiz' && <Quiz key={id} questions={s.quiz} />}
        {tab === 'Notes' && <NotesEditor subjectId={id} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  missing: { color: colors.text, padding: space.md },
  tabs: { flexDirection: 'row', padding: space.md, paddingBottom: 0, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center' },
  tabText: { color: colors.muted, fontWeight: '700' },
  content: { padding: space.md, paddingBottom: space.xl },
  h: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  p: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  formula: { color: colors.primary, fontSize: 15, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: 10, marginBottom: 8, overflow: 'hidden' },
});
