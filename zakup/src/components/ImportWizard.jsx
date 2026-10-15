import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { FIELDS, detectColumns, guessSheets, parseSheet, readWorkbook } from '../lib/excelImport.js';
import { Modal } from './ui.jsx';

const SLOTS = [
  ['sd', 'Общая заявка СД', 'Основная заявка. Количество берётся отсюда.'],
  ['ks', 'КС Астана', 'Потребность по помещениям. Для сверки с заявкой СД.'],
  ['china', 'Китай (лист «Заказ 1»)', 'Уже закуплено и в пути, колонка «Астана».'],
];

const colLetter = (i) => { let s = ''; for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };

function SheetMapper({ slot, sheet, map, setMap }) {
  const { headers } = map;
  return (
    <div className="mt-2 rounded-md bg-slate-50 p-2">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-600">
        Строка заголовков:
        <input type="number" min="1" className="inp !w-16" value={map.headerRow + 1}
          onChange={(e) => setMap(detectWithRow(sheet, slot, Math.max(0, Number(e.target.value) - 1), map))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {FIELDS[slot].map(([f, label]) => (
          <label key={f} className="text-xs text-slate-600">
            {label}
            <select className="inp" value={map.cols[f] ?? ''} onChange={(e) => {
              const cols = { ...map.cols };
              if (e.target.value === '') delete cols[f]; else cols[f] = Number(e.target.value);
              setMap({ ...map, cols });
            }}>
              <option value="">— нет —</option>
              {headers.map((h, i) => <option key={i} value={i}>{colLetter(i)}{h ? `: ${h.slice(0, 30)}` : ''}</option>)}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}

function detectWithRow(sheet, slot, headerRow, prev) {
  const hr = sheet.rows[headerRow] || [];
  return { ...prev, headerRow, headers: prev.headers.map((_, i) => String(hr[i] ?? '').trim()) };
}

export default function ImportWizard({ hasData, onImport, onClose }) {
  const [files, setFiles] = useState([]);
  const [sel, setSel] = useState({ sd: [], ks: [], china: [] }); // id листов "файл:лист"
  const [maps, setMaps] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const sheetOf = (id) => { const [f, s] = id.split(':').map(Number); return { file: files[f], sheet: files[f].sheets[s] }; };
  const mapOf = (slot, id) => maps[`${slot}|${id}`] || { ...detectColumns(sheetOf(id).sheet.rows, slot) };

  const onFiles = async (e) => {
    setBusy(true); setErr('');
    try {
      const loaded = [];
      for (const f of e.target.files) loaded.push(await readWorkbook(await f.arrayBuffer(), f.name));
      setFiles(loaded); setMaps({});
      setSel(guessSheets(loaded));
    } catch (ex) {
      setErr('Не удалось прочитать файл. Нужен формат .xlsx. ' + ex.message);
    }
    setBusy(false);
  };

  const toggle = (slot, id) => setSel((s) => ({ ...s, [slot]: s[slot].includes(id) ? s[slot].filter((x) => x !== id) : [...s[slot], id] }));

  const preview = useMemo(() => {
    const r = {};
    if (!files.length) return r;
    for (const [slot] of SLOTS) {
      r[slot] = sel[slot].reduce((n, id) => n + parseSheet(sheetOf(id).sheet.rows, mapOf(slot, id), slot, sheetOf(id).sheet.name).length, 0);
    }
    return r;
  }, [files, sel, maps]); // eslint-disable-line

  const run = () => {
    const out = {};
    for (const [slot] of SLOTS) {
      if (!sel[slot].length) continue;
      out[slot] = sel[slot].flatMap((id) => parseSheet(sheetOf(id).sheet.rows, mapOf(slot, id), slot, sheetOf(id).sheet.name));
    }
    onImport(out);
    onClose();
  };

  const any = SLOTS.some(([s]) => sel[s].length);
  return (
    <Modal title="Импорт из Excel" onClose={onClose} wide>
      <div className="space-y-4">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand/40 bg-brand-light p-5 text-brand">
          <Upload size={20} />
          <span className="font-medium">{files.length ? `Загружено файлов: ${files.length}. Выбрать другие` : 'Выбрать файлы .xlsx (можно несколько сразу)'}</span>
          <input type="file" accept=".xlsx,.xlsm" multiple className="hidden" onChange={onFiles} />
        </label>
        {busy && <p className="text-sm text-slate-500">Читаю файлы…</p>}
        {err && <p className="text-sm text-red-700">{err}</p>}

        {files.length > 0 && SLOTS.map(([slot, title, hint]) => (
          <section key={slot} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-brand">{title}</h3>
              <span className="text-xs text-slate-500">{sel[slot].length ? `найдено строк: ${preview[slot] ?? 0}` : 'не выбрано — данные останутся прежними'}</span>
            </div>
            <p className="text-xs text-slate-500">{hint}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {files.flatMap((fl, fi) => fl.sheets.map((sh, si) => {
                const id = `${fi}:${si}`; const on = sel[slot].includes(id);
                return (
                  <button key={id} onClick={() => toggle(slot, id)} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${on ? 'border-brand bg-brand text-white' : 'bg-white'}`}>
                    <FileSpreadsheet size={12} />{files.length > 1 ? `${fl.file} · ` : ''}{sh.name}
                  </button>
                );
              }))}
            </div>
            {sel[slot].map((id) => (
              <div key={id} className="mt-2">
                <div className="text-xs font-medium">{sheetOf(id).sheet.name}</div>
                <SheetMapper slot={slot} sheet={sheetOf(id).sheet} map={mapOf(slot, id)} setMap={(m) => setMaps((x) => ({ ...x, [`${slot}|${id}`]: m }))} />
              </div>
            ))}
          </section>
        ))}

        {files.length > 0 && (
          <>
            <p className="text-xs text-slate-500">
              Если колонки «Помещение» нет, помещением считается название листа или строка-раздел.
              Ручные связи, поставщики, цены и прочие правки сохраняются{hasData ? '; загруженные ранее источники с выбранными листами заменяются' : ''}.
            </p>
            <button className="btn btn-primary w-full !py-3" disabled={!any} onClick={run}>Импортировать</button>
          </>
        )}
      </div>
    </Modal>
  );
}
