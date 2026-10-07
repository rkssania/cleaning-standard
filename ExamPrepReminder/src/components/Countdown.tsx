import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { splitDuration } from '../utils/date';

function Unit({ value, unit }: { value: number; unit: string }) {
  return (
    <View style={styles.unit}>
      <Text style={styles.value}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.unitLabel}>{unit}</Text>
    </View>
  );
}

export function Countdown({ ms }: { ms: number }) {
  const { days, hours, minutes } = splitDuration(ms);
  return (
    <View style={styles.row}>
      <Unit value={days} unit="days" />
      <Unit value={hours} unit="hours" />
      <Unit value={minutes} unit="min" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  unit: { flex: 1, alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: 14, marginHorizontal: 4 },
  value: { color: colors.text, fontSize: 36, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unitLabel: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
});
