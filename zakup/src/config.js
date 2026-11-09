// Подключение сайта к общей таблице (Supabase). Ключ публичный: он безопасен, пока включена защита строк (RLS).
export const SUPABASE = {
  url: 'https://klizxkqrbgdyapbudpgj.supabase.co',
  key: 'sb_publishable_sxcAsjUPtcZenxI1TymO9g_pu8gSymf',
};

// Сотрудники, которых можно выбрать в поле «Ответственный» (список меняется здесь).
export const PEOPLE = [
  'Сатаева Меруерт Сериктаевна',
  'Сергазина Жанара Хамитовна',
  'Жабелов Алим Юсупович',
  'Кабылбекова Айжан Маратовна',
];
