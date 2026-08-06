const VALID_PAGES = ["dashboard", "bakery", "leaderboard", "stats", "settings"];

const BAKE_DURATION_MS = 60 * 1000; // 1 minute

let bakeState = {
  active: false,
  startTime: null,
  timerId: null,
};

function showPage(page) {
  if (!VALID_PAGES.includes(page)) page = "dashboard";

  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  const section = document.getElementById(page);
  if (section) section.classList.add("active");

  document.querySelectorAll("nav .nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  try {
    const path = page === "dashboard" ? "/" : "/" + page;
    const cur = (location.pathname || "/").replace(/\/+$/, "") || "/";
    if (cur !== path) {
      history.pushState({ page }, "", path);
    }
  } catch (_) {}
}

function pageFromPath() {
  try {
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const last = (parts[parts.length - 1] || "").toLowerCase();
    if (VALID_PAGES.includes(last)) return last;
  } catch (_) {}
  return "dashboard";
}

function formatTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function startBake() {
  if (bakeState.active) return;

  const card = document.getElementById("oven-card");
  const status = document.getElementById("oven-status");
  const btn = document.getElementById("bake-btn");
  const progressWrap = document.getElementById("progress-wrap");
  const progressFill = document.getElementById("progress-fill");
  const timerEl = document.getElementById("bake-timer");
  const hint = document.getElementById("bake-hint");

  bakeState.active = true;
  bakeState.startTime = Date.now();

  card.classList.remove("done");
  card.classList.add("baking");
  status.textContent = "Baking";
  status.className = "oven-status baking";
  btn.disabled = true;
  btn.textContent = "Baking...";
  btn.classList.remove("done-state");
  progressWrap.hidden = false;
  progressFill.style.width = "0%";
  timerEl.textContent = "1:00";
  hint.textContent = "Cookie is in the oven...";

  function tick() {
    const elapsed = Date.now() - bakeState.startTime;
    const remaining = BAKE_DURATION_MS - elapsed;
    const pct = Math.min(100, (elapsed / BAKE_DURATION_MS) * 100);

    progressFill.style.width = pct + "%";
    timerEl.textContent = formatTime(remaining);

    if (remaining <= 0) {
      finishBake();
      return;
    }
    bakeState.timerId = requestAnimationFrame(tick);
  }

  bakeState.timerId = requestAnimationFrame(tick);
}

function finishBake() {
  if (bakeState.timerId) {
    cancelAnimationFrame(bakeState.timerId);
    bakeState.timerId = null;
  }

  bakeState.active = false;
  bakeState.startTime = null;

  const card = document.getElementById("oven-card");
  const status = document.getElementById("oven-status");
  const btn = document.getElementById("bake-btn");
  const progressFill = document.getElementById("progress-fill");
  const timerEl = document.getElementById("bake-timer");
  const hint = document.getElementById("bake-hint");

  card.classList.remove("baking");
  card.classList.add("done");
  status.textContent = "Done";
  status.className = "oven-status done";
  progressFill.style.width = "100%";
  timerEl.textContent = "0:00";
  hint.textContent = "Placeholder — no rewards yet. Bake again anytime.";

  btn.disabled = false;
  btn.textContent = "Bake again";
  btn.classList.add("done-state");

  // After a short moment, allow clean re-bake look
  setTimeout(() => {
    if (!bakeState.active) {
      // keep done state until they click again
    }
  }, 400);
}

window.addEventListener("popstate", (e) => {
  const page = (e.state && e.state.page) || pageFromPath();
  showPage(page);
});

document.addEventListener("DOMContentLoaded", () => {
  showPage(pageFromPath());
});