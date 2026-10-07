import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QuizQuestion } from '../data/types';
import { colors, radius } from '../theme';

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const restart = () => { setIndex(0); setPicked(null); setScore(0); setDone(false); };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <View style={styles.center}>
        <Text style={styles.big}>{score} / {questions.length}</Text>
        <Text style={styles.sub}>
          {pct >= 80 ? '🎉 Excellent!' : pct >= 50 ? '👍 Good, review the weak spots.' : '📚 Keep studying — you can do it!'}
        </Text>
        <Pressable style={styles.primary} onPress={restart}><Text style={styles.primaryText}>Try again</Text></Pressable>
      </View>
    );
  }

  const q = questions[index];
  const answered = picked !== null;
  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (index + 1 >= questions.length) setDone(true);
    else { setIndex(index + 1); setPicked(null); }
  };

  return (
    <View>
      <Text style={styles.counter}>Question {index + 1} / {questions.length} · Score {score}</Text>
      <Text style={styles.question}>{q.q}</Text>
      {q.options.map((opt, i) => {
        const correct = answered && i === q.answer;
        const wrong = answered && i === picked && i !== q.answer;
        return (
          <Pressable
            key={i}
            onPress={() => choose(i)}
            style={[styles.option, correct && styles.correct, wrong && styles.wrong]}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </Pressable>
        );
      })}
      {answered && (
        <>
          <Text style={[styles.feedback, { color: picked === q.answer ? colors.success : colors.danger }]}>
            {picked === q.answer ? '✅ Correct!' : '❌ Not quite.'} {q.explanation ?? ''}
          </Text>
          <Pressable style={styles.primary} onPress={next}>
            <Text style={styles.primaryText}>{index + 1 >= questions.length ? 'Finish' : 'Next question'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  counter: { color: colors.muted, marginBottom: 8 },
  question: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  option: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: 10 },
  correct: { borderColor: colors.success, backgroundColor: '#12301F' },
  wrong: { borderColor: colors.danger, backgroundColor: '#3A1717' },
  optionText: { color: colors.text, fontSize: 16 },
  feedback: { marginVertical: 8, fontSize: 15 },
  primary: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#0B1020', fontWeight: '800', fontSize: 16 },
  center: { alignItems: 'center', paddingVertical: 24 },
  big: { color: colors.text, fontSize: 56, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 16, marginVertical: 12, textAlign: 'center' },
});
