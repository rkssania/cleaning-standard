import React, { useState } from 'react';
import { Check, Unlink } from 'lucide-react';
import { resolveKey } from '../lib/build.js';
import { Modal } from './ui.jsx';
import LinkPicker from './LinkPicker.jsx';

const TABS = [['recon', 'Сверка КС ↔ СД'], ['links', 'Связи']];

export default function LinksDialog({ store, onClose, focus }) {
  const { state, built, suggestions, link, unlink, setSettings } = store;
  const [tab, setTab] = useState(focus ? 'links' : 'recon');
  const { ksOnly, ksMore, sdNotInKs } = built.reconcile;
  const names = Object.fromEntries(built.items.map((i) => [i.key, i.name]));
  return (
    <Modal title="Сверка и связи" onClose={onClose} wide>
      <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1">
        {TABS.map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${tab === k ? 'bg-white shadow' : 'text-slate-600'}`}>{v}</button>
        ))}
      </div>

      {tab === 'recon' && (
        <div className="space-y-4 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={state.settings.dedupePit} onChange={(e) => setSettings({ dedupePit: e.target.checked })} />
            <span>ПИТ и реанимация не дублируются: брать спецификацию реанимации, строки ПИТ не учитывать</span>
          </label>
          <section>
            <h3 className="font-semibold text-red-700">Есть в КС Астана, нет в заявке СД — добавлено в список ({ksOnly.length})</h3>
            {ksOnly.length === 0 && <p className="text-slate-500">Всё из потребности попало в заявку.</p>}
            <ul className="divide-y">
              {ksOnly.map((i) => <li key={i.key} className="py-1.5"><b>{i.name}</b> — {i.ksQty} шт <span className="text-xs text-slate-500">({i.rooms})</span></li>)}
            </ul>
          </section>
          <section>
            <h3 className="font-semibold">В КС Астана количество больше, чем в заявке СД ({ksMore.length})</h3>
            <p className="text-xs text-slate-500">В списке берётся количество из заявки СД; при необходимости измените его вручную.</p>
            <ul className="divide-y">
              {ksMore.map((i) => <li key={i.key} className="py-1.5"><b>{i.name}</b>: СД {i.sdQty}, КС {i.ksQty}</li>)}
            </ul>
          </section>
          <section>
            <h3 className="font-semibold">Есть в заявке СД, нет в потребности КС ({sdNotInKs.length})</h3>
            <ul className="divide-y">
              {sdNotInKs.map((i) => <li key={i.key} className="py-1.5">{i.name} — {i.sdQty} шт</li>)}
            </ul>
          </section>
        </div>
      )}

      {tab === 'links' && (
        <div className="space-y-4 text-sm">
          {suggestions.length > 0 && (
            <section>
              <h3 className="font-semibold">Возможно, это одно и то же ({suggestions.length})</h3>
              <ul className="divide-y">
                {suggestions.slice(0, 30).map((s) => (
                  <li key={s.from + s.to} className="flex items-center justify-between gap-2 py-1.5">
                    <span><b>{s.fromName}</b> <span className="text-slate-500">→</span> {s.toName}</span>
                    <button className="btn !py-1 text-xs" onClick={() => link(s.from, s.to, s.fromName)}><Check size={13} /> Связать</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h3 className="mb-1 font-semibold">Связать вручную</h3>
            <ManualLink items={built.items} extras={built.extras} link={link} />
          </section>
          <section>
            <h3 className="font-semibold">Действующие связи ({Object.keys(state.aliases).length})</h3>
            <ul className="divide-y">
              {Object.keys(state.aliases).map((from) => (
                <li key={from} className="flex items-center justify-between gap-2 py-1.5">
                  <span>{state.aliasNames[from] || from} <span className="text-slate-500">=</span> <b>{names[resolveKey(from, state.aliases)] || '(позиции нет в списке)'}</b></span>
                  <button className="btn !py-1 text-xs" onClick={() => unlink(from)}><Unlink size={13} /> Разъединить</button>
                </li>
              ))}
              {!Object.keys(state.aliases).length && <li className="py-1.5 text-slate-500">Связей пока нет</li>}
            </ul>
          </section>
        </div>
      )}
    </Modal>
  );
}

function ManualLink({ items, extras, link }) {
  const [v, setV] = useState('');
  const all = [...items.map((i) => ({ key: i.key, name: i.name })), ...extras.map((e) => ({ key: e.key, name: e.name }))];
  const from = all.find((a) => a.name.toLowerCase() === v.trim().toLowerCase());
  return (
    <div className="space-y-2 rounded-lg bg-slate-50 p-3">
      <div>
        <div className="mb-0.5 text-xs font-medium text-slate-500">Позиция, которую нужно влить (например «уборочный комбайн»)</div>
        <input className="inp" list="ml-from" value={v} onChange={(e) => setV(e.target.value)} placeholder="Название…" />
        <datalist id="ml-from">{all.map((a) => <option key={a.key} value={a.name} />)}</datalist>
      </div>
      {from && <LinkPicker fromKey={from.key} fromName={from.name} items={items} onLink={(a, b, n) => { link(a, b, n); setV(''); }} label="…считать позицией (например «тележка уборочная»)" />}
    </div>
  );
}
