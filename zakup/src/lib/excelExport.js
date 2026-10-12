// Экспорт в Excel: цвета статусов и зачёркивание сохраняются, «Сумма» — живая формула.
import { CATEGORIES } from './categories.js';
import { STATUS, STAGE_LABEL, summarize } from './build.js';

const FILL = { china: 'FFC6EFCE', request: 'FFFFF2CC', added: 'FFF8CBAD', extra: 'FFE2F0D9' };
const COLS = [
  ['№', 5], ['Наименование', 38], ['Категория', 24], ['Кол-во всего', 10], ['Из Китая, шт', 10], ['Докупить, шт', 10],
  ['Характеристики / габариты', 28], ['Где (помещения)', 38], ['Статус', 26], ['Поставщик', 20],
  ['Цена за ед., тг', 13], ['Сумма, тг', 14], ['Ответственный', 18], ['Срок поставки', 13], ['Этап закупа', 14], ['Комментарий', 30],
];

const solid = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const thin = { style: 'thin', color: { argb: 'FFBFBFBF' } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

export async function exportXlsx({ items, extras }, facts = {}) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Центр гематологии, Астана';
  const ws = wb.addWorksheet('Закуп оборудования', { views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }] });
  ws.columns = COLS.map(([header, width]) => ({ header, width }));
  const head = ws.getRow(1);
  head.height = 32;
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = solid('FF12396B');
    c.alignment = { vertical: 'middle', wrapText: true, horizontal: 'center' };
    c.border = border;
  });

  const section = (title, argb) => {
    const row = ws.addRow([title]);
    ws.mergeCells(row.number, 1, row.number, COLS.length);
    row.getCell(1).font = { bold: true, size: 12 };
    row.getCell(1).fill = solid(argb);
    row.height = 22;
  };

  const style = (row, status, strike) => {
    row.eachCell({ includeEmpty: true }, (c, col) => {
      c.fill = solid(FILL[status]);
      c.border = border;
      c.alignment = { vertical: 'top', wrapText: true, horizontal: [1, 4, 5, 6, 11, 12].includes(col) ? 'right' : 'left' };
      c.font = { strike, color: { argb: strike ? 'FF4F6F4F' : 'FF000000' } };
    });
    row.getCell(11).numFmt = '#,##0';
    row.getCell(12).numFmt = '#,##0';
  };

  for (const cat of CATEGORIES) {
    const list = items.filter((i) => i.category === cat);
    if (!list.length) continue;
    section(cat, 'FFD9E1F2');
    for (const it of list) {
      const row = ws.addRow([
        it.no, it.name, it.category, it.qty, it.china, it.buy,
        [it.size, ...it.notes].filter(Boolean).join('; '), it.rooms,
        it.partial ? `${STATUS[it.status]} (${it.partial})` : STATUS[it.status],
        it.supplier, it.price || null, null, it.responsible, it.deadline,
        STAGE_LABEL[it.stage], [...it.comments, it.comment].filter(Boolean).join('; '),
      ]);
      row.getCell(12).value = { formula: `F${row.number}*K${row.number}`, result: it.sum };
      style(row, it.status, it.status === 'china');
    }
  }

  if (extras.length) {
    section('Едет из Китая, но нет в потребности', 'FFC5E0B3');
    for (const e of extras) {
      const row = ws.addRow(['', e.name, e.category, '', e.qty, '', '', '', STATUS.extra, '', e.price || null, null, '', '', '', '']);
      style(row, 'extra', false);
    }
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLS.length } };

  // Сводка
  const s = summarize(items, facts);
  const sm = wb.addWorksheet('Сводка');
  sm.columns = [{ width: 38 }, { width: 18 }, { width: 18 }, { width: 14 }];
  const bold = (r) => r.eachCell((c) => (c.font = { bold: true }));
  bold(sm.addRow(['Позиции по статусам']));
  for (const k of ['china', 'request', 'added']) {
    const r = sm.addRow([STATUS[k], s.counts[k]]);
    r.getCell(1).fill = solid(FILL[k]);
  }
  sm.addRow([STATUS.extra, extras.length]).getCell(1).fill = solid(FILL.extra);
  sm.addRow([]);
  bold(sm.addRow(['Итого к закупу, тг', s.total]));
  sm.addRow(['Факт (внесён вручную), тг', s.fact || null]);
  sm.addRow([]);
  bold(sm.addRow(['Поставщик', 'План, тг', 'Факт, тг', 'Позиций']));
  s.suppliers.forEach((x) => sm.addRow([x.name, x.plan, x.fact || null, x.positions]));
  sm.eachRow((r) => [2, 3].forEach((c) => (r.getCell(c).numFmt = '#,##0')));

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function download(blob, name, downloads) {
  // В опубликованной странице скачивание идёт через возможность downloads (с подтверждением у пользователя).
  if (downloads) {
    try { await downloads.save({ filename: name, data: blob }); return; } catch (e) { if (e?.code === 'declined') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
