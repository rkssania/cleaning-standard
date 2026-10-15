import React from 'react';
import { Search, X } from 'lucide-react';
import { STAGES, STATUS } from '../lib/build.js';
import { CATEGORIES } from '../lib/categories.js';

export const NO_SUPPLIER = '__none';

function Sel({ value, onChange, label, children }) {
  return (
    <select className="inp !w-auto min-w-[8.5rem] flex-1 sm:flex-none" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{label}</option>
      {children}
    </select>
  );
}

export default function Filters({ f, setF, items }) {
  const uniq = (fn) => [...new Set(items.flatMap(fn).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
  const rooms = uniq((i) => i.roomList);
  const suppliers = uniq((i) => [i.supplier]);
  const people = uniq((i) => [i.responsible]);
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const active = Object.values(f).some(Boolean);
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="inp !pl-8" placeholder="Поиск по названию" value={f.q} onChange={(e) => set('q')(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Sel label="Все статусы" value={f.status} onChange={set('status')}>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Sel>
        <Sel label="Все категории" value={f.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </Sel>
        <Sel label="Все помещения" value={f.room} onChange={set('room')}>
          {rooms.map((c) => <option key={c}>{c}</option>)}
        </Sel>
        <Sel label="Все поставщики" value={f.supplier} onChange={set('supplier')}>
          <option value={NO_SUPPLIER}>— без поставщика —</option>
          {suppliers.map((c) => <option key={c}>{c}</option>)}
        </Sel>
        <Sel label="Все ответственные" value={f.responsible} onChange={set('responsible')}>
          <option value={NO_SUPPLIER}>— не назначен —</option>
          {people.map((c) => <option key={c}>{c}</option>)}
        </Sel>
        <Sel label="Все этапы" value={f.stage} onChange={set('stage')}>
          {STAGES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Sel>
        {active && (
          <button className="btn !py-1.5" onClick={() => setF({ q: '', status: '', category: '', room: '', supplier: '', responsible: '', stage: '' })}>
            <X size={14} /> Сбросить
          </button>
        )}
      </div>
    </div>
  );
}

export function applyFilters(items, f) {
  const q = f.q.trim().toLowerCase();
  return items.filter((i) =>
    (!f.status || i.status === f.status) &&
    (!f.category || i.category === f.category) &&
    (!f.room || i.roomList.includes(f.room)) &&
    (!f.supplier || (f.supplier === NO_SUPPLIER ? !i.supplier : i.supplier === f.supplier)) &&
    (!f.responsible || (f.responsible === NO_SUPPLIER ? !i.responsible : i.responsible === f.responsible)) &&
    (!f.stage || i.stage === f.stage) &&
    (!q || i.name.toLowerCase().includes(q) || i.aliasNames.some((n) => n.toLowerCase().includes(q)))
  );
}
