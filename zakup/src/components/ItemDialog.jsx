import React from 'react';
import { Trash2, Unlink } from 'lucide-react';
import { STAGES, resolveKey } from '../lib/build.js';
import { CATEGORIES } from '../lib/categories.js';
import { fmtMoney } from '../lib/normalize.js';
import { EditInput, Field, Modal, NeedBlock, QtyStepper, Rooms, StatusBadge } from './ui.jsx';
import LinkPicker from './LinkPicker.jsx';

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
        {it.canDecide && (
          <div className="rounded-lg bg-slate-100 p-3">
            <NeedBlock it={it} onEdit={e} />
            <p className="mt-1 text-xs text-slate-600">Позиции нет в заявке СД и в заказе из Китая. «Нет» убирает её из закупа. Укажите причину решения.</p>
          </div>
        )}
        {it.roomEntries?.length > 0 && <div><div className="mb-1 text-xs font-medium text-slate-500">Где стоит</div><Rooms entries={it.roomEntries} max={50} /></div>}
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
            <select className="inp" value={it.category} onChange={(ev) => e({ category: ev.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
        </div>
        <Field label="Комментарий"><EditInput value={it.comment} onCommit={(v) => e({ comment: v })} /></Field>

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
        {it.manualId && (
          <button className="btn text-red-700" onClick={() => { removeManual(it.manualId); onClose(); }}><Trash2 size={15} /> Удалить позицию</button>
        )}
      </div>
    </Modal>
  );
}
