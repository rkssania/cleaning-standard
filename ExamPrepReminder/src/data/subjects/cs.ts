import { Subject } from '../types';

export const cs: Subject = {
  id: 'cs', name: 'Computer Science', icon: '💻', color: '#22D3EE',
  summary: [
    'Computers store everything in binary. 1 byte = 8 bits; 1 KB = 1024 bytes.',
    'Algorithms are described by pseudocode or flowcharts: sequence, branching, loops.',
    'Data structures: array (indexed), stack (LIFO), queue (FIFO), linked list, tree.',
    'Binary search needs a sorted array and takes O(log n); linear search takes O(n).',
    'Logic: AND, OR, NOT, XOR; truth tables describe them.',
  ],
  formulas: [
    '2⁸ = 256,  2¹⁰ = 1024',
    '1010₂ = 8 + 2 = 10₁₀',
    'Information: N = 2ⁱ (N options need i bits)',
    'Bubble sort O(n²), merge sort O(n log n)',
  ],
  flashcards: [
    { q: 'LIFO structure?', a: 'Stack.' },
    { q: 'FIFO structure?', a: 'Queue.' },
    { q: 'Complexity of binary search?', a: 'O(log n)' },
    { q: 'What does a compiler do?', a: 'Translates the whole source code into machine code before running.' },
    { q: 'What is the decimal value of 1111₂?', a: '15' },
  ],
  quiz: [
    { q: '1010₂ in decimal?', options: ['8', '10', '12', '5'], answer: 1 },
    { q: 'Which structure works as LIFO?', options: ['Queue', 'Stack', 'Array', 'Graph'], answer: 1 },
    { q: 'How many values can 8 bits hold?', options: ['8', '64', '256', '1024'], answer: 2 },
    { q: 'Binary search requires the array to be…', options: ['Empty', 'Sorted', 'Of strings', 'Reversed'], answer: 1 },
  ],
};
