# Портфолио на Hugo (PaperMod, тёмная тема)

Готовый сайт-портфолио. Собран на [Hugo](https://gohugo.io) с темой
[PaperMod](https://github.com/adityatelange/hugo-PaperMod) (тема уже лежит в
`themes/PaperMod`, отдельно ставить не нужно).

## Что внутри

- `content/about.md` — страница «Обо мне»
- `content/projects/` — список проектов (2 примера, можно добавлять свои файлы)
- `hugo.toml` — конфиг сайта (имя, соцсети, меню)
- `.github/workflows/hugo.yml` — автосборка и деплой на GitHub Pages при каждом push в `main`

## Как опубликовать (5 шагов)

1. **Создайте репозиторий** на GitHub с именем `USERNAME.github.io`,
   где `USERNAME` — ваш логин на GitHub (это обязательное условие для
   бесплатного домена вида `username.github.io`).

2. **Замените плейсхолдеры** на свои данные:
   - в `hugo.toml`: `USERNAME` → ваш логин, email, заголовок, описание, `[params.homeInfoParams]`
   - в `content/about.md`, `content/contact.md`, `content/projects/*.md` — свой текст, ссылки, проекты

3. **Загрузите проект в репозиторий:**
   ```bash
   cd portfolio-site
   git init
   git add .
   git commit -m "Initial commit: Hugo portfolio"
   git branch -M main
   git remote add origin https://github.com/USERNAME/USERNAME.github.io.git
   git push -u origin main
   ```

4. **Включите GitHub Pages через Actions:**
   - Зайдите в репозиторий → **Settings → Pages**
   - В разделе **Build and deployment → Source** выберите **GitHub Actions**
   - Больше ничего настраивать не нужно — workflow `.github/workflows/hugo.yml`
     запустится автоматически при следующем push

5. **Дождитесь сборки** (вкладка **Actions** в репозитории, обычно 1-2 минуты).
   После успешного деплоя сайт будет доступен по адресу:
   ```
   https://USERNAME.github.io/
   ```

## Локальный запуск (проверить перед публикацией)

Скачайте Hugo Extended: https://gohugo.io/installation/

```bash
hugo server -D
```

Сайт откроется на `http://localhost:1313/`.

## Добавление нового проекта

```bash
hugo new content ru/projects/my-new-project.md
hugo new content en/projects/my-new-project.md
```

Заполните `title`, `date`, `summary`, `tags` и описание — страница
появится в списке `/projects/` (и `/en/projects/`) автоматически.

## Мультиязычность (RU / EN)

Сайт двуязычный: русский — на корневом домене (`/`), английский — в подпапке
(`/en/`). Переключатель языка появляется в шапке сайта автоматически (это
делает тема PaperMod).

- `content/ru/…` — русские страницы (обо мне, проекты)
- `content/en/…` — английские страницы, зеркалят структуру `content/ru`
- Общие настройки (URL сайта, тема) — в начале `hugo.toml`
- Настройки для каждого языка отдельно (заголовок, описание, соцсети,
  текст на главной, меню) — в блоках `[languages.ru]` и `[languages.en]`
  внутри `hugo.toml`

Если создаёте новую страницу — не забудьте добавить её на обоих языках,
иначе на английской версии будет 404.
