import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { buildList, summarize, emptyState } from '../src/lib/build.js';
import { DEMO } from '../src/lib/demo.js';
import { readWorkbook, detectColumns, parseSheet, guessSheets } from '../src/lib/excelImport.js';
import { exportXlsx } from '../src/lib/excelExport.js';
import { looseKey } from '../src/lib/normalize.js';
import { classify } from '../src/lib/categories.js';

const st = (extra = {}) => ({ ...emptyState(), ...DEMO, ...extra });

test('объединение по помещениям, количество из СД, ПИТ не дублируется', () => {
  const { items } = buildList(st());
  const bed = items.find((i) => i.name === 'Кровать функциональная');
  assert.equal(bed.qty, 10); // 6+2+2 из СД
  assert.equal(bed.china, 4);
  assert.equal(bed.buy, 6);
  assert.match(bed.rooms, /Реанимация — 6; Палата 101 — 2; Палата 102 — 2/);
  assert.equal(bed.status, 'toorder'); // есть и в СД, и в КС Астана
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
  assert.deepEqual(parseSheet(wb.sheets[1].rows, cm, 'china'), [{ name: 'Кровать', qty: 2, price: 1000, order: 1 }]);
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
    if (name === 'Кровать функциональная') { yellow = r.getCell(2); formula = r.getCell(13).value; }
    if (name === 'Кушетка медицинская') red = r.getCell(2);
  });
  assert.equal(green.font.strike, true);
  assert.equal(green.fill.fgColor.argb, 'FFC6EFCE');
  assert.equal(yellow.fill.fgColor.argb, 'FFFCD5B4'); assert.ok(!yellow.font.strike);
  assert.equal(red.fill.fgColor.argb, 'FFF8CBAD');
  assert.match(formula.formula, /^F\d+\*L\d+$/); assert.equal(formula.result, 600);
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

test('«НАДО?»: «Нет» убирает красную позицию из закупа, у заявки СД и Китая бегунка нет', () => {
  const k = looseKey('Кушетка медицинская');
  const base = buildList(st()).items.find((i) => i.key === k);
  assert.equal(base.status, 'added'); assert.equal(base.canDecide, true); assert.equal(base.need, '');
  const no = buildList(st({ edits: { [k]: { need: 'no', needReason: 'есть в наличии', price: 100 } } })).items.find((i) => i.key === k);
  assert.equal(no.needReason, 'есть в наличии'); assert.equal(no.status, 'declined'); assert.equal(no.buy, 0); assert.equal(no.sum, 0);
  const yes = buildList(st({ edits: { [k]: { need: 'yes' } } })).items.find((i) => i.key === k);
  assert.equal(yes.status, 'added'); assert.equal(yes.buy, 2);
  const sd = buildList(st({ edits: { [looseKey('Принтер лазерный')]: { need: 'no' } } })).items.find((i) => i.name === 'Принтер лазерный');
  assert.equal(sd.canDecide, false); assert.equal(sd.status, 'request'); // «НАДО?» только для красных
});

test('категория «Навигация»', () => {
  assert.equal(classify('Стенд информационный, 6 карманов А4'), 'Навигация (ТЗ)');
  assert.equal(classify('Табличка на дверь'), 'Навигация (ТЗ)');
  assert.equal(classify('Стол офисный'), 'Мебель и хранение');
});

test('Китай: «Заказ 2» без колонки «Астана» берётся целиком, дубль «с фото» и позиции для УК — нет', async () => {
  const wb = new ExcelJS.Workbook();
  const a = wb.addWorksheet('Заказ 1 с фото');
  a.addRow(['№', 'Наименование', 'Фото', 'Количество', 'Цена', 'Сумма']);
  a.addRow([1, 'Кровать', '', 11, 180000, 1]);
  const b = wb.addWorksheet('Заказ 1 с филиалами');
  b.addRow(['№', 'Наименование', 'Количество', 'Астана', 'УК', 'Цена', 'Сумма']);
  b.addRow([1, 'Кровать', 11, 5, 6, 180000, 1]);
  const c = wb.addWorksheet('Заказ 2');
  c.addRow(['№', 'Наименование', 'Фото', 'Количество', 'Цена', 'Сумма']);
  c.addRow([1, 'Ширма медицинская', '', 2, 32000, 64000]);
  c.addRow([2, 'Столик обеденный для пациента УК', '', 24, 61000, 1]);
  const f = await readWorkbook(Buffer.from(await wb.xlsx.writeBuffer()), 'k.xlsx');
  const g = guessSheets([f]);
  assert.deepEqual(g.china, ['0:1', '0:2']);
  const rows = g.china.flatMap((id) => { const sh = f.sheets[+id.split(':')[1]]; const m = detectColumns(sh.rows, 'china', sh.name.includes('с филиалами') ? undefined : /количеств/); return parseSheet(sh.rows, m, 'china'); });
  assert.deepEqual(rows.map((r) => [r.name, r.qty]), [['Кровать', 5], ['Ширма медицинская', 2]]);
});

test('Китай: «Заказ 1» — едет, «Заказ 2» — в процессе оформления; лишнее из Китая спрашивает «надо ли»', () => {
  const sd = [{ room: 'А', name: 'Кровать', qty: 10, size: '', note: '', comment: '' }, { room: 'А', name: 'Стол', qty: 2, size: '', note: '', comment: '' }];
  const china = [
    { name: 'Кровать', qty: 4, price: 1, order: 1 },
    { name: 'Кровать', qty: 6, price: 1, order: 2 },
    { name: 'Стол', qty: 2, price: 1, order: 2 },
    { name: 'Бахилы', qty: 100, price: 1, order: 2 },
    { name: 'Лампа', qty: 3, price: 1, order: 1 },
  ];
  const b = buildList({ ...emptyState(), sd, china });
  const bed = b.items.find((i) => i.name === 'Кровать');
  assert.equal(bed.status, 'ordering'); assert.equal(bed.partial, 'едет 4, оформляется 6'); assert.equal(bed.buy, 0);
  const table = b.items.find((i) => i.name === 'Стол');
  assert.equal(table.status, 'ordering'); assert.equal(table.partial, '');
  const only = buildList({ ...emptyState(), sd, china: [{ name: 'Стол', qty: 2, price: 1, order: 1 }] }).items.find((i) => i.name === 'Стол');
  assert.equal(only.status, 'china');
  const ex = Object.fromEntries(b.extras.map((e) => [e.name, e]));
  assert.equal(ex['Бахилы'].kind, 'ordering'); assert.equal(ex['Лампа'].kind, 'transit'); assert.equal(ex['Лампа'].need, '');
  const declined = buildList({ ...emptyState(), sd, china, edits: { [looseKey('Лампа')]: { need: 'no', needReason: 'уже есть' } } }).extras.find((e) => e.name === 'Лампа');
  assert.equal(declined.declined, true); assert.equal(declined.needReason, 'уже есть');
});

test('источники: из каких таблиц позиция', () => {
  const sd = [{ src: 'Фарма', room: 'А', name: 'Стол', qty: 1, size: '', note: '', comment: '' }, { src: 'КС', room: 'Б', name: 'Стол', qty: 1, size: '', note: '', comment: '' }];
  const ks = [{ src: 'Оснащение', room: 'А', name: 'Стол', qty: 2 }, { src: 'Оснащение', room: 'А', name: 'Лампа', qty: 1 }];
  const china = [{ name: 'Стол', qty: 1, price: 1, order: 1 }, { name: 'Бахилы', qty: 5, price: 1, order: 2 }];
  const b = buildList({ ...emptyState(), sd, ks, china });
  assert.deepEqual(b.items.find((i) => i.name === 'Стол').sources, ['СД · Фарма', 'СД · КС', 'КС Астана', 'Китай · заказ 1']);
  assert.deepEqual(b.items.find((i) => i.name === 'Лампа').sources, ['КС Астана']);
  assert.deepEqual(b.extras[0].sources, ['Китай · заказ 2']);
});

test('«Надо заказать»: позиция есть и в СД, и в КС Астана; только в СД — «В процессе»', () => {
  const sd = [
    { src: 'Фарма', room: 'А', name: 'Стол', qty: 2, size: '', note: '', comment: '' },
    { src: 'Фарма', room: 'А', name: 'Шкаф', qty: 1, size: '', note: '', comment: '' },
    { src: 'Фарма', room: 'А', name: 'Лампа', qty: 1, size: '', note: '', comment: '' },
  ];
  const ks = [{ src: 'Оснащение', room: 'А', name: 'Стол', qty: 2 }, { src: 'Оснащение', room: 'А', name: 'Лампа', qty: 1 }];
  const china = [{ name: 'Лампа', qty: 1, price: 1, order: 1 }];
  const by = Object.fromEntries(buildList({ ...emptyState(), sd, ks, china }).items.map((i) => [i.name, i]));
  assert.equal(by['Стол'].status, 'toorder');
  assert.equal(by['Шкаф'].status, 'request');
  assert.equal(by['Лампа'].status, 'china'); // Китай уже покрывает — остаётся «Едет»
});

test('правки позиции: убрать, переименовать, помещения, «Готово»', () => {
  const sd = [{ src: 'КС', room: 'А', name: 'Весы', qty: 3, size: '', note: '', comment: '' }, { src: 'КС', room: 'Б', name: 'Дверь', qty: 1, size: '', note: '', comment: '' }];
  const kw = looseKey('Весы');
  const b = buildList({ ...emptyState(), sd, edits: { [kw]: { name: 'Весы медицинские', rooms: [['Манипуляционная', 1]] }, [looseKey('Дверь')]: { done: true } } });
  const w = b.items.find((i) => i.key === kw);
  assert.equal(w.name, 'Весы медицинские'); assert.equal(w.qty, 1); assert.equal(w.rooms, 'Манипуляционная — 1');
  const d = b.items.find((i) => i.name === 'Дверь');
  assert.equal(d.status, 'done'); assert.equal(d.buy, 0);
  const gone = buildList({ ...emptyState(), sd, edits: { [kw]: { removed: true } } });
  assert.equal(gone.items.length, 1); assert.equal(gone.removed[0].name, 'Весы');
  const back = buildList({ ...emptyState(), sd, edits: { [kw]: { removed: '' } } });
  assert.equal(back.items.length, 2);
});

test('разделы по ТЗ: мебель и навигация после обычных категорий, свой ответственный, порядок ТЗ', () => {
  const sd = [{ src: 'КС', room: 'А', name: 'Стол', qty: 1, size: '', note: '', comment: '' }];
  const sections = [
    { id: 'm', title: 'Мебель (заказ)', responsible: 'Раимбекова С.К.', order: 1, rows: [
      { name: 'Шкаф Б', qty: 5, size: '2600×700×500', places: [['Палата 2', 1], ['Палата 14', 1]] }, { name: 'Шкаф А', qty: 1, places: [] }] },
  ];
  const b = buildList({ ...emptyState(), sd, sections });
  assert.deepEqual(b.items.map((i) => i.name), ['Стол', 'Шкаф Б', 'Шкаф А']); // порядок ТЗ, а не по алфавиту
  const w = b.items[1];
  assert.equal(w.category, 'Мебель (заказ)'); assert.equal(w.responsible, 'Раимбекова С.К.'); assert.equal(w.qty, 5);
  assert.equal(w.status, 'toorder'); assert.equal(w.partial, 'по ТЗ'); assert.equal(w.canDecide, false);
  const k = w.key;
  const b2 = buildList({ ...emptyState(), sd, sections, edits: { [k]: { removed: true } } });
  assert.equal(b2.items.length, 2); assert.equal(b2.removed[0].name, 'Шкаф Б');
  const b3 = buildList({ ...emptyState(), sd, sections, edits: { [k]: { responsible: 'Иванов' } } });
  assert.equal(b3.items[1].responsible, 'Иванов');
});
