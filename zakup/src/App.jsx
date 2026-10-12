import React, { useMemo, useState } from 'react';
import { Droplet, FileDown, FileUp, Link2, MoreVertical, Plus, Trash2, Wand2 } from 'lucide-react';
import { useStore } from './lib/store.js';
import { exportXlsx, download } from './lib/excelExport.js';
import { DEMO } from './lib/demo.js';
import { CATEGORIES } from './lib/categories.js';
import Summary from './components/Summary.jsx';
import Filters, { applyFilters } from './components/Filters.jsx';
import ItemsView from './components/ItemsView.jsx';
import ItemDialog from './components/ItemDialog.jsx';
import ImportWizard from './components/ImportWizard.jsx';
import LinksDialog from './components/LinksDialog.jsx';
import LinkPicker from './components/LinkPicker.jsx';
import { EditInput, Field, Modal } from './components/ui.jsx';

const EMPTY_F = { q: '', status: '', category: '', room: '', supplier: '', responsible: '', stage: '' };

export default function App() {
  const store = useStore();
  const { state, built, summary, suggestions } = store;
  const [f, setF] = useState(EMPTY_F);
  const [dlg, setDlg] = useState(null); // {type, ...}
  const [menu, setMenu] = useState(false);

  const items = useMemo(() => applyFilters(built.items, f), [built.items, f]);
  const showExtras = !f.category && !f.room && !f.supplier && !f.responsible && !f.stage && (!f.status || f.status === 'extra');
  const extras = useMemo(() => {
    if (!showExtras) return [];
    const q = f.q.trim().toLowerCase();
    return built.extras.filter((e) => !q || e.name.toLowerCase().includes(q));
  }, [built.extras, f, showExtras]);
  const mainItems = f.status === 'extra' ? [] : items;

  const suppliers = [...new Set(built.items.map((i) => i.supplier).filter(Boolean))];
  const people = [...new Set(built.items.map((i) => i.responsible).filter(Boolean))];
  const empty = !state.sd.length && !state.ks.length && !state.china.length && !state.manual.length;

  const doExport = async () => {
    const blob = await exportXlsx(built);
    download(blob, `Закуп оборудования ${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 bg-brand text-white shadow">
        <div className="mx-auto flex max-w-[1800px] items-center gap-2 px-4 py-2.5">
          <Droplet size={26} className="shrink-0 fill-drop text-drop" />
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="truncate text-base font-bold sm:text-lg">Закуп оборудования</h1>
            <div className="truncate text-xs text-white/70">Центр гематологии, Астана · запуск КС</div>
          </div>
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
                <MenuItem icon={Link2} onClick={() => setDlg({ type: 'links' })}>Сверка и связи{suggestions.length ? ` (${suggestions.length})` : ''}</MenuItem>
                <MenuItem icon={Plus} onClick={() => setDlg({ type: 'add' })}>Добавить позицию вручную</MenuItem>
                <MenuItem icon={Wand2} onClick={() => store.setImported(DEMO)}>Загрузить демо-данные</MenuItem>
                <MenuItem icon={Trash2} danger onClick={() => confirm('Удалить все данные модуля с этого устройства?') && store.reset()}>Очистить всё</MenuItem>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] space-y-3 px-4 py-4">
        {empty ? (
          <div className="mx-auto max-w-md rounded-xl border bg-white p-6 text-center">
            <Droplet size={40} className="mx-auto fill-drop text-drop" />
            <h2 className="mt-2 text-lg font-bold text-brand">Загрузите данные</h2>
            <p className="mt-1 text-sm text-slate-600">Импортируйте Excel: «Общая заявка СД», «КС Астана» и «Китай» (лист «Заказ 1»). Приложение соберёт единый список закупа.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button className="btn btn-primary !py-3" onClick={() => setDlg({ type: 'import' })}><FileUp size={18} /> Импорт из Excel</button>
              <button className="btn" onClick={() => store.setImported(DEMO)}><Wand2 size={16} /> Посмотреть на демо-данных</button>
            </div>
          </div>
        ) : (
          <>
            <Summary summary={summary} extrasCount={built.extras.length} status={f.status} onStatus={(s) => setF({ ...f, status: s })} />
            {suggestions.length > 0 && (
              <button className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-left text-sm" onClick={() => setDlg({ type: 'links' })}>
                Найдено возможных совпадений названий: <b>{suggestions.length}</b>. Проверить и связать →
              </button>
            )}
            <Filters f={f} setF={setF} items={built.items} />
            <div className="text-xs text-slate-500">Показано {mainItems.length} из {built.items.length}{extras.length ? ` · из Китая без потребности: ${extras.length}` : ''}</div>
            <ItemsView
              items={mainItems}
              extras={extras}
              edit={store.edit}
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
      {dlg?.type === 'links' && <LinksDialog store={store} onClose={() => setDlg(null)} />}
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
