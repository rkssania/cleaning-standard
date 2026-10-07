import { ExamDay } from './types';

/** Year of the exam session. Change here if the schedule moves to another year. */
export const EXAM_YEAR = 2026;
/** Local time at which exams are assumed to start (used for the countdown). */
export const EXAM_START_HOUR = 9;
/** Local time of the evening reminder on the day before. */
export const REMINDER_HOUR = 19;

const day = (d: number, m: number, subjects: ExamDay['subjects']): ExamDay => ({
  id: `${EXAM_YEAR}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
  day: d,
  month: m,
  subjects,
});

export const EXAM_DAYS: ExamDay[] = [
  day(12, 10, ['kazakh', 'chemistry']),
  day(13, 10, ['math', 'kzhistory', 'geography']),
  day(14, 10, ['esl', 'physics']),
  day(15, 10, ['cs', 'ruliterature', 'worldhistory']),
  day(16, 10, ['rulanguage', 'biology']),
];
