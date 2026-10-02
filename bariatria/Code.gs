/**
 * Бариатрия — наблюдение за пациентами после операции.
 * Google Apps Script Web App + Google Таблица (листы «Пациенты» и «Контроль»).
 *
 * Страницы:
 *   /exec                               — первичная анкета
 *   /exec?page=checkin                  — ежемесячный контроль
 *   /exec?page=dashboard&key=<ключ>     — панель врача
 */

var CONFIG = {
  // Пусто — используется таблица, к которой привязан скрипт
  // (Расширения → Apps Script). Иначе — ID таблицы из её адреса.
  SPREADSHEET_ID: '',

  // Секретный ключ панели врача. ОБЯЗАТЕЛЬНО заменить на свой
  // (не короче 12 символов), иначе панель не откроется.
  DASHBOARD_KEY: 'ЗАМЕНИТЕ-НА-СВОЙ-КЛЮЧ',

  DOCTOR_NAME: 'Руслан Ерсайнович',
  APP_TITLE: 'Бариатрия',

  // Статус контроля по дням с последней записи
  SOON_DAYS: 28,     // больше — «скоро»
  OVERDUE_DAYS: 35,  // больше — «просрочен»

  FOLLOWUP_MONTHS: 12,
  MIN_WEIGHT: 30,
  MAX_WEIGHT: 350,

  // Код страны для приведения номеров: 8 701… и 701… → 7701…
  // Пусто — оставлять только цифры, без замены.
  PHONE_COUNTRY_CODE: '7'
};

var PLACEHOLDER_KEY = 'ЗАМЕНИТЕ-НА-СВОЙ-КЛЮЧ';

var SHEET_PATIENTS = 'Пациенты';
var SHEET_CHECKINS = 'Контроль';

var PATIENT_COLS = [
  ['ts', 'Отметка времени'],
  ['name', 'ФИО'],
  ['phone', 'Телефон'],
  ['birthDate', 'Дата рождения'],
  ['sex', 'Пол'],
  ['email', 'Email'],
  ['surgeryDate', 'Дата операции'],
  ['surgeryType', 'Вид операции'],
  ['height', 'Рост, см'],
  ['baseWeight', 'Вес до операции, кг'],
  ['diseases', 'Сопутствующие заболевания'],
  ['consent', 'Согласие на обработку данных']
];

var CHECKIN_COLS = [
  ['ts', 'Отметка времени'],
  ['name', 'ФИО'],
  ['phone', 'Телефон'],
  ['weighDate', 'Дата взвешивания'],
  ['weight', 'Вес, кг'],
  ['waist', 'Талия, см'],
  ['wellbeing', 'Самочувствие (1–5)'],
  ['complaints', 'Жалобы'],
  ['water', 'Вода'],
  ['protein', 'Белок'],
  ['activity', 'Активность'],
  ['vitamins', 'Витамины'],
  ['hb', 'Гемоглобин, г/л'],
  ['ferritin', 'Ферритин, нг/мл'],
  ['vitD', 'Витамин D, нг/мл'],
  ['b12', 'Витамин B12, пг/мл'],
  ['comment', 'Комментарий']
];

/* ───────────── Web App ───────────── */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var page = String(p.page || '').toLowerCase();

  if (page === 'checkin') {
    return render_('Checkin', 'Ежемесячный контроль', {});
  }
  if (page === 'dashboard') {
    if (!isDashboardKeyConfigured_()) {
      return message_('Панель не настроена',
        'Задайте свой секретный ключ в CONFIG.DASHBOARD_KEY (не короче 12 символов) и сохраните новую версию развёртывания.');
    }
    if (!isKeyValid_(p.key)) {
      return message_('Доступ запрещён', 'Эта страница доступна только врачу по персональной ссылке.');
    }
    return render_('Dashboard', 'Панель врача', { data: getDashboardData_(), key: String(p.key) });
  }
  return render_('Intake', 'Первичная анкета', {});
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Запустить один раз вручную: создаёт листы с заголовками. */
function setup() {
  var ss = getSpreadsheet_();
  ensureSheet_(ss, SHEET_PATIENTS, PATIENT_COLS);
  ensureSheet_(ss, SHEET_CHECKINS, CHECKIN_COLS);
  Logger.log('Листы готовы: ' + ss.getUrl());
}

/* ───────────── Приём форм (google.script.run) ───────────── */

function submitIntake(form) {
  form = form || {};
  var name = requiredText_(form.name, 'Укажите ФИО');
  var phone = requiredPhone_(form.phone);
  var baseWeight = parseWeight_(form.baseWeight, true);
  if (!isTrue_(form.consent)) throw new Error('Нужно согласие на обработку данных');

  var row = [
    new Date(),
    textCell_(name),
    phoneCell_(phone),
    parseDate_(form.birthDate, 'Дата рождения'),
    oneOf_(form.sex, ['Женский', 'Мужской']),
    textCell_(clip_(form.email, 200)),
    parseDate_(form.surgeryDate, 'Дата операции'),
    textCell_(clip_(form.surgeryType, 120)),
    parseRange_(form.height, 100, 230, 'Рост должен быть от 100 до 230 см'),
    baseWeight,
    textCell_(clip_(form.diseases, 2000)),
    'Да'
  ];
  appendRow_(SHEET_PATIENTS, PATIENT_COLS, row);
  return { ok: true, name: name };
}

function submitCheckin(form) {
  form = form || {};
  var name = requiredText_(form.name, 'Укажите ФИО');
  var phone = requiredPhone_(form.phone);
  var weight = parseWeight_(form.weight, true);

  var wellbeing = parseRange_(form.wellbeing, 1, 5, 'Самочувствие — от 1 до 5');
  var complaints = Array.isArray(form.complaints)
    ? form.complaints.map(function (c) { return clip_(c, 80); }).filter(String).join('; ')
    : clip_(form.complaints, 500);

  var row = [
    new Date(),
    textCell_(name),
    phoneCell_(phone),
    parseDate_(form.weighDate, 'Дата взвешивания'),
    weight,
    parseRange_(form.waist, 40, 250, 'Талия должна быть от 40 до 250 см'),
    wellbeing,
    textCell_(complaints),
    textCell_(clip_(form.water, 60)),
    textCell_(clip_(form.protein, 60)),
    textCell_(clip_(form.activity, 80)),
    textCell_(clip_(form.vitamins, 80)),
    parseRange_(form.hb, 30, 250, 'Гемоглобин: от 30 до 250 г/л'),
    parseRange_(form.ferritin, 0, 3000, 'Ферритин: от 0 до 3000 нг/мл'),
    parseRange_(form.vitD, 0, 300, 'Витамин D: от 0 до 300 нг/мл'),
    parseRange_(form.b12, 0, 5000, 'Витамин B12: от 0 до 5000 пг/мл'),
    textCell_(clip_(form.comment, 2000))
  ];
  appendRow_(SHEET_CHECKINS, CHECKIN_COLS, row);

  var norm = normalizePhone_(phone);
  var matched = readRows_(SHEET_PATIENTS, PATIENT_COLS).some(function (r) {
    return normalizePhone_(r.phone) === norm;
  });
  return { ok: true, matched: matched };
}

/* ───────────── Панель врача ───────────── */

function getDashboardData_() {
  var tz = Session.getScriptTimeZone();
  var todayIso = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  var byPhone = {};
  var patients = [];
  readRows_(SHEET_PATIENTS, PATIENT_COLS).forEach(function (r, i) {
    var norm = normalizePhone_(r.phone);
    var rec = {
      name: str_(r.name),
      phone: str_(r.phone),
      phoneNorm: norm,
      birthDate: isoDate_(r.birthDate, tz),
      sex: str_(r.sex),
      email: str_(r.email),
      surgeryDate: isoDate_(r.surgeryDate, tz),
      surgeryType: str_(r.surgeryType),
      height: num_(r.height),
      baseWeight: num_(r.baseWeight),
      diseases: str_(r.diseases),
      registeredAt: isoDateTime_(r.ts, tz)
    };
    if (!rec.name && !norm) return;
    var existing = norm && byPhone[norm];
    if (existing) {
      // Повторная анкета с тем же телефоном дополняет/обновляет данные
      Object.keys(rec).forEach(function (k) {
        if (k !== 'registeredAt' && rec[k] !== '' && rec[k] !== null) existing[k] = rec[k];
      });
      return;
    }
    rec.id = 'p' + i;
    rec.checkins = [];
    patients.push(rec);
    if (norm) byPhone[norm] = rec;
  });

  var orphans = [];
  var totalCheckins = 0;
  readRows_(SHEET_CHECKINS, CHECKIN_COLS).forEach(function (r) {
    var c = {
      ts: isoDateTime_(r.ts, tz),
      date: isoDate_(r.weighDate, tz) || isoDate_(r.ts, tz),
      name: str_(r.name),
      phone: str_(r.phone),
      weight: num_(r.weight),
      waist: num_(r.waist),
      wellbeing: num_(r.wellbeing),
      complaints: str_(r.complaints),
      water: str_(r.water),
      protein: str_(r.protein),
      activity: str_(r.activity),
      vitamins: str_(r.vitamins),
      hb: num_(r.hb),
      ferritin: num_(r.ferritin),
      vitD: num_(r.vitD),
      b12: num_(r.b12),
      comment: str_(r.comment)
    };
    if (!c.name && !c.phone && c.weight === null) return;
    totalCheckins++;
    var p = byPhone[normalizePhone_(r.phone)];
    if (p) p.checkins.push(c); else orphans.push(c);
  });

  var overdue = 0, never = 0;
  patients.forEach(function (p) {
    p.checkins.sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0);
    });
    var withWeight = p.checkins.filter(function (c) { return c.weight !== null; });
    var last = p.checkins[p.checkins.length - 1] || null;
    p.currentWeight = withWeight.length ? withWeight[withWeight.length - 1].weight : null;
    p.lost = (p.baseWeight !== null && p.currentWeight !== null) ? round1_(p.baseWeight - p.currentWeight) : null;
    p.lastDate = last ? last.date : '';
    p.daysSince = last ? daysBetween_(last.date, todayIso) : null;
    p.daysSinceSurgery = p.surgeryDate ? daysBetween_(p.surgeryDate, todayIso) : null;
    if (!last) { p.status = 'none'; never++; }
    else if (p.daysSince > CONFIG.OVERDUE_DAYS) { p.status = 'overdue'; overdue++; }
    else if (p.daysSince > CONFIG.SOON_DAYS) p.status = 'soon';
    else p.status = 'ok';
  });

  orphans.sort(function (a, b) { return a.ts < b.ts ? 1 : -1; });

  return {
    today: todayIso,
    config: {
      soonDays: CONFIG.SOON_DAYS,
      overdueDays: CONFIG.OVERDUE_DAYS,
      followupMonths: CONFIG.FOLLOWUP_MONTHS,
      phoneCountryCode: CONFIG.PHONE_COUNTRY_CODE
    },
    totals: {
      patients: patients.length,
      checkins: totalCheckins,
      overdue: overdue,
      never: never
    },
    patients: patients,
    orphans: orphans
  };
}

/* ───────────── Таблица ───────────── */

function getSpreadsheet_() {
  var ss = CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Не найдена таблица: привяжите скрипт к таблице или укажите CONFIG.SPREADSHEET_ID');
  return ss;
}

function ensureSheet_(ss, name, cols) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(cols.map(function (c) { return c[1]; }));
    sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function appendRow_(sheetName, cols, row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    ensureSheet_(getSpreadsheet_(), sheetName, cols).appendRow(row);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

/** Читает лист в массив объектов. Столбцы ищутся по заголовку, так что их можно переставлять. */
function readRows_(sheetName, cols) {
  var sh = getSpreadsheet_().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getRange(1, 1, sh.getLastRow(), Math.max(sh.getLastColumn(), cols.length)).getValues();
  var header = values[0].map(function (h) { return String(h).trim(); });
  var index = cols.map(function (c, i) {
    var at = header.indexOf(c[1]);
    return at >= 0 ? at : i;
  });
  return values.slice(1).map(function (v) {
    var o = {};
    cols.forEach(function (c, i) { o[c[0]] = v[index[i]]; });
    return o;
  });
}

/* ───────────── Проверки и преобразования ───────────── */

function isDashboardKeyConfigured_() {
  var k = String(CONFIG.DASHBOARD_KEY || '');
  return k.length >= 12 && k !== PLACEHOLDER_KEY;
}

function isKeyValid_(key) {
  return typeof key === 'string' && isDashboardKeyConfigured_() && key === CONFIG.DASHBOARD_KEY;
}

function normalizePhone_(v) {
  var d = String(v === null || v === undefined ? '' : v).replace(/\D/g, '');
  var cc = CONFIG.PHONE_COUNTRY_CODE;
  if (cc === '7') {
    if (d.length === 11 && d.charAt(0) === '8') d = '7' + d.slice(1);
    else if (d.length === 10) d = '7' + d;
  }
  return d;
}

function requiredText_(v, msg) {
  var s = clip_(v, 200);
  if (!s) throw new Error(msg);
  return s;
}

function requiredPhone_(v) {
  var s = clip_(v, 40);
  var digits = s.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) throw new Error('Проверьте номер телефона: нужно 10–15 цифр');
  return s;
}

function parseWeight_(v, required) {
  var n = toNumber_(v);
  if (n === null) {
    if (required) throw new Error('Укажите вес');
    return '';
  }
  if (n < CONFIG.MIN_WEIGHT || n > CONFIG.MAX_WEIGHT) {
    throw new Error('Вес должен быть от ' + CONFIG.MIN_WEIGHT + ' до ' + CONFIG.MAX_WEIGHT + ' кг');
  }
  return round1_(n);
}

function parseRange_(v, min, max, msg) {
  var n = toNumber_(v);
  if (n === null) return '';
  if (n < min || n > max) throw new Error(msg);
  return round1_(n);
}

function parseDate_(v, label) {
  var s = clip_(v, 20);
  if (!s) return '';
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(label + ': неверный формат даты');
  var d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (d.getMonth() !== +m[2] - 1 || +m[1] < 1900 || +m[1] > 2100) throw new Error(label + ': неверная дата');
  return d;
}

function oneOf_(v, allowed) {
  var s = clip_(v, 40);
  return allowed.indexOf(s) >= 0 ? s : '';
}

function isTrue_(v) {
  return v === true || v === 'true' || v === 'on' || v === 'Да';
}

function toNumber_(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  var s = String(v).trim().replace(',', '.');
  if (!s) return null;
  var n = Number(s);
  if (!isFinite(n)) throw new Error('Неверное число: ' + clip_(v, 20));
  return n;
}

function num_(v) {
  if (v === '' || v === null || v === undefined) return null;
  var n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'));
  return isFinite(n) ? n : null;
}

function str_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v).trim();
}

function clip_(v, max) {
  return String(v === null || v === undefined ? '' : v).trim().slice(0, max);
}

/** Защита от формул: строки, начинающиеся с = + - @, сохраняются как текст. */
function textCell_(s) {
  s = String(s || '');
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Телефон всегда хранится как текст, как его ввёл пациент. */
function phoneCell_(s) {
  return "'" + s;
}

function isoDate_(v, tz) {
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  var s = String(v === null || v === undefined ? '' : v).trim();
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}

function isoDateTime_(v, tz) {
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : Utilities.formatDate(v, tz, "yyyy-MM-dd'T'HH:mm");
  return isoDate_(v, tz);
}

function daysBetween_(fromIso, toIso) {
  var a = fromIso.split('-'), b = toIso.split('-');
  return Math.round((Date.UTC(+b[0], +b[1] - 1, +b[2]) - Date.UTC(+a[0], +a[1] - 1, +a[2])) / 86400000);
}

function round1_(n) {
  return Math.round(n * 10) / 10;
}

/* ───────────── Вывод страниц ───────────── */

function render_(file, title, vars) {
  var t = HtmlService.createTemplateFromFile(file);
  t.baseUrl = ScriptApp.getService().getUrl();
  t.appTitle = CONFIG.APP_TITLE;
  t.doctorName = CONFIG.DOCTOR_NAME;
  t.minWeight = CONFIG.MIN_WEIGHT;
  t.maxWeight = CONFIG.MAX_WEIGHT;
  t.data = null;
  t.key = '';
  Object.keys(vars).forEach(function (k) { t[k] = vars[k]; });
  return t.evaluate()
    .setTitle(title + ' — ' + CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function message_(title, text) {
  var t = HtmlService.createTemplateFromFile('Message');
  t.title = title;
  t.text = text;
  t.appTitle = CONFIG.APP_TITLE;
  return t.evaluate()
    .setTitle(title + ' — ' + CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** JSON для безопасной вставки внутрь <script>. */
function jsonForScript_(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
