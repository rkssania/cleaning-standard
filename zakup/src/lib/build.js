// Сборка единого списка из заявки СД, потребности КС Астана и закупа из Китая.
import { looseKey, toNum, similarity } from './normalize.js';
import { CATEGORIES, classify } from './categories.js';

export const STAGES = [
  ['not_started', 'Не начато'],
  ['kp', 'Запрошено КП'],
  ['invoice', 'Счёт'],
  ['paid', 'Оплачено'],
  ['transit', 'В пути'],
  ['received', 'Получено'],
  ['installed', 'Установлено'],
];
export const STAGE_LABEL = Object.fromEntries(STAGES);

export const STATUS = {
  china: 'Едет из Китая',
  ordering: 'В процессе оформления',
  done: 'Готово (установлено)',
  toorder: 'Надо заказать',
  request: 'В процессе (в заявке)',
  added: 'НАДО ЛИ?',
  declined: 'Не надо',
  extra: 'Из Китая, но нет в потребности — надо ли?',
};

export const emptyState = () => ({
  sd: [], // {room,name,size,qty,note,comment}
  ks: [], // {room,name,size,qty,note}
  china: [], // {name,qty,price}
  aliases: {}, // looseKey -> looseKey (ручные связи)
  aliasNames: {}, // looseKey -> исходное название (для списка связей)
  edits: {}, // key -> {qty,supplier,price,responsible,deadline,stage,comment,category}
  manual: [], // {id,name,size,qty,room}
  facts: {}, // поставщик -> фактически оплаченная сумма (вводится вручную)
  settings: { dedupePit: true },
  importedAt: null,
});

const isReanim = (r) => /реанимац/i.test(r || '');
const isPit = (r) => /(^|[^а-яё])пит($|[^а-яё])|интенсивн/i.test((r || '').toLowerCase()) && !isReanim(r);

/** ПИТ и реанимация не дублируются: если есть спецификация реанимации, строки ПИТ отбрасываются. */
export function dedupePit(rows, on) {
  if (!on || !rows.some((r) => isReanim(r.room))) return rows;
  return rows.filter((r) => !isPit(r.room));
}

export function resolveKey(key, aliases) {
  const seen = new Set();
  while (aliases[key] && !seen.has(key)) {
    seen.add(key);
    key = aliases[key];
  }
  return key;
}

function addRoom(map, room, qty) {
  const r = (room || '').trim() || 'Без помещения';
  map.set(r, (map.get(r) || 0) + qty);
}

function fold(rows, aliases, label) {
  const m = new Map();
  for (const r of rows) {
    if (!String(r.name || '').trim()) continue;
    const key = resolveKey(looseKey(r.name), aliases);
    let it = m.get(key);
    if (!it) {
      it = { key, name: String(r.name).trim(), size: '', notes: [], comments: [], rooms: new Map(), qty: 0, names: new Set(), srcs: new Set() };
      m.set(key, it);
    }
    const q = toNum(r.qty);
    it.qty += q;
    it.names.add(String(r.name).trim());
    it.srcs.add(label(r));
    addRoom(it.rooms, r.room, q);
    if (!it.size && r.size) it.size = String(r.size).trim();
    for (const [f, arr] of [['note', it.notes], ['comment', it.comments]]) {
      const v = String(r[f] || '').trim();
      if (v && !arr.includes(v)) arr.push(v);
    }
  }
  return m;
}

export const roomsText = (rooms) => [...rooms].map(([r, q]) => `${r} — ${q}`).join('; ');

export function buildList(state) {
  const { aliases, edits, settings } = state;
  const sd = fold(dedupePit(state.sd, settings.dedupePit), aliases, (r) => `СД · ${r.src || 'заявка'}`);
  const ks = fold(dedupePit(state.ks, settings.dedupePit), aliases, () => 'КС Астана');

  const chinaMap = new Map();
  for (const c of state.china) {
    if (!String(c.name || '').trim()) continue;
    const key = resolveKey(looseKey(c.name), aliases);
    const e = chinaMap.get(key) || { key, name: String(c.name).trim(), qty: 0, transit: 0, ordering: 0, cost: 0, names: [], orders: new Set() };
    e.orders.add(c.order === 2 ? 'Китай · заказ 2' : 'Китай · заказ 1');
    e.qty += toNum(c.qty);
    if (c.order === 2) e.ordering += toNum(c.qty); else e.transit += toNum(c.qty);
    e.cost += toNum(c.qty) * toNum(c.price);
    e.names.push(String(c.name).trim());
    chinaMap.set(key, e);
  }

  const base = new Map(); // key -> заготовка позиции
  for (const [key, s] of sd) base.set(key, { ...s, source: 'sd', sdQty: s.qty, ksQty: ks.get(key)?.qty ?? 0, srcs: new Set([...s.srcs, ...(ks.get(key)?.srcs ?? [])]) });
  for (const [key, k] of ks) {
    if (!base.has(key)) base.set(key, { ...k, source: 'ks', sdQty: 0, ksQty: k.qty, notes: k.notes, comments: [] });
  }
  for (const m of state.manual) {
    const key = resolveKey(looseKey(m.name), aliases);
    if (base.has(key)) continue;
    base.set(key, {
      key, name: m.name, size: m.size || '', notes: [], comments: [], qty: toNum(m.qty),
      rooms: new Map([[m.room || 'Без помещения', toNum(m.qty)]]), srcs: new Set(['вручную']), source: 'manual', sdQty: 0, ksQty: 0, manualId: m.id,
    });
  }

  const items = [];
  const removed = []; // убранные из списка (их можно вернуть)
  for (const [key, b] of base) {
    const ed = edits[key] || {};
    if (ed.removed === true) {
      removed.push({ key, name: ed.name || b.name, qty: b.qty, rooms: roomsText(b.rooms), sources: [...(b.srcs ?? [])] });
      continue;
    }
    // помещения можно переопределить вручную; тогда количество по умолчанию — сумма по помещениям
    const roomMap = Array.isArray(ed.rooms) && ed.rooms.length ? new Map(ed.rooms.map(([r, q]) => [String(r), toNum(q)])) : b.rooms;
    const baseQty = roomMap === b.rooms ? b.qty : [...roomMap.values()].reduce((a, x) => a + x, 0);
    const total = ed.qty !== undefined && ed.qty !== '' ? toNum(ed.qty) : baseQty;
    const done = ed.done === true;
    const ch = chinaMap.get(key);
    const china = ch ? ch.qty : 0;
    const tr = ch ? ch.transit : 0; // едет (Заказ 1)
    const od = ch ? ch.ordering : 0; // в процессе оформления (Заказ 2)
    const covered = china > 0 && china >= total;
    // «НАДО?» решается только для позиций, которых нет ни в заявке СД, ни в Китае (красные)
    const canDecide = !covered && b.source !== 'sd' && !done;
    const need = canDecide ? ed.need || '' : '';
    const declined = need === 'no';
    const buy = declined || done ? 0 : Math.max(0, total - china);
    const status = done ? 'done' : covered ? (tr >= total ? 'china' : 'ordering') : declined ? 'declined' : b.source === 'sd' ? (ks.has(key) ? 'toorder' : 'request') : 'added';
    const parts = [tr && `едет ${tr}`, od && `оформляется ${od}`].filter(Boolean);
    const partial = declined || done || !china || (covered && parts.length === 1) ? '' : [...parts, buy ? `докупить ${buy}` : ''].filter(Boolean).join(', ');
    const price = toNum(ed.price);
    items.push({
      key,
      name: ed.name || b.name,
      origName: b.name,
      done,
      aliasNames: [...new Set([...b.names ?? [], ...(ch?.names ?? [])])].filter((n) => n !== (ed.name || b.name)),
      size: b.size,
      notes: b.notes,
      comments: b.comments,
      category: ed.category || classify(ed.name || b.name),
      baseQty,
      qty: total,
      qtyEdited: ed.qty !== undefined && ed.qty !== '',
      sdQty: b.sdQty,
      ksQty: b.ksQty,
      china,
      buy,
      rooms: roomsText(roomMap),
      roomEntries: [...roomMap],
      roomsEdited: roomMap !== b.rooms,
      sources: [...(b.srcs ?? []), ...(ch ? [...ch.orders] : [])],
      roomList: [...roomMap.keys()],
      status,
      canDecide,
      need,
      needReason: canDecide ? ed.needReason || '' : '',
      partial,
      chinaTransit: tr,
      chinaOrdering: od,
      supplier: ed.supplier || '',
      price,
      sum: buy * price,
      responsible: ed.responsible || '',
      deadline: ed.deadline || '',
      stage: ed.stage || 'not_started',
      comment: ed.comment || '',
      source: b.source,
      manualId: b.manualId,
    });
  }
  const catIdx = (c) => { const i = CATEGORIES.indexOf(c); return i < 0 ? 99 : i; };
  items.sort((a, b) => catIdx(a.category) - catIdx(b.category) || a.name.localeCompare(b.name, 'ru'));
  items.forEach((it, i) => (it.no = i + 1));

  // Из Китая, но нет в потребности — надо ли?
  const extras = [];
  for (const [key, c] of chinaMap) {
    if (base.has(key)) continue;
    const ed = edits[key] || {};
    const need = ed.need || '';
    extras.push({
      key, name: c.name, names: c.names, qty: c.qty, cost: c.cost, transit: c.transit, ordering: c.ordering,
      kind: c.transit > 0 ? 'transit' : 'ordering',
      sources: [...c.orders],
      price: c.qty ? c.cost / c.qty : 0, status: 'extra', category: classify(c.name),
      need, needReason: ed.needReason || '', declined: need === 'no',
    });
  }
  extras.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  // Сверка КС ↔ заявка СД
  const ksOnly = items.filter((i) => i.source === 'ks');
  const ksMore = items.filter((i) => i.source === 'sd' && i.ksQty > i.sdQty);
  const sdNotInKs = state.ks.length ? items.filter((i) => i.source === 'sd' && !ks.has(i.key)) : [];

  return { items, extras, removed, reconcile: { ksOnly, ksMore, sdNotInKs } };
}

export function summarize(items, facts = {}) {
  const counts = { done: 0, china: 0, ordering: 0, toorder: 0, request: 0, added: 0, declined: 0 };
  let total = 0;
  const sup = new Map();
  for (const it of items) {
    counts[it.status]++;
    total += it.sum;
    if (!it.buy) continue;
    const name = it.supplier || 'Без поставщика';
    const s = sup.get(name) || { name, plan: 0, fact: toNum(facts[name]), positions: 0 };
    s.plan += it.sum;
    s.positions++;
    sup.set(name, s);
  }
  // поставщик без позиций к закупу, но с внесённым фактом, тоже показываем
  for (const [name, v] of Object.entries(facts)) if (!sup.has(name) && toNum(v)) sup.set(name, { name, plan: 0, fact: toNum(v), positions: 0 });
  const suppliers = [...sup.values()].sort((a, b) => b.plan - a.plan);
  const fact = suppliers.reduce((a, s) => a + s.fact, 0);
  return { counts, total, fact, suppliers };
}

/**
 * Подсказки связей. Для каждой «осиротевшей» позиции (едет из Китая без потребности
 * или добавлена из КС Астана) — до 4 похожих позиций списка.
 */
export function suggestLinks(state, built) {
  const out = [];
  const add = (from, kind, pool, min) => {
    const cands = pool
      .filter((o) => o.key !== from.key)
      .map((o) => ({ key: o.key, name: o.name, score: similarity(from.name, o.name) }))
      .filter((c) => c.score >= min)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    if (cands.length) out.push({ from: from.key, fromName: from.name, qty: from.qty, kind, cands });
  };
  for (const e of built.extras) add(e, 'china', built.items, 0.4);
  const sdItems = built.items.filter((i) => i.source === 'sd');
  for (const it of built.reconcile.ksOnly) add(it, 'ks', sdItems, 0.5);
  return out.sort((a, b) => b.cands[0].score - a.cands[0].score);
}
