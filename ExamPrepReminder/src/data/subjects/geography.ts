import { Subject } from '../types';

export const geography: Subject = {
  id: 'geography', name: 'Geography', icon: '🌍', color: '#38BDF8',
  summary: [
    'Kazakhstan is the largest landlocked country in the world (≈ 2.72 million km²), capital Astana.',
    'Coordinates: latitude (parallels, 0° = equator) and longitude (meridians, 0° = Greenwich).',
    'Earth has 5 oceans; the Pacific is the largest and deepest.',
    'Climate zones depend on latitude, ocean currents, relief and distance from the sea.',
    'Plate tectonics explains earthquakes, volcanoes and mountain building.',
  ],
  formulas: [
    'Scale: distance on the ground = distance on the map × scale denominator',
    'Temperature drops ≈ 6 °C per 1000 m of altitude',
    'Population density = population / area',
  ],
  flashcards: [
    { q: 'Capital of Kazakhstan?', a: 'Astana.' },
    { q: 'Largest ocean?', a: 'The Pacific.' },
    { q: 'Longest river in Africa?', a: 'The Nile.' },
    { q: 'Highest mountain on Earth?', a: 'Everest (Chomolungma), 8849 m.' },
    { q: 'Prime meridian passes through…?', a: 'Greenwich, London (0° longitude).' },
  ],
  quiz: [
    { q: 'Largest landlocked country?', options: ['Mongolia', 'Kazakhstan', 'Chad', 'Bolivia'], answer: 1 },
    { q: 'Latitude of the equator?', options: ['0°', '23.5°', '66.5°', '90°'], answer: 0 },
    { q: 'Which is a continent?', options: ['Greenland', 'Antarctica', 'Madagascar', 'Iceland'], answer: 1 },
    { q: 'Largest lake in the world by area?', options: ['Baikal', 'Balkhash', 'Caspian Sea', 'Victoria'], answer: 2 },
  ],
};
