import React from 'react';
import { Search } from 'lucide-react';

export const NO_SUPPLIER = '__none';

export default function Filters({ f, setF }) {
  return (
    <div className="relative min-w-0 lg:max-w-sm">
      <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="inp !pl-8" placeholder="Поиск по названию" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
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
