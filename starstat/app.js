/*
  NOTE: Подробные заметки по проекту см. в README_GUIDE_RU.md
  Там есть карта функций и CSS-разделов со строками.
*/

/* ===== app.js (FULL) ===== */
/* StarStat OFFLINE v3
   - Welcome screen (как на макете)
   - Вход по логину/паролю (локально)
   - Дашборд с вкладками и графиками на демо-данных
   - Анимированный шум (grain) — в CSS
   - Панель "Настройки суперадмина" (демо CRUD) — без бэкенда
*/

const OFFLINE = Boolean(window.STARSTAT_OFFLINE);
const API = (window.STARSTAT_API || "http://localhost:8000").replace(/\/$/, "");
const $ = (id) => document.getElementById(id);

/* ===== DOM bootstrap (footer + starosta screen) ===== */
function ensureFooter(){
  if(document.querySelector(".site-footer")) return;
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="footer-shell">
      <div class="footer-inner">
        <div class="footer-col">
          <div class="footer-title">ФИИ РУДН · StarStat</div>
          <div class="footer-text">
            Внутренний сервис для старост и администраторов: посещаемость, пары и сводная статистика.
          </div>
        </div>

        <div class="footer-col" data-footer-section="nav">
          <div class="footer-title">Навигация</div>
          <a class="footer-link" href="#" data-footer-nav="overview">Общая статистика</a>
          <a class="footer-link" href="#" data-footer-nav="dates">По датам</a>
          <a class="footer-link" href="#" data-footer-nav="pairs">По парам</a>
        </div>

        <div class="footer-col">
          <div class="footer-title">Документы</div>
          <a class="footer-link" href="#" onclick="return false;">Политика обработки персональных данных</a>
          <a class="footer-link" href="#" onclick="return false;">Пользовательское соглашение</a>
          <a class="footer-link" href="#" onclick="return false;">Регламент доступа к системе</a>
        </div>

        <div class="footer-col">
          <div class="footer-title">Контакты</div>
          <div class="footer-text">117198, г. Москва<br/>ул. Миклухо‑Маклая, д. 6</div>
          <div class="footer-text" style="margin-top:10px">
            Факультет искусственного интеллекта<br/>
            <a class="footer-link" href="mailto:ai@rudn.ru">ai@rudn.ru</a>
            <a class="footer-link" href="tel:+74957873803">+7 (495) 787‑38‑03</a>
          </div>
          <div class="footer-text" style="margin-top:10px">
            Техническая поддержка<br/>
            <a class="footer-link" href="mailto:support@starstat.rudn.ru">support@starstat.rudn.ru</a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        © ${new Date().getFullYear()} RUDN · Faculty of Artificial Intelligence · StarStat (offline demo)
      </div>
    </div>
  `;
  document.body.appendChild(footer);

  // footer links -> switch tabs (when logged in)
  footer.addEventListener("click", (e) => {
    const t = e.target;
    const tab = t?.dataset?.footerNav;
    if(!tab) return;
    e.preventDefault();
    if(!state?.token) return;

    // Староста: только одна страница
    if(state.role === "starosta"){
      toast("Для старосты доступна только страница посещаемости");
      return;
    }

    if(["overview","dates","pairs"].includes(tab)){
      try{ setTab(tab); }catch{}
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

function ensureStarostaScreen(){
  if(document.getElementById("screen-starosta")) return;

  const tpl = document.createElement("main");
  tpl.className = "screen starosta hidden";
  tpl.id = "screen-starosta";
  // Разметка максимально приближена к support (те же отступы/высоты)
  tpl.innerHTML = `
    <section class="wrap">
      <section class="filters glass">
        <div class="field">
          <label>Группа</label>
          <select id="starostaGroupSelect" class="input"></select>
        </div>

        <div class="field">
          <label>Дата</label>
          <input id="starostaDate" class="input" type="date"/>
        </div>

        <div class="field">
          <label>Предмет</label>
          <select id="starostaSubjectSelect" class="input"></select>
        </div>

        <div class="field field-btn">
          <label>&nbsp;</label>
          <button class="pill-btn" id="btn-starosta-refresh">Обновить список</button>
        </div>

        
      </section>

      <section class="glass support-body starosta-body">
        <div class="support-left starosta-left glass" style="background:transparent; box-shadow:none; border:0;">
          <div class="field" style="margin-bottom:10px">
            <label>Поиск по ФИО</label>
            <input id="starostaSearch" class="input" placeholder="Начните вводить фамилию..." />
          </div>
          <div class="support-list" id="starostaStudentsList"></div>
        </div>

        <div class="support-right starosta-right glass" style="background:transparent; box-shadow:none; border:0;">
          <div class="starosta-student-name" id="starostaStudentName">Выберите студента</div>
          <div class="starosta-student-group" id="starostaStudentGroup">—</div>

          <div class="field" style="margin-top:12px">
            <label>Статус</label>
            <div class="status-buttons">
              <button class="status-btn present" data-starosta-status="present" type="button">
                <span class="dot"></span>
                <span>Присутствовал</span>
              </button>

              <button class="status-btn sick" data-starosta-status="sick" type="button">
                <span class="dot"></span>
                <span>Болел</span>
              </button>

              <button class="status-btn excused" data-starosta-status="excused" type="button">
                <span class="dot"></span>
                <span>Уважительная причина</span>
              </button>

              <button class="status-btn truant" data-starosta-status="truant" type="button">
                <span class="dot"></span>
                <span>Прогул</span>
              </button>
            </div>
          </div>

          <div class="field" style="margin-top:12px">
            <label>Комментарий / причина (необязательно)</label>
            <textarea id="starostaReason" class="input" rows="2" placeholder="Например: справка / опоздание / семейные обстоятельства" style="resize:none"></textarea>
          </div>

          <div class="field" style="margin-top:12px">
            <label>Прикрепить документы (справки)</label>
            <input id="starostaFiles" class="input" type="file" multiple />
            <div class="files-list" id="starostaFilesList"></div>
          </div>

          <div class="row" style="margin-top:14px">
            <button class="pill-btn" id="btn-starosta-save" type="button">Сохранить комментарий/файлы</button>
            
          </div>
        </div>
      </section>
    </section>
  `;
  const toastEl = document.getElementById("toast");
  if(toastEl && toastEl.parentElement){
    toastEl.parentElement.insertBefore(tpl, toastEl);
  }else{
    document.body.appendChild(tpl);
  }

  // Важно: экран создаётся динамически → навешиваем обработчики после вставки
  bindStarostaUI();
}

function bindStarostaUI(){
  const root = document.getElementById("screen-starosta");
  if(!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  $("starostaSearch")?.addEventListener("input", (e) => renderStarostaList(e.target.value));
  $("starostaGroupSelect")?.addEventListener("change", () => renderStarostaList($("starostaSearch")?.value || ""));
  $("btn-starosta-refresh")?.addEventListener("click", () => renderStarostaList($("starostaSearch")?.value || ""));

  // Выбор студента (делегирование, чтобы клик работал по любому месту кнопки)
  $("starostaStudentsList")?.addEventListener("click", (e) => {
    const id = e.target?.closest?.("[data-starosta-pick]")?.dataset?.starostaPick;
    if(id) pickStarostaStudent(id);
  });

  // Выбор статуса (сохраняется сразу по клику)
  root.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-starosta-status]");
    if(!btn) return;
    e.preventDefault();
    const status = btn.dataset.starostaStatus;
    if(!status) return;
    upsertStarostaStatus(status);
  });

  // Файлы (локально, для демо — сохраняем метаданные)
  $("starostaFiles")?.addEventListener("change", (e) => {
    const files = Array.from(e.target?.files || []);
    starostaPendingFiles = files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type || "",
      addedAt: Date.now()
    }));
    renderStarostaFiles();
  });

  // autosize reason textarea
  $("starostaReason")?.addEventListener("input", () => {
    try{ autoGrowTextarea($("starostaReason")); }catch{}
  });

  // Сохранение причины/файлов
  $("btn-starosta-save")?.addEventListener("click", saveStarostaReasonAndFiles);
}

function ensureTopbarStarostaNav(){
  const nav = document.querySelector(".topbar .nav");
  if(!nav) return;
  if(nav.querySelector('[data-tab="starosta"]')) return;

  const btn = document.createElement("button");
  btn.className = "nav-btn";
  btn.textContent = "ПОСЕЩАЕМОСТЬ";
  btn.dataset.tab = "starosta";
  btn.style.display = "none"; // покажем только для роли starosta

  btn.addEventListener("click", () => {
    if(state.role === "starosta") withTransition(showStarosta);
    else toast("Экран посещаемости доступен только роли starosta");
  });

  nav.appendChild(btn);
}

function ensureSupportScreen(){
  if(document.getElementById("screen-support")) return;

  const tpl = document.createElement("main");
  tpl.className = "screen support hidden";
  tpl.id = "screen-support";
  tpl.innerHTML = `
    <section class="wrap">
      <section class="filters glass">
        <div class="field">
          <label>Группа</label>
          <select id="supportGroup" class="input"></select>
        </div>

        <div class="field">
          <label>Период с</label>
          <input id="supportDateFrom" class="input" type="date"/>
        </div>

        <div class="field">
          <label>Период по</label>
          <input id="supportDateTo" class="input" type="date"/>
        </div>

        <div class="field field-btn">
          <label>&nbsp;</label>
          <button class="pill-btn" id="btn-support-refresh" type="button">Обновить</button>
        </div>

        <div class="hint" id="supportHint">Support · обращения</div>
      </section>

      <section class="glass support-body">
        <div class="support-left glass" style="background:transparent; box-shadow:none; border:0;">
          <div class="field" style="margin-bottom:10px">
            <label>Поиск</label>
            <input id="supportSearch" class="input" placeholder="Поиск по имени / группе / теме..." />
          </div>
          <div class="support-list" id="supportTicketsList"></div>
        </div>

        <div class="support-right glass" style="background:transparent; box-shadow:none; border:0;">
          <div class="support-head">
            <div>
              <div class="support-title" id="supportTicketTitle">Выберите обращение</div>
              <div class="support-sub" id="supportTicketMeta">—</div>
            </div>
            <div class="support-actions">
              <button class="pill-btn mini" id="supportCloseTicket" type="button" disabled>Закрыть</button>
            </div>
          </div>

          <div class="support-thread" id="supportThread"></div>

          <div class="support-reply">
            <textarea class="input" id="supportReply" rows="1" placeholder="Напишите ответ..." style="resize:none"></textarea>
            <button class="pill-btn" id="supportSend" type="button">Отправить</button>
          </div>
        </div>
      </section>
    </section>
  `;

  const toastEl = document.getElementById("toast");
  if(toastEl && toastEl.parentElement){
    toastEl.parentElement.insertBefore(tpl, toastEl);
  }else{
    document.body.appendChild(tpl);
  }

  // Экран создаётся динамически → навешиваем обработчики после вставки
  bindSupportUI();
}

function bindSupportUI(){
  const root = document.getElementById("screen-support");
  if(!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  $("btn-support-refresh")?.addEventListener("click", refreshSupport);
  $("supportSearch")?.addEventListener("input", () => renderSupportList());
  $("supportGroup")?.addEventListener("change", () => renderSupportList());
  $("supportDateFrom")?.addEventListener("change", () => renderSupportList());
  $("supportDateTo")?.addEventListener("change", () => renderSupportList());

  $("supportTicketsList")?.addEventListener("click", (e) => {
    const id = e.target?.closest?.('.support-item')?.dataset?.supportPick;
    if(id) pickSupportTicket(id);
  });

  $("supportSend")?.addEventListener("click", sendSupportReply);
  $("supportCloseTicket")?.addEventListener("click", closeSupportTicket);
  $("supportReply")?.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); sendSupportReply(); }
  });

  // autosize
  try{ autoGrowTextarea($("supportReply")); }catch{}
}

function ensureTopbarSupportNav(){
  const nav = document.querySelector(".topbar .nav");
  if(!nav) return;
  if(nav.querySelector('[data-tab="support"]')) return;

  const btn = document.createElement("button");
  btn.className = "nav-btn";
  btn.textContent = "SUPPORT";
  btn.dataset.tab = "support";
  btn.style.display = "none"; // покажем только для роли support

  btn.addEventListener("click", () => {
    if(state.role === "support") withTransition(showSupport);
    else toast("Экран поддержки доступен только роли support");
  });

  nav.appendChild(btn);
}


const DEFAULT_USERS = [
  { username: "supadmin", password: "supadmin123", role: "superadmin" },
  { username: "admin", password: "admin123", role: "admin" },
  { username: "designer", password: "demo", role: "admin" },
  { username: "student", password: "student123", role: "student" },
  { username: "starosta", password: "starosta123", role: "starosta" },
  { username: "support", password: "support123", role: "support" },
];

const DEFAULT_GROUPS = [
  { id: 1, name: "ЗПИБД-01-24" },
  { id: 2, name: "ЗПИБД-01-25" },
  { id: 3, name: "ФИИ-01-24" },
];

const state = {
  token: localStorage.getItem("starstat_access") || "",
  username: localStorage.getItem("starstat_user") || "",
  role: localStorage.getItem("starstat_role") || "",
  groupId: Number(localStorage.getItem("starstat_group") || 0) || 0,
  theme: localStorage.getItem("starstat_theme") || "dark",
  charts: {},
  cacheOverview: null,
  cacheDates: null,
  cachePairs: null
};

// ---- Local "DB" (offline) ----
function loadStore(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  }catch{
    return fallback;
  }
}
function saveStore(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

const DEMO_STUDENTS = [
  { id: 1,  name: "Иванов Иван Иванович", groupId: 1 },
  { id: 2,  name: "Петрова Анна Сергеевна", groupId: 1 },
  { id: 3,  name: "Сидоров Михаил Андреевич", groupId: 1 },
  { id: 4,  name: "Кузнецова Мария Ильинична", groupId: 1 },
  { id: 5,  name: "Фёдоров Павел Николаевич", groupId: 1 },
  { id: 6,  name: "Орлова Екатерина Дмитриевна", groupId: 1 },
  { id: 7,  name: "Смирнов Никита Олегович", groupId: 2 },
  { id: 8,  name: "Васильев Артём Сергеевич", groupId: 2 },
  { id: 9,  name: "Ким София Алексеевна", groupId: 2 },
  { id: 10, name: "Зайцева Полина Романовна", groupId: 2 },
  { id: 11, name: "Алиев Тимур Эльдарович", groupId: 3 },
  { id: 12, name: "Громов Даниил Игоревич", groupId: 3 },
];

let USERS = loadStore("sa_users", DEFAULT_USERS);
let GROUPS = loadStore("sa_groups", DEFAULT_GROUPS);
let STUDENTS = loadStore("sa_students", DEMO_STUDENTS);
let ASSIGNS = loadStore("sa_assigns", [
  { username: "admin", groupId: 1 }
]);
let SCHEDULE = loadStore("sa_schedule", []);
let MARKS = loadStore("sa_marks", []);
// Если в localStorage уже лежит пустой массив студентов — заполним демо-данными
if(Array.isArray(STUDENTS) && STUDENTS.length === 0){
  STUDENTS = DEMO_STUDENTS.slice();
  saveStore("sa_students", STUDENTS);
}


function nextId(items){
  return (items.reduce((m, x) => Math.max(m, Number(x.id)||0), 0) || 0) + 1;
}

// ---- UI helpers ----
function toast(msg){
  const el = $("toast");
  if(!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

/* ===== Role-based UI (nav / footer / pages) ===== */
function updateNavByRole(){
  const nav = document.querySelector(".topbar .nav");
  if(!nav) return;

  const btnOverview = nav.querySelector('[data-tab="overview"]');
  const btnDates = nav.querySelector('[data-tab="dates"]');
  const btnPairs = nav.querySelector('[data-tab="pairs"]');
  const btnStarosta = nav.querySelector('[data-tab="starosta"]');
  const btnSupport = nav.querySelector('[data-tab="support"]');

  const show = (el) => { if(el) el.style.display = ""; };
  const hide = (el) => { if(el) el.style.display = "none"; };

  if(!state.token){
    hide(btnOverview); hide(btnDates); hide(btnPairs); hide(btnStarosta); hide(btnSupport);
    return;
  }

  // Староста: только посещаемость
  if(state.role === "starosta"){
    hide(btnOverview); hide(btnDates); hide(btnPairs); hide(btnSupport);
    show(btnStarosta);
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("is-active", b.dataset.tab === "starosta"));
    return;
  }

  // Support: только support
  if(state.role === "support"){
    hide(btnOverview); hide(btnDates); hide(btnPairs); hide(btnStarosta);
    show(btnSupport);
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("is-active", b.dataset.tab === "support"));
    return;
  }

  // Остальные: обычные вкладки, без вкладок старосты/support
  show(btnOverview); show(btnDates); show(btnPairs);
  hide(btnStarosta); hide(btnSupport);
}

function updateFooterByRole(){
  const navSection = document.querySelector('[data-footer-section="nav"]');
  if(!navSection) return;
  if(!state.token){
    navSection.style.display = "";
    return;
  }
  if(state.role === "starosta" || state.role === "support"){
    navSection.style.display = "none";
  }else{
    navSection.style.display = "";
  }
}

// ---- Theme ----
function applyTheme(theme){
  const t = (theme === "light") ? "light" : "dark";
  state.theme = t;
  // Плавный переход между темами: добавляем временный класс,
  // чтобы CSS мог анимировать цвета/границы/тени.
  document.body.classList.add("theme-transition");
  clearTimeout(state._themeTO);
  state._themeTO = setTimeout(() => document.body.classList.remove("theme-transition"), 420);
  document.documentElement.dataset.theme = t;
  localStorage.setItem("starstat_theme", t);
  try{
    $("themeDark")?.classList.toggle("is-active", t === "dark");
    $("themeLight")?.classList.toggle("is-active", t === "light");
    $("themeDarkSa")?.classList.toggle("is-active", t === "dark");
    $("themeLightSa")?.classList.toggle("is-active", t === "light");
  }catch{}

  // ВАЖНО: при смене темы — сразу перерисовать графики и тултипы
  refreshChartsTheme();
}

function isLightTheme(){
  return (document.documentElement.dataset.theme || state.theme) === "light";
}

// ---- Transitions ----
function withTransition(fn){
  const overlay = $("pageTransition");
  if(!overlay){ fn(); return; }
  // Плавный переход между вкладками/экранами: затемнение + blur + лёгкий zoom.
  document.body.classList.add("page-transitioning");
  overlay.classList.add("is-on");
  // 1) дать оверлею начаться
  setTimeout(() => {
    try{ fn(); }finally{
      // 2) после применения разметки — подождать один кадр и убрать
      requestAnimationFrame(() => {
        setTimeout(() => {
          overlay.classList.remove("is-on");
          document.body.classList.remove("page-transitioning");
        }, 220);
      });
    }
  }, 140);
}

function showLanding(){
  $("screen-landing")?.classList.remove("hidden");
  $("screen-dashboard")?.classList.add("hidden");
  $("screen-student")?.classList.add("hidden");
  $("topbar")?.classList.add("hidden");
  document.getElementById("screen-starosta")?.classList.add("hidden");
  document.getElementById("screen-support")?.classList.add("hidden");
  document.body.classList.remove("is-student");
}
function showDashboard(){
  $("screen-landing")?.classList.add("hidden");
  $("screen-dashboard")?.classList.remove("hidden");
  $("screen-student")?.classList.add("hidden");
  document.getElementById("screen-starosta")?.classList.add("hidden");
  document.getElementById("screen-support")?.classList.add("hidden");
  $("topbar")?.classList.remove("hidden");
  document.body.classList.remove("is-student");
}
function showStudent(){
  $("screen-landing")?.classList.add("hidden");
  $("screen-dashboard")?.classList.add("hidden");
  $("screen-student")?.classList.remove("hidden");
  document.getElementById("screen-starosta")?.classList.add("hidden");
  document.getElementById("screen-support")?.classList.add("hidden");
  $("topbar")?.classList.remove("hidden");
  document.body.classList.add("is-student");
}
function showStarosta(){
  $("screen-landing")?.classList.add("hidden");
  $("screen-dashboard")?.classList.add("hidden");
  $("screen-student")?.classList.add("hidden");
  $("screen-support")?.classList.add("hidden");
  $("screen-starosta")?.classList.remove("hidden");
  $("topbar")?.classList.remove("hidden");
  document.body.classList.remove("is-student");
}

function showSupport(){
  $("screen-landing")?.classList.add("hidden");
  $("screen-dashboard")?.classList.add("hidden");
  $("screen-student")?.classList.add("hidden");
  $("screen-starosta")?.classList.add("hidden");
  $("screen-support")?.classList.remove("hidden");
  $("topbar")?.classList.remove("hidden");
  document.body.classList.remove("is-student");
}


function setRoleHint(){
  const hint = $("roleHint");
  if(!hint) return;
  if(!state.token){
    hint.textContent = "Не авторизован";
    return;
  }
  hint.textContent = `Вы вошли как: ${state.username} (${state.role})`;
}

function openLogin(){ $("loginModal")?.classList.remove("hidden"); $("loginError") && ($("loginError").textContent = ""); }
function closeLogin(){ $("loginModal")?.classList.add("hidden"); }

function openProfile(){
  $("profileUser") && ($("profileUser").textContent = state.username || "—");
  $("profileRole") && ($("profileRole").textContent = state.role || "—");
  $("profileModal")?.classList.remove("hidden");
}
function closeProfile(){ $("profileModal")?.classList.add("hidden"); }

function openSuperadmin(){
  const isSA = state.role === "superadmin";
  document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("is-active"));
  if(isSA){
    $("admin-groups")?.classList.add("is-active");
    document.querySelectorAll(".admin-tab").forEach(b => b.classList.toggle("is-active", b.dataset.adminTab === "groups"));
    renderAllSuperadmin();
  }else{
    $("admin-denied")?.classList.add("is-active");
    document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("is-active"));
  }
  $("superadminModal")?.classList.remove("hidden");
}
function closeSuperadmin(){ $("superadminModal")?.classList.add("hidden"); }

document.addEventListener("click", (e) => {
  const t = e.target;
  if(t?.dataset?.close) closeLogin();
  try{ closeChat(); }catch{}
  if(t?.dataset?.closeProfile) closeProfile();
  if(t?.dataset?.closeSuperadmin) closeSuperadmin();
});

function logout(){
  state.token = "";
  state.username = "";
  state.role = "";
  localStorage.removeItem("starstat_access");
  localStorage.removeItem("starstat_user");
  localStorage.removeItem("starstat_role");
  setRoleHint();
  updateNavByRole();
  updateFooterByRole();
  withTransition(showLanding);
  toast("Вы вышли");
}

/* Tabs (dashboard) */
const panels = {
  overview: $("panel-overview"),
  dates: $("panel-dates"),
  pairs: $("panel-pairs")
};
function setTab(name){
  // Староста/Support: только свои экраны
  if(state.role === "starosta"){
    withTransition(showStarosta);
    return;
  }
  if(state.role === "support"){
    withTransition(showSupport);
    return;
  }

  // отдельные кнопки в nav (если кто-то кликает)
  if(name === "starosta"){
    withTransition(showStarosta);
    return;
  }
  if(name === "support"){
    withTransition(showSupport);
    return;
  }

  withTransition(() => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("is-active", b.dataset.tab === name));
    Object.entries(panels).forEach(([k, el]) => el?.classList.toggle("is-active", k === name));
  });

  // Важно: Chart.js иногда "вылетает" из угла, если создать/обновить
  // график во время переключения display. Поэтому даём панели стать видимой.
  clearTimeout(state._chartTO);
  state._chartTO = setTimeout(() => {
    try{
      if(name === "dates" && state.cacheDates){
        const d = state.cacheDates;
        makeLine("lineByDates", d.map(r=>r.date), d.map(r=>r.present), d.map(r=>r.absent));
      }
      if(name === "pairs" && state.cachePairs){
        const p = state.cachePairs;
        makeBar("barByPairs",
          p.map(r => `Пара ${r.pair_number}`),
          p.map(r => r.present),
          p.map(r => r.absent),
          p.map(r => r.sick),
          p.map(r => r.excused)
        );
      }
      // Отложенный resize -> чтобы canvas получил корректный размер контейнера
      requestAnimationFrame(() => {
        Object.values(state.charts).forEach(c => { try{ c.resize(); c.update(); }catch(e){} });
      });
    }catch(e){}
  }, 260);
}

document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));

/* Charts */
function destroyChart(key){
  const c = state.charts[key];
  if(c){ c.destroy(); delete state.charts[key]; }
}

function tooltipOpts(){
  if(isLightTheme()){
    return {
      backgroundColor: "rgba(255,255,255,.92)",
      titleColor: "rgba(0,0,0,.86)",
      bodyColor: "rgba(0,0,0,.82)",
      borderColor: "rgba(0,0,0,.10)",
      borderWidth: 1
    };
  }
  return {
    backgroundColor: "rgba(0,0,0,.72)",
    titleColor: "rgba(255,255,255,.92)",
    bodyColor: "rgba(255,255,255,.88)",
    borderColor: "rgba(255,255,255,.12)",
    borderWidth: 1
  };
}

function chartColors(){
  if(isLightTheme()){
    return {
      legend: "rgba(0,0,0,.72)",
      tick: "rgba(0,0,0,.62)",
      grid: "rgba(0,0,0,.10)"
    };
  }
  return {
    legend: "rgba(255,255,255,.75)",
    tick: "rgba(255,255,255,.60)",
    grid: "rgba(255,255,255,.08)"
  };
}

/**
 * Создаёт круговую диаграмму. Если передан массив colors, использует его
 * как backgroundColor для набора данных. Иначе Chart.js применит свои цвета.
 */
function makeDonut(canvasId, labels, values, colors){
  const ctx = $(canvasId);
  if(!ctx) return;
  destroyChart(canvasId);
  // Мягкий вход (CSS) — убираем эффект «вылета из угла»
  ctx.classList.remove("canvas-ready");
    try{ ctx.style.visibility = "hidden"; }catch(e){}
const dataset = { data: values, borderWidth: 0, hoverOffset: 6 };
  if(colors && Array.isArray(colors)){
    dataset.backgroundColor = colors;
  }
  const tt = tooltipOpts();
  state.charts[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [dataset] },
    options: {
      responsive: true,
      resizeDelay: 150,
      cutout: "72%",
      animation: { duration: 1200, easing: "easeOutCubic", animateRotate: true, animateScale: false },
      plugins: {
        legend: { display:false },
        tooltip: {
          ...tt,
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.formattedValue}` }
        }
      }
    }
  });

  // дать браузеру проставить размеры canvas и только потом включить видимость
  // Два кадра: сначала DOM/layout, затем Chart.js resize.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try{ state.charts[canvasId]?.resize(); state.charts[canvasId]?.update(); }catch(e){}
    ctx.classList.add("canvas-ready");
    try{ ctx.style.visibility = "visible"; }catch(e){}
  }));
}

function makeLine(canvasId, labels, aValues, bValues){
  const ctx = $(canvasId);
  if(!ctx) return;
  destroyChart(canvasId);
  ctx.classList.remove("canvas-ready");

    try{ ctx.style.visibility = "hidden"; }catch(e){}
const cc = chartColors();
  const tt = tooltipOpts();

  const totalDuration = 2400;
  const delayBetweenPoints = totalDuration / Math.max(1, labels.length);

  const previousY = (ctx) => {
    const ds = ctx.chart.data.datasets[ctx.datasetIndex]?.data || [];
    if(ctx.index === 0){
      return ctx.chart.scales.y.getPixelForValue(ds[0] ?? 0);
    }
    const meta = ctx.chart.getDatasetMeta(ctx.datasetIndex);
    return meta.data[ctx.index - 1].getProps(['y'], true).y;
  };

  state.charts[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Присутствовали",
          data: aValues,
          tension: 0.45,
          cubicInterpolationMode: "monotone",
          fill: true,
          pointRadius: 3,
          borderColor: PALETTE.present,
          backgroundColor: hexToRgba(PALETTE.present, isLightTheme() ? 0.25 : 0.35),
        },
        {
          label: "Отсутствовали",
          data: bValues,
          tension: 0.45,
          cubicInterpolationMode: "monotone",
          fill: true,
          pointRadius: 3,
          borderColor: PALETTE.absent,
          backgroundColor: hexToRgba(PALETTE.absent, isLightTheme() ? 0.20 : 0.30),
        },
      ]
    },
    options: {
      responsive: true,
      resizeDelay: 150,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: cc.legend } },
        tooltip: { ...tt }
      },
      scales: {
        x: { ticks: { color: cc.tick }, grid: { color: cc.grid } },
        y: { ticks: { color: cc.tick }, grid: { color: cc.grid } }
      },
      animations: {
        y: {
          type: "number",
          easing: "easeOutCubic",
          from: (ctx) => {
            if(ctx.type !== "data") return undefined;
            return ctx.chart.scales.y.getPixelForValue(0);
          }
        }
      },
      animation: { duration: 1400, easing: "easeOutCubic" }
    }
  });

  // Два кадра — чтобы исключить «вылет из угла» из‑за позднего layout.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try{ state.charts[canvasId]?.resize(); state.charts[canvasId]?.update(); }catch(e){}
    ctx.classList.add("canvas-ready");
    try{ ctx.style.visibility = "visible"; }catch(e){}
  }));
}

function makeBar(canvasId, labels, p, a, s, e){
  const ctx = $(canvasId);
  if(!ctx) return;
  destroyChart(canvasId);
  ctx.classList.remove("canvas-ready");
  try{ ctx.style.visibility = "hidden"; }catch(e){}

  const cc = chartColors();
  const tt = tooltipOpts();

  state.charts[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Присутствовали", data: p, backgroundColor: PALETTE.present },
        { label: "Отсутствовали",  data: a, backgroundColor: PALETTE.absent  },
        { label: "Болели",         data: s, backgroundColor: PALETTE.sick    },
        { label: "Уважительная",   data: e, backgroundColor: PALETTE.excused },
      ]
    },
    options: {
      responsive: true,
      resizeDelay: 150,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: cc.legend } },
        tooltip: { ...tt }
      },
      scales: {
        x: { ticks: { color: cc.tick }, grid: { color: cc.grid } },
        y: { ticks: { color: cc.tick }, grid: { color: cc.grid } }
      },
      animations: {
        y: { from: (ctx) => ctx.chart.scales.y.getPixelForValue(0) },
        base: { from: (ctx) => ctx.chart.scales.y.getPixelForValue(0) }
      },
      animation: {
        duration: 1100,
        easing: "easeOutCubic",
        delay(ctx){
          if(ctx.type !== "data" || ctx.mode !== "default") return 0;
          return ctx.dataIndex * 55 + ctx.datasetIndex * 18;
        }
      }
    }
  });

  requestAnimationFrame(() => requestAnimationFrame(() => {
    try{ state.charts[canvasId]?.resize(); state.charts[canvasId]?.update(); }catch(e){}
    ctx.classList.add("canvas-ready");
    try{ ctx.style.visibility = "visible"; }catch(e){}
  }));
}

function refreshChartsTheme(){
  // Пересобираем графики из кэша сразу после смены темы
  try{
    if(state.role === "student"){
      // student charts пересобираются в refreshStudent при обновлении;
      // здесь мягко обновим только если есть данные в DOM
      try{ refreshStudent(); }catch{}
      return;
    }
    if(state.role === "starosta"){
      // на странице старосты графиков нет
      return;
    }

    if(state.cacheOverview){
      const ov = state.cacheOverview;
      const absentCount = ov.studentsCount - ov.status_counts.present;
      makeDonut("donutAttendance", ["Присутствовали", "Отсутствовали"], [
        ov.status_counts.present, absentCount
      ], [PALETTE.present, PALETTE.absent]);

      makeDonut("donutStatuses",
        ["Присутствовали","Болели","Уважительная причина","Прогул"],
        [ov.status_counts.present, ov.status_counts.sick, ov.status_counts.excused, ov.status_counts.truant],
        [PALETTE.present, PALETTE.sick, PALETTE.excused, PALETTE.truant]
      );

      const singleColor = isLightTheme() ? "rgba(0,0,0,.85)" : "rgba(255,255,255,.85)";
      makeDonut("donutPairs", ["Пары"], [ov.total_pairs], [singleColor]);
    }

    if(state.cacheDates){
      const d = state.cacheDates;
      makeLine("lineByDates", d.map(r=>r.date), d.map(r=>r.present), d.map(r=>r.absent));
    }

    if(state.cachePairs){
      const p = state.cachePairs;
      makeBar("barByPairs",
        p.map(r => `Пара ${r.pair_number}`),
        p.map(r => r.present),
        p.map(r => r.absent),
        p.map(r => r.sick),
        p.map(r => r.excused)
      );
    }
  }catch(e){}
}

/* Demo data helpers */
const WEEKDAYS_RU = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
function weekdayRU(iso){
  const d = new Date(iso + "T00:00:00");
  return WEEKDAYS_RU[d.getDay()];
}
function dateRangeISO(fromISO, toISO){
  const out = [];
  const from = new Date(fromISO + "T00:00:00");
  const to = new Date(toISO + "T00:00:00");
  for(let d = new Date(from); d <= to; d.setDate(d.getDate()+1)){
    out.push(d.toISOString().slice(0,10));
  }
  return out;
}
function seededRand(seed){
  let t = seed % 2147483647;
  if (t <= 0) t += 2147483646;
  return function(){
    t = t * 16807 % 2147483647;
    return (t - 1) / 2147483646;
  };
}
function hexToRgba(hex, alpha){
  if(!hex || hex[0] !== '#' || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ===== Subjects && Palette ===== */
const SUBJECTS = [
  "Все",
  "Английский 1 группа",
  "Математика",
  "Программирование",
  "Алгебра",
  "Базы данных",
  "Физика",
];
const PALETTE = {
  present: "#8979FF",
  sick: "#FFA948",
  excused: "#3CC3DF",
  truant: "#FF928A",
  absent: "#FF928A",
};

function ensureDashboardSubjectFilter(){
  const filters = document.querySelector("#screen-dashboard .filters");
  if(!filters) return;
  if(document.getElementById("subjectSelect")) return;

  // вставляем перед кнопкой "Обновить"
  const btnField = filters.querySelector(".field.field-btn");
  const field = document.createElement("div");
  field.className = "field";
  field.innerHTML = `
    <label>Предмет</label>
    <select id="subjectSelect" class="input"></select>
  `;
  if(btnField) filters.insertBefore(field, btnField);
  else filters.appendChild(field);
}

function ensureStudentSubjectFilter(){
  const filters = document.querySelector("#screen-student .filters");
  if(!filters) return;
  if(document.getElementById("studentSubjectSelect")) return;

  const btnField = filters.querySelector(".field.field-btn");
  const field = document.createElement("div");
  field.className = "field";
  field.innerHTML = `
    <label>Предмет</label>
    <select id="studentSubjectSelect" class="input"></select>
  `;
  if(btnField) filters.insertBefore(field, btnField);
  else filters.appendChild(field);
}


function loadSubjectsToSelect(selectId){
  const sel = $(selectId);
  if(!sel) return;
  sel.innerHTML = "";
  for(const subj of SUBJECTS){
    const opt = document.createElement("option");
    opt.value = subj;
    opt.textContent = subj;
    sel.appendChild(opt);
  }
  const key = `starstat_subject_${selectId}`;
  const saved = localStorage.getItem(key);
  if(saved && SUBJECTS.includes(saved)) sel.value = saved;
  sel.addEventListener("change", () => {
    localStorage.setItem(key, sel.value);
  });
}

function setDefaultDates(){
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 14);
  const fmt = (d) => d.toISOString().slice(0,10);
  $("dateTo") && ($("dateTo").value = localStorage.getItem("starstat_to") || fmt(to));
  $("dateFrom") && ($("dateFrom").value = localStorage.getItem("starstat_from") || fmt(from));
}

function loadGroupsToSelect(selectId, allowAll=false){
  const sel = $(selectId);
  if(!sel) return;
  sel.innerHTML = "";
  if(allowAll){
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "— Выберите группу —";
    sel.appendChild(opt);
  }
  for(const g of GROUPS){
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    sel.appendChild(opt);
  }
}

function loadGroups(){
  loadGroupsToSelect("groupSelect", false);
  const sel = $("groupSelect");
  if(!sel) return;
  if(state.groupId && GROUPS.some(g => g.id === state.groupId)){
    sel.value = String(state.groupId);
  }else{
    sel.value = String(GROUPS[0]?.id || 1);
    state.groupId = Number(sel.value || 1);
  }
}

function getFilters(){
  return {
    groupId: Number($("groupSelect")?.value || 0),
    dateFrom: $("dateFrom")?.value,
    dateTo: $("dateTo")?.value,
    subject: $("subjectSelect")?.value || "Все",
  };
}

/* ===== Student page (v6) ===== */
const STUDENT_STATUS_LABEL = {
  present: "Присутствовал",
  sick: "Болел",
  excused: "Уважительная причина",
  truant: "Прогул",
};

function setDefaultStudentDates(){
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 14);
  const fmt = (d) => d.toISOString().slice(0,10);
  const kFrom = "starstat_student_from";
  const kTo = "starstat_student_to";
  const elFrom = $("studentDateFrom");
  const elTo = $("studentDateTo");
  if(!elFrom || !elTo) return;
  elTo.value = localStorage.getItem(kTo) || fmt(to);
  elFrom.value = localStorage.getItem(kFrom) || fmt(from);
}

function getCurrentStudent(){
  let id = Number(localStorage.getItem("starstat_student_id") || 0);
  let s = STUDENTS.find(x => x.id === id);
  if(!s){
    s = STUDENTS[0];
    if(!s){
      const gid = GROUPS[0]?.id || 1;
      s = { id: 1, name: "Иванов Иван Иванович", groupId: gid };
      STUDENTS = [s];
      saveStore("sa_students", STUDENTS);
    }
    localStorage.setItem("starstat_student_id", String(s.id));
  }
  return s;
}

function ensureStudentReady(){
  const s = getCurrentStudent();
  state.groupId = Number(s.groupId || GROUPS[0]?.id || 1);
  localStorage.setItem("starstat_group", String(state.groupId));

  const g = GROUPS.find(x => x.id === state.groupId);
  const groupName = g ? g.name : "—";
  const gi = $("studentGroup");
  if(gi){ gi.value = groupName; }

  const hint = $("studentHint");
  if(hint){ hint.textContent = `${s.name} · ${groupName}`; }
}

function getStudentFilters(){
  return {
    dateFrom: $("studentDateFrom")?.value,
    dateTo: $("studentDateTo")?.value,
    subject: $("studentSubjectSelect")?.value || "Все",
  };
}

function makeDonutColored(canvasId, labels, values, colors){
  const ctx = $(canvasId);
  if(!ctx) return;
  destroyChart(canvasId);
  const tt = tooltipOpts();
  state.charts[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data: values, borderWidth: 0, hoverOffset: 6, backgroundColor: colors }] },
    options: {
      responsive: true,
      resizeDelay: 150,
      cutout: "72%",
      animation: { duration: 1200, easing: "easeOutCubic", animateRotate: true, animateScale: false },
      plugins: { legend: { display:false }, tooltip: { ...tt } }
    }
  });
}

async function refreshStudent(){
  if(!state.token || state.role !== "student") return;
  ensureStudentReady();

  const { dateFrom, dateTo, subject } = getStudentFilters();
  if(!dateFrom || !dateTo){ toast("Заполните период"); return; }

  localStorage.setItem("starstat_student_from", dateFrom);
  localStorage.setItem("starstat_student_to", dateTo);

  const s = getCurrentStudent();
  const days = dateRangeISO(dateFrom, dateTo);
  const subjSeed = (subject || "Все").split("").reduce((a,c)=> a + c.charCodeAt(0), 0);
  const seed = (s.id * 13579) + Number(dateFrom.replaceAll("-", "")) + Number(dateTo.replaceAll("-", "")) + subjSeed;
  const rand = seededRand(seed);

  const rows = [];
  let present = 0, sick = 0, excused = 0, truant = 0;

  for(const iso of days){
    const r = rand();
    let status = "present";
    if(r < 0.60) status = "present";
    else if(r < 0.60 + 0.15) status = "sick";
    else if(r < 0.60 + 0.15 + 0.20) status = "excused";
    else status = "truant";

    if(status === "present") present += 1;
    if(status === "sick") sick += 1;
    if(status === "excused") excused += 1;
    if(status === "truant") truant += 1;

    rows.push({ date: iso, weekday: weekdayRU(iso), status });
  }

  const total = Math.max(1, rows.length);
  const absTotal = (total - present);
  const pct = Math.round((present / total) * 100);

  $("studAttendancePercent") && ($("studAttendancePercent").textContent = `${pct}%`);
  $("studVisitedRatio") && ($("studVisitedRatio").textContent = `${present}/${total}`);
  $("studAbsencesTotal") && ($("studAbsencesTotal").textContent = `${absTotal}`);

  makeDonutColored("studDonutAttendance", ["Присутствовал","Отсутствовал"], [present, absTotal], [PALETTE.present, PALETTE.absent]);
  makeDonutColored("studDonutVisited", ["Присутствовал","Отсутствовал"], [present, absTotal], [PALETTE.present, PALETTE.absent]);

  const safe = (sick + excused + truant) === 0 ? [1,0,0] : [sick, excused, truant];
  makeDonutColored("studDonutAbsences", ["Болел","Уважительная причина","Прогул"], safe, [PALETTE.sick, PALETTE.excused, PALETTE.truant]);

  const tb = $("studTable")?.querySelector("tbody");
  if(tb){
    tb.innerHTML = "";
    for(const r of rows){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.date}</td>
        <td>${r.weekday}</td>
        <td>${STUDENT_STATUS_LABEL[r.status] || r.status}</td>
      `;
      tb.appendChild(tr);
    }
  }
}

function openStudentFull(){
  const sec = $("studTableSection");
  if(!sec) return;
  $("fullOverlay")?.classList.add("is-on");
  document.body.classList.add("is-full-open");
  sec.classList.add("is-full");
  const closeBtn = $("studCloseFullBtn");
  if(closeBtn) closeBtn.style.display = "";
  const expBtn = $("studExpandBtn");
  if(expBtn) expBtn.style.display = "none";
}
function closeStudentFull(){
  const sec = $("studTableSection");
  if(!sec) return;
  $("fullOverlay")?.classList.remove("is-on");
  document.body.classList.remove("is-full-open");
  sec.classList.remove("is-full");
  const closeBtn = $("studCloseFullBtn");
  if(closeBtn) closeBtn.style.display = "none";
  const expBtn = $("studExpandBtn");
  if(expBtn) expBtn.style.display = "";
}

/* ===== Starosta page (отмечание посещаемости) ===== */
let starostaSelectedStudentId = null;
let starostaSelectedStatus = null;
let starostaPendingFiles = [];

function autoGrowTextarea(el){
  if(!el) return;
  const resize = () => {
    el.style.height = 'auto';
    el.style.height = Math.min(260, el.scrollHeight) + 'px';
  };
  el.addEventListener('input', resize);
  // initial
  requestAnimationFrame(resize);
}

function fileMetaList(files){
  const out = [];
  try{
    for(const f of (files || [])){
      out.push({
        name: f.name,
        size: f.size,
        type: f.type || '',
        lastModified: f.lastModified || 0
      });
    }
  }catch{}
  return out;
}

function renderStarostaFiles(){
  const wrap = $("starostaFilesList");
  if(!wrap) return;
  wrap.innerHTML = "";
  if(!starostaPendingFiles.length) return;

  for(const f of starostaPendingFiles){
    const row = document.createElement('div');
    row.className = 'file-item';
    const sizeKb = Math.max(1, Math.round((Number(f.size||0) / 1024)));
    row.innerHTML = `
      <div class="left" style="display:flex; gap:10px; align-items:center; overflow:hidden;">
        <span class="badge">Файл</span>
        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(f.name||'document')}</span>
        <span class="muted" style="white-space:nowrap;">${sizeKb} KB</span>
      </div>
      <button class="pill-btn danger" type="button" data-file-remove="${escapeHtmlAttr(f.name||'')}">Удалить</button>
    `;
    wrap.appendChild(row);
  }
}

function escapeHtml(str){
  return String(str || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeHtmlAttr(str){
  return escapeHtml(str).replace(/\s+/g,' ');
}

// Найти последнюю отметку по ключу
function findMarkIndex(studentId, date, subject){
  const sid = Number(studentId);
  const d = String(date || "");
  const subj = String(subject || "");
  for(let i = MARKS.length - 1; i >= 0; i--){
    const m = MARKS[i];
    if(Number(m.studentId) === sid && String(m.date) === d && String(m.subject) === subj){
      return i;
    }
  }
  return -1;
}

function getStarostaMark(studentId, date, subject){
  const idx = findMarkIndex(studentId, date, subject);
  return idx >= 0 ? MARKS[idx] : null;
}

function renderStarostaList(filter=""){
  const wrap = $("starostaStudentsList");
  if(!wrap) return;

  const groupId = Number($("starostaGroupSelect")?.value || 0);
  const q = (filter || "").trim().toLowerCase();

  const date = $("starostaDate")?.value || "";
  const subject = $("starostaSubjectSelect")?.value || "";

  const list = STUDENTS
    .filter(s => {
      const matchGroup = !groupId || s.groupId === groupId;
      const matchName = !q || String(s.name||"").toLowerCase().includes(q);
      return matchGroup && matchName;
    })
    .sort((a,b) => String(a.name).localeCompare(String(b.name), 'ru'));

  wrap.innerHTML = "";

  for(const s of list){
    const g = GROUPS.find(x => x.id === s.groupId);
    const row = document.createElement("div");

    const mark = (date && subject) ? getStarostaMark(s.id, date, subject) : null;
    const status = mark?.status || null;
    const isPicked = starostaSelectedStudentId && Number(starostaSelectedStudentId) === Number(s.id);

    row.className = "starosta-item" + (isPicked ? " is-active" : "") + (status ? ` st-${status}` : "");
    row.dataset.starostaPick = String(s.id);

    row.innerHTML = `
      <div class="left">
        <span class="badge">${g ? g.name : "—"}</span>
        <span class="name">${escapeHtml(s.name)}</span>
      </div>
      <span class="status-dot" aria-hidden="true"></span>
    `;

    wrap.appendChild(row);
  }
}

function pickStarostaStudent(id){
  const nameEl = $("starostaStudentName");
  const groupEl = $("starostaStudentGroup");

  starostaSelectedStudentId = id ? Number(id) : null;
  starostaSelectedStatus = null;

  // подсветка статусов (сброс)
  document.querySelectorAll('[data-starosta-status]')?.forEach(btn => btn.classList.remove('is-active'));

  // очистка полей комментария/файлов
  const reasonEl = $("starostaReason");
  if(reasonEl) reasonEl.value = "";
  starostaPendingFiles = [];
  try{ const fileEl = $("starostaFiles"); if(fileEl) fileEl.value = ""; }catch{}
  renderStarostaFiles();
  try{ autoGrowTextarea($("starostaReason")); }catch{}

  if(!id){
    if(nameEl) nameEl.textContent = "Выберите студента";
    if(groupEl) groupEl.textContent = "—";
    renderStarostaList($("starostaSearch")?.value || "");
    return;
  }

  const stud = STUDENTS.find(x => x.id === Number(id));
  const grp = GROUPS.find(x => x.id === stud?.groupId);

  if(nameEl) nameEl.textContent = stud ? stud.name : "—";
  if(groupEl) groupEl.textContent = grp ? grp.name : "—";

  // если уже есть отметка на дату/предмет — покажем её и зальём поля
  const date = $("starostaDate")?.value;
  const subject = $("starostaSubjectSelect")?.value;
  const mark = (date && subject) ? getStarostaMark(id, date, subject) : null;

  if(mark?.status){
    starostaSelectedStatus = mark.status;
    document.querySelectorAll('[data-starosta-status]')?.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.starostaStatus === mark.status);
    });
  }

  if(mark?.reason && reasonEl){
    reasonEl.value = String(mark.reason);
  }
  if(Array.isArray(mark?.files)){
    starostaPendingFiles = mark.files.slice(0);
    renderStarostaFiles();
  }
  try{ autoGrowTextarea($("starostaReason")); }catch{}

  // Важно: чтобы кнопка "Выбрать" стала оранжевой сразу после выбора (если ещё нет статуса)
  renderStarostaList($("starostaSearch")?.value || "");
}

function upsertStarostaStatus(status){
  const studentId = starostaSelectedStudentId;
  const date = $("starostaDate")?.value;
  const subject = $("starostaSubjectSelect")?.value || "";
  const groupId = Number($("starostaGroupSelect")?.value || 0);

  if(!studentId){ toast("Выберите студента"); return; }
  if(!date){ toast("Выберите дату"); return; }
  if(!subject){ toast("Выберите предмет"); return; }

  const idx = findMarkIndex(studentId, date, subject);
  if(idx >= 0){
    // обновляем статус, оставляя причину/файлы
    MARKS[idx] = {
      ...MARKS[idx],
      status,
      groupId: groupId || MARKS[idx].groupId || 0,
      updatedAt: Date.now()
    };
  }else{
    MARKS.push({
      id: nextId(MARKS),
      studentId: Number(studentId),
      groupId: groupId || 0,
      date,
      subject,
      status,
      reason: "",
      files: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  saveStore("sa_marks", MARKS);
  starostaSelectedStatus = status;

  // UI
  document.querySelectorAll('[data-starosta-status]')?.forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.starostaStatus === status);
  });

  // студент сразу перекрашивается
  renderStarostaList($("starostaSearch")?.value || "");
  toast("Статус сохранён");
}

function saveStarostaReasonAndFiles(){
  const studentId = starostaSelectedStudentId;
  const date = $("starostaDate")?.value;
  const subject = $("starostaSubjectSelect")?.value || "";
  const reason = String($("starostaReason")?.value || "").trim();

  if(!studentId){ toast("Выберите студента"); return; }
  if(!date){ toast("Выберите дату"); return; }
  if(!subject){ toast("Выберите предмет"); return; }

  const idx = findMarkIndex(studentId, date, subject);
  if(idx < 0){
    toast("Сначала выберите статус посещения");
    return;
  }

  MARKS[idx] = {
    ...MARKS[idx],
    reason,
    files: Array.isArray(starostaPendingFiles) ? starostaPendingFiles.slice(0) : [],
    updatedAt: Date.now()
  };

  saveStore("sa_marks", MARKS);
  toast("Комментарий/файлы сохранены");
}
function genOverview(groupId, dateFrom, dateTo, subject = "Все"){
  const days = dateRangeISO(dateFrom, dateTo);
  const subjSeed = (subject || "Все").split("").reduce((a,c)=> a + c.charCodeAt(0), 0);
  const rand = seededRand(groupId * 100000 + Number(dateFrom.replaceAll("-","")) + Number(dateTo.replaceAll("-","")) + subjSeed);

  const studentsCount = 900 + Math.floor(rand() * 900);
  const present = Math.floor(studentsCount * (0.55 + rand()*0.25));
  const remaining = Math.max(0, studentsCount - present);
  const sick = Math.floor(remaining * (0.15 + rand()*0.15));
  const excused = Math.floor((remaining - sick) * (0.20 + rand()*0.25));
  const truant = Math.max(0, studentsCount - present - sick - excused);
  const attendance_percent = Math.round((present / Math.max(1, studentsCount)) * 100);
  const total_pairs = Math.max(10, Math.min(140, days.length * 4));
  return { attendance_percent, studentsCount, status_counts: { present, sick, excused, truant }, total_pairs };
}

function genByDates(groupId, dateFrom, dateTo, subject = "Все"){
  const days = dateRangeISO(dateFrom, dateTo);
  const subjSeed = (subject || "Все").split("").reduce((a,c)=> a + c.charCodeAt(0), 0);
  const rand = seededRand(groupId * 77777 + Number(dateFrom.replaceAll("-","")) + subjSeed);
  return days.map((iso) => {
    const base = 40 + Math.floor(rand() * 60);
    const present = Math.max(0, Math.floor(base * (0.55 + rand()*0.25)));
    const remaining = Math.max(0, base - present);
    const sick = Math.max(0, Math.floor(remaining * (0.15 + rand()*0.15)));
    const excused = Math.max(0, Math.floor((remaining - sick) * (0.20 + rand()*0.25)));
    const truant = Math.max(0, base - present - sick - excused);
    return {
      date: iso,
      weekday: weekdayRU(iso),
      present,
      absent: sick + excused + truant,
      sick,
      excused,
      truant,
      total: base
    };
  });
}

function genByPairs(groupId, subject = "Все"){
  const subjSeed = (subject || "Все").split("").reduce((a,c)=> a + c.charCodeAt(0), 0);
  const rand = seededRand(groupId * 99991 + subjSeed);
  return [1,2,3,4,5,6].map(n => {
    const total = 120;
    const p = Math.floor(total * (0.55 + rand()*0.25)) - n*2;
    const present = Math.max(0, p);
    const remaining = Math.max(0, total - present);
    const sick = Math.max(0, Math.floor(remaining * (0.15 + rand()*0.15)));
    const excused = Math.max(0, Math.floor((remaining - sick) * (0.20 + rand()*0.25)));
    const truant = Math.max(0, total - present - sick - excused);
    const absent = sick + excused + truant;
    return { pair_number:n, present, absent, sick, excused, truant, total };
  });
}

async function refreshAll(){
  if(!state.token){
    toast("Сначала войдите");
    return;
  }
  if(state.role === "starosta"){
    withTransition(showStarosta);
    return;
  }

  const { groupId, dateFrom, dateTo, subject } = getFilters();
  if(!groupId || !dateFrom || !dateTo){
    toast("Заполните фильтры");
    return;
  }
  state.groupId = groupId;
  localStorage.setItem("starstat_group", String(groupId));
  localStorage.setItem("starstat_from", dateFrom);
  localStorage.setItem("starstat_to", dateTo);

  const ov = genOverview(groupId, dateFrom, dateTo, subject);
  state.cacheOverview = ov;

  $("attendancePercent") && ($("attendancePercent").textContent = `${ov.attendance_percent}%`);
  $("totalMarks") && ($("totalMarks").textContent = `${ov.studentsCount}`);
  $("totalPairs") && ($("totalPairs").textContent = `${ov.total_pairs}`);

  const absentCount = ov.studentsCount - ov.status_counts.present;
  makeDonut("donutAttendance", ["Присутствовали", "Отсутствовали"], [
    ov.status_counts.present,
    absentCount
  ], [PALETTE.present, PALETTE.absent]);

  makeDonut("donutStatuses",
    ["Присутствовали","Болели","Уважительная причина","Прогул"],
    [ov.status_counts.present, ov.status_counts.sick, ov.status_counts.excused, ov.status_counts.truant],
    [PALETTE.present, PALETTE.sick, PALETTE.excused, PALETTE.truant]
  );

  const singleColor = isLightTheme() ? "rgba(0,0,0,.85)" : "rgba(255,255,255,.85)";
  makeDonut("donutPairs", ["Пары"], [ov.total_pairs], [singleColor]);

  const dates = genByDates(groupId, dateFrom, dateTo, subject);
  state.cacheDates = dates;
  makeLine("lineByDates", dates.map(r=>r.date), dates.map(r=>r.present), dates.map(r=>r.absent));

  const tb = $("tableDates")?.querySelector("tbody");
  if(tb){
    tb.innerHTML = "";
    for(const r of dates){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.date}</td>
        <td>${r.weekday}</td>
        <td>${r.present}</td>
        <td>${r.absent}</td>
        <td>${r.sick}</td>
        <td>${r.excused}</td>
        <td>${r.total}</td>
      `;
      tb.appendChild(tr);
    }
  }

  const pairs = genByPairs(groupId, subject);
  state.cachePairs = pairs;
  makeBar("barByPairs",
    pairs.map(r => `Пара ${r.pair_number}`),
    pairs.map(r => r.present),
    pairs.map(r => r.absent),
    pairs.map(r => r.sick),
    pairs.map(r => r.excused),
  );

  toast("Демо-данные загружены");
}

/* Login */
async function doLogin(username, password){
  const user = USERS.find(u => u.username === username && u.password === password);
  if(!user){
    throw new Error("Неверный логин или пароль");
  }

  state.token = "offline-token";
  state.username = user.username;
  state.role = user.role;

  localStorage.setItem("starstat_access", state.token);
  localStorage.setItem("starstat_user", state.username);
  localStorage.setItem("starstat_role", state.role);

  closeLogin();
  try{ closeChat(); }catch{}

  setRoleHint();
  updateNavByRole();
  updateFooterByRole();

  if(state.role === "student"){
    ensureStudentReady();
    withTransition(showStudent);
    await refreshStudent();
  }else if(state.role === "starosta"){
    loadGroupsToSelect("starostaGroupSelect", false);
    loadSubjectsToSelect("starostaSubjectSelect");

    const today = new Date().toISOString().slice(0,10);
    const savedDate = localStorage.getItem("starstat_starosta_date");
    $("starostaDate").value = savedDate || today;

    $("starostaDate")?.addEventListener("change", () => {
      try{ localStorage.setItem("starstat_starosta_date", $("starostaDate").value); }catch{}
      renderStarostaList($("starostaSearch")?.value || "");
    });
    $("starostaSubjectSelect")?.addEventListener("change", () => renderStarostaList($("starostaSearch")?.value || ""));

    withTransition(showStarosta);
    renderStarostaList("");
    pickStarostaStudent(null);
  }else if(state.role === "support"){
    seedSupportTicketsIfEmpty();
    ensureSupportReady();
    withTransition(showSupport);
    refreshSupport();
  }else{

    withTransition(showDashboard);
    loadGroups();
    await refreshAll();
  }
}

/* ===== Superadmin panel logic ===== */
function setAdminTab(name){
  document.querySelectorAll(".admin-tab").forEach(b => b.classList.toggle("is-active", b.dataset.adminTab === name));
  document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("is-active"));
  const map = {
    groups: "admin-groups",
    students: "admin-students",
    schedule: "admin-schedule",
    assign: "admin-assign",
    users: "admin-users",
  };
  const id = map[name];
  if(id) $(id)?.classList.add("is-active");
}
document.querySelectorAll(".admin-tab").forEach(btn => {
  btn.addEventListener("click", () => setAdminTab(btn.dataset.adminTab));
});

function renderGroups(){
  const wrap = $("saGroupsList");
  if(!wrap) return;
  wrap.innerHTML = "";
  for(const g of GROUPS){
    const row = document.createElement("div");
    // Вкладка «Группы» не относится к расписанию → не делаем draggable
    row.className = "admin-item";
    row.innerHTML = `
      <div class="left"><span class="badge">группа</span><span>${g.name}</span></div>
      <button class="pill-btn danger" data-del-group="${g.id}">Удалить</button>
    `;
    wrap.appendChild(row);
  }
  loadGroupsToSelect("saStudentGroup", true);
  loadGroupsToSelect("saStudentsViewGroup", true);
  loadGroupsToSelect("saScheduleGroup", true);
  loadGroupsToSelect("saAssignGroup", true);
  loadGroups();
}

function renderStudents(){
  const viewGroup = Number($("saStudentsViewGroup")?.value || 0);
  const wrap = $("saStudentsList");
  if(!wrap) return;
  wrap.innerHTML = "";
  const list = STUDENTS.filter(s => !viewGroup || s.groupId === viewGroup);
  for(const s of list){
    const g = GROUPS.find(x => x.id === s.groupId);
    const row = document.createElement("div");
    row.className = "admin-item";
    row.innerHTML = `
      <div class="left"><span class="badge">${g ? g.name : "—"}</span><span>${s.name}</span></div>
      <input type="radio" name="studentPick" value="${s.id}" />
    `;
    wrap.appendChild(row);
  }
}

function renderUsers(){
  const wrap = $("saUsersList");
  if(!wrap) return;
  wrap.innerHTML = "";
  for(const u of USERS){
    const row = document.createElement("div");
    row.className = "admin-item";
    row.innerHTML = `
      <div class="left"><span class="badge">${u.role === "superadmin" ? "Суперадминистратор" : "Администратор"}</span><span>${u.username}</span></div>
      <button class="pill-btn danger" data-del-user="${u.username}">Удалить</button>
    `;
    wrap.appendChild(row);
  }

  const sel = $("saAssignUser");
  if(!sel) return;
  sel.innerHTML = "";
  for(const u of USERS.filter(x => x.role !== "superadmin")){
    const opt = document.createElement("option");
    opt.value = u.username;
    opt.textContent = u.username;
    sel.appendChild(opt);
  }
}

function renderAssigns(){
  const wrap = $("saAssignList");
  if(!wrap) return;
  wrap.innerHTML = "";
  for(const a of ASSIGNS){
    const g = GROUPS.find(x => x.id === a.groupId);
    const row = document.createElement("div");
    row.className = "admin-item";
    row.innerHTML = `
      <div class="left"><span class="badge">${a.username}</span><span>→</span><span>${g ? g.name : "—"}</span></div>
      <button class="pill-btn danger" data-del-assign="${a.username}:${a.groupId}">Удалить</button>
    `;
    wrap.appendChild(row);
  }
}


// Superadmin schedule day filter
let SA_SCHEDULE_DAY = "Понедельник";
function renderSchedule(){
  const wrap = $("saScheduleList");
  if(!wrap) return;
  wrap.innerHTML = "";

  const gid = Number($("saScheduleGroup")?.value || 0);
  const order = ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
  const list = SCHEDULE
    .filter(x => (!gid || x.groupId === gid) && (!SA_SCHEDULE_DAY || x.weekday === SA_SCHEDULE_DAY))
    .slice()
    .sort((a,b) => {
      const wa = order.indexOf(a.weekday);
      const wb = order.indexOf(b.weekday);
      if(wa !== wb) return wa - wb;
      return Number(a.pair||0) - Number(b.pair||0);
    });

  if(!list.length){
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Расписание пустое (это демо). Нажмите «Сгенерировать демо».";
    wrap.appendChild(empty);
    return;
  }

  for(const e of list){
    const g = GROUPS.find(x => x.id === e.groupId);
    const row = document.createElement("div");
    row.className = "admin-item schedule-item";
    // Native HTML5 drag&drop даёт рывки и плохую анимацию. Делаем pointer-based
    // reorder со spring (как идея в react-motion demo). Поэтому draggable=false.
    row.draggable = false;
    row.dataset.scheduleId = String(e.id);
    row.dataset.scheduleGroupId = String(e.groupId);
    row.dataset.scheduleWeekday = String(e.weekday);
    row.dataset.schedulePair = String(e.pair);
    row.innerHTML = `
      <div class="left">
        <span class="badge">${g ? g.name : "—"}</span>
        <span>${e.weekday}</span>
        <span class="badge">пара ${e.pair}</span>
        <span>${e.subject}</span>
      </div>
      <div class="schedule-actions">
        <button class="icon-btn small move-btn" title="Поднять" aria-label="Поднять" data-move-up="${e.id}">▲</button>
        <button class="icon-btn small move-btn" title="Опустить" aria-label="Опустить" data-move-down="${e.id}">▼</button>
        <button class="pill-btn danger" data-del-schedule="${e.id}">Удалить</button>
      </div>
    `;
    wrap.appendChild(row);
  }

  // Динамическая разметка -> привяжем pointer-based drag&drop один раз
  initScheduleMotionSortable();
}


/* Smooth FLIP animation for schedule reordering */
function renderScheduleAnimated(){
  const wrap = $("saScheduleList");
  if(!wrap){
    renderSchedule();
    return;
  }
  const first = new Map();
  wrap.querySelectorAll(".schedule-item").forEach(el => {
    const id = el.dataset.scheduleId;
    if(id) first.set(id, el.getBoundingClientRect());
  });

  renderSchedule();

  const items = wrap.querySelectorAll(".schedule-item");
  items.forEach(el => {
    const id = el.dataset.scheduleId;
    if(!id) return;
    const fr = first.get(id);
    if(!fr) return;
    const lr = el.getBoundingClientRect();
    const dx = fr.left - lr.left;
    const dy = fr.top - lr.top;
    if(Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    el.classList.add("is-flip");
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    // force reflow
    el.getBoundingClientRect();
    requestAnimationFrame(() => {
      el.style.transform = "";
    });
    el.addEventListener("transitionend", () => {
      el.classList.remove("is-flip");
    }, { once: true });
  });
}

/* ===== Schedule: swap pairs (superadmin) ===== */
function swapSchedulePairsById(entryId, dir){
  const e = SCHEDULE.find(x => Number(x.id) === Number(entryId));
  if(!e){ toast("Элемент не найден"); return; }
  const targetPair = Number(e.pair||0) + (dir === "up" ? -1 : 1);
  if(targetPair < 1){ toast("Это уже первая пара"); return; }

  const other = SCHEDULE.find(x =>
    x.groupId === e.groupId &&
    x.weekday === e.weekday &&
    Number(x.pair||0) === targetPair
  );
  if(!other){ toast("Нет пары для обмена"); return; }

  const tmp = e.pair;
  e.pair = other.pair;
  other.pair = tmp;

  saveStore("sa_schedule", SCHEDULE);
  renderScheduleAnimated();
  toast("Пары поменялись местами");
}

/* ===== Schedule: drag & drop reorder (superadmin) =====
   Хотим эффект «примагничивания»: берём элемент мышкой,
   тащим — остальные плавно разъезжаются/съезжаются.
   Реализация: сортировка DOM + FLIP-анимация, а на drop
   пересчитываем номера пар внутри одного дня и группы.
*/

let scheduleDragEl = null;
let scheduleDragKey = null;

function scheduleKeyFromEl(el){
  const gid = el?.dataset?.scheduleGroupId;
  const wd = el?.dataset?.scheduleWeekday;
  if(!gid || !wd) return null;
  return `${gid}|${wd}`;
}

function captureRects(container){
  const map = new Map();
  container.querySelectorAll('.schedule-item').forEach(el => {
    map.set(el, el.getBoundingClientRect());
  });
  return map;
}

function playFLIP(container, firstRects){
  container.querySelectorAll('.schedule-item').forEach(el => {
    const first = firstRects.get(el);
    if(!first) return;
    const last = el.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if(Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    el.classList.add('is-flip');
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.getBoundingClientRect();
    requestAnimationFrame(() => {
      el.style.transform = '';
    });
    el.addEventListener('transitionend', () => {
      el.classList.remove('is-flip');
    }, { once: true });
  });
}

function reorderSchedulePairsFromDOM(container, key){
  // key = "groupId|weekday"
  const [gidStr, weekday] = key.split('|');
  const gid = Number(gidStr);
  const items = [...container.querySelectorAll('.schedule-item')]
    .filter(el => scheduleKeyFromEl(el) === key);

  // В DOM-порядке назначаем пары 1..N
  items.forEach((el, idx) => {
    const id = Number(el.dataset.scheduleId || 0);
    const e = SCHEDULE.find(x => Number(x.id) === id);
    if(e){ e.pair = idx + 1; e.groupId = gid; e.weekday = weekday; }
  });

  saveStore('sa_schedule', SCHEDULE);
  renderScheduleAnimated();
  toast('Расписание обновлено');
}

/* ===== Motion-like (spring) reorder for schedule =====
   Идея как в react-motion draggable list: при перестановке элементов
   мы делаем FLIP, но проигрываем возврат к 0 через пружину (stiffness/damping),
   а не через обычный CSS transition.

   - Во время drag мы двигаем сам элемент через transform.
   - При изменении порядка (вставка в DOM) остальные получают инверсию (dy) и
     пружинно возвращаются к нулю.
*/

let schedPointer = {
  active: false,
  pointerId: null,
  el: null,
  key: null,
  startY: 0,
  lastY: 0,
  offsetY: 0,
  container: null
};

let motionRAF = 0;

function springStep(m, dt){
  // Простая пружина: x'' = -k(x-target) - c x'
  const k = 280;      // stiffness
  const c = 26;       // damping
  const ax = -k * (m.x - m.tx) - c * m.vx;
  const ay = -k * (m.y - m.ty) - c * m.vy;
  m.vx += ax * dt;
  m.vy += ay * dt;
  m.x += m.vx * dt;
  m.y += m.vy * dt;
}

function startMotionLoop(container){
  if(motionRAF) return;
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;

    let alive = false;
    container.querySelectorAll('.schedule-item').forEach(el => {
      const m = el._motion;
      if(!m) return;
      springStep(m, dt);
      const dx = m.x;
      const dy = m.y;
      el.style.transform = `translate(${dx}px, ${dy}px)`;

      const done = Math.abs(dx - m.tx) < 0.35 && Math.abs(dy - m.ty) < 0.35 &&
                   Math.abs(m.vx) < 0.35 && Math.abs(m.vy) < 0.35;
      if(done){
        el.style.transform = '';
        el._motion = null;
      }else{
        alive = true;
      }
    });

    if(alive){
      motionRAF = requestAnimationFrame(tick);
    }else{
      motionRAF = 0;
    }
  };
  motionRAF = requestAnimationFrame(tick);
}

function captureRectsById(container){
  const map = new Map();
  container.querySelectorAll('.schedule-item').forEach(el => {
    map.set(el, el.getBoundingClientRect());
  });
  return map;
}

function springFLIP(container, firstRects){
  container.querySelectorAll('.schedule-item').forEach(el => {
    const first = firstRects.get(el);
    if(!first) return;
    const last = el.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if(Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    // стартуем из инверсии -> цель 0
    el._motion = { x: dx, y: dy, vx: 0, vy: 0, tx: 0, ty: 0 };
  });
  startMotionLoop(container);
}

function schedulePickKey(el){
  const gid = el?.dataset?.scheduleGroupId;
  const wd = el?.dataset?.scheduleWeekday;
  if(!gid || !wd) return null;
  return `${gid}|${wd}`;
}

function initScheduleMotionSortable(){
  const wrap = $("saScheduleList");
  if(!wrap || wrap.dataset.motionBound === "1") return;
  wrap.dataset.motionBound = "1";

  wrap.addEventListener('pointerdown', (e) => {
    const item = e.target?.closest?.('.schedule-item');
    if(!item) return;
    // не начинаем drag, если клик по кнопкам
    if(e.target.closest('button, a, input, textarea, select')) return;

    const key = schedulePickKey(item);
    if(!key) return;

    schedPointer.active = true;
    schedPointer.pointerId = e.pointerId;
    schedPointer.el = item;
    schedPointer.key = key;
    schedPointer.container = wrap;
    schedPointer.startY = e.clientY;
    schedPointer.lastY = e.clientY;
    schedPointer.offsetY = 0;
    const rr = item.getBoundingClientRect();
    schedPointer.grabOffset = e.clientY - rr.top;

    item.classList.add('is-dragging');
    item.setPointerCapture?.(e.pointerId);

    e.preventDefault();
  });

  wrap.addEventListener('pointermove', (e) => {
    if(!schedPointer.active || e.pointerId !== schedPointer.pointerId) return;
    const item = schedPointer.el;
    const container = schedPointer.container;
    if(!item || !container) return;

    schedPointer.lastY = e.clientY;
    const dy = e.clientY - schedPointer.startY;
    schedPointer.offsetY = dy;

    // двигаем перетаскиваемый элемент
    item.style.transform = `translate(0px, ${dy}px)`;
    item.style.zIndex = '5';
    item.style.pointerEvents = 'none';

    // определяем "магнит" (куда вставлять)
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.schedule-item');
    if(!over || over === item) return;
    if(schedulePickKey(over) !== schedPointer.key) return;

    const first = captureRectsById(container);
    const r = over.getBoundingClientRect();
    const before = e.clientY < r.top + r.height / 2;

    if(before){
      if(over.previousSibling !== item) container.insertBefore(item, over);
    }else{
      const next = over.nextSibling;
      if(next !== item) container.insertBefore(item, next);
    }

    // проигрываем пружинный FLIP для остальных
    springFLIP(container, first);

    // сбросим базу, чтобы можно было тянуть через много элементов без "залипания"
    schedPointer.startY = e.clientY;
    schedPointer.offsetY = 0;
    item.style.transform = `translate(0px, 0px)`;
  });

  const finish = (e) => {
    if(!schedPointer.active || e.pointerId !== schedPointer.pointerId) return;
    const item = schedPointer.el;
    const container = schedPointer.container;
    const key = schedPointer.key;

    schedPointer.active = false;
    schedPointer.pointerId = null;
    schedPointer.el = null;
    schedPointer.key = null;
    schedPointer.container = null;

    if(item){
      item.classList.remove('is-dragging');
      item.style.zIndex = '';
      item.style.transform = '';
      item.style.pointerEvents = '';
    }

    if(container && key){
      reorderSchedulePairsFromDOM(container, key);
    }
  };

  wrap.addEventListener('pointerup', finish);
  wrap.addEventListener('pointercancel', finish);
}


function renderAllSuperadmin(){
  if(!$("saStudentsViewGroup")?.value) $("saStudentsViewGroup").value = "";
  if(!$("saScheduleGroup")?.value) $("saScheduleGroup").value = "";
  if(!$("saAssignGroup")?.value) $("saAssignGroup").value = String(GROUPS[0]?.id || 1);

  renderGroups();
  renderStudents();
  renderUsers();
  renderAssigns();
  renderSchedule();
}

// Actions
$("saAddGroup")?.addEventListener("click", () => {
  const name = ($("saGroupName")?.value || "").trim();
  if(!name){ toast("Введите название группы"); return; }
  if(GROUPS.some(g => g.name.toLowerCase() === name.toLowerCase())){
    toast("Такая группа уже есть");
    return;
  }
  const id = nextId(GROUPS);
  GROUPS.push({ id, name });
  saveStore("sa_groups", GROUPS);
  $("saGroupName").value = "";
  renderGroups();
  toast("Группа добавлена");
});

$("saGroupsList")?.addEventListener("click", (e) => {
  const id = e.target?.dataset?.delGroup;
  if(!id) return;
  const gid = Number(id);
  GROUPS = GROUPS.filter(g => g.id !== gid);
  STUDENTS = STUDENTS.filter(s => s.groupId !== gid);
  ASSIGNS = ASSIGNS.filter(a => a.groupId !== gid);
  SCHEDULE = SCHEDULE.filter(s => s.groupId !== gid);
  saveStore("sa_groups", GROUPS);
  saveStore("sa_students", STUDENTS);
  saveStore("sa_assigns", ASSIGNS);
  saveStore("sa_schedule", SCHEDULE);
  renderAllSuperadmin();
  toast("Группа удалена");
});

$("saAddStudent")?.addEventListener("click", () => {
  const name = ($("saStudentName")?.value || "").trim();
  const gid = Number($("saStudentGroup")?.value || 0);
  if(!name){ toast("Введите ФИО"); return; }
  if(!gid){ toast("Выберите группу"); return; }
  STUDENTS.push({ id: nextId(STUDENTS), name, groupId: gid });
  saveStore("sa_students", STUDENTS);
  $("saStudentName").value = "";
  renderStudents();
  toast("Студент добавлен");
});

$("saStudentsViewGroup")?.addEventListener("change", renderStudents);
$("saDeleteStudent")?.addEventListener("click", () => {
  const pick = document.querySelector('input[name="studentPick"]:checked');
  if(!pick){ toast("Выберите студента"); return; }
  const sid = Number(pick.value);
  STUDENTS = STUDENTS.filter(s => s.id !== sid);
  saveStore("sa_students", STUDENTS);
  renderStudents();
  toast("Удалено");
});

$("saSeedSchedule")?.addEventListener("click", () => {
  const gid = Number($("saScheduleGroup")?.value || 0) || (GROUPS[0]?.id || 1);
  const weekdays = ["Понедельник","Вторник","Среда","Четверг","Пятница"];
  const subjects = ["Математика", "Программирование", "Алгебра", "Базы данных", "Английский", "Физика"];
  let id = nextId(SCHEDULE);
  for(const wd of weekdays){
    for(let p=1;p<=4;p++){
      const subj = subjects[(id + p) % subjects.length];
      SCHEDULE.push({ id: id++, groupId: gid, weekday: wd, pair: p, subject: subj });
    }
  }
  saveStore("sa_schedule", SCHEDULE);
  renderSchedule();
  toast("Демо-расписание создано");
});

$("saScheduleDays")?.addEventListener("click", (e) => {
  const btn = e.target?.closest?.(".day-chip");
  if(!btn) return;
  SA_SCHEDULE_DAY = btn.dataset.day || "Понедельник";
  // active style
  $("saScheduleDays").querySelectorAll(".day-chip").forEach(b => b.classList.toggle("is-active", b === btn));
  renderSchedule();
});

$("saScheduleGroup")?.addEventListener("change", renderSchedule);

$("saScheduleList")?.addEventListener("click", (e) => {
  const upId = e.target?.dataset?.moveUp;
  const downId = e.target?.dataset?.moveDown;
  if(upId){ swapSchedulePairsById(upId, "up"); return; }
  if(downId){ swapSchedulePairsById(downId, "down"); return; }

  const id = e.target?.dataset?.delSchedule;
  if(!id) return;
  const sid = Number(id);
  SCHEDULE = SCHEDULE.filter(s => s.id !== sid);
  saveStore("sa_schedule", SCHEDULE);
  renderSchedule();
  toast("Удалено");
});

// Drag & drop reorder (магнит + плавные съезды)
$("saScheduleList")?.addEventListener("dragstart", (e) => {
  const item = e.target?.closest?.(".schedule-item");
  if(!item) return;
  scheduleDragEl = item;
  scheduleDragKey = scheduleKeyFromEl(item);
  item.classList.add("is-dragging");
  try{
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.dataset.scheduleId || "");
  }catch{}
});

$("saScheduleList")?.addEventListener("dragend", (e) => {
  const wrap = $("saScheduleList");
  if(scheduleDragEl) scheduleDragEl.classList.remove("is-dragging");
  wrap?.querySelectorAll?.(".schedule-item.is-drop-target")?.forEach?.(x => x.classList.remove("is-drop-target"));
  scheduleDragEl = null;
  scheduleDragKey = null;
});

$("saScheduleList")?.addEventListener("dragover", (e) => {
  const wrap = $("saScheduleList");
  if(!wrap || !scheduleDragEl || !scheduleDragKey) return;

  const over = e.target?.closest?.(".schedule-item");
  if(!over || over === scheduleDragEl) return;
  if(scheduleKeyFromEl(over) !== scheduleDragKey) return; // только внутри дня+группы

  e.preventDefault();
  try{ e.dataTransfer.dropEffect = "move"; }catch{}

  // «магнит»: вставляем до/после по положению мыши
  const first = captureRects(wrap);
  const r = over.getBoundingClientRect();
  const before = e.clientY < r.top + r.height / 2;
  wrap.querySelectorAll(".schedule-item.is-drop-target").forEach(x => x.classList.remove("is-drop-target"));
  over.classList.add("is-drop-target");

  if(before){
    if(over.previousSibling !== scheduleDragEl) wrap.insertBefore(scheduleDragEl, over);
  }else{
    const next = over.nextSibling;
    if(next !== scheduleDragEl) wrap.insertBefore(scheduleDragEl, next);
  }
  playFLIP(wrap, first);
});

$("saScheduleList")?.addEventListener("drop", (e) => {
  const wrap = $("saScheduleList");
  if(!wrap || !scheduleDragEl || !scheduleDragKey) return;
  e.preventDefault();
  wrap.querySelectorAll(".schedule-item.is-drop-target").forEach(x => x.classList.remove("is-drop-target"));
  reorderSchedulePairsFromDOM(wrap, scheduleDragKey);
});


$("saAssign")?.addEventListener("click", () => {
  const u = $("saAssignUser")?.value;
  const gid = Number($("saAssignGroup")?.value || 0);
  if(!u || !gid){ toast("Выберите пользователя и группу"); return; }
  if(ASSIGNS.some(a => a.username === u && a.groupId === gid)){
    toast("Уже назначено");
    return;
  }
  ASSIGNS.push({ username: u, groupId: gid });
  saveStore("sa_assigns", ASSIGNS);
  renderAssigns();
  toast("Назначено");
});
$("saAssignList")?.addEventListener("click", (e) => {
  const key = e.target?.dataset?.delAssign;
  if(!key) return;
  const [u, gid] = key.split(":");
  ASSIGNS = ASSIGNS.filter(a => !(a.username === u && String(a.groupId) === gid));
  saveStore("sa_assigns", ASSIGNS);
  renderAssigns();
  toast("Удалено");
});

$("saAddUser")?.addEventListener("click", () => {
  const username = ($("saUserName")?.value || "").trim();
  const password = ($("saUserPass")?.value || "").trim();
  const role = $("saUserRole")?.value;
  if(!username || !password){ toast("Введите имя и пароль"); return; }
  if(USERS.some(u => u.username.toLowerCase() === username.toLowerCase())){
    toast("Пользователь уже существует");
    return;
  }
  USERS.push({ username, password, role });
  saveStore("sa_users", USERS);
  $("saUserName").value = "";
  $("saUserPass").value = "";
  renderUsers();
  toast("Пользователь добавлен");
});

$("saUsersList")?.addEventListener("click", (e) => {
  const u = e.target?.dataset?.delUser;
  if(!u) return;
  if(u === "supadmin"){ toast("Нельзя удалить supadmin в демо"); return; }
  USERS = USERS.filter(x => x.username !== u);
  ASSIGNS = ASSIGNS.filter(a => a.username !== u);
  saveStore("sa_users", USERS);
  saveStore("sa_assigns", ASSIGNS);
  renderUsers();
  renderAssigns();
  toast("Пользователь удалён");
});



/* ===== Support page (role support) ===== */
const SUPPORT_STORE_KEY = "starstat_support_tickets_v1";
let supportTickets = loadStore(SUPPORT_STORE_KEY, []);
let supportActiveId = Number(localStorage.getItem("starstat_support_active") || 0) || 0;

function saveSupport(){
  saveStore(SUPPORT_STORE_KEY, supportTickets);
}

function seedSupportTicketsIfEmpty(){
  supportTickets = loadStore(SUPPORT_STORE_KEY, []);
  if(Array.isArray(supportTickets) && supportTickets.length) return;

  const now = Date.now();
  const daysBack = (n) => new Date(now - n*86400000).toISOString().slice(0,10);

  const names = [
    "Иванов Иван Иванович",
    "Петрова Анна Сергеевна",
    "Смирнов Никита Олегович",
    "Голицын Тимофей Дмитриевич",
    "Соколова Мария Андреевна",
    "Ким Александр Петрович",
    "Назаров Даниил Сергеевич",
    "Кузнецова Мария Андреевна",
    "Аббосов Таигир Сеймурович",
    "Тарасов Артём Ильич",
    "Морозова Ксения Максимовна",
    "Ершов Павел Денисович",
  ];

  const topics = [
    "Не открывается график посещаемости",
    "Не могу войти в аккаунт",
    "Пропали данные по расписанию",
    "Ошибка при смене темы",
    "Проблема с загрузкой справки",
    "Кнопки статусов не реагируют",
    "Нужно изменить группу",
    "Не отображается таблица по датам",
    "Некорректные данные в статистике",
    "Сбой при сохранении отметки",
  ];

  const makeThread = (seed, subject) => {
    const body = `Здравствуйте! ${subject}.
\nОпишите, пожалуйста, как исправить? Проблема повторяется стабильно, пробовал обновить страницу и зайти заново.\n\nСпасибо!`;
    return [
      { who: "student", text: body, ts: now - (seed+5)*360000 },
      { who: "support", text: "Принял. Уточните, пожалуйста: какая группа, дата и где именно это видно (страница/вкладка)?", ts: now - (seed+4)*360000 },
      { who: "student", text: "Группа ЗПИБД-01-24. Проявляется сразу после входа. Если нужно — могу прислать скрин.", ts: now - (seed+3)*360000 },
    ];
  };

  const tickets = [];
  let id = 1;
  const groupIds = GROUPS.map(g => g.id);
  const fallbackGroup = GROUPS[0]?.id || 1;

  for(let i=0;i<14;i++){
    const gid = groupIds[i % Math.max(1, groupIds.length)] || fallbackGroup;
    const dateISO = daysBack(14 - i);
    const studentName = names[i % names.length];
    const subject = topics[i % topics.length];

    const body = `Здравствуйте! ${subject}.
\nПожалуйста, подскажите, как исправить. Ошибка воспроизводится после входа / при обновлении страницы.`;

    tickets.push({
      id: id++,
      groupId: gid,
      date: dateISO,
      studentName,
      subject,
      body,
      status: (i % 5 === 0) ? "closed" : "open",
      messages: makeThread(i, subject)
    });
  }

  supportTickets = tickets;
  saveSupport();
}

function ensureSupportReady(){
  loadGroupsToSelect("supportGroup", true);

  const df = $("supportDateFrom");
  const dt = $("supportDateTo");

  const today = new Date();
  const toISO = today.toISOString().slice(0,10);
  const from = new Date();
  from.setDate(today.getDate() - 14);
  const fromISO = from.toISOString().slice(0,10);

  if(df) df.value = localStorage.getItem("starstat_support_from") || fromISO;
  if(dt) dt.value = localStorage.getItem("starstat_support_to") || toISO;

  df?.addEventListener("change", () => localStorage.setItem("starstat_support_from", df.value));
  dt?.addEventListener("change", () => localStorage.setItem("starstat_support_to", dt.value));

  autoGrowTextarea($("supportReply"));
}



function renderSupportList(){
  const wrap = $("supportTicketsList");
  if(!wrap) return;

  const q = String($("supportSearch")?.value || "").trim().toLowerCase();
  const gid = Number($("supportGroup")?.value || 0);
  const fromISO = $("supportDateFrom")?.value || "";
  const toISO = $("supportDateTo")?.value || "";

  const list = (supportTickets || [])
    .filter(t => {
      const matchGroup = !gid || Number(t.groupId) === gid;
      const matchQ = !q || (
        String(t.studentName||"").toLowerCase().includes(q) ||
        String(t.subject||"").toLowerCase().includes(q)
      );
      const matchDate = (!fromISO && !toISO) ? true : (String(t.date||"" ) >= (fromISO||"0000-00-00") && String(t.date||"" ) <= (toISO||"9999-99-99"));
      return matchGroup && matchQ && matchDate;
    })
    .sort((a,b) => String(b.date||"").localeCompare(String(a.date||"")) || Number(b.id||0) - Number(a.id||0));

  wrap.innerHTML = "";

  if(!list.length){
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Нет обращений по выбранным фильтрам.";
    wrap.appendChild(empty);
    return;
  }

  for(const t of list){
    const g = GROUPS.find(x => x.id === Number(t.groupId));
    const item = document.createElement("div");
    item.className = "support-item" + (Number(t.id) === Number(supportActiveId) ? " is-active" : "");
    const badge = (t.status === "closed") ? "закрыто" : (t.status === "inwork" ? "в работе" : "открыто");
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
        <div style="min-width:0;">
          <div style="font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(t.subject||"Обращение")}</div>
          <div class="muted" style="margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(t.studentName||"—")} · ${escapeHtml(g ? g.name : "—")} · ${escapeHtml(t.date||"—")}</div>
        </div>
        <span class="badge">${badge}</span>
      </div>
    `;
    item.dataset.supportPick = String(t.id);
    // на всякий случай вешаем прямой обработчик (иногда делегирование ломается из-за вложенных элементов)
    item.addEventListener("click", () => pickSupportTicket(t.id));
    wrap.appendChild(item);
  }
}

function renderSupportThread(){
  const title = $("supportTicketTitle");
  const meta = $("supportTicketMeta");
  const thread = $("supportThread");
  const closeBtn = $("supportCloseTicket");
  const sendBtn = $("supportSend");
  const replyBox = $("supportReply");
  if(!thread) return;

  const t = (supportTickets || []).find(x => Number(x.id) === Number(supportActiveId));
  if(!t){
    if(title) title.textContent = "Выберите обращение";
    if(meta) meta.textContent = "—";
    thread.innerHTML = "";
    if(closeBtn) closeBtn.disabled = true;
    if(sendBtn) sendBtn.disabled = true;
    if(replyBox){ replyBox.disabled = true; replyBox.placeholder = "Выберите обращение слева..."; }
    return;
  }

  if(closeBtn) closeBtn.disabled = (t.status === "closed");
  if(sendBtn) sendBtn.disabled = (t.status === "closed");
  if(replyBox){
    replyBox.disabled = (t.status === "closed");
    replyBox.placeholder = (t.status === "closed") ? "Обращение закрыто" : "Напишите ответ...";
  }

  const g = GROUPS.find(x => x.id === Number(t.groupId));
  if(title) title.textContent = t.subject || "Обращение";
  if(meta) meta.textContent = `${t.studentName || "—"} · ${g ? g.name : "—"} · ${t.date || "—"}`;

  thread.innerHTML = "";

  // Полный текст обращения: стараемся показать как отдельный блок сверху
  // (если body не задан — берём первое сообщение студента)
  const msgs = Array.isArray(t.messages) ? t.messages : [];
  const derivedBody = String(t.body || "" ).trim() || String((msgs.find(m => m?.who === "student")?.text) || "").trim();
  if(derivedBody){
    const row = document.createElement("div");
    row.className = "support-msg";
    row.innerHTML = `
      <div class="bubble">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:6px;">
          <span class="badge">обращение</span>
          <span class="muted" style="font-size:12px;">${escapeHtml(t.date||"")}</span>
        </div>
        <div style="white-space:pre-wrap;">${escapeHtml(derivedBody)}</div>
      </div>
    `;
    thread.appendChild(row);
  }

  // Чат/переписка
  for(const m of msgs){
    const who = String(m.who||"");
    const isYou = who === "support";
    const isSystem = who === "system";
    const row = document.createElement("div");
    row.className = "support-msg" + (isYou ? " you" : "") + (isSystem ? " system" : "");
    const stamp = new Date(Number(m.ts||Date.now())).toLocaleString();
    row.innerHTML = `
      <div class="bubble">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:6px;">
          <span class="badge">${isSystem ? "система" : (isYou ? "support" : "student")}</span>
          <span class="muted" style="font-size:12px;">${escapeHtml(stamp)}</span>
        </div>
        <div style="white-space:pre-wrap;">${escapeHtml(m.text||"")}</div>
      </div>
    `;
    thread.appendChild(row);
  }

  thread.scrollTop = thread.scrollHeight;
}

function pickSupportTicket(id){
  supportActiveId = Number(id) || 0;
  localStorage.setItem("starstat_support_active", String(supportActiveId||0));

  // При открытии переводим статус в "в работе" (если было "открыто")
  const t = (supportTickets || []).find(x => Number(x.id) === Number(supportActiveId));
  if(t && t.status === "open"){
    t.status = "inwork";
    saveSupport();
  }

  renderSupportList();
  renderSupportThread();
}

function refreshSupport(){
  // ensure in-memory sync
  supportTickets = loadStore(SUPPORT_STORE_KEY, supportTickets || []);
  renderSupportList();
  renderSupportThread();
}

function sendSupportReply(){
  const t = (supportTickets || []).find(x => Number(x.id) === Number(supportActiveId));
  if(!t){ toast("Выберите обращение"); return; }

  // Если тикет был "открыт" — после ответа тоже переводим в "в работе"
  if(t.status === "open"){
    t.status = "inwork";
  }

  const box = $("supportReply");
  const text = String(box?.value || "").trim();
  if(!text) return;

  t.messages = Array.isArray(t.messages) ? t.messages : [];
  t.messages.push({ who: "support", text, ts: Date.now() });
  saveSupport();

  if(box) box.value = "";
  autoGrowTextarea(box);

  renderSupportThread();
  toast("Отправлено");
}

function closeSupportTicket(){
  const t = (supportTickets || []).find(x => Number(x.id) === Number(supportActiveId));
  if(!t){ toast("Выберите обращение"); return; }
  if(t.status === "closed"){ toast("Обращение уже закрыто"); return; }
  t.status = "closed";
  t.messages = Array.isArray(t.messages) ? t.messages : [];
  t.messages.push({ who: "system", text: "Обращение закрыто (выполнено)", ts: Date.now() });
  saveSupport();
  renderSupportList();
  renderSupportThread();
  toast("Обращение закрыто");
}

/* Support chat (offline demo) */
const chatFab = $("chatFab");
const supportChat = $("supportChat");
const chatClose = $("chatClose");
const chatBody = $("chatBody");
const chatInput = $("chatInput");
const chatSend = $("chatSend");

function openChat(){
  supportChat?.classList.remove("hidden");
  document.body.classList.add("chat-open");
  requestAnimationFrame(() => supportChat?.classList.add("is-open"));
  chatInput?.focus();
}
function closeChat(){
  supportChat?.classList.remove("is-open");
  setTimeout(() => supportChat?.classList.add("hidden"), 220);
  document.body.classList.remove("chat-open");
}
function addMsg(text, who="user"){
  const row = document.createElement("div");
  row.className = `msg msg-${who}`;
  row.innerHTML = `<div class="bubble"></div>`;
  row.querySelector(".bubble").textContent = text;
  chatBody?.appendChild(row);
  if(chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

chatFab?.addEventListener("click", (e) => {
  e.stopPropagation();
  if(supportChat?.classList.contains("hidden")) openChat();
  else closeChat();
});
chatClose?.addEventListener("click", closeChat);

supportChat?.addEventListener("click", (e) => {
  if(e.target === supportChat) closeChat();
});
supportChat?.querySelector(".support-card")?.addEventListener("click", (e) => e.stopPropagation());

function sendChat(){
  const t = (chatInput?.value || "").trim();
  if(!t) return;
  addMsg(t, "user");
  if(chatInput) chatInput.value = "";
  setTimeout(() => addMsg("Принял! (демо) — тут будет ответ поддержки 🙂", "bot"), 400);
}
chatSend?.addEventListener("click", sendChat);
chatInput?.addEventListener("keydown", (e) => {
  if(e.key === "Enter") sendChat();
});

/* Wire (main) */
$("btn-enter")?.addEventListener("click", openLogin);
$("btn-login-submit")?.addEventListener("click", async () => {
  const u = $("loginUsername")?.value?.trim?.() || "";
  const p = $("loginPassword")?.value || "";
  try{
    await doLogin(u, p);
  }catch(e){
    $("loginError") && ($("loginError").textContent = String(e.message || e));
  }
});
$("btn-refresh")?.addEventListener("click", refreshAll);
$("btn-logout")?.addEventListener("click", logout);

$("btn-settings")?.addEventListener("click", () => {
  if(state.role === "superadmin") openSuperadmin();
  else openProfile();
});

// Landing settings (theme only)
function openLandingSettings(){
  const m = $("landingSettingsModal");
  if(!m) return;
  m.classList.remove("hidden");
  m.setAttribute("aria-hidden","false");
}
function closeLandingSettings(){
  const m = $("landingSettingsModal");
  if(!m) return;
  m.classList.add("hidden");
  m.setAttribute("aria-hidden","true");
}

$("btn-landing-settings")?.addEventListener("click", (e) => {
  e.preventDefault();
  openLandingSettings();
});
document.querySelectorAll('[data-close-landing-settings="1"]').forEach(el => {
  el.addEventListener('click', closeLandingSettings);
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') closeLandingSettings();
});

// Theme toggle
try{
  $("themeDark")?.addEventListener("click", () => applyTheme("dark"));
  $("themeLight")?.addEventListener("click", () => applyTheme("light"));
  $("themeDarkSa")?.addEventListener("click", () => applyTheme("dark"));
  $("themeLightSa")?.addEventListener("click", () => applyTheme("light"));
  $("themeDarkLanding")?.addEventListener("click", () => applyTheme("dark"));
  $("themeLightLanding")?.addEventListener("click", () => applyTheme("light"));
}catch{}

// Student controls
$("btn-student-refresh")?.addEventListener("click", refreshStudent);
$("studExpandBtn")?.addEventListener("click", openStudentFull);
$("studCloseFullBtn")?.addEventListener("click", closeStudentFull);
$("fullOverlay")?.addEventListener("click", closeStudentFull);

// Support/Starosta controls вешаются внутри ensureSupportScreen()/bindSupportUI()
// и ensureStarostaScreen()/bindStarostaUI() (экраны создаются динамически).

/* Init */
(function init(){
  ensureStarostaScreen();
  ensureFooter();
  ensureTopbarStarostaNav();
  ensureSupportScreen();
  ensureTopbarSupportNav();
  ensureDashboardSubjectFilter();
  ensureStudentSubjectFilter();

  applyTheme(state.theme || "dark");
  setDefaultDates();
  setDefaultStudentDates();

  loadGroupsToSelect("groupSelect", false);
  loadSubjectsToSelect("subjectSelect");
  loadSubjectsToSelect("studentSubjectSelect");
  loadSubjectsToSelect("starostaSubjectSelect");

  if(state.token){
    setRoleHint();
    updateNavByRole();
    updateFooterByRole();

    if(state.role === "student"){
      ensureStudentReady();
      showStudent();
      refreshStudent();
    }else if(state.role === "starosta"){
      loadGroupsToSelect("starostaGroupSelect", false);
      loadSubjectsToSelect("starostaSubjectSelect");

      const savedDate = localStorage.getItem("starstat_starosta_date");
      const today = new Date().toISOString().slice(0,10);
      $("starostaDate").value = savedDate || today;

      showStarosta();
      renderStarostaList("");
      pickStarostaStudent(null);
    }else if(state.role === "support"){
      seedSupportTicketsIfEmpty();
      ensureSupportReady();
      showSupport();
      refreshSupport();
    }else{

      showDashboard();
      loadGroups();
      refreshAll();
    }
  }else{
    updateNavByRole();
    updateFooterByRole();
    showLanding();
  }
})();
