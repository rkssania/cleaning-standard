import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SUBJECTS } from '../data/subjects';
import { SubjectId } from '../data/types';
import { colors, radius } from '../theme';

/** Tappable pill that opens the subject's study hub. */
export function SubjectChip({ id }: { id: SubjectId }) {
  const s = SUBJECTS[id];
  return (
    <Link href={{ pathname: '/subject/[id]', params: { id } }} asChild>
      <Pressable style={({ pressed }) => [styles.chip, { borderColor: s.color, opacity: pressed ? 0.6 : 1 }]}>
        <Text style={styles.text}>{s.icon} {s.name}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceAlt,
    marginRight: 8,
    marginBottom: 8,
  },
  text: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
