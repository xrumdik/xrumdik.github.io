# Nerdy — вторая версия сайта

Та же информация, что на основном сайте (PaperMod), но в теме [Nerdy](https://github.com/hugo-themes/nerdy).
Собирается отдельно и публикуется рядом: `ryabinin.pro/nerdy/` (RU) и `ryabinin.pro/en/nerdy/` (EN).

## Откуда берётся контент
- **Кейсы и «Обо мне»** подключаются прямо из основного `content/` (через mounts в `hugo.ru.yaml` / `hugo.en.yaml`).
  Правишь статью в `content/ru/projects/…` — меняется обе версии сайта.
- **Профиль, статистика, терминал** — в `data/ru/` и `data/en/`.
- **Разделы кейсов** (Helpdesk, Сети и почта, Бэкап) — `content/<язык>/posts/work/`.
  Новый кейс: добавь файл в `content/<язык>/projects/` и впиши его имя в нужный раздел в `mounts()` в `hugo.ru.yaml` / `hugo.en.yaml`.

## Переключатель тем
- В Nerdy — кнопки `EN/RU`, `Paper` и светлая/тёмная схема (`layouts/_partials/site/theme-toggle-float.html`).
- В PaperMod — таблетка «Тема: Paper / Nerdy» внизу слева (`assets/js/theme-switch.js`).
- Новый кейс нужно также добавить в таблицу `topics` в `assets/js/theme-switch.js`.

## Локальный просмотр
Нужны Hugo extended **0.162.1+**, Node 20+.
```bash
cd nerdy
npm ci
export PATH="$PWD/node_modules/.bin:$PATH"
hugo --config hugo.yaml,hugo.ru.yaml --renderToMemory   # создаёт hugo_stats.json для Tailwind
hugo server --config hugo.yaml,hugo.ru.yaml
```

## Правки в теме
Тема лежит в `themes/nerdy` (скопирована, не подмодуль). Единственная правка оригинала:
`assets/js/main.js` — `focus({ preventScroll: true })`, чтобы на телефоне страница не прокручивалась к терминалу при загрузке.
