// Нормализация названий: «Кушетка медицинская» и «медицинская  кушетка» — одна позиция.

export function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim();
}

const STOP = new Set(['для', 'и', 'с', 'на', 'в', 'из', 'по', 'без', 'шт', 'мм', 'см']);

function stems(name, noParens) {
  return norm(noParens ? String(name ?? '').replace(/\([^)]*\)/g, ' ') : name)
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
  const A = new Set(stems(a, true));
  const B = new Set(stems(b, true));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((t) => B.has(t) && inter++);
  // среднее между «общей долей» и «вхождением короткого названия в длинное»
  return (inter / (A.size + B.size - inter) + inter / Math.min(A.size, B.size)) / 2;
}

export function toNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'object' && 'result' in v) return toNum(v.result);
  // «≥8» → 8, «2 или 6» → 2 (первое число), «По потребности» → 0
  const m = String(v).replace(/\s/g, '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

/** Количество записано не просто числом («≥8», «По потребности»). */
export function isOddQty(v) {
  const t = String(v ?? '').trim();
  return t !== '' && !/^\d+([.,]\d+)?$/.test(t);
}

export function fmtNum(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function fmtMoney(n) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
}
