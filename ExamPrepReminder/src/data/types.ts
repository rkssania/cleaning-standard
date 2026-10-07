export type SubjectId =
  | 'kazakh' | 'chemistry' | 'math' | 'kzhistory' | 'geography' | 'esl'
  | 'physics' | 'cs' | 'ruliterature' | 'worldhistory' | 'rulanguage' | 'biology';

export interface Flashcard { q: string; a: string }

export interface QuizQuestion {
  q: string;
  options: string[];
  /** index into options */
  answer: number;
  explanation?: string;
}

export interface Subject {
  id: SubjectId;
  name: string;
  icon: string;
  color: string;
  summary: string[];
  formulas: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface ExamDay {
  /** ISO date, e.g. 2026-10-12 */
  id: string;
  day: number;
  month: number;
  subjects: SubjectId[];
}
