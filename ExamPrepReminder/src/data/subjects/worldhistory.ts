import { Subject } from '../types';

export const worldhistory: Subject = {
  id: 'worldhistory', name: 'World History', icon: '🏛️', color: '#A78BFA',
  summary: [
    'Ancient world: Egypt, Greece (democracy in Athens), Rome (Republic 509 BC, Empire 27 BC).',
    'Middle Ages: fall of Western Rome (476), feudalism, Crusades, Black Death (14th c.).',
    'Early modern: Renaissance, Reformation (1517), Age of Discovery (Columbus, 1492).',
    'Revolutions: American (1776), French (1789), Industrial Revolution.',
    'World Wars: WWI 1914–1918, WWII 1939–1945. Cold War until 1991.',
  ],
  formulas: [
    '476 — fall of Western Roman Empire',
    '1492 — Columbus reaches America',
    '1789 — French Revolution',
    '1914–1918 — WWI',
    '1939–1945 — WWII',
    '1991 — dissolution of the USSR',
  ],
  flashcards: [
    { q: 'Year of the French Revolution?', a: '1789' },
    { q: 'Who started the Reformation?', a: 'Martin Luther (1517).' },
    { q: 'Triple Entente members?', a: 'Britain, France, Russia.' },
    { q: 'What was the Cold War?', a: 'Political rivalry between the USA and USSR after WWII, without direct war.' },
    { q: 'Where did the Industrial Revolution begin?', a: 'Great Britain (18th century).' },
  ],
  quiz: [
    { q: 'WWII ended in…', options: ['1918', '1939', '1945', '1991'], answer: 2 },
    { q: 'Columbus reached America in…', options: ['1392', '1492', '1592', '1692'], answer: 1 },
    { q: 'The Renaissance began in…', options: ['Italy', 'Spain', 'Russia', 'China'], answer: 0 },
    { q: 'Who was the first U.S. president?', options: ['Lincoln', 'Jefferson', 'Washington', 'Adams'], answer: 2 },
  ],
};
