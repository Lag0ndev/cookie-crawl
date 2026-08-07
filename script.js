const STORAGE_KEY = "coc_ui_settings_v1";

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
};

let settings = loadSettings();

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (_) {}
  return { ...DEFAULTS };
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (_) {}
}

function applyAll() {
  const root = document.documentElement;
  const s = settings;

  root.style.setProperty("--color-primary", s.colorPrimary);
  root.style.setProperty("--color-accent", s.colorAccent);
  root.style.setProperty("--color-bg", s.colorBg);
  root.style.setProperty("--color-card", s.colorCard);
  root.style.setProperty("--color-text", s.colorText);
  root.style.setProperty("--color-muted", s.colorMuted);
  root.style.setProperty("--color-nav", s.colorNav);

  root.style.setProperty("--font-family", s.fontFamily + ", system-ui, sans-serif");
  root.style.setProperty("--font-size", s.fontSize + "px");
  root.style.setProperty("--heading-size", s.headingSize + "px");
  root.style.setProperty("--font-weight", String(s.fontWeight));

  root.style.setProperty("--radius", s.radius + "px");
  root.style.setProperty("--card-padding", s.cardPadding + "px");
  root.style.setProperty("--card-gap", s.cardGap + "px");
  root.style.setProperty("--border-width", s.borderWidth + "px");
  root.style.setProperty("--shadow", s.shadow + "px");

  root.style.setProperty("--btn-pad", s.btnSize + "px");
  root.style.setProperty("--btn-radius", s.btnRadius + "px");
  root.style.setProperty("--btn-font", s.btnFont + "px");

  root.style.setProperty("--content-width", s.contentWidth + "px");
  root.style.setProperty("--page-padding", s.pagePadding + "px");
  root.style.setProperty("--topbar-h", s.topbarH + "px");
  root.style.setProperty("--sidebar-w", s.sidebarW + "px");

  root.style.setProperty("--hover-lift", s.hoverLift + "px");
  root.style.setProperty("--anim-speed", String((s.animSpeed || 100) / 100));

  document.body.dataset.layout = s.layout;
  document.body.dataset.anim = s.animOn ? "on" : "off";
  document.body.dataset.pageTrans = s.pageTrans ? "on" : "off";
  document.body.dataset.showBrand = s.showBrand ? "on" : "off";

  // sync form controls
  setVal("content-width", s.contentWidth, "content-width-val", s.contentWidth + "px");
  setVal("page-padding", s.pagePadding, "page-padding-val", s.pagePadding + "px");
  setVal("font-size", s.fontSize, "font-size-val", s.fontSize + "px");
  setVal("heading-size", s.headingSize, "heading-size-val", s.headingSize + "px");
  setVal("font-weight", s.fontWeight, "font-weight-val", String(s.fontWeight));
  setVal("radius", s.radius, "radius-val", s.radius + "px");
  setVal("card-padding", s.cardPadding, "card-padding-val", s.cardPadding + "px");
  setVal("card-gap", s.cardGap, "card-gap-val", s.cardGap + "px");
  setVal("border-width", s.borderWidth, "border-width-val", s.borderWidth + "px");
  setVal("shadow", s.shadow, "shadow-val", String(s.shadow));
  setVal("btn-size", s.btnSize, "btn-size-val", s.btnSize + "px padding");
  setVal("btn-radius", s.btnRadius, "btn-radius-val", s.btnRadius + "px");
  setVal("btn-font", s.btnFont, "btn-font-val", s.btnFont + "px");
  setVal("anim-speed", s.animSpeed, "anim-speed-val", s.animSpeed + "%");
  setVal("hover-lift", s.hoverLift, "hover-lift-val", s.hoverLift + "px");
  setVal("topbar-h", s.topbarH, "topbar-h-val", s.topbarH + "px");
  setVal("sidebar-w", s.sidebarW, "sidebar-w-val", s.sidebarW + "px");

  const ff = document.getElementById("font-family");
  if (ff) ff.value = s.fontFamily;

  setColor("color-primary", s.colorPrimary);
  setColor("color-accent", s.colorAccent);
  setColor("color-bg", s.colorBg);
  setColor("color-card", s.colorCard);
  setColor("color-text", s.colorText);
  setColor("color-muted", s.colorMuted);
  setColor("color-nav", s.colorNav);

  const animOn = document.getElementById("anim-on");
  if (animOn) animOn.checked = !!s.animOn;
  const pageTrans = document.getElementById("page-trans");
  if (pageTrans) pageTrans.checked = !!s.pageTrans;
  const showBrand = document.getElementById("show-brand");
  if (showBrand) showBrand.checked = !!s.showBrand;

  document.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === s.layout);
  });
}

function setVal(id, value, labelId, labelText) {
  const el = document.getElementById(id);
  if (el) el.value = value;
  const lab = document.getElementById(labelId);
  if (lab) lab.textContent = labelText;
}

function setColor(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function applySetting(key, value) {
  if (["contentWidth", "pagePadding", "fontSize", "headingSize", "fontWeight", "radius", "cardPadding", "cardGap", "borderWidth", "shadow", "btnSize", "btnRadius", "btnFont", "animSpeed", "hoverLift", "topbarH", "sidebarW"].includes(key)) {
    settings[key] = Number(value);
  } else if (["animOn", "pageTrans", "showBrand"].includes(key)) {
    settings[key] = !!value;
  } else {
    settings[key] = value;
  }
  saveSettings();
  applyAll();
}

function setLayout(mode) {
  settings.layout = mode;
  saveSettings();
  applyAll();
}

function resetAll() {
  settings = { ...DEFAULTS };
  saveSettings();
  applyAll();
}

function showPage(page) {
  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  const sec = document.getElementById(page);
  if (sec) sec.classList.add("active");

  document.querySelectorAll("[data-page]").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  try {
    const path = page === "settings" ? "/settings" : "/";
    if ((location.pathname || "/") !== path) {
      history.pushState({ page }, "", path);
    }
  } catch (_) {}
}

function pageFromPath() {
  const parts = (location.pathname || "/").split("/").filter(Boolean);
  const last = (parts[parts.length - 1] || "").toLowerCase();
  if (last === "settings") return "settings";
  return "settings";
}

window.addEventListener("popstate", () => showPage(pageFromPath()));

document.addEventListener("DOMContentLoaded", () => {
  applyAll();
  showPage(pageFromPath());
});