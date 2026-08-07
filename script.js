const STORAGE_KEY = "coc_builder_v1";

const DEFAULTS = {
  layout: "topbar",
  contentWidth: 1080,
  pagePadding: 32,
  fontFamily: "Inter",
  fontSize: 15,
  headingSize: 28,
  fontWeight: 400,
  colorPrimary: "#7c3aed",
  colorAccent: "#ec4899",
  colorBg: "#f8fafc",
  colorCard: "#ffffff",
  colorText: "#0f172a",
  colorMuted: "#64748b",
  colorNav: "#1e1b4b",
  radius: 16,
  cardPadding: 20,
  cardGap: 16,
  borderWidth: 1,
  shadow: 12,
  btnSize: 12,
  btnRadius: 10,
  btnFont: 14,
  animOn: true,
  animSpeed: 100,
  hoverLift: 3,
  pageTrans: true,
  topbarH: 60,
  sidebarW: 220,
  showBrand: true,
  brandName: "Contest of Candy",
  pages: [
    {
      id: "settings",
      name: "Settings",
      icon: "settings",
      locked: true,
      blocks: [],
    },
  ],
};

let settings = loadSettings();
let currentPage = "settings";
let iconPickTarget = null; // { type: 'page'|'block', pageId, blockId? }
let idleTimers = {};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed, pages: parsed.pages || DEFAULTS.pages };
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
}

function uid() {
  return "id_" + Math.random().toString(36).slice(2, 10);
}

function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Theme apply ---------- */
function applyTheme() {
  const root = document.documentElement;
  const s = settings;
  const map = {
    "--color-primary": s.colorPrimary,
    "--color-accent": s.colorAccent,
    "--color-bg": s.colorBg,
    "--color-card": s.colorCard,
    "--color-text": s.colorText,
    "--color-muted": s.colorMuted,
    "--color-nav": s.colorNav,
    "--font-family": s.fontFamily + ", system-ui, sans-serif",
    "--font-size": s.fontSize + "px",
    "--heading-size": s.headingSize + "px",
    "--font-weight": String(s.fontWeight),
    "--radius": s.radius + "px",
    "--card-padding": s.cardPadding + "px",
    "--card-gap": s.cardGap + "px",
    "--border-width": s.borderWidth + "px",
    "--shadow": s.shadow + "px",
    "--btn-pad": s.btnSize + "px",
    "--btn-radius": s.btnRadius + "px",
    "--btn-font": s.btnFont + "px",
    "--content-width": s.contentWidth + "px",
    "--page-padding": s.pagePadding + "px",
    "--topbar-h": s.topbarH + "px",
    "--sidebar-w": s.sidebarW + "px",
    "--hover-lift": s.hoverLift + "px",
    "--anim-speed": String((s.animSpeed || 100) / 100),
  };
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, v));

  document.body.dataset.layout = s.layout;
  document.body.dataset.anim = s.animOn ? "on" : "off";
  document.body.dataset.pageTrans = s.pageTrans ? "on" : "off";
  document.body.dataset.showBrand = s.showBrand ? "on" : "off";

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
  saveSettings();
  applyTheme();
  if (currentPage === "settings") renderMain();
}

function setLayout(mode) {
  settings.layout = mode;
  saveSettings();
  applyTheme();
  renderNav();
  if (currentPage === "settings") renderMain();
}

function resetAll() {
  if (!confirm("Reset everything to defaults? Custom pages will be removed.")) return;
  settings = JSON.parse(JSON.stringify(DEFAULTS));
  saveSettings();
  applyTheme();
  renderNav();
  showPage("settings");
  toast("Reset to defaults");
}

/* ---------- Nav ---------- */
function renderNav() {
  const side = document.getElementById("sidebar-nav");
  const top = document.getElementById("top-nav");
  if (!side || !top) return;

  const pages = settings.pages || [];
  side.innerHTML = pages.map(p => `
    <button type="button" class="side-link ${p.id === currentPage ? "active" : ""}" data-page="${p.id}" onclick="showPage('${p.id}')">
      ${iconSvg(p.icon || "star", 18)}
      ${escapeHtml(p.name)}
    </button>`).join("");

  top.innerHTML = pages.map(p => `
    <button type="button" class="nav-link ${p.id === currentPage ? "active" : ""}" data-page="${p.id}" onclick="showPage('${p.id}')">
      ${iconSvg(p.icon || "star", 16)}
      <span>${escapeHtml(p.name)}</span>
    </button>`).join("");
}

function escapeHtml(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ---------- Pages CRUD ---------- */
function addPage() {
  const id = uid();
  settings.pages.push({
    id,
    name: "New Page",
    icon: "star",
    locked: false,
    blocks: [
      { id: uid(), type: "heading", text: "New Page" },
      { id: uid(), type: "text", text: "Add content blocks from Settings." },
    ],
  });
  saveSettings();
  renderNav();
  showPage("settings");
  toast("Page added");
}

function removePage(pageId) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p || p.locked) return toast("Can't remove Settings");
  if (!confirm(`Delete page "${p.name}"?`)) return;
  settings.pages = settings.pages.filter(x => x.id !== pageId);
  saveSettings();
  if (currentPage === pageId) showPage("settings");
  else { renderNav(); renderMain(); }
  toast("Page removed");
}

function renamePage(pageId, name) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p) return;
  p.name = name.slice(0, 32) || "Page";
  saveSettings();
  renderNav();
}

function setPageIcon(pageId, icon) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p) return;
  p.icon = icon;
  saveSettings();
  renderNav();
  if (currentPage === "settings") renderMain();
}

/* ---------- Blocks ---------- */
function addBlock(pageId, type) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p) return;
  const block = { id: uid(), type };
  if (type === "heading") block.text = "Heading";
  if (type === "text") block.text = "Body text goes here.";
  if (type === "button") { block.text = "Click me"; block.style = "primary"; }
  if (type === "box") block.text = "A content box.";
  if (type === "idle") { block.text = "Idle action"; block.seconds = 30; }
  if (type === "surprise") block.text = "Something unexpected might happen...";
  if (type === "image") block.text = "Placeholder image";
  if (type === "divider") {}
  p.blocks = p.blocks || [];
  p.blocks.push(block);
  saveSettings();
  renderMain();
  toast("Block added");
}

function updateBlock(pageId, blockId, field, value) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p) return;
  const b = (p.blocks || []).find(x => x.id === blockId);
  if (!b) return;
  b[field] = value;
  saveSettings();
}

function removeBlock(pageId, blockId) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p) return;
  p.blocks = (p.blocks || []).filter(x => x.id !== blockId);
  saveSettings();
  renderMain();
}

function moveBlock(pageId, blockId, dir) {
  const p = settings.pages.find(x => x.id === pageId);
  if (!p || !p.blocks) return;
  const i = p.blocks.findIndex(x => x.id === blockId);
  if (i < 0) return;
  const j = i + dir;
  if (j < 0 || j >= p.blocks.length) return;
  const tmp = p.blocks[i];
  p.blocks[i] = p.blocks[j];
  p.blocks[j] = tmp;
  saveSettings();
  renderMain();
}

/* ---------- Idle / Surprise ---------- */
function startIdle(pageId, blockId, seconds) {
  const key = pageId + ":" + blockId;
  if (idleTimers[key]) return;
  let left = seconds || 30;
  const el = document.getElementById("idle-" + blockId);
  const btn = document.getElementById("idle-btn-" + blockId);
  if (btn) btn.disabled = true;
  function tick() {
    if (el) el.textContent = formatSec(left);
    if (left <= 0) {
      clearInterval(idleTimers[key]);
      delete idleTimers[key];
      if (el) el.textContent = "Done!";
      if (btn) { btn.disabled = false; btn.textContent = "Start again"; }
      toast("Idle complete (placeholder)");
      return;
    }
    left--;
  }
  tick();
  idleTimers[key] = setInterval(tick, 1000);
}

function formatSec(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ":" + String(sec).padStart(2, "0");
}

function triggerSurprise(blockId) {
  const surprises = [
    "A rare candy sparkles in the distance... (placeholder)",
    "You found a golden wrapper! (placeholder)",
    "Double points for the next minute! (placeholder)",
    "A mysterious merchant appears. (placeholder)",
    "Nothing happened. Or did it?",
    "Contest of Candy smiles upon you.",
  ];
  const msg = surprises[Math.floor(Math.random() * surprises.length)];
  toast(msg);
  const el = document.getElementById("surprise-" + blockId);
  if (el) el.textContent = msg;
}

/* ---------- Icon modal ---------- */
function openIconPicker(target) {
  iconPickTarget = target;
  const modal = document.getElementById("icon-modal");
  modal.classList.add("open");
  document.getElementById("icon-search").value = "";
  renderIconGrid("");
}

function closeIconModal(e) {
  if (e && e.target !== document.getElementById("icon-modal") && e.type === "click") return;
  document.getElementById("icon-modal").classList.remove("open");
  iconPickTarget = null;
}

function filterIcons(q) {
  renderIconGrid(q || "");
}

function renderIconGrid(q) {
  const grid = document.getElementById("icon-grid");
  const query = (q || "").toLowerCase();
  const names = ICON_NAMES.filter(n => !query || n.includes(query));
  grid.innerHTML = names.map(n => `
    <button type="button" class="icon-pick" title="${n}" onclick="pickIcon('${n}')">
      ${iconSvg(n, 20)}
    </button>`).join("");
}

function pickIcon(name) {
  if (!iconPickTarget) return;
  if (iconPickTarget.type === "page") {
    setPageIcon(iconPickTarget.pageId, name);
  }
  closeIconModal();
  toast("Icon set to " + name);
}

/* ---------- Export / Import ---------- */
function exportConfig() {
  const json = JSON.stringify(settings, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "coc-config.json";
  a.click();
  URL.revokeObjectURL(a.href);

  const ta = document.getElementById("export-area");
  if (ta) ta.value = json;
  toast("Config downloaded — send coc-config.json to set as default");
}

function importConfig() {
  const ta = document.getElementById("export-area");
  if (!ta || !ta.value.trim()) return toast("Paste JSON first");
  try {
    const parsed = JSON.parse(ta.value);
    settings = { ...DEFAULTS, ...parsed, pages: parsed.pages || DEFAULTS.pages };
    saveSettings();
    applyTheme();
    renderNav();
    showPage("settings");
    toast("Config imported");
  } catch {
    toast("Invalid JSON");
  }
}

function copyConfig() {
  const json = JSON.stringify(settings, null, 2);
  const ta = document.getElementById("export-area");
  if (ta) ta.value = json;
  navigator.clipboard?.writeText(json).then(() => toast("Copied to clipboard")).catch(() => toast("Copy failed — use download"));
}

/* ---------- Render pages ---------- */
function showPage(pageId) {
  if (!settings.pages.find(p => p.id === pageId)) pageId = "settings";
  currentPage = pageId;
  renderNav();
  renderMain();
  try {
    const path = pageId === "settings" ? "/settings" : "/" + pageId;
    if ((location.pathname || "/") !== path) history.pushState({ page: pageId }, "", path);
  } catch (_) {}
}

function renderMain() {
  const main = document.getElementById("main");
  if (!main) return;

  if (currentPage === "settings") {
    main.innerHTML = renderSettingsPage();
    return;
  }

  const page = settings.pages.find(p => p.id === currentPage);
  if (!page) {
    main.innerHTML = `<div class="settings-card"><p>Page not found.</p></div>`;
    return;
  }

  main.innerHTML = `
    <div class="page-head">
      <div>
        <h1>${escapeHtml(page.name)}</h1>
        <p>Custom page</p>
      </div>
    </div>
    <div class="blocks-list">
      ${(page.blocks || []).map(b => renderBlockView(page.id, b)).join("") || `<div class="block-idle">No blocks yet. Add some in Settings.</div>`}
    </div>`;
}

function renderBlockView(pageId, b) {
  switch (b.type) {
    case "heading":
      return `<div class="block-heading">${escapeHtml(b.text)}</div>`;
    case "text":
      return `<div class="block-text">${escapeHtml(b.text)}</div>`;
    case "button":
      return `<div style="margin:10px 0"><button type="button" class="btn ${b.style === "ghost" ? "ghost" : "primary"}" onclick="toast('Button clicked (placeholder)')">${escapeHtml(b.text)}</button></div>`;
    case "box":
      return `<div class="block-box">${escapeHtml(b.text)}</div>`;
    case "idle":
      return `<div class="block-idle">
        <div style="font-weight:600;margin-bottom:4px">${escapeHtml(b.text)}</div>
        <div class="idle-timer" id="idle-${b.id}">${formatSec(b.seconds || 30)}</div>
        <button type="button" class="btn primary" id="idle-btn-${b.id}" onclick="startIdle('${pageId}','${b.id}',${b.seconds || 30})">Start</button>
      </div>`;
    case "surprise":
      return `<div class="block-surprise">
        <div style="font-weight:700;margin-bottom:8px">Surprise</div>
        <p id="surprise-${b.id}" style="margin-bottom:12px;font-size:0.9rem">${escapeHtml(b.text)}</p>
        <button type="button" class="btn primary" onclick="triggerSurprise('${b.id}')">Reveal</button>
      </div>`;
    case "image":
      return `<div class="block-image-ph">${iconSvg("image", 32)}<span style="margin-left:8px">${escapeHtml(b.text || "Image")}</span></div>`;
    case "divider":
      return `<hr style="border:none;border-top:1px solid var(--color-border);margin:16px 0" />`;
    default:
      return "";
  }
}

function renderSettingsPage() {
  const s = settings;
  return `
  <div class="page-head">
    <div>
      <h1>Settings</h1>
      <p>Design, pages, content blocks, export</p>
    </div>
    <div class="page-head-actions">
      <button type="button" class="btn ghost" onclick="exportConfig()">Save / Export</button>
      <button type="button" class="btn ghost" onclick="resetAll()">Reset all</button>
    </div>
  </div>

  <div class="settings-grid">

    <div class="settings-card span-2">
      <h2>Save &amp; share</h2>
      <p style="font-size:0.85rem;color:var(--color-muted);margin-bottom:10px">Download or copy this JSON and send it so it can become the new default.</p>
      <textarea class="export-box" id="export-area" placeholder="Exported config appears here..."></textarea>
      <div class="preview-row" style="margin-top:10px">
        <button type="button" class="btn primary" onclick="exportConfig()">Download JSON</button>
        <button type="button" class="btn ghost" onclick="copyConfig()">Copy</button>
        <button type="button" class="btn ghost" onclick="importConfig()">Import from box</button>
      </div>
    </div>

    <div class="settings-card span-2">
      <h2>Pages</h2>
      <div class="page-list">
        ${s.pages.map(p => `
          <div class="page-item">
            <button type="button" class="pi-icon" title="Change icon" onclick="openIconPicker({type:'page',pageId:'${p.id}'})">${iconSvg(p.icon || "star", 18)}</button>
            <div class="pi-name"><input type="text" value="${escapeHtml(p.name)}" ${p.locked ? "readonly" : ""} onchange="renamePage('${p.id}', this.value)" /></div>
            <div class="pi-actions">
              ${p.locked ? "" : `<button type="button" class="btn small danger" onclick="removePage('${p.id}')">Delete</button>`}
            </div>
          </div>`).join("")}
      </div>
      <button type="button" class="btn primary" style="margin-top:12px" onclick="addPage()">Add page</button>
    </div>

    <div class="settings-card span-2">
      <h2>Page content builder</h2>
      <p style="font-size:0.85rem;color:var(--color-muted);margin-bottom:12px">Pick a page and add blocks: headings, text, buttons, boxes, idle timers, surprises, images.</p>
      <div class="field">
        <label>Edit page</label>
        <select id="edit-page-select" onchange="renderMain()">
          ${s.pages.filter(p => !p.locked).map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("") || "<option value=\"\">No custom pages yet</option>"}
        </select>
      </div>
      ${renderContentBuilder()}
    </div>

    <div class="settings-card">
      <h2>Layout</h2>
      <div class="field">
        <label>Navigation</label>
        <div class="seg">
          <button type="button" class="seg-btn ${s.layout==="topbar"?"active":""}" onclick="setLayout('topbar')">Top bar</button>
          <button type="button" class="seg-btn ${s.layout==="sidebar"?"active":""}" onclick="setLayout('sidebar')">Sidebar</button>
        </div>
      </div>
      <div class="field"><label>Brand name</label>
        <input type="text" value="${escapeHtml(s.brandName)}" onchange="applySetting('brandName', this.value)" />
      </div>
      ${rangeField("contentWidth","Content width",720,1400,20,s.contentWidth,"px")}
      ${rangeField("pagePadding","Page padding",12,48,2,s.pagePadding,"px")}
      ${rangeField("topbarH","Top bar height",48,72,2,s.topbarH,"px")}
      ${rangeField("sidebarW","Sidebar width",180,280,4,s.sidebarW,"px")}
      <div class="field row"><label>Show brand</label>
        <label class="switch"><input type="checkbox" ${s.showBrand?"checked":""} onchange="applySetting('showBrand', this.checked)" /><span class="slider"></span></label>
      </div>
    </div>

    <div class="settings-card">
      <h2>Typography</h2>
      <div class="field"><label>Font</label>
        <select onchange="applySetting('fontFamily', this.value)">
          ${["Inter","Outfit","Space Grotesk","DM Sans","Nunito","system-ui"].map(f => `<option value="${f}" ${s.fontFamily===f?"selected":""}>${f}</option>`).join("")}
        </select>
      </div>
      ${rangeField("fontSize","Base size",13,20,1,s.fontSize,"px")}
      ${rangeField("headingSize","Heading size",22,40,1,s.headingSize,"px")}
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
      ${colorField("colorNav","Nav bar",s.colorNav)}
    </div>

    <div class="settings-card">
      <h2>Boxes &amp; buttons</h2>
      ${rangeField("radius","Radius",0,28,1,s.radius,"px")}
      ${rangeField("cardPadding","Card padding",12,36,2,s.cardPadding,"px")}
      ${rangeField("cardGap","Card gap",8,32,2,s.cardGap,"px")}
      ${rangeField("borderWidth","Border",0,3,1,s.borderWidth,"px")}
      ${rangeField("shadow","Shadow",0,40,2,s.shadow,"")}
      ${rangeField("btnSize","Button padding",8,20,1,s.btnSize,"px")}
      ${rangeField("btnRadius","Button radius",0,24,1,s.btnRadius,"px")}
      ${rangeField("btnFont","Button font",12,18,1,s.btnFont,"px")}
      <div class="preview-row" style="margin-top:10px">
        <button type="button" class="btn primary">Primary</button>
        <button type="button" class="btn ghost">Ghost</button>
      </div>
    </div>

    <div class="settings-card">
      <h2>Animations</h2>
      <div class="field row"><label>Enable</label>
        <label class="switch"><input type="checkbox" ${s.animOn?"checked":""} onchange="applySetting('animOn', this.checked)" /><span class="slider"></span></label>
      </div>
      ${rangeField("animSpeed","Speed",50,200,10,s.animSpeed,"%")}
      ${rangeField("hoverLift","Hover lift",0,8,1,s.hoverLift,"px")}
      <div class="field row"><label>Page transition</label>
        <label class="switch"><input type="checkbox" ${s.pageTrans?"checked":""} onchange="applySetting('pageTrans', this.checked)" /><span class="slider"></span></label>
      </div>
    </div>

  </div>`;
}

function renderContentBuilder() {
  const sel = document.getElementById("edit-page-select");
  // when first render, sel may not exist yet — pick first custom page
  let pageId = sel ? sel.value : (settings.pages.find(p => !p.locked)?.id || "");
  if (!pageId) return `<p style="color:var(--color-muted);font-size:0.9rem">Add a page first.</p>`;
  const page = settings.pages.find(p => p.id === pageId);
  if (!page) return "";

  return `
    <div class="blocks-list">
      ${(page.blocks || []).map(b => `
        <div class="block-card">
          <div class="block-toolbar">
            <span class="block-type-tag">${b.type}</span>
            <button type="button" class="btn small ghost" onclick="moveBlock('${page.id}','${b.id}',-1)">Up</button>
            <button type="button" class="btn small ghost" onclick="moveBlock('${page.id}','${b.id}',1)">Down</button>
            <button type="button" class="btn small danger" onclick="removeBlock('${page.id}','${b.id}')">Remove</button>
          </div>
          ${b.type !== "divider" ? `<div class="field" style="margin:0"><input type="text" value="${escapeHtml(b.text || "")}" onchange="updateBlock('${page.id}','${b.id}','text',this.value); renderMain();" placeholder="Text..." /></div>` : ""}
          ${b.type === "idle" ? `<div class="field" style="margin-top:8px"><label>Seconds</label><input type="text" value="${b.seconds || 30}" onchange="updateBlock('${page.id}','${b.id}','seconds',Number(this.value)||30)" /></div>` : ""}
          ${b.type === "button" ? `<div class="field" style="margin-top:8px"><label>Style</label><select onchange="updateBlock('${page.id}','${b.id}','style',this.value)"><option value="primary" ${b.style!=="ghost"?"selected":""}>Primary</option><option value="ghost" ${b.style==="ghost"?"selected":""}>Ghost</option></select></div>` : ""}
        </div>`).join("") || `<p style="color:var(--color-muted);font-size:0.9rem">No blocks yet.</p>`}
    </div>
    <div class="block-add-row">
      <button type="button" class="btn small ghost" onclick="addBlock('${page.id}','heading')">+ Heading</button>
      <button type="button" class="btn small ghost" onclick="addBlock('${page.id}','text')">+ Text</button>
      <button type="button" class="btn small ghost" onclick="addBlock('${page.id}','button')">+ Button</button>
      <button type="button" class="btn small ghost" onclick="addBlock('${page.id}','box')">+ Box</button>
      <button type="button" class="btn small ghost" onclick="addBlock('${page.id}','idle')">+ Idle timer</button>
      <button type="button" class="btn small ghost" onclick="addBlock('${page.id}','surprise')">+ Surprise</button>
      <button type="button" class="btn small ghost" onclick="addBlock('${page.id}','image')">+ Image</button>
      <button type="button" class="btn small ghost" onclick="addBlock('${page.id}','divider')">+ Divider</button>
    </div>`;
}

function rangeField(key, label, min, max, step, val, suffix) {
  return `<div class="field"><label>${label}</label>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${val}"
      oninput="applySetting('${key}', this.value); this.nextElementSibling.textContent=this.value+'${suffix}'" />
    <div class="range-val">${val}${suffix}</div></div>`;
}

function colorField(key, label, val) {
  return `<div class="field row"><label>${label}</label>
    <input type="color" value="${val}" oninput="applySetting('${key}', this.value)" /></div>`;
}

function pageFromPath() {
  const parts = (location.pathname || "/").split("/").filter(Boolean);
  const last = (parts[parts.length - 1] || "").toLowerCase();
  if (settings.pages.some(p => p.id === last)) return last;
  return "settings";
}

window.addEventListener("popstate", (e) => {
  showPage((e.state && e.state.page) || pageFromPath());
});

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  renderNav();
  showPage(pageFromPath());
});

// re-render content builder when select changes — handled via onchange="renderMain()"