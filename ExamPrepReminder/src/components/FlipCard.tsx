import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Flashcard } from '../data/types';
import { colors, radius } from '../theme';

/** Tap to flip between question and answer with a 3D rotation. */
export function FlipCard({ card }: { card: Flashcard }) {
  const flip = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  // reset when the card changes
  useEffect(() => {
    flip.setValue(0);
    setFlipped(false);
  }, [card, flip]);

  const toggle = () => {
    Animated.spring(flip, { toValue: flipped ? 0 : 1, friction: 8, tension: 10, useNativeDriver: true }).start();
    setFlipped(!flipped);
  };

  const rot = (from: string, to: string) => flip.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

  return (
    <Pressable onPress={toggle} style={styles.wrap} accessibilityRole="button" accessibilityLabel="Flip card">
      <Animated.View style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: rot('0deg', '180deg') }] }]}>
        <Text style={styles.tag}>QUESTION</Text>
        <Text style={styles.text}>{card.q}</Text>
        <Text style={styles.hint}>Tap to reveal</Text>
      </Animated.View>
      <Animated.View
        style={[styles.face, styles.back, { transform: [{ perspective: 1000 }, { rotateY: rot('180deg', '360deg') }] }]}
      >
        <Text style={[styles.tag, { color: colors.success }]}>ANSWER</Text>
        <Text style={styles.text}>{card.a}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 220 },
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { backgroundColor: colors.surfaceAlt },
  tag: { position: 'absolute', top: 16, left: 20, color: colors.primary, fontSize: 12, letterSpacing: 1.5, fontWeight: '700' },
  text: { color: colors.text, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  hint: { position: 'absolute', bottom: 14, color: colors.muted, fontSize: 12 },
});
