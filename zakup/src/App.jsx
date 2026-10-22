import React, { useMemo, useState } from 'react';
import { CircleHelp, FileDown, FileUp, Link2, MoreVertical, Plus, Trash2, Wand2 } from 'lucide-react';
import { useStore } from './lib/store.js';
import { exportXlsx, download } from './lib/excelExport.js';
import { DEMO } from './lib/demo.js';
import Filters, { applyFilters } from './components/Filters.jsx';
import ItemsView from './components/ItemsView.jsx';
import ItemDialog from './components/ItemDialog.jsx';
import ImportWizard from './components/ImportWizard.jsx';
import LinksDialog from './components/LinksDialog.jsx';
import Legend from './components/Legend.jsx';
import LinkPicker from './components/LinkPicker.jsx';
import Logo from './components/Logo.jsx';
import { Field, Modal } from './components/ui.jsx';

const EMPTY_F = { q: '', need: '', status: '', category: '', room: '', supplier: '', responsible: '', stage: '' };

export default function App({ conn }) {
  const store = useStore(conn);
  const { state, built, summary, suggestions } = store;
  const [f, setF] = useState(EMPTY_F);
  const [dlg, setDlg] = useState(null); // {type, ...}
  const [menu, setMenu] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [grouped, setGrouped] = useState(() => { try { return localStorage.getItem('ks-grouped') !== '0'; } catch (e) { return true; } });
  const setGroupedSaved = (v) => { setGrouped(v); try { localStorage.setItem('ks-grouped', v ? '1' : '0'); } catch (e) { /* без сохранения */ } };

  const items = useMemo(() => applyFilters(built.items, f), [built.items, f]);
  const showExtras = !f.category && !f.room && !f.supplier && !f.responsible && !f.stage && (!f.status || f.status === 'extra');
  const extras = useMemo(() => {
    if (!showExtras) return [];
    const q = f.q.trim().toLowerCase();
    return built.extras.filter((e) => (!q || e.name.toLowerCase().includes(q)) && (!f.need || (f.need === 'undecided' ? !e.need : e.need === f.need)));
  }, [built.extras, f, showExtras]);
  const mainItems = f.status === 'extra' ? [] : items;
  const undecided = built.items.filter((i) => i.canDecide && !i.need).length + built.extras.filter((e) => !e.need).length;

  const suppliers = [...new Set(built.items.map((i) => i.supplier).filter(Boolean))];
  const people = [...new Set(built.items.map((i) => i.responsible).filter(Boolean))];
  const empty = !state.sd.length && !state.ks.length && !state.china.length && !state.manual.length;

  const doExport = async () => {
    const blob = await exportXlsx(built, state.facts);
    await download(blob, `Закуп оборудования ${new Date().toISOString().slice(0, 10)}.xlsx`, conn.downloads);
  };

  return (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 bg-brand text-white shadow">
        <div className="mx-auto flex max-w-[1800px] items-center gap-2 px-4 py-2.5">
          <div className="shrink-0 overflow-hidden rounded-full bg-white p-1 shadow-sm"><Logo variant="mark" className="h-11 w-11 object-contain sm:h-12 sm:w-12" /></div>
          <div className="hidden min-w-0 flex-1 leading-tight sm:block">
            <h1 className="truncate text-base font-bold sm:text-lg">Центр гематологии</h1>
            <div className="truncate text-xs text-white/75">Закуп оборудования · запуск КС · {store.shared ? 'общая таблица' : 'только на этом устройстве'}</div>
          </div>
          <div className="flex-1 sm:hidden"><span className="block truncate pl-1 text-sm font-semibold">Центр гематологии</span></div>
          <button className="btn !border-white/30 !bg-white/10 !text-white hover:!bg-white/20" onClick={() => setDlg({ type: 'import' })}>
            <FileUp size={16} /><span className="hidden sm:inline">Импорт</span>
          </button>
          <button className="btn !border-white/30 !bg-white/10 !text-white hover:!bg-white/20" disabled={empty} onClick={doExport}>
            <FileDown size={16} /><span className="hidden sm:inline">Экспорт</span>
          </button>
          <div className="relative">
            <button className="rounded-md p-2 hover:bg-white/10" aria-label="Меню" onClick={() => setMenu(!menu)}><MoreVertical size={20} /></button>
            {menu && (
              <div className="absolute right-0 top-full mt-1 w-64 overflow-hidden rounded-lg bg-white py-1 text-sm text-slate-800 shadow-xl" onClick={() => setMenu(false)}>
                <MenuItem icon={CircleHelp} onClick={() => setDlg({ type: 'help' })}>Подсказки</MenuItem>
                <MenuItem icon={Link2} onClick={() => setDlg({ type: 'links' })}>Сверка и связи{suggestions.length ? ` (${suggestions.length})` : ''}</MenuItem>
                <MenuItem icon={Plus} onClick={() => setDlg({ type: 'add' })}>Добавить позицию вручную</MenuItem>
                {!store.shared && <MenuItem icon={Wand2} onClick={() => store.setImported(DEMO)}>Загрузить демо-данные</MenuItem>}
                <MenuItem icon={Trash2} danger onClick={() => setConfirmClear(true)}>Очистить всё</MenuItem>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] space-y-3 px-4 py-4">
        {store.error && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            <span>{store.error}</span>
            <button className="shrink-0 font-semibold underline" onClick={store.clearError}>Скрыть</button>
          </div>
        )}
        {!store.ready ? (
          <div className="rounded-lg border bg-white p-8 text-center text-slate-500">Загружаю общую таблицу…</div>
        ) : empty ? (
          <div className="mx-auto max-w-md rounded-xl border bg-white p-6 text-center">
            <div className="mx-auto w-fit"><Logo className="h-40" /></div>
            <h2 className="mt-2 text-lg font-bold text-brand">Загрузите данные</h2>
            <p className="mt-1 text-sm text-slate-600">Импортируйте Excel: «Общая заявка СД», «КС Астана» и «Китай» (лист «Заказ 1»). Приложение соберёт единый список закупа.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button className="btn btn-primary !py-3" onClick={() => setDlg({ type: 'import' })}><FileUp size={18} /> Импорт из Excel</button>
              {!store.shared && <button className="btn" onClick={() => store.setImported(DEMO)}><Wand2 size={16} /> Посмотреть на демо-данных</button>}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold text-brand sm:hidden">Закуп оборудования <span className="text-sm font-normal text-slate-500">· запуск КС</span></h1>
            {suggestions.length > 0 && (
              <button className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-left text-sm" onClick={() => setDlg({ type: 'links' })}>
                Найдено возможных совпадений названий: <b>{suggestions.length}</b>. Проверить и связать →
              </button>
            )}
            <Filters f={f} setF={setF} items={built.items} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                Показано {mainItems.length} из {built.items.length}
                {undecided > 0 && <> · <button className="font-semibold text-amber-700 underline" onClick={() => setF({ ...EMPTY_F, need: 'undecided' })}>НАДО ЛИ? не решено: {undecided}</button></>}
                {extras.length ? ` · из Китая без потребности: ${extras.length}` : ''}
              </div>
              <div className="inline-flex overflow-hidden rounded-md border border-slate-300 bg-white text-xs font-medium">
                <button className={`px-3 py-1.5 ${grouped ? 'bg-brand text-white' : ''}`} onClick={() => setGroupedSaved(true)}>По категориям</button>
                <button className={`px-3 py-1.5 ${!grouped ? 'bg-brand text-white' : ''}`} onClick={() => setGroupedSaved(false)}>Одним списком</button>
              </div>
            </div>
            <ItemsView
              items={mainItems}
              grouped={grouped}
              extras={extras}
              edit={store.edit}
              onHelp={() => setDlg({ type: 'help' })}
              removedCount={built.removed.length}
              onRemoved={() => setDlg({ type: 'removed' })}
              onOpen={(it) => setDlg({ type: 'item', item: it })}
              onLinkExtra={(e) => setDlg({ type: 'extra', extra: e })}
            />
          </>
        )}
      </main>

      <datalist id="suppliers">{suppliers.map((s) => <option key={s} value={s} />)}</datalist>
      <datalist id="people">{people.map((s) => <option key={s} value={s} />)}</datalist>

      {dlg?.type === 'import' && (
        <ImportWizard hasData={!empty} onClose={() => setDlg(null)} onImport={(parts) => store.setImported(parts)} />
      )}
      {dlg?.type === 'item' && <ItemDialog item={dlg.item} store={store} onClose={() => setDlg(null)} />}
      {dlg?.type === 'help' && <Legend onClose={() => setDlg(null)} />}
      {dlg?.type === 'removed' && (
        <Modal title={`Убранные позиции · ${built.removed.length}`} onClose={() => setDlg(null)}>
          <p className="mb-2 text-xs text-slate-500">Эти позиции не показываются в списке и не идут в закуп. Нажмите «Вернуть», чтобы вернуть позицию.</p>
          <ul className="divide-y">
            {built.removed.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0"><b>{r.name}</b><span className="block truncate text-xs text-slate-500">{r.rooms}</span></span>
                <button className="btn !py-1 text-xs" onClick={() => store.edit(r.key, { removed: '' })}>Вернуть</button>
              </li>
            ))}
            {!built.removed.length && <li className="py-2 text-slate-500">Ничего не убрано</li>}
          </ul>
        </Modal>
      )}
      {dlg?.type === 'links' && <LinksDialog store={store} onClose={() => setDlg(null)} />}
      {confirmClear && (
        <Modal title="Очистить всё?" onClose={() => setConfirmClear(false)}>
          <p className="text-sm">{store.shared ? 'Данные будут удалены у всех, кто работает с общей таблицей: заявка, потребность, закуп из Китая, связи, цены и поставщики.' : 'Все данные будут удалены с этого устройства.'} Отменить это нельзя.</p>
          <div className="mt-4 flex gap-2">
            <button className="btn flex-1" onClick={() => setConfirmClear(false)}>Отмена</button>
            <button className="btn flex-1 !border-red-700 !bg-red-700 !text-white" onClick={() => { store.reset(); setConfirmClear(false); }}>Удалить всё</button>
          </div>
        </Modal>
      )}
      {dlg?.type === 'add' && <AddDialog onAdd={store.addManual} onClose={() => setDlg(null)} />}
      {dlg?.type === 'extra' && (
        <Modal title={dlg.extra.name} onClose={() => setDlg(null)}>
          <p className="mb-3 text-sm text-slate-600">Едет из Китая ({dlg.extra.qty} шт), но в потребности под таким названием не найдено. Если это та же позиция под другим названием, свяжите их.</p>
          <LinkPicker fromKey={dlg.extra.key} fromName={dlg.extra.name} items={built.items} onLink={(a, b, n) => { store.link(a, b, n); setDlg(null); }} />
        </Modal>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, children, onClick, danger }) {
  return (
    <button className={`flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-100 ${danger ? 'text-red-700' : ''}`} onClick={onClick}>
      <Icon size={16} />{children}
    </button>
  );
}

function AddDialog({ onAdd, onClose }) {
  const [v, setV] = useState({ name: '', qty: 1, room: '', size: '' });
  return (
    <Modal title="Новая позиция" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Наименование"><input className="inp" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Количество"><input className="inp" inputMode="numeric" value={v.qty} onChange={(e) => setV({ ...v, qty: e.target.value })} /></Field>
          <Field label="Помещение"><input className="inp" value={v.room} onChange={(e) => setV({ ...v, room: e.target.value })} /></Field>
        </div>
        <Field label="Характеристики / габариты"><input className="inp" value={v.size} onChange={(e) => setV({ ...v, size: e.target.value })} /></Field>
        <button className="btn btn-primary w-full" disabled={!v.name.trim()} onClick={() => { onAdd({ ...v, name: v.name.trim() }); onClose(); }}>Добавить</button>
      </div>
    </Modal>
  );
}
