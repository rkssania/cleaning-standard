import { Subject } from '../types';

export const chemistry: Subject = {
  id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#34D399',
  summary: [
    'Atoms consist of protons, neutrons and electrons. The element is defined by the number of protons (atomic number).',
    'Bond types: ionic (metal + non-metal, electron transfer), covalent (shared pairs), metallic.',
    'The mole connects mass and particles: 1 mol = 6.02·10²³ particles.',
    'Acids give H⁺, bases give OH⁻. Neutral pH = 7, acids < 7, bases > 7.',
    'In redox reactions the oxidiser gains electrons and the reducing agent loses them.',
  ],
  formulas: [
    'n = m / M',
    'N = n · Nₐ,  Nₐ = 6.02·10²³ mol⁻¹',
    'V = n · 22.4 L (gas at STP)',
    'ω = m(solute) / m(solution) · 100%',
    'C = n / V',
    'pH = −lg[H⁺]',
  ],
  flashcards: [
    { q: 'Bond in NaCl?', a: 'Ionic.' },
    { q: 'Molar volume of a gas at STP?', a: '22.4 L/mol' },
    { q: 'Avogadro constant?', a: '6.02·10²³ mol⁻¹' },
    { q: 'What does the oxidiser do?', a: 'Accepts electrons (is reduced).' },
    { q: 'Group number of the alkali metals?', a: 'Group 1 (IA).' },
  ],
  quiz: [
    { q: 'pH of a neutral solution?', options: ['0', '7', '10', '14'], answer: 1 },
    { q: 'Moles in 18 g of water (M = 18 g/mol)?', options: ['0.5', '1', '2', '18'], answer: 1, explanation: 'n = m/M = 18/18.' },
    { q: 'Which is an acid?', options: ['NaOH', 'H₂SO₄', 'NaCl', 'CaO'], answer: 1 },
    { q: 'Lightest element?', options: ['Helium', 'Lithium', 'Hydrogen', 'Carbon'], answer: 2 },
  ],
};
