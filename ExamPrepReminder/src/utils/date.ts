import { EXAM_START_HOUR, EXAM_YEAR, REMINDER_HOUR } from '../data/exams';
import { ExamDay } from '../data/types';

export const dateOf = (d: ExamDay, hour = 0, minute = 0) =>
  new Date(EXAM_YEAR, d.month - 1, d.day, hour, minute, 0, 0);

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const examStart = (d: ExamDay) => dateOf(d, EXAM_START_HOUR);

/** 19:00 on the evening before the exam day. */
export const reminderDate = (d: ExamDay) => addDays(dateOf(d, REMINDER_HOUR), -1);

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const weekdayOf = (d: ExamDay) => WEEKDAYS[dateOf(d).getDay()];
export const label = (d: ExamDay) =>
  `${String(d.day).padStart(2, '0')}.${String(d.month).padStart(2, '0')}`;

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 60000));
  return { days: Math.floor(total / 1440), hours: Math.floor((total % 1440) / 60), minutes: total % 60 };
}
