import React, { useEffect, useState } from 'react';
import { MapPin, Minus, Plus, X } from 'lucide-react';
import { STATUS } from '../lib/build.js';

export const ROW_STYLE = {
  china: 'bg-green-100 text-green-900',
  ordering: 'bg-green-100 text-green-900',
  done: 'bg-emerald-200 text-emerald-950',
  toorder: 'bg-orange-100',
  request: 'bg-yellow-100',
  added: 'bg-red-100',
  declined: 'bg-slate-200 text-slate-500',
  extra: 'bg-emerald-50',
};
export const BADGE_STYLE = {
  china: 'bg-green-600 text-white',
  ordering: 'bg-teal-700 text-white',
  done: 'bg-emerald-800 text-white',
  toorder: 'bg-orange-500 text-white',
  request: 'bg-yellow-400 text-yellow-950',
  added: 'bg-red-600 text-white',
  declined: 'bg-slate-500 text-white',
  extra: 'bg-emerald-700 text-white',
};

// Простыми словами: Китай = «В процессе», в заявке = «Надо». Пояснение — мелким шрифтом.
const SHORT = { done: 'Готово', china: 'Едет', ordering: 'В процессе оформления', toorder: 'Надо заказать', request: 'В процессе', declined: 'Не надо', extra: 'Едет из Китая' };
const SUB = { done: 'установлено', china: 'из Китая', ordering: 'Китай', toorder: 'есть в СД и КС Астана', request: 'в заявке СД', declined: '', extra: 'нет в потребности' };
const HINT = {
  done: 'Уже сделано и установлено. Подтверждение можно приложить в карточке.',
  china: 'Едет из Китая (заказ 1). Покупать не нужно.',
  ordering: 'Китай, заказ 2: в процессе оформления. Покупать не нужно.',
  toorder: 'Есть и в заявке СД, и в потребности КС Астана. Нужно заказывать.',
  request: 'Позиция только в заявке СД: в процессе.',
  declined: 'Решили не покупать. Причина указана рядом.',
};

export function StatusBadge({ status, partial }) {
  return (
    <span className="inline-flex flex-col" title={HINT[status] || ''}>
      <span className={`inline-block w-fit rounded border border-black/30 px-1.5 py-0.5 text-xs font-semibold ${BADGE_STYLE[status]}`}>{SHORT[status]}</span>
      {(partial || SUB[status]) && <span className="mt-0.5 text-xs font-medium text-slate-700">{partial || SUB[status]}</span>}
    </span>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`flex max-h-[94dvh] w-full flex-col rounded-t-xl border border-brand bg-white shadow-xl sm:rounded-lg ${wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}>
        <div className="flex items-center justify-between border-b border-brand bg-brand px-4 py-2">
          <h2 className="text-base font-bold text-white sm:text-lg">{title}</h2>
          <button className="rounded border border-white/60 bg-transparent p-1 text-white hover:bg-white/15" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

/** Поле, которое сохраняется при уходе фокуса или Enter. */
export function EditInput({ value, onCommit, type = 'text', list, placeholder, className = '', align }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => setV(value ?? ''), [value]);
  const commit = () => {
    const out = type === 'number' ? (v === '' ? '' : Number(String(v).replace(',', '.'))) : v.trim();
    if (out !== (value ?? '')) onCommit(Number.isNaN(out) ? '' : out);
  };
  return (
    <input
      className={`inp ${align === 'right' ? 'text-right' : ''} ${className}`}
      type={type === 'number' ? 'text' : type}
      inputMode={type === 'number' ? 'decimal' : undefined}
      value={v}
      list={list}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-0.5 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

/** Бегунок «НАДО?»: Да / Нет. Ничего не выбрано — не решено. */
export function NeedToggle({ value, onChange, compact }) {
  const opts = [['yes', 'Да'], ['no', 'Нет']];
  const color = { yes: 'bg-emerald-600 text-white', no: 'bg-slate-600 text-white' };
  return (
    <div className="inline-flex items-center gap-1.5" role="group" aria-label="Надо ли?">
      <span className={`font-bold ${compact ? 'text-[11px]' : 'text-xs'}`}>НАДО ЛИ?</span>
      <span className="inline-flex overflow-hidden rounded-full border border-slate-400 bg-white">
        {opts.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={value === k}
            onClick={() => onChange(value === k ? '' : k)}
            className={`min-w-[2.4rem] px-2.5 py-0.5 text-xs font-semibold ${value === k ? color[k] : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {label}
          </button>
        ))}
      </span>
      {!value && <span className="rounded-full bg-amber-400 px-1.5 text-xs font-bold text-amber-950">?</span>}
    </div>
  );
}

/** Бегунок + причина. Решение без причины подсвечено. */
export function NeedBlock({ it, onEdit, compact }) {
  return (
    <div className="space-y-1">
      <NeedToggle compact={compact} value={it.need} onChange={(v) => onEdit({ need: v })} />
      {it.need && (
        <EditInput
          placeholder={it.need === 'no' ? 'Причина: почему не надо' : 'Причина: почему надо'}
          value={it.needReason}
          onCommit={(v) => onEdit({ needReason: v })}
          className={it.needReason ? '' : '!border-amber-500'}
        />
      )}
    </div>
  );
}

/** Количество: компактный счётчик вместо длинного окна. Можно нажимать − и + или вписать число. */
export function QtyStepper({ value, onCommit, warn }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const apply = (n) => { if (Number.isFinite(n) && n >= 0 && n !== value) onCommit(n); };
  const btn = 'flex h-8 w-7 items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30';
  return (
    <span className={`inline-flex items-center overflow-hidden rounded-full border bg-white ${warn ? 'border-amber-500 ring-2 ring-amber-300' : 'border-slate-300'}`} title="Количество: нажмите − или +, или впишите число">
      <button type="button" className={btn} aria-label="Меньше" disabled={value <= 0} onClick={() => apply(Math.max(0, value - 1))}><Minus size={14} /></button>
      <input
        className="h-8 w-11 border-0 bg-transparent p-0 text-center text-sm font-bold tabular-nums focus:outline-none"
        inputMode="decimal"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { const n = Number(String(v).replace(',', '.')); if (Number.isNaN(n)) setV(String(value)); else apply(n); }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label="Количество"
      />
      <button type="button" className={btn} aria-label="Больше" onClick={() => apply(value + 1)}><Plus size={14} /></button>
    </span>
  );
}

/** Где стоит: помещения метками с количеством. */
export function Rooms({ entries, strike, max = 3 }) {
  if (!entries?.length) return null;
  const shown = entries.slice(0, max);
  const rest = entries.length - shown.length;
  const all = entries.map(([r, q]) => `${r} — ${q}`).join('\n');
  return (
    <div className={`flex flex-wrap gap-1 ${strike ? 'opacity-70' : ''}`} title={all}>
      {shown.map(([room, qty]) => (
        <span key={room} className="inline-flex max-w-full items-center gap-1 rounded-md border border-black/10 bg-white/75 px-1.5 py-0.5 text-xs">
          <MapPin size={11} className="shrink-0 text-brand/70" />
          <span className={`truncate ${strike ? 'line-through' : ''}`}>{room}</span>
          <span className="rounded bg-slate-200 px-1 text-[11px] font-bold tabular-nums">{qty}</span>
        </span>
      ))}
      {rest > 0 && <span className="inline-flex items-center rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-semibold" title={all}>+{rest}</span>}
    </div>
  );
}

const SRC_STYLE = { 'СД': 'bg-indigo-100 text-indigo-900', 'КС': 'bg-violet-100 text-violet-900', 'Ки': 'bg-emerald-100 text-emerald-900' };

/** Откуда позиция: короткие метки «СД · Фарма», «КС Астана», «Китай · заказ 1». */
export function Sources({ list }) {
  if (!list?.length) return null;
  // inline-flex: зачёркивание зелёных строк на метки не распространяется
  return (
    <div className="mt-1">
      <span className="inline-flex flex-wrap gap-1" title="Из каких таблиц позиция">
        {list.map((s) => (
          <span key={s} className={`rounded px-1 py-px text-[10.5px] font-semibold leading-snug ${SRC_STYLE[s.slice(0, 2)] || 'bg-slate-200 text-slate-700'}`}>{s}</span>
        ))}
      </span>
    </div>
  );
}
