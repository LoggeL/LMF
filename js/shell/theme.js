/**
 * Theme toggle  [LEAD]
 * - Without a stored value the site follows the system (boot script in <head> + live listener here).
 * - A click stores the explicit choice under `lmf-theme` ("dark" | "light").
 * - aria-label: „Dunkles Design aktivieren“ / „Helles Design aktivieren“ (tested); the tooltip (title) says the same.
 * - <meta name="theme-color"> follows --bg of the active theme (CHROME mirrors tokens.css; reading it
 *   back with getComputedStyle during boot forced a full style recalc, ~80 ms on a slow phone).
 */

import { local } from "../lib/storage.js";

const KEY = "lmf-theme";
const root = document.documentElement;
const systemDark = matchMedia("(prefers-color-scheme: dark)");
/** --bg per theme, as in css/tokens.css (:root[data-theme=…]). */
const CHROME = { light: "#ede9e2", dark: "#0e0c0b" };

function syncChrome(button) {
  const dark = root.dataset.theme === "dark";
  if (button) {
    const label = dark ? "Helles Design aktivieren" : "Dunkles Design aktivieren";
    button.setAttribute("aria-label", label);
    button.title = label;
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", CHROME[dark ? "dark" : "light"]);
}

export function setTheme(theme, { persist = true } = {}) {
  root.dataset.theme = theme === "dark" ? "dark" : "light";
  if (persist) local.set(KEY, root.dataset.theme);
  syncChrome(document.getElementById("theme-toggle"));
  document.dispatchEvent(new CustomEvent("lmf:theme", { detail: { theme: root.dataset.theme } }));
}

export function initTheme() {
  const button = document.getElementById("theme-toggle");
  const stored = local.get(KEY);
  if (stored !== "dark" && stored !== "light") root.dataset.theme = systemDark.matches ? "dark" : "light";
  syncChrome(button);

  button?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  // Follow the system only while the visitor has not chosen explicitly.
  systemDark.addEventListener?.("change", (event) => {
    const choice = local.get(KEY);
    if (choice === "dark" || choice === "light") return;
    setTheme(event.matches ? "dark" : "light", { persist: false });
  });
}

export default initTheme;
