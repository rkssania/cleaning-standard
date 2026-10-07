import { Subject } from '../types';

export const kzhistory: Subject = {
  id: 'kzhistory', name: 'Kazakh History', icon: '🏔️', color: '#F472B6',
  summary: [
    'Early states: Saka, Wusun, Kangju, then the Turkic Khaganate (6th c.), Karakhanids, Golden Horde.',
    'Kazakh Khanate founded in 1465 by Kerey and Zhanibek. Peak under Kasym Khan (1511–1521).',
    'Three zhuzes (Senior, Middle, Junior). Abylai Khan (1711–1781) united the Kazakhs against the Dzungars.',
    'National liberation uprisings: Kenesary Kasymov (1837–1847).',
    'Alash Orda autonomy (1917–1920); Kazakh SSR 1936; independence on 16 December 1991.',
  ],
  formulas: [
    '1465 — Kazakh Khanate',
    '1731 — Junior Zhuz joins Russia (Abulkhair Khan)',
    '1837–1847 — Kenesary uprising',
    '1917 — Alash Orda',
    '1991 — Independence',
  ],
  flashcards: [
    { q: 'Who founded the Kazakh Khanate?', a: 'Kerey and Zhanibek, in 1465.' },
    { q: 'Independence Day of Kazakhstan?', a: '16 December 1991.' },
    { q: 'Leader of the 1837–1847 uprising?', a: 'Kenesary Kasymov.' },
    { q: 'Who wrote the code "Zhety Zhargy"?', a: 'Tauke Khan.' },
    { q: 'Leader of the Alash movement?', a: 'Alikhan Bukeikhanov.' },
  ],
  quiz: [
    { q: 'Year the Kazakh Khanate was formed?', options: ['1365', '1465', '1565', '1731'], answer: 1 },
    { q: 'How many zhuzes are there?', options: ['2', '3', '4', '5'], answer: 1 },
    { q: 'Kasym Khan ruled in…', options: ['1511–1521', '1611–1621', '1711–1721', '1411–1421'], answer: 0 },
    { q: 'Who led the Alash Orda government?', options: ['Abai', 'Alikhan Bukeikhanov', 'Abylai', 'Tauke'], answer: 1 },
  ],
};
