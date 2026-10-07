import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Flashcard } from '../data/types';
import { colors, radius } from '../theme';
import { FlipCard } from './FlipCard';

export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((i + d + cards.length) % cards.length);
  return (
    <View>
      <Text style={styles.counter}>Card {i + 1} / {cards.length}</Text>
      <FlipCard card={cards[i]} />
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => go(-1)}><Text style={styles.btnText}>← Prev</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => go(1)}><Text style={styles.btnText}>Next →</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: { color: colors.muted, marginBottom: 10, textAlign: 'center' },
  row: { flexDirection: 'row', marginTop: 16, gap: 12 },
  btn: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: colors.text, fontWeight: '700' },
});
