import React, { useState } from 'react';
import { Link2 } from 'lucide-react';

/** Выбор позиции, с которой нужно объединить текущую. Название набирается или выбирается из списка. */
export default function LinkPicker({ fromKey, fromName, items, onLink, label = 'Объединить с позицией' }) {
  const [v, setV] = useState('');
  const target = items.find((i) => i.name.toLowerCase() === v.trim().toLowerCase() && i.key !== fromKey);
  const id = `lp-${fromKey}`;
  return (
    <div>
      <div className="mb-0.5 text-xs font-medium text-slate-500">{label}</div>
      <div className="flex gap-2">
        <input className="inp" list={id} value={v} onChange={(e) => setV(e.target.value)} placeholder="Начните вводить название…" />
        <datalist id={id}>{items.filter((i) => i.key !== fromKey).map((i) => <option key={i.key} value={i.name} />)}</datalist>
        <button className="btn btn-primary shrink-0" disabled={!target} onClick={() => { onLink(fromKey, target.key, fromName); setV(''); }}>
          <Link2 size={16} /> Связать
        </button>
      </div>
      {v && !target && <div className="mt-1 text-xs text-slate-500">Выберите название из списка</div>}
    </div>
  );
}
