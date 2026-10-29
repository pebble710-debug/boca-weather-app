// Light / Dark / Auto appearance switch
const THEME_KEY = "boca-weather-theme";
const THEME_CHOICES = ["light", "dark", "auto"];
const THEME_COLORS = { light: "#3a8ee6", dark: "#0b1530" };
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function getThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEME_CHOICES.includes(saved) ? saved : "auto";
  } catch (e) {
    return "auto";
  }
}

function saveThemePreference(choice) {
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch (e) {
    // Storage blocked (e.g. private mode): the theme still applies for this visit
  }
}

function applyTheme(choice) {
  const resolved = choice === "auto" ? (systemDark.matches ? "dark" : "light") : choice;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-choice", choice);

  document.querySelector('meta[name="theme-color"]').setAttribute("content", THEME_COLORS[resolved]);

  const switcher = document.querySelector(".theme-switch");
  switcher.style.setProperty("--theme-index", THEME_CHOICES.indexOf(choice));
  switcher.querySelectorAll(".theme-option").forEach((btn) => {
    const selected = btn.dataset.themeChoice === choice;
    btn.setAttribute("aria-checked", selected);
    btn.tabIndex = selected ? 0 : -1;
  });
}

function setTheme(choice) {
  saveThemePreference(choice);
  applyTheme(choice);
}

document.querySelectorAll(".theme-option").forEach((btn) => {
  btn.addEventListener("click", () => setTheme(btn.dataset.themeChoice));

  // Arrow keys move between options, like a native segmented control
  btn.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const index = THEME_CHOICES.indexOf(getThemePreference());
    const next = THEME_CHOICES[(index + step + THEME_CHOICES.length) % THEME_CHOICES.length];
    setTheme(next);
    document.querySelector(`[data-theme-choice="${next}"]`).focus();
  });
});

// In Auto mode, follow the device setting live
systemDark.addEventListener("change", () => {
  if (getThemePreference() === "auto") applyTheme("auto");
});

applyTheme(getThemePreference());
