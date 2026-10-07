import { Subject } from '../types';

export const physics: Subject = {
  id: 'physics', name: 'Physics', icon: '⚛️', color: '#F59E0B',
  summary: [
    'Newton\'s laws: inertia, F = ma, and action equals reaction.',
    'Energy is conserved: kinetic and potential energy transform into each other.',
    'In a series circuit the current is the same; in a parallel circuit the voltage is the same.',
    'Heat: Q = cmΔT; phase changes need latent heat.',
  ],
  formulas: [
    'v = s / t,  a = (v − v₀) / t',
    'F = ma,  p = mv',
    'Eₖ = mv²/2,  Eₚ = mgh',
    'A = F·s,  P = A / t',
    'I = U / R,  P = U·I',
    'Q = c·m·ΔT',
    'R_series = R₁ + R₂,  1/R_parallel = 1/R₁ + 1/R₂',
  ],
  flashcards: [
    { q: 'Unit of force?', a: 'Newton (N) = kg·m/s²' },
    { q: 'Ohm\'s law?', a: 'I = U / R' },
    { q: 'Acceleration due to gravity?', a: 'g ≈ 9.8 m/s² (≈ 10 in rough problems)' },
    { q: 'Unit of power?', a: 'Watt (W) = J/s' },
    { q: 'Formula for kinetic energy?', a: 'Eₖ = mv²/2' },
  ],
  quiz: [
    { q: 'A 2 kg body accelerates at 3 m/s². Force?', options: ['1.5 N', '5 N', '6 N', '9 N'], answer: 2 },
    { q: 'U = 12 V, R = 4 Ω. Current?', options: ['3 A', '8 A', '48 A', '0.33 A'], answer: 0 },
    { q: 'Which unit measures energy?', options: ['Watt', 'Joule', 'Newton', 'Pascal'], answer: 1 },
    { q: 'Speed of light in vacuum ≈', options: ['3·10⁶ m/s', '3·10⁸ m/s', '3·10¹⁰ m/s', '340 m/s'], answer: 1 },
  ],
};
