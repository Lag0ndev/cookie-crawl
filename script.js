const STORAGE_KEY = "coc_builder_v2";
const DEFAULTS = {
  layout: "topbar", contentWidth: 1080, pagePadding: 32,
  fontFamily: "Inter", fontSize: 15, headingSize: 28, fontWeight: 400,
  colorPrimary: "#7c3aed", colorAccent: "#ec4899", colorBg: "#f8fafc",
  colorCard: "#ffffff", colorText: "#0f172a", colorMuted: "#64748b", colorNav: "#1e1b4b",
  radius: 16, cardPadding: 20, cardGap: 16, borderWidth: 1, shadow: 12,
  btnSize: 12, btnRadius: 10, btnFont: 14,
  animOn: true, animSpeed: 100, hoverLift: 3, pageTrans: true,
  topbarH: 60, sidebarW: 220, showBrand: true, brandName: "Contest of Candy",
  pages: [{ id: "settings", name: "Settings", icon: "settings", locked: true, blocks: [] }],
};

const BLOCK_TYPES = [
  { type: "heading", label: "Heading", icon: "edit" },
  { type: "text", label: "Text", icon: "edit" },
  { type: "button", label: "Button", icon: "zap" },
  { type: "box", label: "Box", icon: "grid" },
  { type: "idle", label: "Idle timer", icon: "clock" },
  { type: "clicker", label: "Clicker", icon: "target" },
  { type: "counter", label: "Counter", icon: "plus" },
  { type: "progress", label: "Progress", icon: "chart" },
  { type: "surprise", label: "Surprise", icon: "sparkles" },
  { type: "image", label: "Image", icon: "image" },
  { type: "divider", label: "Divider", icon: "minus" },
];

let settings = loadSettings();
let currentPage = "settings";
let editMode = false;
let iconPickTarget = null;
let addTargetPage = null;
let runtime = {}; // block runtime state: counts, timers, progress

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { ...DEFAULTS, ...p, pages: p.pages || DEFAULTS.pages };
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULTS));
}
function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
}
function uid() { return "id_" + Math.random().toString(36).slice(2, 10); }
function escapeHtml(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove("show"), 2200);
}

function applyTheme() {
  const s = settings, r = document.documentElement;
  const map = {
    "--color-primary": s.colorPrimary, "--color-accent": s.colorAccent, "--color-bg": s.colorBg,
    "--color-card": s.colorCard, "--color-text": s.colorText, "--color-muted": s.colorMuted,
    "--color-nav": s.colorNav, "--font-family": s.fontFamily + ", system-ui, sans-serif",
    "--font-size": s.fontSize + "px", "--heading-size": s.headingSize + "px",
    "--font-weight": String(s.fontWeight), "--radius": s.radius + "px",
    "--card-padding": s.cardPadding + "px", "--card-gap": s.cardGap + "px",
    "--border-width": s.borderWidth + "px", "--shadow": s.shadow + "px",
    "--btn-pad": s.btnSize + "px", "--btn-radius": s.btnRadius + "px", "--btn-font": s.btnFont + "px",
    "--content-width": s.contentWidth + "px", "--page-padding": s.pagePadding + "px",
    "--topbar-h": s.topbarH + "px", "--sidebar-w": s.sidebarW + "px",
    "--hover-lift": s.hoverLift + "px", "--anim-speed": String((s.animSpeed || 100) / 100),
  };
  Object.entries(map).forEach(([k, v]) => r.style.setProperty(k, v));
  document.body.dataset.layout = s.layout;
  document.body.dataset.anim = s.animOn ? "on" : "off";
  document.body.dataset.pageTrans = s.pageTrans ? "on" : "off";
  document.body.dataset.showBrand = s.showBrand ? "on" : "off";
  document.body.classList.toggle("editing", editMode && currentPage !== "settings");
  const logo = document.getElementById("logo-text");
  if (logo) logo.textContent = s.brandName || "Contest of Candy";
  const sb = document.getElementById("sidebar-brand");
  if (sb) sb.textContent = (s.brandName || "COC").split(" ").map(w => w[0]).join("").slice(0, 4).toUpperCase() || "COC";
}

function applySetting(key, value) {
  const nums = ["contentWidth","pagePadding","fontSize","headingSize","fontWeight","radius","cardPadding","cardGap","borderWidth","shadow","btnSize","btnRadius","btnFont","animSpeed","hoverLift","topbarH","sidebarW"];
  const bools = ["animOn","pageTrans","showBrand"];
  if (nums.includes(key)) settings[key] = Number(value);
  else if (bools.includes(key)) settings[key] = !!value;
  else settings[key] = value;
  saveSettings(); applyTheme();
  if (currentPage === "settings") renderMain();
}
function setLayout(mode) { settings.layout = mode; saveSettings(); applyTheme(); renderNav(); if (currentPage === "settings") renderMain(); }
function resetAll() {
  if (!confirm("Reset everything?")) return;
  settings = JSON.parse(JSON.stringify(DEFAULTS));
  runtime = {}; editMode = false;
  saveSettings(); applyTheme(); renderNav(); showPage("settings"); toast("Reset");
}

function renderNav() {
  const side = document.getElementById("sidebar-nav");
  const top = document.getElementById("top-nav");
  const pages = settings.pages || [];
  const mk = (p, sideMode) => `
    <button type="button" class="${sideMode ? "side-link" : "nav-link"} ${p.id === currentPage ? "active" : ""}"
      data-page="${p.id}" onclick="showPage('${p.id}')">
      ${iconSvg(p.icon || "star", sideMode ? 18 : 16)}
      ${sideMode ? escapeHtml(p.name) : `<span>${escapeHtml(p.name)}</span>`}
    </button>`;
  if (side) side.innerHTML = pages.map(p => mk(p, true)).join("");
  if (top) top.innerHTML = pages.map(p => mk(p, false)).join("");
}

function addPage() {
  const id = uid();
  settings.pages.push({
    id, name: "New Page", icon: "star", locked: false,
    blocks: [
      { id: uid(), type: "heading", text: "New Page" },
      { id: uid(), type: "text", text: "Turn on Edit and click anything to change it. Use + to add blocks." },
    ],
  });
  saveSettings(); renderNav(); showPage(id); editMode = true; applyTheme(); renderMain();
  toast("Page created — Edit mode on");
}
function removePage(pageId) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p || p.locked) return toast("Can't remove Settings");
  if (!confirm(`Delete "${p.name}"?`)) return;
  settings.pages = settings.pages.filter(x => x.id !== pageId);
  saveSettings();
  if (currentPage === pageId) showPage("settings");
  else { renderNav(); renderMain(); }
}
function renamePage(pageId, name) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p) return;
  p.name = (name || "Page").slice(0, 32);
  saveSettings(); renderNav();
}
function setPageIcon(pageId, icon) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p) return;
  p.icon = icon; saveSettings(); renderNav(); if (currentPage === "settings") renderMain();
}

function addBlock(pageId, type, index) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p) return;
  p.blocks = p.blocks || [];
  const block = { id: uid(), type };
  if (type === "heading") block.text = "Heading";
  if (type === "text") block.text = "Click to edit this text.";
  if (type === "button") { block.text = "Click me"; block.style = "primary"; }
  if (type === "box") block.text = "A content box — edit me.";
  if (type === "idle") { block.text = "Idle job"; block.seconds = 15; }
  if (type === "clicker") { block.text = "Tap the orb"; block.score = 0; }
  if (type === "counter") { block.text = "Score"; block.value = 0; }
  if (type === "progress") { block.text = "Progress"; block.value = 0; block.max = 100; }
  if (type === "surprise") block.text = "Tap reveal for a surprise";
  if (type === "image") block.text = "Image placeholder";
  if (typeof index === "number" && index >= 0) p.blocks.splice(index, 0, block);
  else p.blocks.push(block);
  saveSettings(); renderMain(); toast("Added " + type);
}
function updateBlockText(pageId, blockId, text) {
  const p = settings.pages.find(x => x.id === pageId);
  const b = p?.blocks?.find(x => x.id === blockId);
  if (!b) return;
  b.text = text; saveSettings();
}
function removeBlock(pageId, blockId) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p) return;
  p.blocks = (p.blocks || []).filter(x => x.id !== blockId);
  saveSettings(); renderMain();
}
function moveBlock(pageId, blockId, dir) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p?.blocks) return;
  const i = p.blocks.findIndex(x => x.id === blockId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= p.blocks.length) return;
  [p.blocks[i], p.blocks[j]] = [p.blocks[j], p.blocks[i]];
  saveSettings(); renderMain();
}

/* Runtime game bits */
function formatSec(s) {
  s = Math.max(0, s|0);
  return Math.floor(s/60) + ":" + String(s%60).padStart(2,"0");
}
function startIdle(pageId, blockId, seconds) {
  const key = blockId;
  if (runtime[key]?.timer) return;
  let left = seconds || 15;
  const el = document.getElementById("idle-" + blockId);
  const btn = document.getElementById("idle-btn-" + blockId);
  if (btn) btn.disabled = true;
  runtime[key] = runtime[key] || {};
  function tick() {
    if (el) el.textContent = formatSec(left);
    if (left <= 0) {
      clearInterval(runtime[key].timer);
      runtime[key].timer = null;
      if (el) el.textContent = "Done!";
      if (btn) { btn.disabled = false; btn.textContent = "Start again"; }
      toast("Idle complete");
      return;
    }
    left--;
  }
  tick();
  runtime[key].timer = setInterval(tick, 1000);
}
function clickerHit(pageId, blockId) {
  const p = settings.pages.find(x => x.id === pageId);
  const b = p?.blocks?.find(x => x.id === blockId);
  if (!b) return;
  b.score = (b.score || 0) + 1;
  saveSettings();
  const el = document.getElementById("click-score-" + blockId);
  if (el) el.textContent = b.score;
}
function counterAdd(pageId, blockId, delta) {
  const p = settings.pages.find(x => x.id === pageId);
  const b = p?.blocks?.find(x => x.id === blockId);
  if (!b) return;
  b.value = (b.value || 0) + delta;
  saveSettings();
  const el = document.getElementById("counter-" + blockId);
  if (el) el.textContent = b.value;
}
function progressAdd(pageId, blockId, delta) {
  const p = settings.pages.find(x => x.id === pageId);
  const b = p?.blocks?.find(x => x.id === blockId);
  if (!b) return;
  const max = b.max || 100;
  b.value = Math.min(max, Math.max(0, (b.value || 0) + delta));
  saveSettings();
  const fill = document.getElementById("prog-" + blockId);
  const lab = document.getElementById("prog-lab-" + blockId);
  if (fill) fill.style.width = ((b.value / max) * 100) + "%";
  if (lab) lab.textContent = b.value + " / " + max;
  if (b.value >= max) toast("Progress complete!");
}
function triggerSurprise(blockId) {
  const msgs = [
    "A rare candy appears!", "Golden wrapper found!", "Double points aura (placeholder)",
    "Nothing... or everything?", "Contest of Candy approves.", "Mystery merchant waves.",
  ];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  const el = document.getElementById("surprise-" + blockId);
  if (el) el.textContent = msg;
  toast(msg);
}

function toggleEdit() {
  if (currentPage === "settings") return;
  editMode = !editMode;
  applyTheme();
  renderMain();
  toast(editMode ? "Edit mode on — click text or +" : "Edit mode off");
}

/* Modals */
function openIconPicker(target) {
  iconPickTarget = target;
  document.getElementById("icon-modal").classList.add("open");
  document.getElementById("icon-search").value = "";
  renderIconGrid("");
}
function closeIconModal(e) {
  if (e && e.target !== document.getElementById("icon-modal") && e.type === "click") return;
  document.getElementById("icon-modal").classList.remove("open");
  iconPickTarget = null;
}
function filterIcons(q) { renderIconGrid(q || ""); }
function renderIconGrid(q) {
  const grid = document.getElementById("icon-grid");
  const names = ICON_NAMES.filter(n => !q || n.includes(q.toLowerCase()));
  grid.innerHTML = names.map(n => `
    <button type="button" class="icon-pick" title="${n}" onclick="pickIcon('${n}')">${iconSvg(n, 20)}</button>`).join("");
}
function pickIcon(name) {
  if (iconPickTarget?.type === "page") setPageIcon(iconPickTarget.pageId, name);
  closeIconModal(); toast("Icon: " + name);
}

function openAddModal(pageId) {
  addTargetPage = pageId;
  const grid = document.getElementById("add-grid");
  grid.innerHTML = BLOCK_TYPES.map(t => `
    <button type="button" class="add-pick" onclick="pickAddType('${t.type}')">
      ${iconSvg(t.icon, 22)}
      <span>${t.label}</span>
    </button>`).join("");
  document.getElementById("add-modal").classList.add("open");
}
function closeAddModal(e) {
  if (e && e.target !== document.getElementById("add-modal") && e.type === "click") return;
  document.getElementById("add-modal").classList.remove("open");
  addTargetPage = null;
}
function pickAddType(type) {
  if (!addTargetPage) return;
  addBlock(addTargetPage, type);
  closeAddModal();
}

function exportConfig() {
  const json = JSON.stringify(settings, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "coc-config.json"; a.click();
  URL.revokeObjectURL(a.href);
  const ta = document.getElementById("export-area");
  if (ta) ta.value = json;
  toast("Downloaded — send JSON to set as default");
}
function importConfig() {
  const ta = document.getElementById("export-area");
  if (!ta?.value.trim()) return toast("Paste JSON first");
  try {
    const parsed = JSON.parse(ta.value);
    settings = { ...DEFAULTS, ...parsed, pages: parsed.pages || DEFAULTS.pages };
    saveSettings(); applyTheme(); renderNav(); showPage("settings"); toast("Imported");
  } catch { toast("Invalid JSON"); }
}
function copyConfig() {
  const json = JSON.stringify(settings, null, 2);
  const ta = document.getElementById("export-area");
  if (ta) ta.value = json;
  navigator.clipboard?.writeText(json).then(() => toast("Copied")).catch(() => toast("Copy failed"));
}

function showPage(pageId) {
  if (!settings.pages.find(p => p.id === pageId)) pageId = "settings";
  if (pageId === "settings") editMode = false;
  currentPage = pageId;
  applyTheme(); renderNav(); renderMain();
  try {
    const path = pageId === "settings" ? "/settings" : "/" + pageId;
    if ((location.pathname || "/") !== path) history.pushState({ page: pageId }, "", path);
  } catch (_) {}
}

function renderMain() {
  const main = document.getElementById("main");
  if (!main) return;
  if (currentPage === "settings") { main.innerHTML = renderSettingsPage(); return; }
  const page = settings.pages.find(p => p.id === currentPage);
  if (!page) { main.innerHTML = `<div class="settings-card">Page not found</div>`; return; }

  const blocks = page.blocks || [];
  main.innerHTML = `
    <div class="page-head">
      <div>
        <h1 ${editMode ? `contenteditable="true" onblur="renamePage('${page.id}', this.innerText);"` : ""}>${escapeHtml(page.name)}</h1>
        <p>${editMode ? "Edit mode — click text, use + to add" : "View mode"}</p>
      </div>
      <div class="page-head-actions">
        <button type="button" class="btn ghost edit-toggle ${editMode ? "on" : ""}" onclick="toggleEdit()">
          ${iconSvg("edit", 16)} ${editMode ? "Done" : "Edit page"}
        </button>
      </div>
    </div>
    <div class="canvas" id="canvas">
      ${blocks.map((b, i) => renderBlock(page.id, b, i)).join("")}
      <div class="add-slot" onclick="openAddModal('${page.id}')">+ Add block</div>
    </div>
    <button type="button" class="fab-add" title="Add block" onclick="openAddModal('${page.id}')">${iconSvg("plus", 24)}</button>`;
}

function renderBlock(pageId, b, index) {
  const controls = `
    <div class="block-controls">
      <button type="button" title="Up" onclick="event.stopPropagation(); moveBlock('${pageId}','${b.id}',-1)">${iconSvg("plus", 14)}</button>
      <button type="button" title="Down" onclick="event.stopPropagation(); moveBlock('${pageId}','${b.id}',1)">${iconSvg("plus", 14)}</button>
      <button type="button" title="Delete" onclick="event.stopPropagation(); removeBlock('${pageId}','${b.id}')">${iconSvg("trash", 14)}</button>
    </div>`;

  const ce = (field) => editMode
    ? `contenteditable="true" onblur="updateBlockText('${pageId}','${b.id}', this.innerText)"`
    : "";

  let body = "";
  switch (b.type) {
    case "heading":
      body = `<div class="block-heading" ${ce("text")}>${escapeHtml(b.text)}</div>`; break;
    case "text":
      body = `<div class="block-text" ${ce("text")}>${escapeHtml(b.text)}</div>`; break;
    case "button":
      body = `<div style="margin:6px 0">
        <button type="button" class="btn ${b.style === "ghost" ? "ghost" : "primary"}"
          onclick="${editMode ? "event.preventDefault()" : "toast('Button: '+this.innerText)"}">
          <span ${ce("text")}>${escapeHtml(b.text)}</span>
        </button></div>`; break;
    case "box":
      body = `<div class="block-box" ${ce("text")}>${escapeHtml(b.text)}</div>`; break;
    case "idle":
      body = `<div class="block-idle">
        <div style="font-weight:600" ${ce("text")}>${escapeHtml(b.text)}</div>
        <div class="idle-timer" id="idle-${b.id}">${formatSec(b.seconds || 15)}</div>
        <button type="button" class="btn primary" id="idle-btn-${b.id}"
          onclick="startIdle('${pageId}','${b.id}',${b.seconds || 15})">Start</button>
      </div>`; break;
    case "clicker":
      body = `<div class="block-clicker">
        <div style="font-weight:600" ${ce("text")}>${escapeHtml(b.text)}</div>
        <div class="counter-val" id="click-score-${b.id}">${b.score || 0}</div>
        <div class="clicker-area" onclick="clickerHit('${pageId}','${b.id}')">${iconSvg("target", 32)}</div>
      </div>`; break;
    case "counter":
      body = `<div class="block-counter">
        <div style="font-weight:600" ${ce("text")}>${escapeHtml(b.text)}</div>
        <div class="counter-val" id="counter-${b.id}">${b.value || 0}</div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button type="button" class="btn ghost" onclick="counterAdd('${pageId}','${b.id}',-1)">-1</button>
          <button type="button" class="btn primary" onclick="counterAdd('${pageId}','${b.id}',1)">+1</button>
          <button type="button" class="btn ghost" onclick="counterAdd('${pageId}','${b.id}',10)">+10</button>
        </div>
      </div>`; break;
    case "progress":
      body = `<div class="block-progress">
        <div style="font-weight:600" ${ce("text")}>${escapeHtml(b.text)}</div>
        <div class="progress-track"><div class="progress-fill" id="prog-${b.id}" style="width:${((b.value||0)/(b.max||100))*100}%"></div></div>
        <div id="prog-lab-${b.id}" style="font-size:0.85rem;color:var(--color-muted)">${b.value||0} / ${b.max||100}</div>
        <button type="button" class="btn primary" style="margin-top:8px" onclick="progressAdd('${pageId}','${b.id}',10)">+10</button>
      </div>`; break;
    case "surprise":
      body = `<div class="block-surprise">
        <div style="font-weight:700;margin-bottom:8px">Surprise</div>
        <p id="surprise-${b.id}" style="margin-bottom:12px;font-size:0.9rem" ${ce("text")}>${escapeHtml(b.text)}</p>
        <button type="button" class="btn primary" onclick="triggerSurprise('${b.id}')">Reveal</button>
      </div>`; break;
    case "image":
      body = `<div class="block-image-ph">${iconSvg("image", 28)}<span ${ce("text")}>${escapeHtml(b.text || "Image")}</span></div>`; break;
    case "divider":
      body = `<hr style="border:none;border-top:1px solid var(--color-border);margin:8px 0" />`; break;
    default: body = "";
  }

  return `<div class="block-wrap" data-id="${b.id}">${editMode ? controls : ""}${body}
    ${editMode ? `<div class="add-slot" style="margin-top:8px;padding:10px;font-size:0.8rem" onclick="openAddModal('${pageId}')">+ Add below</div>` : ""}
  </div>`;
}

function renderSettingsPage() {
  const s = settings;
  return `
  <div class="page-head">
    <div><h1>Settings</h1><p>Design, pages, export</p></div>
    <div class="page-head-actions">
      <button type="button" class="btn ghost" onclick="exportConfig()">Save / Export</button>
      <button type="button" class="btn ghost" onclick="resetAll()">Reset all</button>
    </div>
  </div>
  <div class="settings-grid">
    <div class="settings-card span-2">
      <h2>Save &amp; share</h2>
      <p style="font-size:0.85rem;color:var(--color-muted);margin-bottom:10px">Download JSON and send it to make this the default.</p>
      <textarea class="export-box" id="export-area"></textarea>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button type="button" class="btn primary" onclick="exportConfig()">Download JSON</button>
        <button type="button" class="btn ghost" onclick="copyConfig()">Copy</button>
        <button type="button" class="btn ghost" onclick="importConfig()">Import</button>
      </div>
    </div>
    <div class="settings-card span-2">
      <h2>Pages</h2>
      <div class="page-list">
        ${s.pages.map(p => `
          <div class="page-item">
            <button type="button" class="pi-icon" onclick="openIconPicker({type:'page',pageId:'${p.id}'})">${iconSvg(p.icon||"star",18)}</button>
            <div class="pi-name"><input type="text" value="${escapeHtml(p.name)}" ${p.locked?"readonly":""} onchange="renamePage('${p.id}',this.value)" /></div>
            ${p.locked ? "" : `<button type="button" class="btn small danger" onclick="removePage('${p.id}')">Delete</button>`}
          </div>`).join("")}
      </div>
      <button type="button" class="btn primary" style="margin-top:12px" onclick="addPage()">Add page</button>
      <p style="margin-top:10px;font-size:0.82rem;color:var(--color-muted)">Open a page → press <strong>Edit page</strong> → click text or + to build.</p>
    </div>
    <div class="settings-card">
      <h2>Layout</h2>
      <div class="field"><label>Navigation</label>
        <div class="seg">
          <button type="button" class="seg-btn ${s.layout==="topbar"?"active":""}" onclick="setLayout('topbar')">Top bar</button>
          <button type="button" class="seg-btn ${s.layout==="sidebar"?"active":""}" onclick="setLayout('sidebar')">Sidebar</button>
        </div>
      </div>
      <div class="field"><label>Brand name</label>
        <input type="text" value="${escapeHtml(s.brandName)}" onchange="applySetting('brandName',this.value)" /></div>
      ${rangeField("contentWidth","Content width",720,1400,20,s.contentWidth,"px")}
      ${rangeField("pagePadding","Padding",12,48,2,s.pagePadding,"px")}
      ${rangeField("topbarH","Top bar height",48,72,2,s.topbarH,"px")}
      ${rangeField("sidebarW","Sidebar width",180,280,4,s.sidebarW,"px")}
      <div class="field row"><label>Show brand</label>
        <label class="switch"><input type="checkbox" ${s.showBrand?"checked":""} onchange="applySetting('showBrand',this.checked)"/><span class="slider"></span></label></div>
    </div>
    <div class="settings-card">
      <h2>Typography</h2>
      <div class="field"><label>Font</label>
        <select onchange="applySetting('fontFamily',this.value)">
          ${["Inter","Outfit","Space Grotesk","DM Sans","Nunito","system-ui"].map(f=>`<option ${s.fontFamily===f?"selected":""}>${f}</option>`).join("")}
        </select></div>
      ${rangeField("fontSize","Base size",13,20,1,s.fontSize,"px")}
      ${rangeField("headingSize","Heading",22,40,1,s.headingSize,"px")}
      ${rangeField("fontWeight","Weight",400,700,100,s.fontWeight,"")}
    </div>
    <div class="settings-card">
      <h2>Colors</h2>
      ${colorField("colorPrimary","Primary",s.colorPrimary)}
      ${colorField("colorAccent","Accent",s.colorAccent)}
      ${colorField("colorBg","Background",s.colorBg)}
      ${colorField("colorCard","Card",s.colorCard)}
      ${colorField("colorText","Text",s.colorText)}
      ${colorField("colorMuted","Muted",s.colorMuted)}
      ${colorField("colorNav","Nav",s.colorNav)}
    </div>
    <div class="settings-card">
      <h2>Boxes &amp; buttons</h2>
      ${rangeField("radius","Radius",0,28,1,s.radius,"px")}
      ${rangeField("cardPadding","Card padding",12,36,2,s.cardPadding,"px")}
      ${rangeField("shadow","Shadow",0,40,2,s.shadow,"")}
      ${rangeField("btnSize","Btn padding",8,20,1,s.btnSize,"px")}
      ${rangeField("btnRadius","Btn radius",0,24,1,s.btnRadius,"px")}
      <div style="display:flex;gap:8px;margin-top:8px">
        <button type="button" class="btn primary">Primary</button>
        <button type="button" class="btn ghost">Ghost</button>
      </div>
    </div>
    <div class="settings-card">
      <h2>Animations</h2>
      <div class="field row"><label>Enable</label>
        <label class="switch"><input type="checkbox" ${s.animOn?"checked":""} onchange="applySetting('animOn',this.checked)"/><span class="slider"></span></label></div>
      ${rangeField("animSpeed","Speed",50,200,10,s.animSpeed,"%")}
      ${rangeField("hoverLift","Hover lift",0,8,1,s.hoverLift,"px")}
    </div>
  </div>`;
}

function rangeField(key, label, min, max, step, val, suffix) {
  return `<div class="field"><label>${label}</label>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${val}"
      oninput="applySetting('${key}',this.value);this.nextElementSibling.textContent=this.value+'${suffix}'"/>
    <div class="range-val">${val}${suffix}</div></div>`;
}
function colorField(key, label, val) {
  return `<div class="field row"><label>${label}</label>
    <input type="color" value="${val}" oninput="applySetting('${key}',this.value)"/></div>`;
}

function pageFromPath() {
  const parts = (location.pathname || "/").split("/").filter(Boolean);
  const last = (parts[parts.length - 1] || "").toLowerCase();
  if (settings.pages.some(p => p.id === last)) return last;
  return "settings";
}

window.addEventListener("popstate", (e) => showPage((e.state && e.state.page) || pageFromPath()));
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(); renderNav(); showPage(pageFromPath());
});