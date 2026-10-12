// Нормализация названий: «Кушетка медицинская» и «медицинская  кушетка» — одна позиция.

export function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim();
}

const STOP = new Set(['для', 'и', 'с', 'на', 'в', 'из', 'по', 'без', 'шт', 'мм', 'см']);

function stems(name) {
  return norm(name)
    .split(' ')
    .filter((t) => t && !STOP.has(t))
    .map((t) => (/^\d+$/.test(t) ? t : t.slice(0, 5)));
}

/** Ключ позиции: не зависит от порядка слов и окончаний. */
export function looseKey(name) {
  return [...new Set(stems(name))].sort().join(' ');
}

/** Похожесть двух названий 0..1 — для подсказок «возможно, это одно и то же». */
export function similarity(a, b) {
  const A = new Set(stems(a));
  const B = new Set(stems(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((t) => B.has(t) && inter++);
  return inter / (A.size + B.size - inter);
}

export function toNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'object' && 'result' in v) return toNum(v.result);
  const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function fmtNum(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function fmtMoney(n) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
}
