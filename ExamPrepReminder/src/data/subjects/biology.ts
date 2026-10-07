import { Subject } from '../types';

export const biology: Subject = {
  id: 'biology', name: 'Biology', icon: '🧬', color: '#4ADE80',
  summary: [
    'The cell is the basic unit of life. Eukaryotes have a nucleus; prokaryotes do not.',
    'Mitosis produces two identical diploid cells; meiosis produces four haploid gametes.',
    'Photosynthesis (chloroplasts) stores light energy in glucose; respiration (mitochondria) releases it as ATP.',
    'DNA: double helix, base pairs A–T and G–C. Transcription DNA → mRNA, translation mRNA → protein.',
    'Mendel: dominant and recessive alleles; Aa × Aa gives a 3:1 phenotype ratio.',
  ],
  formulas: [
    '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂',
    'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP',
    'Aa × Aa → 1 AA : 2 Aa : 1 aa',
    'Chargaff: A = T, G = C',
  ],
  flashcards: [
    { q: 'Powerhouse of the cell?', a: 'Mitochondrion.' },
    { q: 'Which base pairs with adenine in DNA?', a: 'Thymine.' },
    { q: 'Where does photosynthesis happen?', a: 'In chloroplasts.' },
    { q: 'Where are proteins synthesised?', a: 'On ribosomes.' },
    { q: 'Phases of mitosis?', a: 'Prophase, metaphase, anaphase, telophase.' },
  ],
  quiz: [
    { q: 'Gas released by photosynthesis?', options: ['CO₂', 'N₂', 'O₂', 'H₂'], answer: 2 },
    { q: 'Aa × Aa: share of recessive (aa) offspring?', options: ['0%', '25%', '50%', '75%'], answer: 1 },
    { q: 'Which organelle contains DNA in animal cells (besides the nucleus)?', options: ['Ribosome', 'Mitochondrion', 'Golgi', 'Lysosome'], answer: 1 },
    { q: 'Meiosis produces…', options: ['2 diploid cells', '4 haploid cells', '2 haploid cells', '4 diploid cells'], answer: 1 },
  ],
};
