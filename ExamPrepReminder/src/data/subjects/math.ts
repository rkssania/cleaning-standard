import { Subject } from '../types';

export const math: Subject = {
  id: 'math', name: 'Mathematics', icon: '📐', color: '#7C9CFF',
  summary: [
    'Quadratic equations: compute the discriminant first. D > 0 gives two real roots, D = 0 one root, D < 0 no real roots.',
    'Derivatives measure the rate of change. Use the product, quotient and chain rules for complex functions.',
    'Logarithms turn multiplication into addition: log(ab) = log a + log b.',
    'Progressions: arithmetic has a constant difference d, geometric has a constant ratio q.',
  ],
  formulas: [
    'x = (−b ± √D) / 2a,  D = b² − 4ac',
    '(xⁿ)′ = n·xⁿ⁻¹,  (sin x)′ = cos x,  (cos x)′ = −sin x',
    'sin²x + cos²x = 1',
    'aₙ = a₁ + (n−1)d,  Sₙ = n(a₁+aₙ)/2',
    'bₙ = b₁·qⁿ⁻¹,  Sₙ = b₁(qⁿ−1)/(q−1)',
    'log_a(xʸ) = y·log_a x',
  ],
  flashcards: [
    { q: 'What does D < 0 mean for a quadratic?', a: 'No real roots.' },
    { q: 'Derivative of sin x?', a: 'cos x' },
    { q: 'Sum of the first n terms of an arithmetic progression?', a: 'Sₙ = n(a₁ + aₙ) / 2' },
    { q: 'sin 30°?', a: '1/2' },
    { q: 'Chain rule?', a: '(f(g(x)))′ = f′(g(x))·g′(x)' },
  ],
  quiz: [
    { q: 'Derivative of x³?', options: ['x²', '3x²', '3x', 'x³/3'], answer: 1 },
    { q: 'log₂ 8 = ?', options: ['2', '3', '4', '8'], answer: 1, explanation: '2³ = 8.' },
    { q: 'Roots of x² − 5x + 6 = 0?', options: ['1 and 6', '−2 and −3', '2 and 3', '5 and 1'], answer: 2, explanation: 'Sum = 5, product = 6.' },
    { q: 'sin²x + cos²x = ?', options: ['0', '1', '2', 'sin 2x'], answer: 1 },
  ],
};
