import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { buildList, summarize, emptyState } from '../src/lib/build.js';
import { DEMO } from '../src/lib/demo.js';
import { readWorkbook, detectColumns, parseSheet, guessSheets } from '../src/lib/excelImport.js';
import { exportXlsx } from '../src/lib/excelExport.js';
import { looseKey } from '../src/lib/normalize.js';

const st = (extra = {}) => ({ ...emptyState(), ...DEMO, ...extra });

test('объединение по помещениям, количество из СД, ПИТ не дублируется', () => {
  const { items } = buildList(st());
  const bed = items.find((i) => i.name === 'Кровать функциональная');
  assert.equal(bed.qty, 10); // 6+2+2 из СД
  assert.equal(bed.china, 4);
  assert.equal(bed.buy, 6);
  assert.match(bed.rooms, /Реанимация — 6; Палата 101 — 2; Палата 102 — 2/);
  assert.equal(bed.status, 'request');
  assert.equal(bed.partial, 'едет 4, докупить 6');
  assert.equal(bed.ksQty, 9); // ПИТ (6) отброшен: 6+3
});

test('Китай покрывает всё → зелёный; позиция из КС → «Добавлено»; лишнее из Китая', () => {
  const { items, extras } = buildList(st());
  assert.equal(items.find((i) => i.name === 'Монитор пациента').status, 'china');
  assert.equal(items.find((i) => i.name === 'Кушетка медицинская').status, 'added');
  assert.deepEqual(extras.map((e) => e.name), ['Рециркулятор бактерицидный']);
  const dozator = items.find((i) => i.name === 'Дозатор для мыла');
  assert.equal(dozator.qty, 6); assert.equal(dozator.buy, 0); assert.equal(dozator.status, 'china');
});

test('ручная связь: уборочный комбайн = тележка уборочная', () => {
  const before = buildList(st());
  assert.ok(before.items.find((i) => i.name === 'Уборочный комбайн'));
  const a = looseKey('Уборочный комбайн'), b = looseKey('Тележка уборочная');
  const after = buildList(st({ aliases: { [a]: b } }));
  assert.equal(after.items.find((i) => i.name === 'Уборочный комбайн'), undefined);
  assert.equal(after.items.find((i) => i.name === 'Тележка уборочная').qty, 2); // из СД, не суммируется с КС
});

test('сумма = докупить × цена; поставщики план/факт', () => {
  const key = looseKey('Кровать функциональная');
  const s = st({ edits: { [key]: { price: 100, supplier: 'А', stage: 'paid' } } });
  assert.equal(summarize(buildList(s).items).fact, 0); // факт сам не считается
  const { items } = buildList(s);
  const sum = summarize(items, { 'А': 250 });
  assert.equal(sum.total, 600);
  assert.deepEqual(sum.suppliers[0], { name: 'А', plan: 600, fact: 250, positions: 1 });
  const edited = buildList(st({ edits: { [key]: { qty: 20, price: 100 } } })).items.find((i) => i.key === key);
  assert.equal(edited.buy, 16); assert.equal(edited.sum, 1600);
});

async function sampleXlsx() {
  const wb = new ExcelJS.Workbook();
  const sd = wb.addWorksheet('Общая заявка СД');
  sd.addRow(['Заявка']);
  sd.addRow(['Помещение', 'Наименование', 'Габариты', 'Кол-во', 'Примечание', 'Комментарий СД']);
  sd.addRow(['Реанимация', 'Кровать', '2200', 2, 'п', 'к']);
  sd.addRow(['Операционная']);
  sd.addRow(['', 'Стол операционный', '', 1]);
  const ch = wb.addWorksheet('Заказ 1');
  ch.addRow(['Наименование', 'Цена', 'Москва', 'Астана']);
  ch.addRow(['Кровать', 1000, 5, 2]);
  ch.addRow(['Итого', '', 5, 2]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

test('импорт Excel: автоопределение листов и колонок', async () => {
  const wb = await readWorkbook(await sampleXlsx(), 'Китай.xlsx');
  const g = guessSheets([wb]);
  assert.deepEqual(g.sd, ['0:0']); assert.deepEqual(g.china, ['0:1']);
  const sdRows = wb.sheets[0].rows;
  const m = detectColumns(sdRows, 'sd');
  assert.equal(m.headerRow, 1);
  const parsed = parseSheet(sdRows, m, 'sd', 'Общая заявка СД');
  assert.deepEqual(parsed.map((p) => [p.room, p.name, p.qty]), [['Реанимация', 'Кровать', 2], ['Операционная', 'Стол операционный', 1]]);
  const cm = detectColumns(wb.sheets[1].rows, 'china');
  assert.deepEqual(parseSheet(wb.sheets[1].rows, cm, 'china'), [{ name: 'Кровать', qty: 2, price: 1000 }]);
});

test('экспорт: цвета, зачёркивание, формула суммы', async () => {
  const built = buildList(st({ edits: { [looseKey('Кровать функциональная')]: { price: 100 } } }));
  // Node: exceljs.writeBuffer возвращает Blob-обёртку через наш экспорт
  const blob = await exportXlsx(built);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(await blob.arrayBuffer()));
  const ws = wb.getWorksheet('Закуп оборудования');
  let green, yellow, red, formula;
  ws.eachRow((r) => {
    const name = r.getCell(2).value;
    if (name === 'Монитор пациента') green = r.getCell(2);
    if (name === 'Кровать функциональная') { yellow = r.getCell(2); formula = r.getCell(12).value; }
    if (name === 'Кушетка медицинская') red = r.getCell(2);
  });
  assert.equal(green.font.strike, true);
  assert.equal(green.fill.fgColor.argb, 'FFC6EFCE');
  assert.equal(yellow.fill.fgColor.argb, 'FFFFF2CC'); assert.ok(!yellow.font.strike);
  assert.equal(red.fill.fgColor.argb, 'FFF8CBAD');
  assert.match(formula.formula, /^F\d+\*K\d+$/); assert.equal(formula.result, 600);
});

test('особенности реальных файлов: разделы, «≥8», «По потребности», площадь в помещении, колонка «Астана»', async () => {
  const wb = new ExcelJS.Workbook();
  const sd = wb.addWorksheet('Фарма');
  sd.addRow(['№', 'Помещение / зона', 'Наименование', 'Габаритные размеры', 'Кол-во, шт.', 'Примечание', '']);
  const sec = sd.addRow(['1. Склад ИМН', '1. Склад ИМН', '1. Склад ИМН', '1. Склад ИМН', '1. Склад ИМН', '1. Склад ИМН']);
  void sec;
  sd.addRow([1, 'Палата на 2 койки, 22,37 м²', 'Насос шприцевой', '', '≥8', '', 'коммент СД']);
  sd.addRow([2, 'Палата на 2 койки', 'Ведро', '', 'По потребности', '', '']);
  sd.addRow(['ИТОГО', 'ИТОГО', 'ИТОГО', 'ИТОГО', 45, 'Без указания стоимости', '']);
  const ks = wb.addWorksheet('Оснащение');
  ks.addRow(['Блок', 'Планировка ЦГ', 'Площадь, м²', 'Оснащение', 'Количество']);
  ks.addRow(['Блок I', 'Ресепшен', 27.5, 'стойка', 1]);
  ks.addRow(['', '', '', 'кресло', 2]);
  const f = await readWorkbook(Buffer.from(await wb.xlsx.writeBuffer()), 'x.xlsx');
  const g = guessSheets([f]);
  assert.deepEqual(g.sd, ['0:0']); assert.deepEqual(g.ks, ['0:1']);
  const rows = parseSheet(f.sheets[0].rows, detectColumns(f.sheets[0].rows, 'sd'), 'sd');
  assert.deepEqual(rows.map((r) => [r.room, r.name, r.qty]), [['Палата на 2 койки', 'Насос шприцевой', 8], ['Палата на 2 койки', 'Ведро', 0]]);
  assert.equal(rows[0].comment, 'коммент СД');
  assert.match(rows[1].note, /По потребности/);
  const k = parseSheet(f.sheets[1].rows, detectColumns(f.sheets[1].rows, 'ks'), 'ks');
  assert.deepEqual(k.map((r) => [r.room, r.name, r.qty]), [['Ресепшен', 'стойка', 1], ['Ресепшен', 'кресло', 2]]);
});
