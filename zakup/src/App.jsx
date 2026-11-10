import React, { useMemo, useState } from 'react';
import { CircleHelp, FileDown, FileUp, LayoutList, Link2, MoreVertical, Plus, Trash2, Wand2 } from 'lucide-react';
import { useStore } from './lib/store.js';
import { resolveKey } from './lib/build.js';
import { looseKey } from './lib/normalize.js';
import { ROOMS, ROOM_LABELS, roomLabel } from './lib/rooms.js';
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
  const [mode, setMode] = useState(() => { try { return localStorage.getItem('ks-view') || (localStorage.getItem('ks-grouped') === '0' ? 'flat' : 'cat'); } catch (e) { return 'cat'; } });
  const setModeSaved = (v) => { setMode(v); try { localStorage.setItem('ks-view', v); } catch (e) { /* без сохранения */ } };

  const items = useMemo(() => applyFilters(built.items, f), [built.items, f]);
  const showExtras = !f.category && !f.room && !f.supplier && !f.responsible && !f.stage && (!f.status || f.status === 'extra');
  const extras = useMemo(() => {
    if (!showExtras) return [];
    const q = f.q.trim().toLowerCase();
    return built.extras.filter((e) => (!q || e.name.toLowerCase().includes(q)) && (!f.need || (f.need === 'undecided' ? !e.need : e.need === f.need)));
  }, [built.extras, f, showExtras]);
  // помещения по плану (даже если в них пока нет позиций), потом прочие названия из таблицы
  const itemRooms = useMemo(() => [...new Set(built.items.flatMap((i) => i.roomList))], [built.items]);
  const otherRooms = useMemo(() => itemRooms.filter((r) => !ROOM_LABELS.includes(r)).sort(new Intl.Collator('ru', { numeric: true, sensitivity: 'base' }).compare), [itemRooms]);
  const rooms = useMemo(() => [...ROOM_LABELS, ...otherRooms], [otherRooms]);
  // при выбранном помещении у каждой позиции показываем, сколько её в этом помещении
  const roomItems = f.room ? items.map((i) => ({ ...i, roomName: f.room, roomQty: (i.roomEntries.find(([r]) => r === f.room) || [])[1] })) : items;
  // позиция с таким названием уже есть — добавляем к ней помещение (или увеличиваем число в нём), иначе создаём новую
  const addToList = (m) => {
    const key = resolveKey(looseKey(m.name), state.aliases);
    const ex = built.items.find((i) => i.key === key);
    const q = Number(String(m.qty).replace(',', '.')) || 0;
    const room = (m.room || '').trim() || 'Без помещения';
    if (!ex) return store.addManual({ ...m, room, qty: q });
    const entries = ex.roomEntries.some(([r]) => r === room) ? ex.roomEntries.map(([r, n]) => (r === room ? [r, n + q] : [r, n])) : [...ex.roomEntries, [room, q]];
    store.edit(ex.key, { rooms: entries, qty: '' });
  };
  const mainItems = f.status === 'extra' ? [] : roomItems;
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
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-[45] border-b-2 border-brand bg-white">
        <div className="mx-auto flex max-w-[1800px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <div className="shrink-0" title="Центр гематологии"><Logo variant="mark" className="h-10 w-10 object-contain sm:h-12 sm:w-12" /></div>
          <div className="min-w-0 flex-1 leading-none">
            <h1 className="truncate text-[15px] font-bold text-brand sm:text-xl">Закуп оборудования</h1>
            <div className="mt-1 truncate text-xs text-slate-500">Запуск КС · {store.shared ? 'общая таблица · изменения сохраняются сразу' : conn.noAccess ? 'нет доступа' : 'только на этом устройстве'}</div>
          </div>
          {!conn.noAccess && (<>
          <button className="btn !px-2.5 sm:!px-3" onClick={() => setDlg({ type: 'import' })}>
            <FileUp size={16} /><span className="hidden sm:inline">Импорт</span>
          </button>
          <button className="btn !px-2.5 sm:!px-3" disabled={empty} onClick={doExport}>
            <FileDown size={16} /><span className="hidden sm:inline">Экспорт</span>
          </button>
          <div className="relative">
            <button className="btn !px-2" aria-label="Меню" onClick={() => setMenu(!menu)}><MoreVertical size={18} /></button>
            {menu && (
              <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded border border-brand bg-white py-1 text-sm text-slate-900 shadow-lg" onClick={() => setMenu(false)}>
                <MenuItem icon={CircleHelp} onClick={() => setDlg({ type: 'help' })}>Подсказки</MenuItem>
                <MenuItem icon={Link2} onClick={() => setDlg({ type: 'links' })}>Сверка и связи{suggestions.length ? ` (${suggestions.length})` : ''}</MenuItem>
                <MenuItem icon={Plus} onClick={() => setDlg({ type: 'add' })}>Добавить позицию вручную</MenuItem>
                <MenuItem icon={LayoutList} onClick={() => setDlg({ type: 'rooms' })}>Помещения (по плану)</MenuItem>
                {!store.shared && <MenuItem icon={Wand2} onClick={() => store.setImported(DEMO)}>Загрузить демо-данные</MenuItem>}
                <MenuItem icon={Trash2} danger onClick={() => setConfirmClear(true)}>Очистить всё</MenuItem>
              </div>
            )}
          </div>
          </>)}
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] space-y-3 px-4 py-4">
        {store.error && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            <span>{store.error}</span>
            <button className="shrink-0 font-semibold underline" onClick={store.clearError}>Скрыть</button>
          </div>
        )}
        {conn.noAccess ? (
          <div className="mx-auto max-w-md rounded border border-brand bg-white p-6 text-center">
            <Logo className="mx-auto h-24" />
            <h2 className="mt-3 text-xl font-bold text-brand">Нет доступа к общей таблице</h2>
            <p className="mt-2 text-sm text-slate-600">Откройте ссылку в браузере, где вы вошли в свой аккаунт claude.ai, и убедитесь, что владелец таблицы дал вам доступ с правом редактирования. Если вы только что вошли, обновите страницу.</p>
          </div>
        ) : !store.ready ? (
          <div className="rounded-lg border bg-white p-8 text-center text-slate-500">Загружаю общую таблицу…</div>
        ) : empty ? (
          <div className="mx-auto max-w-md rounded border border-brand bg-white p-6 text-center">
            <div className="mx-auto w-fit"><Logo className="h-36" /></div>
            <h2 className="mt-2 text-2xl font-bold text-brand">Загрузите данные</h2>
            <p className="mt-1 text-sm text-slate-600">Импортируйте Excel: «Общая заявка СД», «КС Астана» и «Китай» (лист «Заказ 1»). Приложение соберёт единый список закупа.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button className="btn btn-primary !py-3" onClick={() => setDlg({ type: 'import' })}><FileUp size={18} /> Импорт из Excel</button>
              {!store.shared && <button className="btn" onClick={() => store.setImported(DEMO)}><Wand2 size={16} /> Посмотреть на демо-данных</button>}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1 lg:max-w-sm"><Filters f={f} setF={setF} /></div>
              <select className="inp !w-auto max-w-[14rem] !border-brand !py-2 font-medium text-brand" aria-label="Помещение" value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })}>
                <option value="">Все помещения</option>
                <optgroup label="По плану этажа">{ROOM_LABELS.map((r) => <option key={r} value={r}>{r}</option>)}</optgroup>
                {otherRooms.length > 0 && <optgroup label="Прочие">{otherRooms.map((r) => <option key={r} value={r}>{r}</option>)}</optgroup>}
              </select>
              <div className="inline-flex overflow-hidden rounded border border-brand bg-white text-xs font-medium">
                {[['cat', 'По категориям'], ['room', 'По помещениям'], ['flat', 'Одним списком']].map(([id, label]) => (
                  <button key={id} className={`px-3 py-2 ${mode === id ? 'bg-brand text-white' : 'text-brand'}`} onClick={() => setModeSaved(id)}>{label}</button>
                ))}
              </div>
            </div>
            <ItemsView
              items={mainItems}
              sectionTitles={built.sectionTitles}
              mode={f.room ? 'room' : mode}
              query={f.q}
              room={f.room}
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
      {dlg?.type === 'rooms' && (
        <Modal title="Помещения по плану этажа" wide onClose={() => setDlg(null)}>
          <p className="mb-2 text-xs text-slate-500">Названия по навигации. Нажмите на помещение, чтобы показать его позиции.</p>
          <div className="max-h-[65dvh] overflow-auto rounded border border-slate-300">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-brand text-left text-xs text-white"><tr><th className="px-2 py-1.5">№</th><th className="px-2 py-1.5">Помещение</th><th className="px-2 py-1.5 text-right">м²</th><th className="px-2 py-1.5 text-right">Позиций</th></tr></thead>
              <tbody>
                {ROOMS.map(([no, name, area]) => {
                  const label = roomLabel(no);
                  const n = built.items.filter((i) => i.roomList.includes(label)).length;
                  return (
                    <tr key={no} className="cursor-pointer border-t border-slate-200 hover:bg-brand-light" onClick={() => { setF({ ...f, room: label }); setDlg(null); }}>
                      <td className="px-2 py-1.5 tabular-nums">{no}</td><td className="px-2 py-1.5 font-medium">{name}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{area.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{n || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
      {dlg?.type === 'add' && <AddDialog onAdd={addToList} rooms={rooms} defaultRoom={f.room} onClose={() => setDlg(null)} />}
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

function AddDialog({ onAdd, onClose, rooms = [], defaultRoom = '' }) {
  const [v, setV] = useState({ name: '', qty: 1, room: defaultRoom, size: '' });
  return (
    <Modal title="Новая позиция" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Наименование"><input className="inp" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Количество"><input className="inp" inputMode="numeric" value={v.qty} onChange={(e) => setV({ ...v, qty: e.target.value })} /></Field>
          <Field label="Помещение"><input className="inp" list="rooms-list" value={v.room} onChange={(e) => setV({ ...v, room: e.target.value })} /></Field>
        </div>
        <datalist id="rooms-list">{rooms.map((r) => <option key={r} value={r} />)}</datalist>
        <Field label="Характеристики / габариты"><input className="inp" value={v.size} onChange={(e) => setV({ ...v, size: e.target.value })} /></Field>
        <button className="btn btn-primary w-full" disabled={!v.name.trim()} onClick={() => { onAdd({ ...v, name: v.name.trim() }); onClose(); }}>Добавить</button>
      </div>
    </Modal>
  );
}
