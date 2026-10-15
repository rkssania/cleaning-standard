import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { STATUS } from '../lib/build.js';
import { fmtMoney } from '../lib/normalize.js';
import { EditInput, ROW_STYLE } from './ui.jsx';

export default function Summary({ summary, extrasCount, status, onStatus, onFact }) {
  const [open, setOpen] = useState(false);
  const tiles = [
    ['china', summary.counts.china],
    ['request', summary.counts.request],
    ['added', summary.counts.added],
    ['extra', extrasCount],
  ];
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map(([k, n]) => (
          <button
            key={k}
            onClick={() => onStatus(status === k ? '' : k)}
            className={`rounded-lg border p-2.5 text-left ${ROW_STYLE[k]} ${status === k ? 'ring-2 ring-brand' : 'border-transparent'}`}
          >
            <div className="text-2xl font-bold leading-none">{n}</div>
            <div className="mt-1 text-xs font-medium leading-tight">{STATUS[k]}</div>
          </button>
        ))}
      </div>
      <div className="rounded-lg border bg-white p-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-slate-500">Итого к закупу</div>
            <div className="text-2xl font-bold text-brand">{fmtMoney(summary.total)} ₸</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500">Факт (вносится вручную)</div>
            <div className="text-lg font-semibold">{summary.fact ? `${fmtMoney(summary.fact)} ₸` : '—'}</div>
          </div>
          <button className="btn !px-2 !py-1.5 text-xs" onClick={() => setOpen(!open)}>
            По поставщикам {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {open && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500">
                  <th className="py-1 pr-2 font-medium">Поставщик</th>
                  <th className="px-2 text-right font-medium">План, ₸</th>
                  <th className="px-2 text-right font-medium">Факт, ₸</th>
                  <th className="pl-2 text-right font-medium">Поз.</th>
                </tr>
              </thead>
              <tbody>
                {summary.suppliers.map((s) => (
                  <tr key={s.name} className="border-b last:border-0">
                    <td className="py-1 pr-2">{s.name}</td>
                    <td className="px-2 text-right tabular-nums">{fmtMoney(s.plan)}</td>
                    <td className="w-32 px-1 py-1"><EditInput type="number" align="right" placeholder="—" value={summary.facts?.[s.name] ?? (s.fact || '')} onCommit={(v) => onFact(s.name, v)} /></td>
                    <td className="pl-2 text-right tabular-nums">{s.positions}</td>
                  </tr>
                ))}
                {!summary.suppliers.length && <tr><td colSpan="4" className="py-2 text-slate-500">Нет позиций к закупу</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
