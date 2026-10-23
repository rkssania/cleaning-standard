import { createClient } from '@supabase/supabase-js';

/**
 * Общая таблица на Supabase. Повторяет тот же интерфейс, что и база страницы claude.ai
 * (doc/collection, get/set/update/delete/add, onSnapshot), поэтому остальной код не меняется.
 * Все документы лежат в одной таблице docs (collection, id, data).
 */
export function createSupabaseDb(url, key) {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const cache = new Map(); // коллекция -> Map(id -> data)
  const subs = new Map(); // коллекция -> Set(функций-подписчиков)
  const loaded = new Map(); // коллекция -> Promise первой загрузки
  const col = (c) => { if (!cache.has(c)) cache.set(c, new Map()); return cache.get(c); };
  const emit = (c) => (subs.get(c) || []).forEach((fn) => fn());
  const split = (path) => { const i = path.indexOf('/'); return [path.slice(0, i), path.slice(i + 1)]; };
  const fail = (error) => Object.assign(new Error(error.message), { code: error.code || 'ошибка' });
  const apply = (c, id, data) => { if (data === null) col(c).delete(id); else col(c).set(id, data); };

  const fetchAll = async (c) => {
    const { data, error } = await sb.from('docs').select('id,data').eq('collection', c);
    if (error) throw fail(error);
    const m = col(c);
    m.clear();
    for (const r of data) m.set(r.id, r.data);
  };
  const load = (c, force) => {
    if (force || !loaded.has(c)) loaded.set(c, fetchAll(c));
    return loaded.get(c);
  };

  let channel;
  const listen = () => {
    if (channel) return;
    channel = sb
      .channel('docs-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, (p) => {
        const gone = p.eventType === 'DELETE';
        const row = gone ? p.old : p.new;
        if (!row || !subs.has(row.collection)) return;
        apply(row.collection, row.id, gone ? null : row.data);
        emit(row.collection);
      })
      .subscribe((status) => {
        // после обрыва связи перечитываем всё, что открыто
        if (status === 'SUBSCRIBED') [...subs.keys()].forEach((c) => load(c, true).then(() => emit(c)).catch(() => {}));
      });
  };

  const colSnap = (c) => ({ docs: [...col(c)].map(([id, data]) => ({ id, data: () => data })) });
  const docSnap = (c, id) => {
    const data = col(c).get(id);
    return { id, exists: data !== undefined, data: () => data };
  };
  const watch = (c, make, cb, onError) => {
    const fn = () => cb(make());
    if (!subs.has(c)) subs.set(c, new Set());
    subs.get(c).add(fn);
    listen();
    load(c).then(fn).catch((e) => onError?.(e));
    return () => subs.get(c)?.delete(fn);
  };

  const write = async (c, id, data) => {
    const { error } = await sb.from('docs').upsert({ collection: c, id, data, updated_at: new Date().toISOString() });
    if (error) throw fail(error);
    apply(c, id, data);
    emit(c);
  };
  const readOne = async (c, id) => {
    const { data, error } = await sb.from('docs').select('data').eq('collection', c).eq('id', id).maybeSingle();
    if (error) throw fail(error);
    return data ? data.data : undefined;
  };
  const doc = (path) => {
    const [c, id] = split(path);
    return {
      get: async () => { const d = await readOne(c, id); return { id, exists: d !== undefined, data: () => d }; },
      set: (obj) => write(c, id, obj),
      update: async (patch) => write(c, id, { ...((await readOne(c, id)) || {}), ...patch }),
      delete: async () => {
        const { error } = await sb.from('docs').delete().eq('collection', c).eq('id', id);
        if (error) throw fail(error);
        apply(c, id, null);
        emit(c);
      },
      onSnapshot: (cb, onError) => watch(c, () => docSnap(c, id), cb, onError),
    };
  };
  const collection = (c) => ({
    onSnapshot: (cb, onError) => watch(c, () => colSnap(c), cb, onError),
    add: async (obj) => {
      const id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-3);
      await write(c, id, obj);
      return { id };
    },
  });
  return { doc, collection };
}
