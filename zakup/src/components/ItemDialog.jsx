import React, { useRef, useState } from 'react';
import { CheckCircle2, EyeOff, Paperclip, Plus, Trash2, Unlink, X } from 'lucide-react';
import { STAGES, resolveKey } from '../lib/build.js';
import { CATEGORIES } from '../lib/categories.js';
import { download } from '../lib/excelExport.js';
import { prepareFile } from '../lib/files.js';
import { fmtMoney } from '../lib/normalize.js';
import { EditInput, Field, Modal, NeedBlock, QtyStepper, Rooms, StatusBadge } from './ui.jsx';
import LinkPicker from './LinkPicker.jsx';

/** Редактор помещений: «где стоит» и сколько штук в каждом. */
function RoomsEditor({ it, onSave }) {
  const [rows, setRows] = useState(null); // null — не редактируем
  const start = () => setRows(it.roomEntries.length ? it.roomEntries.map(([r, q]) => [r, String(q)]) : [['', '1']]);
  const set = (i, j, v) => setRows(rows.map((r, k) => (k === i ? r.map((x, m) => (m === j ? v : x)) : r)));
  const save = () => {
    const clean = rows.map(([r, q]) => [r.trim(), Number(String(q).replace(',', '.')) || 0]).filter(([r]) => r);
    onSave(clean.length ? clean : '');
    setRows(null);
  };
  if (!rows) {
    return (
      <div className="flex flex-wrap gap-2">
        <button className="btn !py-1 text-xs" onClick={start}>Изменить помещения</button>
        {it.roomsEdited && <button className="btn !py-1 text-xs" onClick={() => onSave('')}>Вернуть из таблицы</button>}
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-lg bg-slate-50 p-2">
      {rows.map(([room, qty], i) => (
        <div key={i} className="flex gap-2">
          <input className="inp" placeholder="Помещение" value={room} onChange={(e) => set(i, 0, e.target.value)} />
          <input className="inp !w-16 text-right" inputMode="decimal" value={qty} onChange={(e) => set(i, 1, e.target.value)} aria-label="Количество" />
          <button className="rounded p-2 hover:bg-slate-200" aria-label="Убрать строку" onClick={() => setRows(rows.filter((_, k) => k !== i))}><X size={15} /></button>
        </div>
      ))}
      <div className="flex gap-2">
        <button className="btn !py-1 text-xs" onClick={() => setRows([...rows, ['', '1']])}><Plus size={13} /> Помещение</button>
        <button className="btn btn-primary !py-1 text-xs" onClick={save}>Сохранить</button>
        <button className="btn !py-1 text-xs" onClick={() => setRows(null)}>Отмена</button>
      </div>
      <p className="text-xs text-slate-500">Общее количество станет суммой по помещениям (если вы не задали его вручную).</p>
    </div>
  );
}

/** Подтверждения: фото и документы (договор, акт, снимок установленного оборудования). */
function Attachments({ it, store }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [view, setView] = useState(null); // {id, name, data}
  if (!store.shared) return <p className="text-xs text-slate-500">Вложения доступны в общей таблице на странице claude.ai.</p>;

  const onPick = async (ev) => {
    const files = [...ev.target.files];
    ev.target.value = '';
    setErr(''); setBusy(true);
    try {
      for (const f of files) await store.addFile(it.key, await prepareFile(f));
    } catch (e) { setErr(e.message || 'Не удалось прикрепить файл'); }
    setBusy(false);
  };
  const open = async (f) => {
    setErr('');
    const data = await store.getFile(f.id);
    if (!data) { setErr('Файл не найден'); return; }
    if (/^image\//.test(f.mime)) { setView({ id: f.id, name: f.name, data }); return; }
    const blob = await (await fetch(data)).blob();
    await download(blob, f.name, store.downloads);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">Подтверждения: фото, договор, документ</div>
        {store.canAttach && (
          <>
            <button className="btn !py-1 text-xs" disabled={busy} onClick={() => input.current.click()}><Paperclip size={13} /> {busy ? 'Загружаю…' : 'Прикрепить'}</button>
            <input ref={input} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={onPick} />
          </>
        )}
      </div>
      {err && <p className="text-xs text-red-700">{err}</p>}
      {it.files.length === 0 && <p className="text-xs text-slate-400">Пока ничего не приложено.</p>}
      <ul className="divide-y rounded-lg border bg-white">
        {it.files.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
            <button className="min-w-0 flex-1 truncate text-left underline" onClick={() => open(f)}>{f.name}</button>
            <span className="shrink-0 text-xs text-slate-400">{Math.round((f.size || 0) / 1024)} КБ · {String(f.at || '').slice(0, 10)}</span>
            {store.canAttach && <button className="rounded p-1 hover:bg-slate-100" aria-label="Удалить файл" onClick={() => store.removeFile(f.id)}><Trash2 size={14} /></button>}
          </li>
        ))}
      </ul>
      {view && (
        <div className="rounded-lg border bg-slate-50 p-2">
          <div className="mb-1 flex items-center justify-between text-xs"><span className="truncate">{view.name}</span><button className="underline" onClick={() => setView(null)}>Закрыть</button></div>
          <img src={view.data} alt={view.name} className="max-h-[60dvh] w-full rounded object-contain" />
        </div>
      )}
    </div>
  );
}

export default function ItemDialog({ item, store, onClose }) {
  const { state, built, edit, link, unlink, removeManual } = store;
  // актуальная версия позиции (после правок)
  const it = built.items.find((i) => i.key === item.key) || item;
  const merged = Object.entries(state.aliases).filter(([from, to]) => from !== it.key && built.items.some((i) => i.key === it.key) && resolveKey(from, state.aliases) === it.key);
  const e = (patch) => edit(it.key, patch);
  return (
    <Modal title={it.name} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {it.status !== 'added' && <StatusBadge status={it.status} partial={it.partial} />}
          <span className="text-xs text-slate-500">№ {it.no} · {it.source === 'sd' ? 'из заявки СД' : it.source === 'ks' ? 'нет в заявке СД (из КС Астана)' : 'добавлено вручную'}</span>
        </div>
        <Field label="Название (можно изменить)"><EditInput value={it.name} onCommit={(v) => e({ name: v === it.origName ? '' : v })} /></Field>
        <label className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4" checked={it.done} onChange={(ev) => e({ done: ev.target.checked })} />
          <CheckCircle2 size={16} className="text-emerald-700" /> Готово: уже установлено
        </label>
        {it.canDecide && (
          <div className="rounded-lg bg-slate-100 p-3">
            <NeedBlock it={it} onEdit={e} />
            <p className="mt-1 text-xs text-slate-600">Позиции нет в заявке СД и в заказе из Китая. «Нет» убирает её из закупа. Укажите причину решения.</p>
          </div>
        )}
        <div>
          <div className="mb-1 text-xs font-medium text-slate-500">Где стоит</div>
          <div className="mb-2"><Rooms entries={it.roomEntries} max={50} /></div>
          <RoomsEditor it={it} onSave={(v) => e({ rooms: v })} />
        </div>
        {[it.size, ...it.notes].filter(Boolean).length > 0 && <p className="text-sm"><b>Характеристики:</b> {[it.size, ...it.notes].filter(Boolean).join('; ')}</p>}
        {it.comments.length > 0 && <p className="text-sm"><b>Комментарий СД:</b> {it.comments.join('; ')}</p>}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div><div className="text-xs text-slate-500">{it.qtyEdited ? 'Кол-во (изменено)' : 'Кол-во'}</div><div className="pt-1"><QtyStepper value={it.qty} warn={!it.qty} onCommit={(v) => e({ qty: v })} /></div></div>
          <div><div className="text-xs text-slate-500">Из Китая</div><div className="pt-1.5 text-lg font-semibold">{it.china}</div></div>
          <div><div className="text-xs text-slate-500">Докупить</div><div className="pt-1.5 text-lg font-bold">{it.buy}</div></div>
        </div>
        {it.qtyEdited && <button className="text-xs underline" onClick={() => e({ qty: '' })}>Вернуть количество из источника ({it.baseQty})</button>}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Поставщик"><EditInput list="suppliers" value={it.supplier} onCommit={(v) => e({ supplier: v })} /></Field>
          <Field label="Цена за ед., ₸"><EditInput type="number" align="right" value={it.price || ''} onCommit={(v) => e({ price: v })} /></Field>
        </div>
        <div className="text-right text-sm">Сумма (докупить × цена): <b>{fmtMoney(it.sum)} ₸</b></div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Ответственный"><EditInput list="people" value={it.responsible} onCommit={(v) => e({ responsible: v })} /></Field>
          <Field label="Срок поставки"><EditInput type="date" value={it.deadline} onCommit={(v) => e({ deadline: v })} /></Field>
          <Field label="Этап закупа">
            <select className="inp" value={it.stage} onChange={(ev) => e({ stage: ev.target.value })}>{STAGES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </Field>
          <Field label="Категория">
            <select className="inp" value={it.category} onChange={(ev) => e({ category: ev.target.value })}>{[...new Set([...CATEGORIES, it.category])].map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
        </div>
        <Field label="Комментарий"><EditInput value={it.comment} onCommit={(v) => e({ comment: v })} /></Field>

        <div className="border-t pt-3"><Attachments it={it} store={store} /></div>

        <div className="space-y-2 border-t pt-3">
          {merged.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">Объединено с этой позицией</div>
              {merged.map(([from]) => (
                <div key={from} className="flex items-center justify-between gap-2 border-b py-1 text-sm">
                  <span>{state.aliasNames[from] || from}</span>
                  <button className="btn !py-1 text-xs" onClick={() => unlink(from)}><Unlink size={13} /> Разъединить</button>
                </div>
              ))}
            </div>
          )}
          <LinkPicker fromKey={it.key} fromName={it.name} items={built.items} onLink={(a, b, n) => { link(a, b, n); onClose(); }} label="Эта позиция = другая позиция (влить в…)" />
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-3">
          <button className="btn" onClick={() => { e({ removed: true }); onClose(); }}><EyeOff size={15} /> Убрать из списка</button>
          {it.manualId && <button className="btn text-red-700" onClick={() => { removeManual(it.manualId); onClose(); }}><Trash2 size={15} /> Удалить позицию</button>}
        </div>
      </div>
    </Modal>
  );
}
