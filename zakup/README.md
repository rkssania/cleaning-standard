# Закуп оборудования — Центр гематологии, Астана (запуск КС)

React + Vite + Tailwind + Lucide. Данные хранятся в `localStorage` браузера, сервер не нужен.

```bash
npm install
npm run dev      # разработка
npm run build    # сборка в dist/ (base ./, можно открыть с любого хостинга)
npm test         # проверка логики: объединение, статусы, импорт и экспорт Excel
```

Фирменные цвета меняются в `tailwind.config.js` (`brand`, `drop`).
Правила категорий — `src/lib/categories.js`, сборка списка — `src/lib/build.js`.

## Логотип

Файлы: `src/assets/logo.png` (полный) и `src/assets/logo-mark.png` (только знак, для шапки).
Чтобы заменить, подмените файлы и пересоберите. Фирменные цвета (сине-серый и оранжевый) заданы в `tailwind.config.js`.
