// Чтение Excel и автоопределение колонок. Работает и в браузере, и в Node (для тестов).
import { norm, toNum, isOddQty } from './normalize.js';

function plain(v) {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if ('result' in v) return plain(v.result);
    if (v.richText) return v.richText.map((t) => t.text).join('');
    if ('text' in v) return plain(v.text);
    return '';
  }
  return v;
}

export async function readWorkbook(buffer, fileName) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheets = wb.worksheets.map((ws) => {
    const rows = [];
    ws.eachRow({ includeEmpty: true }, (row, r) => {
      const arr = [];
      for (let c = 1; c <= ws.columnCount; c++) arr.push(plain(row.getCell(c).value));
      rows[r - 1] = arr;
    });
    for (let i = 0; i < rows.length; i++) rows[i] = rows[i] || [];
    return { name: ws.name, rows };
  });
  return { file: fileName, sheets };
}

export const FIELDS = {
  sd: [['name', 'Наименование'], ['room', 'Помещение / зона'], ['size', 'Габариты'], ['qty', 'Количество'], ['note', 'Примечание'], ['comment', 'Комментарий СД']],
  ks: [['name', 'Наименование'], ['room', 'Помещение / зона'], ['size', 'Габариты'], ['qty', 'Количество'], ['note', 'Примечание']],
  china: [['name', 'Наименование'], ['qty', 'Количество (колонка «Астана»)'], ['price', 'Цена']],
};

const RE = {
  name: /наименован|название|оборудован|оснащен|позици|товар/,
  room: /помещен|зона|кабинет|комнат|отделен|подраздел|планир/,
  size: /габарит|размер|характеристик|параметр|модел/,
  qty: /количеств|^кол|кол во|^шт( |$)/,
  note: /примечан/,
  comment: /коммент/,
  price: /цена|стоимост/,
};

function colMatchers(kind) {
  if (kind === 'china') return { ...RE, qty: /астан/ };
  return RE;
}

/** Ищет строку заголовков и сопоставляет колонки. Возвращает {headerRow, cols:{field:index}, headers}. */
export function detectColumns(rows, kind, qtyRe) {
  const re = { ...colMatchers(kind), ...(qtyRe ? { qty: qtyRe } : {}) };
  const fields = FIELDS[kind].map((f) => f[0]);
  let best = { score: 0, headerRow: 0, cols: {} };
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const cols = {};
    const used = new Set();
    rows[r].forEach((cell, c) => {
      const t = norm(cell);
      if (!t) return;
      for (const f of fields) {
        if (cols[f] === undefined && !used.has(c) && re[f].test(t)) {
          cols[f] = c;
          used.add(c);
          break;
        }
      }
    });
    const score = Object.keys(cols).length + (cols.name !== undefined ? 2 : 0) + (cols.qty !== undefined ? 1 : 0);
    if (score > best.score) best = { score, headerRow: r, cols };
  }
  const hr = rows[best.headerRow] || [];
  if (kind === 'sd' && best.cols.comment === undefined && best.cols.note !== undefined) {
    const next = best.cols.note + 1;
    const hasData = rows.slice(best.headerRow + 1).some((r) => String(r[next] ?? '').trim());
    if (!String(hr[next] ?? '').trim() && hasData) best.cols.comment = next;
  }
  const width = Math.max(0, ...rows.slice(0, 40).map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => String(hr[i] ?? '').trim());
  return { headerRow: best.headerRow, cols: best.cols, headers };
}

const SKIP = /^(итого|всего|сумма)/;

/** «Палата на 2 койки, 22,37 м²» → «Палата на 2 койки» */
export const cleanRoom = (r) => String(r ?? '').replace(/[,;(]?\s*\d+(?:[.,]\d+)?\s*(?:кв\.?\s*м|м[²2])\.?\)?/gi, '').replace(/\s+/g, ' ').trim();

/**
 * Разбор листа. map = {headerRow, cols}. defaultRoom — имя листа, если колонки «Помещение» нет.
 * Строки-разделы («1. Склад…», где во всех ячейках один и тот же текст, или заполнена одна ячейка) не попадают в список.
 */
export function parseSheet(rows, map, kind, defaultRoom = '') {
  const { cols, headerRow } = map;
  const out = [];
  let room = defaultRoom;
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (f) => (cols[f] === undefined ? '' : row[cols[f]] ?? '');
    const name = String(get('name')).trim();
    const filled = row.map((v) => String(v ?? '').trim()).filter(Boolean);
    if (!filled.length) continue;
    if (kind !== 'china') {
      // весь ряд — один и тот же текст (объединённая ячейка-раздел)
      if (filled.length > 1 && filled.every((v) => v === filled[0])) {
        if (cols.room === undefined && !SKIP.test(norm(filled[0]))) room = cleanRoom(filled[0]);
        continue;
      }
      // Одно значение в ряду — заголовок раздела (помещение), если помещения не вынесены в колонку.
      if (filled.length === 1 && String(get('qty')).trim() === '') {
        if (!(filled[0] === name && cols.room !== undefined)) {
          // помещение без оборудования в своей колонке: следующие строки с пустой ячейкой относятся к нему
          const roomOnly = cols.room !== undefined && String(get('room')).trim() === filled[0];
          if (!SKIP.test(norm(filled[0])) && (cols.room === undefined || roomOnly)) room = cleanRoom(filled[0]);
          continue;
        }
      }
    }
    if (!name || SKIP.test(norm(name))) continue;
    const qtyRaw = get('qty');
    if (kind === 'china') {
      if (!toNum(qtyRaw)) continue;
      // «…для пациента УК» — позиция для другого филиала, в Астану не едет
      if (/(^|[^а-яё])ук($|[^а-яё])/i.test(name)) continue;
      out.push({ name, qty: toNum(qtyRaw), price: toNum(get('price')), order: /заказ\s*2/i.test(defaultRoom) ? 2 : 1 });
      continue;
    }
    const roomCell = cleanRoom(get('room'));
    if (cols.room !== undefined && roomCell) room = roomCell;
    let note = String(get('note')).trim();
    if (isOddQty(qtyRaw)) note = [`Кол-во в источнике: ${String(qtyRaw).trim()}`, note].filter(Boolean).join('; ');
    out.push({
      room: cols.room !== undefined ? roomCell || room : room,
      name,
      size: String(get('size')).trim(),
      qty: toNum(qtyRaw),
      note,
      comment: String(get('comment')).trim(),
    });
  }
  return out;
}

/**
 * Подбирает листы для трёх источников по содержимому заголовков (имена файлов и листов могут быть любыми):
 *  - Китай: есть колонка «Астана» (+ наименование);
 *  - КС Астана: «Оснащение» / «Планировка» или лист с названием «КС Астана»;
 *  - Общая заявка СД: колонки помещение + наименование + количество (все остальные листы такого вида).
 */
export function guessSheets(files) {
  const res = { sd: [], ks: [], china: [] };
  const chinaWithAstana = [];
  const chinaPlain = [];
  files.forEach((fl, fi) => fl.sheets.forEach((sh, si) => {
    const id = `${fi}:${si}`;
    const m = detectColumns(sh.rows, 'sd');
    const c = detectColumns(sh.rows, 'china');
    const plain = detectColumns(sh.rows, 'china', /количеств/);
    if (c.cols.name !== undefined && c.cols.qty !== undefined) chinaWithAstana.push(id);
    else if (/оснащен|планировк/.test(norm(sh.rows[m.headerRow]?.join(' ') ?? '')) && m.cols.name !== undefined || /кс.*астан/.test(norm(sh.name))) res.ks.push(id);
    else if (m.cols.name !== undefined && m.cols.qty !== undefined && m.cols.room !== undefined) res.sd.push(id);
    else if (plain.cols.name !== undefined && plain.cols.qty !== undefined && plain.cols.price !== undefined) chinaPlain.push(id);
  }));
  // Лист заказа без колонки «Астана» (например «Заказ 2») берём целиком,
  // но не если он повторяет уже выбранный (например «Заказ 1 с фото» дублирует «с филиалами»).
  const namesOf = (id) => {
    const [a, b] = id.split(':').map(Number);
    const sh = files[a].sheets[b];
    const c = detectColumns(sh.rows, 'china', /количеств/);
    return new Set(sh.rows.slice(c.headerRow + 1).map((r) => norm(r[c.cols.name])).filter(Boolean));
  };
  const chosen = chinaWithAstana.map(namesOf);
  res.china = [...chinaWithAstana];
  for (const id of chinaPlain) {
    const n = namesOf(id);
    const overlap = [...n].filter((x) => chosen.some((s) => s.has(x))).length;
    if (n.size && overlap / n.size < 0.5) { res.china.push(id); chosen.push(n); }
  }
  return res;
}
