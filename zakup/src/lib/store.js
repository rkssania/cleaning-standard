import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { emptyState, buildList, summarize, suggestLinks } from './build.js';

const LOCAL_KEY = 'ks-zakup-v1';
const CHUNK = 100; // строк в одном документе общей базы

/** Короткий безопасный id документа из произвольного текста (в путях нельзя кириллицу). */
export function hid(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Тип доступа к данным: общая база (db) или localStorage этого устройства. */
export async function connect() {
  try {
    const claude = window.claude;
    if (!claude?.use) return { db: null, canWrite: true, download: null };
    const [db, user, downloads] = await Promise.all([claude.use('db'), claude.use('user'), claude.use('downloads')]);
    let canWrite = true;
    try { if (db && user && user.can('data.write') === false) canWrite = false; } catch (e) { /* неизвестно — считаем, что можно */ }
    return { db, canWrite, downloads };
  } catch (e) {
    return { db: null, canWrite: true, downloads: null };
  }
}

// ---------- локальный режим ----------
function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch (e) { /* повреждённое хранилище — начинаем с пустого */ }
  return emptyState();
}

function useLocal(enabled) {
  const [state, setState] = useState(loadLocal);
  useEffect(() => {
    if (!enabled) return;
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (e) { /* переполнено */ }
  }, [state, enabled]);

  const actions = useMemo(() => ({
    edit: (key, patch) => setState((s) => {
      const cur = { ...(s.edits[key] || {}), ...patch };
      for (const k of Object.keys(cur)) if (cur[k] === '' || cur[k] === undefined) delete cur[k];
      return { ...s, edits: { ...s.edits, [key]: cur } };
    }),
    link: (from, to, fromName) => setState((s) => {
      if (!from || !to || from === to) return s;
      const edits = { ...s.edits };
      if (edits[from]) { edits[to] = { ...edits[from], ...(edits[to] || {}) }; delete edits[from]; }
      return { ...s, aliases: { ...s.aliases, [from]: to }, aliasNames: { ...s.aliasNames, [from]: fromName || from }, edits };
    }),
    unlink: (from) => setState((s) => {
      const aliases = { ...s.aliases };
      delete aliases[from];
      return { ...s, aliases };
    }),
    addManual: (m) => setState((s) => ({ ...s, manual: [...s.manual, { ...m, id: Date.now().toString(36) }] })),
    removeManual: (id) => setState((s) => ({ ...s, manual: s.manual.filter((m) => m.id !== id) })),
    setImported: (parts) => setState((s) => ({ ...s, ...parts, importedAt: new Date().toISOString() })),
    setSettings: (p) => setState((s) => ({ ...s, settings: { ...s.settings, ...p } })),
    setFact: (name, v) => setState((s) => ({ ...s, facts: { ...s.facts, [name]: v } })),
    reset: () => setState(emptyState()),
  }), []);
  return { state, actions, ready: true, error: '' };
}

// ---------- общая база ----------
function useRemote(db, canWrite) {
  const [meta, setMeta] = useState(null); // null — ещё не пришло
  const [rowDocs, setRowDocs] = useState(null);
  const [editDocs, setEditDocs] = useState(null);
  const [aliasDocs, setAliasDocs] = useState(null);
  const [manualDocs, setManualDocs] = useState(null);
  const [error, setError] = useState('');
  const queues = useRef(new Map());

  useEffect(() => {
    if (!db) return undefined;
    const fail = (e) => setError(`Нет связи с общей таблицей (${e?.code || 'ошибка'}). Обновите страницу.`);
    const list = (setter, pick) => (snap) => setter(snap.docs.map((d) => ({ id: d.id, ...pick(d.data()) })));
    const subs = [
      db.doc('meta/state').onSnapshot((d) => setMeta(d.exists ? d.data() : {}), fail),
      db.collection('rows').onSnapshot(list(setRowDocs, (x) => x), fail),
      db.collection('edits').onSnapshot(list(setEditDocs, (x) => x), fail),
      db.collection('aliases').onSnapshot(list(setAliasDocs, (x) => x), fail),
      db.collection('manual').onSnapshot(list(setManualDocs, (x) => x), fail),
    ];
    return () => subs.forEach((u) => u());
  }, [db]);

  const state = useMemo(() => {
    const st = emptyState();
    if (!db) return st;
    for (const src of ['sd', 'ks', 'china']) {
      st[src] = (rowDocs || []).filter((d) => d.src === src).sort((a, b) => a.i - b.i).flatMap((d) => d.rows || []);
    }
    for (const d of editDocs || []) {
      const { id, key, ...f } = d;
      if (key) st.edits[key] = f;
    }
    for (const d of aliasDocs || []) { st.aliases[d.from] = d.to; st.aliasNames[d.from] = d.name; }
    st.manual = (manualDocs || []).map(({ id, ...m }) => ({ ...m, id }));
    st.facts = meta?.facts || {};
    st.settings = { dedupePit: meta?.dedupePit ?? true };
    st.importedAt = meta?.importedAt || null;
    return st;
  }, [db, meta, rowDocs, editDocs, aliasDocs, manualDocs]);

  // Записи в один документ идут по очереди; ошибки показываются, а не теряются.
  const run = useCallback((path, fn) => {
    if (!canWrite) { setError('У вас доступ только для просмотра. Попросите права «Участник» или «Редактор».'); return Promise.resolve(); }
    const prev = queues.current.get(path) || Promise.resolve();
    const next = prev.then(fn).catch((e) => setError(`Не удалось сохранить (${e?.code || 'ошибка'}). Попробуйте ещё раз.`));
    queues.current.set(path, next);
    return next;
  }, [canWrite]);

  const actions = useMemo(() => {
    if (!db) return {};
    const upsert = (path, patch, existing) => run(path, () => (existing ? db.doc(path).update(patch) : db.doc(path).set(patch)));
    const editsById = Object.fromEntries((editDocs || []).map((d) => [d.id, d]));
    const aliasById = Object.fromEntries((aliasDocs || []).map((d) => [d.id, d]));
    const metaPatch = (patch) => upsert('meta/state', patch, meta && Object.keys(meta).length > 0);
    return {
      edit: (key, patch) => {
        const id = hid(key);
        const ex = editsById[id];
        upsert(`edits/${id}`, ex ? patch : { key, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== '' && v !== undefined)) }, !!ex);
      },
      link: (from, to, fromName) => {
        if (!from || !to || from === to) return;
        run(`aliases/${hid(from)}`, () => db.doc(`aliases/${hid(from)}`).set({ from, to, name: fromName || from }));
        const src = editsById[hid(from)];
        if (src) {
          const { id, key, ...fields } = src;
          const dst = editsById[hid(to)];
          const { id: _i, key: _k, ...dstFields } = dst || {};
          run(`edits/${hid(to)}`, () => db.doc(`edits/${hid(to)}`).set({ key: to, ...fields, ...dstFields }));
          run(`edits/${hid(from)}`, () => db.doc(`edits/${hid(from)}`).delete());
        }
      },
      unlink: (from) => run(`aliases/${hid(from)}`, () => db.doc(`aliases/${hid(from)}`).delete()),
      addManual: (m) => run('manual/new', () => db.collection('manual').add(m)),
      removeManual: (id) => run(`manual/${id}`, () => db.doc(`manual/${id}`).delete()),
      setSettings: (p) => metaPatch({ dedupePit: p.dedupePit }),
      setFact: (name, v) => metaPatch({ facts: { [name]: v === '' ? 0 : v } }),
      setImported: (parts) => run('import', async () => {
        for (const src of Object.keys(parts)) {
          const rows = parts[src];
          const chunks = Math.max(1, Math.ceil(rows.length / CHUNK));
          for (let i = 0; i < chunks; i++) {
            await db.doc(`rows/${src}-${i}`).set({ src, i, rows: rows.slice(i * CHUNK, (i + 1) * CHUNK) });
          }
          for (const d of rowDocs || []) if (d.src === src && d.i >= chunks) await db.doc(`rows/${d.id}`).delete();
        }
        await db.doc('meta/state').set({ ...(meta || {}), importedAt: new Date().toISOString() });
      }),
      reset: () => run('reset', async () => {
        const all = [['rows', rowDocs], ['edits', editDocs], ['aliases', aliasDocs], ['manual', manualDocs]];
        for (const [c, docs] of all) for (const d of docs || []) await db.doc(`${c}/${d.id}`).delete();
        await db.doc('meta/state').delete();
      }),
    };
  }, [db, run, meta, rowDocs, editDocs, aliasDocs, manualDocs]);

  const ready = !db || (meta !== null && rowDocs !== null && editDocs !== null && aliasDocs !== null && manualDocs !== null);
  return { state, actions, ready, error, clearError: () => setError('') };
}

export function useStore(conn) {
  const { db, canWrite } = conn;
  const local = useLocal(!db);
  const remote = useRemote(db, canWrite);
  const cur = db ? remote : local;
  const { state } = cur;

  const built = useMemo(() => buildList(state), [state]);
  const summary = useMemo(() => summarize(built.items, state.facts), [built, state.facts]);
  const suggestions = useMemo(() => suggestLinks(state, built), [state, built]);

  return {
    state, built, summary, suggestions,
    shared: !!db, ready: cur.ready, error: cur.error || '', clearError: cur.clearError || (() => {}),
    ...cur.actions,
  };
}
