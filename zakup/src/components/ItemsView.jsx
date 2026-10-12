import React from 'react';
import { Link2, Pencil } from 'lucide-react';
import { STAGES } from '../lib/build.js';
import { CATEGORIES } from '../lib/categories.js';
import { fmtMoney, fmtNum } from '../lib/normalize.js';
import { EditInput, ROW_STYLE, StatusBadge } from './ui.jsx';

const strike = (it) => (it.status === 'china' ? 'line-through decoration-2 decoration-green-800/70' : '');
const spec = (it) => [it.size, ...it.notes].filter(Boolean).join('; ');

function StageSelect({ it, edit }) {
  return (
    <select className="inp" value={it.stage} onChange={(e) => edit(it.key, { stage: e.target.value })}>
      {STAGES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );
}

function groups(items) {
  return CATEGORIES.map((c) => [c, items.filter((i) => i.category === c)]).filter(([, l]) => l.length);
}

const TH = 'whitespace-nowrap px-2 py-2 text-left text-xs font-semibold';

function Table({ items, extras, edit, onOpen, onLinkExtra }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border bg-white lg:block">
      <table className="w-full min-w-[1800px] border-collapse text-sm">
        <thead className="bg-brand text-white">
          <tr>
            <th className={TH}>№</th><th className={`${TH} sticky left-0 z-10 bg-brand`}>Наименование</th>
            <th className={TH}>Характеристики / габариты</th><th className={TH}>Где (помещения)</th>
            <th className={`${TH} text-right`}>Всего</th><th className={`${TH} text-right`}>Из Китая</th><th className={`${TH} text-right`}>Докупить</th>
            <th className={TH}>Статус</th><th className={TH}>Поставщик</th><th className={`${TH} text-right`}>Цена, ₸</th>
            <th className={`${TH} text-right`}>Сумма, ₸</th><th className={TH}>Ответственный</th><th className={TH}>Срок</th>
            <th className={TH}>Этап закупа</th><th className={TH}>Комментарий</th><th className={TH} />
          </tr>
        </thead>
        <tbody>
          {groups(items).map(([cat, list]) => (
            <React.Fragment key={cat}>
              <tr><td colSpan="16" className="bg-brand-light px-3 py-1.5 text-sm font-bold text-brand">{cat} <span className="font-normal text-slate-500">· {list.length}</span></td></tr>
              {list.map((it) => (
                <tr key={it.key} className={`${ROW_STYLE[it.status]} border-b border-white align-top`}>
                  <td className="px-2 py-2 tabular-nums">{it.no}</td>
                  <td className={`sticky left-0 z-[1] max-w-[260px] bg-inherit px-2 py-2 font-medium ${strike(it)}`}>
                    {it.name}
                    {it.aliasNames.length > 0 && <div className="text-xs font-normal opacity-70">= {it.aliasNames.join(', ')}</div>}
                  </td>
                  <td className={`max-w-[220px] px-2 py-2 text-xs ${strike(it)}`}>{spec(it)}</td>
                  <td className={`max-w-[300px] px-2 py-2 text-xs ${strike(it)}`}>{it.rooms}</td>
                  <td className="w-20 px-1 py-1.5">
                    <EditInput type="number" align="right" value={it.qty} onCommit={(v) => edit(it.key, { qty: v })} />
                    {it.qtyEdited && <button className="text-[11px] text-slate-600 underline" onClick={() => edit(it.key, { qty: '' })}>из заявки: {fmtNum(it.baseQty)}</button>}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{it.china || ''}</td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">{it.buy}</td>
                  <td className="px-2 py-2"><StatusBadge status={it.status} partial={it.partial} /></td>
                  <td className="min-w-[11rem] px-1 py-1.5"><EditInput list="suppliers" value={it.supplier} onCommit={(v) => edit(it.key, { supplier: v })} /></td>
                  <td className="min-w-[7.5rem] px-1 py-1.5"><EditInput type="number" align="right" value={it.price || ''} onCommit={(v) => edit(it.key, { price: v })} /></td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-semibold tabular-nums">{it.sum ? fmtMoney(it.sum) : ''}</td>
                  <td className="min-w-[9rem] px-1 py-1.5"><EditInput list="people" value={it.responsible} onCommit={(v) => edit(it.key, { responsible: v })} /></td>
                  <td className="min-w-[10rem] px-1 py-1.5"><EditInput type="date" value={it.deadline} onCommit={(v) => edit(it.key, { deadline: v })} /></td>
                  <td className="min-w-[9.5rem] px-1 py-1.5"><StageSelect it={it} edit={edit} /></td>
                  <td className="min-w-[12rem] px-1 py-1.5"><EditInput value={it.comment} onCommit={(v) => edit(it.key, { comment: v })} /></td>
                  <td className="px-1 py-1.5"><button className="rounded p-1.5 hover:bg-black/10" title="Подробнее" onClick={() => onOpen(it)}><Pencil size={15} /></button></td>
                </tr>
              ))}
            </React.Fragment>
          ))}
          {extras.length > 0 && (
            <>
              <tr><td colSpan="16" className="bg-emerald-700 px-3 py-1.5 text-sm font-bold text-white">Едет из Китая, но нет в потребности · {extras.length}</td></tr>
              {extras.map((e) => (
                <tr key={e.key} className={`${ROW_STYLE.extra} border-b border-white`}>
                  <td /><td className="sticky left-0 bg-inherit px-2 py-2 font-medium">{e.name}</td>
                  <td colSpan="3" />
                  <td className="px-2 py-2 text-right tabular-nums">{e.qty}</td><td />
                  <td className="px-2 py-2"><StatusBadge status="extra" /></td>
                  <td /><td className="px-2 py-2 text-right tabular-nums">{e.price ? fmtMoney(e.price) : ''}</td>
                  <td colSpan="5" className="px-2 py-2"><button className="btn !py-1 text-xs" onClick={() => onLinkExtra(e)}><Link2 size={13} /> Связать с позицией</button></td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Cards({ items, extras, edit, onOpen, onLinkExtra }) {
  return (
    <div className="space-y-4 lg:hidden">
      {groups(items).map(([cat, list]) => (
        <div key={cat} className="space-y-2">
          <h3 className="rounded bg-brand-light px-3 py-1.5 text-sm font-bold text-brand">{cat} <span className="font-normal text-slate-500">· {list.length}</span></h3>
          {list.map((it) => (
            <article key={it.key} className={`rounded-lg p-3 shadow-sm ${ROW_STYLE[it.status]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className={`min-w-0 font-semibold leading-snug ${strike(it)}`}><span className="mr-1 font-normal opacity-60">{it.no}.</span>{it.name}</div>
                <button className="shrink-0 rounded bg-white/70 p-2" aria-label="Подробнее" onClick={() => onOpen(it)}><Pencil size={16} /></button>
              </div>
              <div className="mt-1"><StatusBadge status={it.status} partial={it.partial} /></div>
              {spec(it) && <div className={`mt-1 text-xs ${strike(it)}`}>{spec(it)}</div>}
              {it.rooms && <div className={`mt-1 text-xs opacity-80 ${strike(it)}`}>{it.rooms}</div>}
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                <label>Всего<EditInput type="number" align="right" value={it.qty} onCommit={(v) => edit(it.key, { qty: v })} /></label>
                <div>Из Китая<div className="pt-1.5 text-base font-semibold">{it.china}</div></div>
                <div>Докупить<div className="pt-1.5 text-base font-bold">{it.buy}</div></div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <label>Поставщик<EditInput list="suppliers" value={it.supplier} onCommit={(v) => edit(it.key, { supplier: v })} /></label>
                <label>Цена за ед., ₸<EditInput type="number" align="right" value={it.price || ''} onCommit={(v) => edit(it.key, { price: v })} /></label>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="rounded bg-white/70 px-2 py-0.5 text-xs">{STAGES.find(([k]) => k === it.stage)[1]}</span>
                <span className="font-bold">{it.sum ? `${fmtMoney(it.sum)} ₸` : ''}</span>
              </div>
            </article>
          ))}
        </div>
      ))}
      {extras.length > 0 && (
        <div className="space-y-2">
          <h3 className="rounded bg-emerald-700 px-3 py-1.5 text-sm font-bold text-white">Едет из Китая, но нет в потребности · {extras.length}</h3>
          {extras.map((e) => (
            <article key={e.key} className={`rounded-lg p-3 ${ROW_STYLE.extra}`}>
              <div className="font-semibold">{e.name}</div>
              <div className="mt-1 text-sm">{e.qty} шт{e.price ? ` · ${fmtMoney(e.price)} ₸/шт` : ''}</div>
              <button className="btn mt-2 !py-1.5 text-xs" onClick={() => onLinkExtra(e)}><Link2 size={13} /> Связать с позицией</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItemsView(props) {
  if (!props.items.length && !props.extras.length) {
    return <div className="rounded-lg border bg-white p-8 text-center text-slate-500">Ничего не найдено</div>;
  }
  return (<><Table {...props} /><Cards {...props} /></>);
}
