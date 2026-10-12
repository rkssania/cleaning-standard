// Чтение Excel и автоопределение колонок. Работает и в браузере, и в Node (для тестов).
import { norm, toNum } from './normalize.js';

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
  name: /наименован|название|оборудован|позици|товар/,
  room: /помещен|зона|кабинет|комнат|отделен|подраздел/,
  size: /габарит|размер|характеристик|параметр|модел/,
  qty: /^(кол|количеств|шт( |$))|кол во/,
  note: /примечан/,
  comment: /коммент/,
  price: /цена|стоимост/,
};

function colMatchers(kind) {
  if (kind === 'china') return { ...RE, qty: /астан/ };
  return RE;
}

/** Ищет строку заголовков и сопоставляет колонки. Возвращает {headerRow, cols:{field:index}, headers}. */
export function detectColumns(rows, kind) {
  const re = colMatchers(kind);
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
  const width = Math.max(0, ...rows.slice(0, 40).map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => String(hr[i] ?? '').trim());
  return { headerRow: best.headerRow, cols: best.cols, headers };
}

const SKIP = /^(итого|всего|сумма)/;

/**
 * Разбор листа. map = {headerRow, cols}. defaultRoom — имя листа, если колонки «Помещение» нет.
 * Строка, в которой заполнено только наименование, считается заголовком раздела (помещением).
 */
export function parseSheet(rows, map, kind, defaultRoom = '') {
  const { cols, headerRow } = map;
  const out = [];
  let room = defaultRoom;
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (f) => (cols[f] === undefined ? '' : row[cols[f]] ?? '');
    const name = String(get('name')).trim();
    const filled = row.filter((v) => String(v ?? '').trim() !== '');
    // Строка с единственным значением — заголовок раздела (помещение), а не позиция.
    // Исключение: если помещения вынесены в отдельную колонку, одинокое название — позиция без количества.
    if (filled.length === 1 && kind !== 'china' && String(get('qty')).trim() === '') {
      const only = String(filled[0]).trim();
      if (!(only === name && cols.room !== undefined)) {
        if (!SKIP.test(norm(only))) room = only;
        continue;
      }
    }
    if (!name || SKIP.test(norm(name))) continue;
    const qtyRaw = get('qty');
    if (kind === 'china') {
      if (!toNum(qtyRaw)) continue;
      out.push({ name, qty: toNum(qtyRaw), price: toNum(get('price')) });
      continue;
    }
    const roomCell = String(get('room')).trim();
    if (cols.room !== undefined && roomCell) room = roomCell;
    out.push({
      room: cols.room !== undefined ? roomCell || room : room,
      name,
      size: String(get('size')).trim(),
      qty: toNum(qtyRaw),
      note: String(get('note')).trim(),
      comment: String(get('comment')).trim(),
    });
  }
  return out;
}

/** Подбирает листы по названиям для трёх источников. */
export function guessSheets(files) {
  const rules = {
    sd: (f, s) => /общая.*заявк|заявк.*сд|^сд$|(?<![а-я])сд(?![а-я])/i.test(s) || /общая.*заявк|заявк.*сд/i.test(f),
    ks: (f, s) => /кс.*астан|астан.*кс|^кс(?![а-я])/i.test(s) || (/кс.*астан/i.test(f) && !/заявк/i.test(s)),
    china: (f, s) => /заказ\s*1/i.test(s) || (/китай/i.test(f) && /заказ/i.test(s)),
  };
  const res = { sd: [], ks: [], china: [] };
  files.forEach((fl, fi) => fl.sheets.forEach((sh, si) => {
    for (const k of ['sd', 'ks', 'china']) {
      if (res[k].length === 0 || k === 'ks' || k === 'sd') {
        if (rules[k](fl.file, sh.name)) res[k].push(`${fi}:${si}`);
      }
    }
  }));
  // Лист не должен попадать в два источника сразу — СД имеет приоритет над КС
  res.ks = res.ks.filter((id) => !res.sd.includes(id));
  res.china = res.china.filter((id) => !res.sd.includes(id) && !res.ks.includes(id)).slice(0, 1);
  return res;
}
