const VALID_PAGES = ["dashboard", "leaderboard", "stats", "settings"];

function showPage(page) {
  if (!VALID_PAGES.includes(page)) page = "dashboard";

  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  const section = document.getElementById(page);
  if (section) section.classList.add("active");

  document.querySelectorAll("nav .nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  // Keep URL in sync (optional, nice for later)
  try {
    const path = "/" + (page === "dashboard" ? "" : page);
    const cur = (location.pathname || "/").replace(/\/+$/, "") || "/";
    if (cur !== path && cur !== "/" + page) {
      history.pushState({ page }, "", path || "/");
    }
  } catch (_) {}
}

// Restore page from URL on load
function pageFromPath() {
  try {
    const parts = (location.pathname || "/").split("/").filter(Boolean);
    const last = (parts[parts.length - 1] || "").toLowerCase();
    if (VALID_PAGES.includes(last)) return last;
  } catch (_) {}
  return "dashboard";
}

window.addEventListener("popstate", (e) => {
  const page = (e.state && e.state.page) || pageFromPath();
  showPage(page);
});

document.addEventListener("DOMContentLoaded", () => {
  showPage(pageFromPath());
});