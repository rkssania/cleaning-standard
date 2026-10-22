import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Columns3, EyeOff, Link2, Paperclip, Pencil } from 'lucide-react';
import { STAGES } from '../lib/build.js';
import { fmtMoney, fmtNum } from '../lib/normalize.js';
import { EditInput, NeedBlock, QtyStepper, ROW_STYLE, Rooms, StatusBadge } from './ui.jsx';

const FilesMark = ({ it }) => (it.files?.length ? <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-xs font-normal text-slate-600" title="Есть вложения"><Paperclip size={12} />{it.files.length}</span> : null);
const strike = (it) => (['china', 'ordering'].includes(it.status) ? 'line-through decoration-2 decoration-green-800/70' : '');
const spec = (it) => [it.size, ...it.notes].filter(Boolean).join('; ');
const stageLabel = (k) => STAGES.find(([x]) => x === k)?.[1] ?? '';
const extraQty = (e) => [e.transit && `едет ${e.transit}`, e.ordering && `в оформлении ${e.ordering}`].filter(Boolean).join(', ') + ' шт';
const extraStatus = (e) => (e.declined ? 'declined' : e.kind === 'ordering' ? 'ordering' : 'china');

// Колонки таблицы. Наименование всегда показывается; остальные можно скрыть кнопкой «Колонки».
const COLS = [
  { id: 'category', label: 'Категория', def: false, flatOnly: true, w: 'min-w-[11rem]' },
  { id: 'where', label: 'Где стоит', hint: 'Помещения и сколько штук в каждом', def: true, w: 'min-w-[14rem] max-w-[20rem]' },
  { id: 'qty', label: 'Кол-во', hint: 'Сколько нужно всего. Меняется кнопками − и +', def: true, w: 'w-[8.5rem]' },
  { id: 'china', label: 'Из Китая', hint: 'Сколько уже едет или оформляется', def: false, w: 'w-[4.5rem]', right: true },
  { id: 'buy', label: 'Докупить', hint: 'Нужно минус то, что уже едет из Китая', def: false, w: 'w-[5rem]', right: true },
  { id: 'status', label: 'Статус', hint: 'Едет, Заказ Китай №2, Надо согласовать, НАДО ЛИ?', def: true, w: 'min-w-[14rem]' },
  { id: 'supplier', label: 'Поставщик', def: false, w: 'min-w-[10rem]' },
  { id: 'price', label: 'Цена, ₸', hint: 'Цена за единицу', def: false, w: 'min-w-[7rem]', right: true },
  { id: 'sum', label: 'Сумма, ₸', hint: 'Докупить × цена', def: false, w: 'w-[7rem]', right: true },
  { id: 'stage', label: 'Этап закупа', def: false, w: 'min-w-[9.5rem]' },
  { id: 'resp', label: 'Ответственный', def: false, w: 'min-w-[9rem]' },
  { id: 'deadline', label: 'Срок поставки', def: false, w: 'min-w-[10rem]' },
  { id: 'comment', label: 'Комментарий', def: false, w: 'min-w-[12rem]' },
];
const LS = 'ks-zakup-cols3';
const PRESETS = [
  ['Простой', ['where', 'qty', 'status']],
  ['Закуп', ['where', 'qty', 'china', 'buy', 'status', 'supplier', 'price', 'sum', 'stage']],
  ['Все', COLS.filter((c) => !c.flatOnly).map((c) => c.id)],
];

function loadCols() {
  try {
    const v = JSON.parse(localStorage.getItem(LS));
    if (Array.isArray(v)) return new Set(v);
  } catch (e) { /* нет сохранённого — берём по умолчанию */ }
  return new Set(COLS.filter((c) => c.def).map((c) => c.id));
}

function groups(items, grouped) {
  if (!grouped) return [{ cat: null, list: items }];
  // категории в порядке появления: сначала обычные, потом разделы по ТЗ
  return [...new Set(items.map((i) => i.category))].map((c) => ({ cat: c, list: items.filter((i) => i.category === c) }));
}

/** Статус: красные позиции показывают только «НАДО ЛИ?» (один раз), остальные — цветную метку. */
function StatusCell({ it, onEdit, compact }) {
  return (
    <div className="space-y-1">
      {it.status !== 'added' && <StatusBadge status={it.status} partial={it.partial} />}
      {it.canDecide && <NeedBlock compact={compact} it={it} onEdit={onEdit} />}
    </div>
  );
}

function Cell({ col, it, edit }) {
  const e = (patch) => edit(it.key, patch);
  switch (col) {
    case 'where': return <Rooms entries={it.roomEntries} strike={strike(it)} />;
    case 'qty':
      return (
        <div className="space-y-0.5">
          <QtyStepper value={it.qty} warn={!it.qty} onCommit={(v) => e({ qty: v })} />
          {it.qtyEdited && <button className="block text-[11px] text-slate-600 underline" onClick={() => e({ qty: '' })}>из заявки: {fmtNum(it.baseQty)}</button>}
        </div>
      );
    case 'category': return <span className="text-xs">{it.category}</span>;
    case 'china': return <span className="tabular-nums">{it.china || ''}</span>;
    case 'buy': return <span className="text-base font-bold tabular-nums">{it.buy}</span>;
    case 'status': return <StatusCell compact it={it} onEdit={e} />;
    case 'supplier': return <EditInput list="suppliers" value={it.supplier} onCommit={(v) => e({ supplier: v })} />;
    case 'price': return <EditInput type="number" align="right" value={it.price || ''} onCommit={(v) => e({ price: v })} />;
    case 'sum': return <span className="whitespace-nowrap font-semibold tabular-nums">{it.sum ? fmtMoney(it.sum) : ''}</span>;
    case 'stage':
      return (
        <select className="inp" value={it.stage} onChange={(ev) => e({ stage: ev.target.value })}>
          {STAGES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      );
    case 'resp': return <EditInput list="people" value={it.responsible} onCommit={(v) => e({ responsible: v })} />;
    case 'deadline': return <EditInput type="date" value={it.deadline} onCommit={(v) => e({ deadline: v })} />;
    case 'comment': return <EditInput value={it.comment} onCommit={(v) => e({ comment: v })} />;
    default: return null;
  }
}

function CatHeader({ g, open, toggle, colSpan, dark }) {
  return (
    <tr>
      <td colSpan={colSpan} className="sticky left-0 p-0">
        <button onClick={toggle} data-cat={g.cat} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold ${dark ? 'bg-emerald-700 text-white' : 'bg-brand-light text-brand'}`}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>{g.cat}</span>
          <span className={`font-normal ${dark ? 'text-white/80' : 'text-slate-500'}`}>· {g.list.length}</span>
        </button>
      </td>
    </tr>
  );
}

function ColumnsMenu({ vis, setVis }) {
  const [open, setOpen] = useState(false);
  const save = (n) => { setVis(n); try { localStorage.setItem(LS, JSON.stringify([...n])); } catch (e) { /* без сохранения */ } };
  const toggle = (id) => { const n = new Set(vis); if (n.has(id)) n.delete(id); else n.add(id); save(n); };
  return (
    <div className="relative">
      <button className="btn !py-1.5 text-xs" onClick={() => setOpen(!open)} title="Какие колонки показывать"><Columns3 size={14} /> Колонки</button>
      {open && (
        <div className="absolute right-0 z-40 mt-1 w-60 rounded-lg border bg-white p-2 text-sm shadow-xl">
          <div className="mb-1 flex gap-1">
            {PRESETS.map(([label, ids]) => (
              <button key={label} className="flex-1 rounded bg-brand-light px-1 py-1 text-xs font-semibold text-brand" onClick={() => save(new Set(ids))}>{label}</button>
            ))}
          </div>
          {COLS.filter((c) => !c.flatOnly).map((c) => (
            <label key={c.id} className="flex items-center gap-2 px-1 py-1">
              <input type="checkbox" checked={vis.has(c.id)} onChange={() => toggle(c.id)} /> {c.label}
            </label>
          ))}
          <button className="mt-1 w-full rounded bg-slate-100 py-1 text-xs" onClick={() => setOpen(false)}>Готово</button>
        </div>
      )}
    </div>
  );
}

function Table({ items, extras, edit, onOpen, onLinkExtra, vis, collapsed, toggleCat, grouped }) {
  const cols = COLS.filter((c) => (c.flatOnly ? !grouped : vis.has(c.id)));
  const span = cols.length + 3;
  const TH = 'whitespace-nowrap px-2 py-2 text-xs font-semibold';
  return (
    <div className="hidden max-h-[78dvh] overflow-auto rounded border border-brand bg-white lg:block">
      <table className="w-full border-separate border-spacing-0 text-[13px]">
        <thead className="sticky top-0 z-30 bg-brand text-white">
          <tr>
            <th className={`${TH} sticky left-0 z-40 w-10 bg-brand text-left`}>№</th>
            <th className={`${TH} sticky left-10 z-40 min-w-[18rem] bg-brand text-left`}>Наименование</th>
            {cols.map((c) => <th key={c.id} title={c.hint || ''} className={`${TH} ${c.right ? 'text-right' : 'text-left'}`}>{c.label}</th>)}
            <th className={TH} />
          </tr>
        </thead>
        <tbody>
          {groups(items, grouped).map((g) => (
            <React.Fragment key={g.cat || 'all'}>
              {g.cat && <CatHeader g={g} open={!collapsed.has(g.cat)} toggle={() => toggleCat(g.cat)} colSpan={span} />}
              {!(g.cat && collapsed.has(g.cat)) && g.list.map((it) => (
                <tr key={it.key} className={`${ROW_STYLE[it.status]} align-top`}>
                  <td className="sticky left-0 z-10 border-b border-white bg-inherit px-2 py-2 tabular-nums">{it.no}</td>
                  <td className={`sticky left-10 z-10 min-w-[18rem] max-w-[24rem] border-b border-white bg-inherit px-2 py-2 ${strike(it)}`}>
                    <button className="text-left font-semibold leading-snug hover:underline" title="Открыть карточку позиции" onClick={() => onOpen(it)}>{it.name}</button>
                    <FilesMark it={it} />
                    {spec(it) && <div className="mt-0.5 text-xs font-normal opacity-75">{spec(it)}</div>}
                    {it.aliasNames.length > 0 && <div className="text-xs font-normal opacity-60">= {it.aliasNames.join(', ')}</div>}
                  </td>
                  {cols.map((c) => (
                    <td key={c.id} className={`border-b border-white px-1.5 py-2 ${c.w} ${c.right && !['price'].includes(c.id) ? 'text-right' : ''}`}>
                      <Cell col={c.id} it={it} edit={edit} />
                    </td>
                  ))}
                  <td className="border-b border-white px-1 py-2"><button className="rounded p-1.5 hover:bg-black/10" title="Подробнее" onClick={() => onOpen(it)}><Pencil size={14} /></button></td>
                </tr>
              ))}
            </React.Fragment>
          ))}
          {extras.length > 0 && (
            <>
              <CatHeader g={{ cat: 'Из Китая, но нет в потребности — надо ли?', list: extras }} open={!collapsed.has('__extra')} toggle={() => toggleCat('__extra')} colSpan={span} dark />
              {!collapsed.has('__extra') && extras.map((e) => (
                <tr key={e.key} className={ROW_STYLE[e.declined ? 'declined' : 'extra']}>
                  <td className="sticky left-0 z-10 border-b border-white bg-inherit" />
                  <td className="sticky left-10 z-10 border-b border-white bg-inherit px-2 py-2 font-semibold">
                    {e.name}
                    <div className="text-xs font-normal opacity-70">{extraQty(e)}{e.price ? ` · ${fmtMoney(e.price)} ₸/шт` : ''}</div>
                  </td>
                  <td colSpan={span - 2} className="border-b border-white px-2 py-2">
                    <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
                      <StatusBadge status={extraStatus(e)} partial={e.declined ? '' : 'нет в потребности'} />
                      <NeedBlock it={e} onEdit={(p) => edit(e.key, p)} compact />
                      <button className="btn !py-1 text-xs" title="Если это та же позиция под другим названием" onClick={() => onLinkExtra(e)}><Link2 size={13} /> Связать с позицией</button>
                    </div>
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Cards({ items, extras, edit, onOpen, onLinkExtra, collapsed, toggleCat, grouped, vis }) {
  const showMoney = vis.has('supplier') || vis.has('price') || vis.has('stage');
  const showBuy = vis.has('china') || vis.has('buy');
  const head = (g, dark) => (
    <button onClick={() => toggleCat(g.key || g.cat)} data-cat={g.cat} className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold ${dark ? 'bg-emerald-700 text-white' : 'bg-brand-light text-brand'}`}>
      {collapsed.has(g.key || g.cat) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
      <span className="flex-1">{g.cat}</span>
      <span className="font-normal opacity-80">{g.list.length}</span>
    </button>
  );
  return (
    <div className="space-y-3 lg:hidden">
      {groups(items, grouped).map((g) => (
        <div key={g.cat || 'all'} className="space-y-2">
          {g.cat && head(g)}
          {!(g.cat && collapsed.has(g.cat)) && g.list.map((it) => (
            <article key={it.key} className={`rounded-xl p-3 shadow-sm ${ROW_STYLE[it.status]}`}>
              <div className="flex items-start justify-between gap-2">
                <button className={`min-w-0 text-left font-semibold leading-snug ${strike(it)}`} onClick={() => onOpen(it)}><span className="mr-1 font-normal opacity-60">{it.no}.</span>{it.name}<FilesMark it={it} /></button>
                <button className="shrink-0 rounded-full bg-white/70 p-2" aria-label="Подробнее" onClick={() => onOpen(it)}><Pencil size={15} /></button>
              </div>
              {spec(it) && <div className={`mt-1 text-xs opacity-80 ${strike(it)}`}>{spec(it)}</div>}
              {!grouped && <div className="mt-1 text-[11px] font-medium opacity-60">{it.category}</div>}
              <div className="mt-2"><Rooms entries={it.roomEntries} strike={strike(it)} max={4} /></div>
              <div className="mt-2.5 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                <div className="space-y-0.5">
                  <QtyStepper value={it.qty} warn={!it.qty} onCommit={(v) => edit(it.key, { qty: v })} />
                  {it.qtyEdited && <button className="block text-[11px] text-slate-600 underline" onClick={() => edit(it.key, { qty: '' })}>из заявки: {fmtNum(it.baseQty)}</button>}
                </div>
                <StatusCell it={it} onEdit={(p) => edit(it.key, p)} />
              </div>
              {showBuy && <div className="mt-2 text-xs">Из Китая: <b>{it.china}</b> · Докупить: <b>{it.buy}</b></div>}
              {showMoney && (
                <>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <label>Поставщик<EditInput list="suppliers" value={it.supplier} onCommit={(v) => edit(it.key, { supplier: v })} /></label>
                    <label>Цена за ед., ₸<EditInput type="number" align="right" value={it.price || ''} onCommit={(v) => edit(it.key, { price: v })} /></label>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="rounded bg-white/70 px-2 py-0.5 text-xs">{stageLabel(it.stage)}</span>
                    <span className="font-bold">{it.sum ? `${fmtMoney(it.sum)} ₸` : ''}</span>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      ))}
      {extras.length > 0 && (
        <div className="space-y-2">
          {head({ key: '__extra', cat: 'Из Китая, но нет в потребности — надо ли?', list: extras }, true)}
          {!collapsed.has('__extra') && extras.map((e) => (
            <article key={e.key} className={`rounded-xl p-3 ${ROW_STYLE[e.declined ? 'declined' : 'extra']}`}>
              <div className="font-semibold">{e.name}</div>
              <div className="mt-1 text-sm">{extraQty(e)}{e.price ? ` · ${fmtMoney(e.price)} ₸/шт` : ''}</div>
              <div className="mt-1.5 flex flex-wrap items-start gap-x-4 gap-y-2">
                <StatusBadge status={extraStatus(e)} partial={e.declined ? '' : 'нет в потребности'} />
                <NeedBlock it={e} onEdit={(p) => edit(e.key, p)} />
              </div>
              <button className="btn mt-2 !py-1.5 text-xs" onClick={() => onLinkExtra(e)}><Link2 size={13} /> Связать с позицией</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItemsView(props) {
  const [vis, setVis] = useState(loadCols);
  const [collapsed, setCollapsed] = useState(new Set());
  const toggleCat = (c) => setCollapsed((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
  const titles = props.sectionTitles || [];
  const sectionList = titles.map((t) => [t, props.items.filter((i) => i.category === t).length]);
  // перейти к разделу: раскрыть и прокрутить
  const goTo = (title) => {
    setCollapsed((s) => { const n = new Set(s); n.delete(title); return n; });
    setTimeout(() => {
      const el = [...document.querySelectorAll('[data-cat]')].filter((e) => e.dataset.cat === title && e.offsetParent !== null)[0];
      if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }, 60);
  };
  // разделы по ТЗ (мебель, навигация) при первом появлении свёрнуты, их можно раскрыть
  const seenSections = useRef(new Set());
  useEffect(() => {
    const fresh = (props.sectionTitles || []).filter((c) => !seenSections.current.has(c));
    if (!fresh.length) return;
    fresh.forEach((c) => seenSections.current.add(c));
    setCollapsed((s) => new Set([...s, ...fresh]));
  }, [props.sectionTitles]);
  if (!props.items.length && !props.extras.length) {
    return <div className="rounded-lg border bg-white p-8 text-center text-slate-500">Ничего не найдено</div>;
  }
  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {sectionList.length > 0 && (
          <div className="mr-auto flex flex-wrap items-center gap-1.5">
            {sectionList.map(([title, n]) => (
              <button key={title} className="rounded border border-brand bg-white px-3 py-1 text-sm font-semibold text-brand hover:bg-brand-light" onClick={() => goTo(title)}>{title} · {n}</button>
            ))}
          </div>
        )}
        {props.removedCount > 0 && <button className="btn !py-1.5 text-xs" onClick={props.onRemoved} title="Позиции, которые вы убрали из списка"><EyeOff size={14} /> Убранные · {props.removedCount}</button>}
        <ColumnsMenu vis={vis} setVis={setVis} />
      </div>
      <Table {...props} vis={vis} collapsed={collapsed} toggleCat={toggleCat} />
      <Cards {...props} vis={vis} collapsed={collapsed} toggleCat={toggleCat} />
    </>
  );
}
