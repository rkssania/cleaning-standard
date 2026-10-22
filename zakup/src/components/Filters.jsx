import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { STAGES, STATUS } from '../lib/build.js';

export const NO_SUPPLIER = '__none';

function Sel({ value, onChange, label, children }) {
  return (
    <select className="inp !w-auto min-w-[8rem] flex-1 sm:flex-none" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{label}</option>
      {children}
    </select>
  );
}

export default function Filters({ f, setF, items }) {
  const [open, setOpen] = useState(false); // фильтры спрятаны, пока их не раскрыли
  const uniq = (fn) => [...new Set(items.flatMap(fn).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
  const cats = [...new Set(items.map((i) => i.category))];
  const rooms = uniq((i) => i.roomList);
  const suppliers = uniq((i) => [i.supplier]);
  const people = uniq((i) => [i.responsible]);
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const count = Object.entries(f).filter(([k, v]) => k !== 'q' && v).length;
  const reset = () => setF({ q: '', need: '', status: '', category: '', room: '', supplier: '', responsible: '', stage: '' });
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="inp !pl-8" placeholder="Поиск по названию" value={f.q} onChange={(e) => set('q')(e.target.value)} />
        </div>
        <button className="btn !py-1.5" onClick={() => setOpen(!open)} aria-expanded={open}>
          <SlidersHorizontal size={15} /> Фильтры{count ? ` · ${count}` : ''}
        </button>
        {(count > 0 || f.q) && (
          <button className="btn !py-1.5" onClick={reset}><X size={14} /> Сбросить</button>
        )}
      </div>
      {open && (
        <div className="flex flex-wrap gap-2 rounded-lg border bg-white p-2">
          <Sel label="Все статусы" value={f.status} onChange={set('status')}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Sel>
          <Sel label="НАДО ЛИ? — любое" value={f.need} onChange={set('need')}>
            <option value="undecided">Не решено</option>
            <option value="yes">Надо</option>
            <option value="no">Не надо</option>
          </Sel>
          <Sel label="Все категории" value={f.category} onChange={set('category')}>
            {cats.map((c) => <option key={c}>{c}</option>)}
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
        </div>
      )}
    </div>
  );
}

export function applyFilters(items, f) {
  const q = f.q.trim().toLowerCase();
  return items.filter((i) =>
    (!f.status || i.status === f.status) &&
    (!f.need || (f.need === 'undecided' ? i.canDecide && !i.need : i.need === f.need)) &&
    (!f.category || i.category === f.category) &&
    (!f.room || i.roomList.includes(f.room)) &&
    (!f.supplier || (f.supplier === NO_SUPPLIER ? !i.supplier : i.supplier === f.supplier)) &&
    (!f.responsible || (f.responsible === NO_SUPPLIER ? !i.responsible : i.responsible === f.responsible)) &&
    (!f.stage || i.stage === f.stage) &&
    (!q || i.name.toLowerCase().includes(q) || (i.origName || '').toLowerCase().includes(q) || i.aliasNames.some((n) => n.toLowerCase().includes(q)))
  );
}
