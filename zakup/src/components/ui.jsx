import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { STATUS } from '../lib/build.js';

export const ROW_STYLE = {
  china: 'bg-green-100 text-green-900',
  request: 'bg-yellow-100',
  added: 'bg-red-100',
  extra: 'bg-emerald-50',
};
export const BADGE_STYLE = {
  china: 'bg-green-600 text-white',
  request: 'bg-yellow-400 text-yellow-950',
  added: 'bg-red-600 text-white',
  extra: 'bg-emerald-700 text-white',
};

export function StatusBadge({ status, partial }) {
  return (
    <span className="inline-flex flex-col">
      <span className={`inline-block w-fit rounded px-1.5 py-0.5 text-xs font-semibold ${BADGE_STYLE[status]}`}>{STATUS[status]}</span>
      {partial && <span className="mt-0.5 text-xs font-medium text-slate-700">{partial}</span>}
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
      <div className={`flex max-h-[94dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold text-brand">{title}</h2>
          <button className="rounded p-1.5 hover:bg-slate-100" onClick={onClose} aria-label="Закрыть"><X size={20} /></button>
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
