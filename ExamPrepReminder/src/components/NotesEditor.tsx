import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useNotes } from '../hooks/useNotes';
import { colors, radius } from '../theme';

export function NotesEditor({ subjectId }: { subjectId: string }) {
  const { text, setText, status } = useNotes(subjectId);
  return (
    <>
      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Paste or write your own notes here…"
        placeholderTextColor={colors.muted}
        textAlignVertical="top"
      />
      <Text style={styles.status}>{status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ Saved on this device' : ' '}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 280,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 16,
  },
  status: { color: colors.muted, marginTop: 8, fontSize: 12 },
});
