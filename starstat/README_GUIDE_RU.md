# StarStat (offline UI) — подробные заметки по структуре проекта

Этот файл — карта проекта: **что за что отвечает**, где менять размеры/отступы/цвета, и как быстро найти нужный блок.

Проект маленький и состоит из 4 ключевых файлов:
- `index.html` — разметка (главные экраны, модалки, базовые контейнеры)
- `styles.css` — вся визуалка (темы, стекло, фон, футер, страницы)
- `app.js` — логика (роли, навигация, localStorage, Starosta/Support, графики, админка)
- `config.js` — флаг offline/адрес API (заготовка на будущее)

## Как быстро находить «где это правится»

1) Открой страницу → **F12 → Elements** → выбери элемент стрелкой.
2) Справа в Styles видно **какой селектор** и **из какого файла/строки** он приходит (например `styles.css:468`).
3) В редакторе делай поиск по классу (`.filters`, `.glass`, `.support-card` и т.д.).

## Структура папки

```
starstat/
  index.html
  styles.css
  app.js
  config.js
  assets/
    noise.png          # киношный шум
```

## 1) index.html — разметка (что за что отвечает)

### 1.1 Слои фона
В начале `<body>`:
- `.bg` — контейнер фона
  - `.bg-top` — затемнение/градиент сверху
  - `.bg-wave`, `.bg-wave2` — оранжевые «пятна/волны» снизу (анимация в CSS)
  - `.bg-grid` — сетка
  - `.bg-vignette` — виньетка
- `.grain` — слой шума (использует `assets/noise.png`)
- `.page-transition` и `.full-overlay` — оверлеи для анимации переходов/фуллскрина

**Где править:** `styles.css` разделы `Background`, `Film grain`, `overlays`.

### 1.2 Верхняя панель (Topbar)
`<header class="topbar" id="topbar">`
- `.brand` — логотип/название
- `.nav` — кнопки вкладок (часть добавляется динамически по роли)
- `.top-actions` — ⚙ настройки и кнопка «Выйти»

**Где править:** `styles.css` → `Topbar`.
**Логика:** `app.js` → `updateNavByRole()`, `ensureTopbarStarostaNav()`, `ensureTopbarSupportNav()`.

### 1.3 Экраны
В HTML статически есть 3 экрана:
- `#screen-landing` — стартовая страница («Добро пожаловать…»)
- `#screen-student` — экран студента (v6)
- `#screen-dashboard` — дашборд со статистикой/графиками

⚠️ Экраны **Starosta** и **Support** создаются не в HTML, а в `app.js` (см. `ensureStarostaScreen()` и `ensureSupportScreen()`).

### 1.4 Дашборд: фильтры, карточки, графики
Внутри `#screen-dashboard`:
- `.wrap` — общий контейнер ширины и внутренних отступов
- `.filters.glass` — верхняя панель фильтров
  - `.field` / `.input` — поля и инпуты
- `.panel-stack` — контейнер вкладок
  - `.panel#panel-overview` — обзор
    - `.cards` → `.card.glass` — 3 карточки с donut
    - `.chart.glass` — линейный график
  - `.panel#panel-dates` — таблица
  - `.panel#panel-pairs` — bar chart

**Где править:** `styles.css` → `Screens`, `Chart layout fix`.
**Графики:** `app.js` → блоки Chart.js (см. ниже).

### 1.5 Модалки
В `index.html` есть модалки:
- `#loginModal` — вход/выбор роли
- `#landingSettingsModal` — настройки на лендинге (тема)

**Где править:** `styles.css` → `modal` / `Superadmin modal`.
**Логика:** `app.js` → `openModal/closeModal` + `applyTheme()`.

## 2) styles.css — визуальные блоки (что и где менять)

В файле много секций с заголовками `/* ===== ... ===== */` — это специально, чтобы легко ориентироваться.

### 2.1 Переменные (цвета, радиусы)
В самом верху `:root`:
- `--acc`, `--acc2` — оранжевый акцент (градиенты/скролл)
- `--glassA`, `--glassB`, `--stroke` — стекло (фон/граница)
- `--text`, `--muted` — основной/приглушённый текст
- `--radius` — общий радиус скругления
- `--c-present`, `--c-sick`, `--c-excused`, `--c-truant` — цвета статусов

➡️ Если хочешь «всё чуть круглее» — увеличь `--radius`.

### 2.2 Темы (dark/light)
Секция `Theme (dark/light)`:
- `:root:not([data-theme="light"])` — тёмная тема
- `:root[data-theme="light"]` — светлая

➡️ Чтобы поменять контраст/читабельность в light — правь `--text` и `--muted`.

### 2.3 Фон (волна/пятно/сетка/виньетка)
Секция `Background`:
- `.bg-wave`/`.bg-wave2` — именно тут задаются **оранжевые пятна** и их анимация.
- `.bg-grid` — сетка (толщина/прозрачность через `--gridColor` и `--gridOpacity`)
- `.bg-vignette` — виньетка (темнее края)

➡️ Хотишь ярче пятно: увеличивай альфу в `rgba(255,64,0,...)` и `rgba(255,122,0,...)`.
➡️ Хотишь быстрее/живее анимацию: уменьши `animation-duration` у `.bg-wave`.

### 2.4 Стекло (универсальный класс)
Секция `Glass`:
- `.glass` — главный стиль «стеклянных» карточек.

Чаще всего тебе нужно править именно тут:
- `backdrop-filter: blur(...)`
- `background: linear-gradient(...)`
- `border: 1px solid var(--stroke)`
- `box-shadow: var(--shadow)`

### 2.5 Сетки/отступы страниц
Секция `Screens`:
- `.wrap` — максимальная ширина и отступы слева/справа
- `.filters` — верхняя панель фильтров
- `.panel`, `.cards`, `.chart`, `.table-wrap` — структура статистики

➡️ Если «внутри тесно» — увеличивай `padding` у `.glass` или конкретных контейнеров.
➡️ Если нужно изменить расстояния между блоками — `gap` у flex/grid контейнеров.

### 2.6 Футер
Секция `Footer`:
- `.footer` — внешний контейнер (отступы)
- `.footer-inner` / `.footer-glass` (если есть) — стеклянная подложка футера

➡️ Чтобы добавить стеклянную подложку футеру, см. рецепт в конце файла (раздел «Рецепты»).

### 2.7 Starosta / Support / Admin
- `Starosta page` — размеры двух колонок, список студентов, кнопки статусов
- `Support chat` и `Support page` — список обращений слева и чат справа
- `Superadmin modal` + `Schedule drag&drop` — админка и DnD

Совет: ищи по словам `starosta-`, `support-`, `admin-`.

### 2.8 Шум
Секция `Film grain (animated noise)`:
- `.grain` использует `assets/noise.png`.

➡️ Сильнее шум: увеличь `opacity`.
➡️ Мельче/крупнее: меняй `background-size`.

## 3) app.js — логика (что делает каждая крупная часть)

В `app.js` тоже есть разделы `/* ===== ... ===== */`.

### 3.1 Генерация DOM-частей (которые не в HTML)
- `ensureFooter()` — вставляет/обновляет футер
- `ensureStarostaScreen()` — **создаёт** экран старосты (разметка из template string)
- `ensureSupportScreen()` — **создаёт** экран поддержки

Если тебе нужно поменять структуру Starosta/Support — правь именно эти функции.

### 3.2 Состояние и хранилище
- `loadStore()` / `saveStore()` — чтение/запись в `localStorage`
- внутри `store` лежат: пользователи, посещаемость, обращения поддержки, настройки, расписание.

Если хочешь «сбросить всё» — очисть localStorage в DevTools → Application.

### 3.3 Роли и навигация
- `updateNavByRole()` — какие вкладки доступны (student/starosta/support/superadmin)
- `updateFooterByRole()` — подписи/блоки футера по роли
- `showLanding()` / `showDashboard()` / `showStudent()` / `showStarosta()` / `showSupport()` — переключение экранов

### 3.4 Тема
- `applyTheme(theme)` — ставит `data-theme` на `:root` и сохраняет в localStorage
- `isLightTheme()` — утилита

Чтобы добавить новые цветовые режимы — расширяется этот блок.

### 3.5 Графики (Chart.js)
Используются `Chart.js` (подключён CDN в `index.html`).
В `app.js` создаются:
- `donutAttendance`, `donutStatuses`, `donutPairs` — круговые
- `lineByDates` — линия
- `barByPairs` — столбики

Если хочешь поменять анимации:
- ищи `animation:` в конфиге графика
- или общие настройки `Chart.defaults` (если есть)

⚠️ «Появление из угла» часто из-за ресайза canvas → смотри опции `responsive`, `maintainAspectRatio`, `resizeDelay`.

### 3.6 Starosta — отметки посещаемости
Основные функции:
- `bindStarostaUI()` — навешивает обработчики кликов/рендер списка
- хранение отметок — в `store.attendance` (или похожий ключ)

Если «статусы не кликаются» — почти всегда проблема в:
- `pointer-events` в CSS
- или событие не делегировано (элементы создаются заново при ререндере)

В проекте сделано через делегирование / повторный bind после рендера.

### 3.7 Support — обращения и чат
- `bindSupportUI()` — обработчики кликов по обращению слева
- при открытии обращения статус меняется на `in_progress`
- отправка ответа добавляет сообщение в массив `messages`
- кнопка «Закрыть» ставит статус `closed`

Если хочешь поменять тексты статусов — ищи в этом блоке.

### 3.8 Superadmin — админка и расписание
- `renderAdminPanel()` (или похожие функции) — отрисовка вкладок
- `swapPairs()` / `initDragAndDropPairs()` — перестановка пар мышкой

Чтобы сделать анимацию «переезда» плавнее — правь CSS-класс элемента пары (transition: transform) и логику добавления классов во время drag.

## 4) Практические рецепты

### 4.1 Поменять отступы внутри карточек (чтобы не прилипало)
Ищи в `styles.css`:
- `.glass { padding: ... }` — глобально
- или конкретно: `.support-card`, `.starosta-card`, `.chart`, `.card`

Пример:
```css
.support-card{ padding: 18px 18px; }
```

### 4.2 Сделать список внутри блока со скроллом (чтобы не вылезал)
```css
.students-list{
  max-height: 520px;
  overflow: auto;
}
```
Если нужно, ограничь высоту родителя (обычно правая/левая колонка).

### 4.3 Добавить стеклянную подложку футеру
**HTML:**
```html
<footer class="footer">
  <div class="footer-glass">
    ...контент...
  </div>
</footer>
```
**CSS:**
```css
.footer-glass{
  background: linear-gradient(180deg, rgba(255,122,0,.16), rgba(0,0,0,.28));
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255,160,70,.22);
  border-radius: 26px;
  padding: 22px 24px;
  box-shadow: 0 12px 40px rgba(0,0,0,.35);
}
```

### 4.4 Сделать оранжевое пятно ярче и живее
В `styles.css` ищи `.bg-wave` и `.bg-wave2`:
- усиливай альфу: `rgba(255,64,0,0.35) → 0.45`
- ускоряй: `animation-duration: 18s → 12s`

### 4.5 Сделать шум «киношным» (мелкий, сверху сильнее)
В `styles.css` секция `Film grain`:
- `background-size: 140px 140px` (мельче) / `220px 220px` (крупнее)
- `opacity: .10 → .14` (сильнее)
- если нужно «сверху сильнее» — добавь маску `mask-image: linear-gradient(...)`

## 5) Словарь классов (частые)

- `.wrap` — общий контейнер ширины
- `.filters` — панель фильтров сверху
- `.field`/`.input` — инпуты
- `.glass` — стеклянный фон
- `.panel` — вкладка контента
- `.cards`/`.card` — карточки (donut)
- `.chart` — контейнер графика
- `.table-wrap` — скролл таблицы
- `.support-*` — всё для поддержки
- `.starosta-*` — всё для старосты
- `.admin-*` — всё для админки

---

Если хочешь — могу сделать **ещё более “жёстко” привязанную карту**: прямо по твоим классам (со ссылками на строки) и с пометками «меняй тут», «не трогай тут». Для этого скажи, какие 3–5 вещей ты чаще всего будешь крутить: **отступы**, **размеры колонок**, **шрифты**, **фон**, **футер**, **кнопки**.


## Приложение A — навигация по styles.css (разделы и строки)

Открывай `styles.css` и прыгай по строкам:

- **строка 27** — ===== Theme (dark/light) =====
- **строка 60** — ===== Scrollbar (brand orange) =====
- **строка 77** — ===== Local font: Neopixel (drop your font file into /assets/fonts/) =====
- **строка 104** — ===== Background (match макет: оранжевая "волна" снизу) =====
- **строка 199** — ===== Glass =====
- **строка 208** — ===== Topbar =====
- **строка 341** — ===== Screens =====
- **строка 468** — ===== Footer =====
- **строка 592** — ===== Starosta page =====
- **строка 679** — ===== Light theme overrides =====
- **строка 787** — ===== Film grain (animated noise) =====
- **строка 817** — ===== Superadmin modal =====
- **строка 932** — ===== Support chat (demo, offline) =====
- **строка 1052** — ===== Superadmin glass polish (v4) =====
- **строка 1086** — ===== Chart layout fix (v4) =====
- **строка 1103** — ===== v6 additions =====
- **строка 1178** — ===== v6: overlays + fullscreen expand =====
- **строка 1210** — ===== Support page (role support) — UI (for app.js) =====
- **строка 1313** — ===== Starosta textarea: square + auto grow-friendly =====
- **строка 1329** — ===== File input (nice glass button) for starostaFiles =====
- **строка 1369** — ===== Make status buttons look like the screenshot: glass + colored glow =====
- **строка 1406** — ===== Starosta: student list button states (used by app_READY.js) =====

## Приложение B — навигация по app.js (разделы и строки)

### B1) Крупные разделы

- **строка 1** — ===== app.js (FULL) =====
- **строка 14** — ===== DOM bootstrap (footer + starosta screen) =====
- **строка 459** — ===== Role-based UI (nav / footer / pages) =====
- **строка 987** — ===== Subjects && Palette =====
- **строка 1105** — ===== Student page (v6) =====
- **строка 1270** — ===== Starosta page (отмечание посещаемости) =====
- **строка 1710** — ===== Superadmin panel logic =====
- **строка 1899** — ===== Schedule: swap pairs (superadmin) =====
- **строка 1922** — ===== Schedule: drag & drop reorder (superadmin) =====
- **строка 2128** — ===== Support page (role support) =====

### B2) Самые полезные функции (быстрые точки входа)

- **ensureFooter()** — строка **15**
- **ensureStarostaScreen()** — строка **86**
- **bindStarostaUI()** — строка **188**
- **ensureSupportScreen()** — строка **253**
- **bindSupportUI()** — строка **327**
- **updateNavByRole()** — строка **460**
- **updateFooterByRole()** — строка **499**
- **applyTheme()** — строка **514**
- **showLanding()** — строка **546**
- **showDashboard()** — строка **555**
- **showStudent()** — строка **564**
- **showStarosta()** — строка **573**
- **showSupport()** — строка **583**
- **loadStore()** — строка **401**
- **saveStore()** — строка **411**

