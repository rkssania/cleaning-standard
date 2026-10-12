import { useCallback, useEffect, useMemo, useState } from 'react';
import { emptyState, buildList, summarize, suggestLinks } from './build.js';

const KEY = 'ks-zakup-v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch (e) { /* повреждённое хранилище — начинаем с пустого */ }
  return emptyState();
}

export function useStore() {
  const [state, setState] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* переполнено */ }
  }, [state]);

  const built = useMemo(() => buildList(state), [state]);
  const summary = useMemo(() => summarize(built.items), [built]);
  const suggestions = useMemo(() => suggestLinks(state, built), [state, built]);

  const edit = useCallback((key, patch) => setState((s) => {
    const cur = { ...(s.edits[key] || {}), ...patch };
    for (const k of Object.keys(cur)) if (cur[k] === '' || cur[k] === undefined) delete cur[k];
    return { ...s, edits: { ...s.edits, [key]: cur } };
  }), []);

  /** Связать: позиция from считается той же, что to (например «уборочный комбайн» = «тележка уборочная»). */
  const link = useCallback((from, to, fromName) => setState((s) => {
    if (!from || !to || from === to) return s;
    const edits = { ...s.edits };
    if (edits[from]) {
      edits[to] = { ...edits[from], ...(edits[to] || {}) };
      delete edits[from];
    }
    return { ...s, aliases: { ...s.aliases, [from]: to }, aliasNames: { ...s.aliasNames, [from]: fromName || from }, edits };
  }), []);

  const unlink = useCallback((from) => setState((s) => {
    const aliases = { ...s.aliases };
    delete aliases[from];
    return { ...s, aliases };
  }), []);

  const addManual = useCallback((m) => setState((s) => ({
    ...s, manual: [...s.manual, { ...m, id: Date.now().toString(36) }],
  })), []);
  const removeManual = useCallback((id) => setState((s) => ({ ...s, manual: s.manual.filter((m) => m.id !== id) })), []);

  const setImported = useCallback((parts) => setState((s) => ({
    ...s, ...parts, importedAt: new Date().toISOString(),
  })), []);
  const setSettings = useCallback((p) => setState((s) => ({ ...s, settings: { ...s.settings, ...p } })), []);
  const reset = useCallback(() => setState(emptyState()), []);
  const restore = useCallback((st) => setState({ ...emptyState(), ...st }), []);

  return { state, built, summary, suggestions, edit, link, unlink, addManual, removeManual, setImported, setSettings, reset, restore };
}
