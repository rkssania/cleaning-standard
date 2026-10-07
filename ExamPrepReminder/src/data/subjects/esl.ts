import { Subject } from '../types';

export const esl: Subject = {
  id: 'esl', name: 'ESL (English)', icon: '🔤', color: '#FB7185',
  summary: [
    'Present Perfect (have/has + V3) links the past with now: "I have lived here since 2020."',
    'Conditionals: 0 (if + present, present), 1 (if + present, will), 2 (if + past, would), 3 (if + past perfect, would have).',
    'Passive voice: be + V3 — "The book was written by Orwell."',
    'Linking words: however, although, therefore, moreover, in addition.',
    'Reported speech shifts tenses back: "I am tired" → He said he was tired.',
  ],
  formulas: [
    'Present Simple: S + V(s)',
    'Past Simple: S + V2 / did + V',
    'Present Perfect: S + have/has + V3',
    'Second conditional: If + Past Simple, would + V',
    'Passive: S + be + V3',
  ],
  flashcards: [
    { q: 'Past simple of "go"?', a: 'went' },
    { q: 'Past participle of "write"?', a: 'written' },
    { q: 'When do we use "for" vs "since"?', a: '"for" + period (for 3 years); "since" + point in time (since 2020).' },
    { q: 'Second conditional example?', a: 'If I had time, I would help you.' },
    { q: 'Comparative of "good"?', a: 'better' },
  ],
  quiz: [
    { q: 'If I ___ rich, I would travel.', options: ['am', 'was/were', 'will be', 'have been'], answer: 1, explanation: 'Second conditional uses past simple.' },
    { q: 'She ___ lived here since 2019.', options: ['has', 'have', 'is', 'did'], answer: 0 },
    { q: 'Choose the passive: ', options: ['The cat ate the fish.', 'The fish was eaten by the cat.', 'The cat is eating.', 'The fish eats.'], answer: 1 },
    { q: 'I am interested ___ music.', options: ['on', 'at', 'in', 'of'], answer: 2 },
  ],
};
