/**
 * Logge Media Forge · main.js  [LEAD]
 * Boot, section registry, lazy scheduling, data-bind refresh.
 * The frozen contract (section module API, ctx, Data, events, data-bind, renderers, CSS layers)
 * is in docs/contract.md (spec §6.2).
 */

import { motion } from "./lib/motion.js";
import { router } from "./lib/router.js";
import { announce, toast } from "./lib/announce.js";
import storage from "./lib/storage.js";
import format from "./lib/format.js";
import { loadData } from "./lib/data.js";
import { formatBinding } from "./lib/derive.js";
import { initTheme } from "./shell/theme.js";
import { initNav } from "./shell/nav.js";
import { initMotionToggle } from "./shell/motion-toggle.js";
import { scrollToTarget, watchAnchors } from "./lib/scroll.js";

/**
 * Section registry. when: "eager" now · "intent" (Werkbank) on #werk/…, the first reach for a
 * Werkstück (hover/focus on a #werk/ link, hashchange, lmf:open) or idle · "idle" after load + idle ·
 * "visible" one viewport ahead (IntersectionObserver). css: injected on load, earlier when on
 * screen or for an in-page jump; a module mounts once its sheets settled. critical: sheets at once.
 */
const SKELETONS = "css/skeletons.css";
export const SECTIONS = [
  { name: "lager", selector: "#lager", when: "eager", src: "./sections/lager.js", css: ["css/sections/lager.css", SKELETONS] },
  { name: "werkbank", selector: "#werkbank", when: "intent", src: "./werkbank/werkbank.pack.js", css: [SKELETONS], critical: true },
  { name: "warm", selector: "#warm", when: "eager", src: "./sections/warm.js", css: ["css/sections/lager.css"], critical: true },
  { name: "esse", selector: "#esse", when: "idle", src: "./sections/esse.js" },
  { name: "meister", selector: "#meisterstuecke", when: "visible", src: "./sections/meister.js", css: [SKELETONS, "css/sections/meister.css", "css/werkbank.css"] },
  { name: "film", selector: "#kapitel-iv", when: "visible", src: "./sections/film.js", css: [SKELETONS, "css/sections/film.css"] },
  { name: "schichtbuch", selector: "#schichtbuch", when: "visible", src: "./sections/schichtbuch.js", css: [SKELETONS, "css/sections/schichtbuch.css"] },
  { name: "werkstatt", selector: "#werkstatt", when: "visible", src: "./sections/werkstatt.js", css: [SKELETONS, "css/sections/werkstatt.css"] },
  { name: "abspann", selector: "#abspann", when: "visible", src: "./sections/abspann.js", css: [SKELETONS, "css/sections/werkstatt.css"] },
  { name: "abseits", selector: "#abseits", when: "visible", src: "./sections/abseits.js", css: [SKELETONS, "css/sections/abseits.css"] },
  { name: "kontakt", selector: "#kontakt", when: "visible", src: "./sections/kontakt.js", css: [SKELETONS, "css/sections/kontakt.css"] },
];
for (const entry of SECTIONS) entry.load = (attempt = 0) => import(attempt ? `${entry.src}?r=${attempt}` : entry.src);

/** Boolean flags for [data-show-if], computed from bindings. Missing inputs → false (element stays hidden). */
const FLAGS = {
  "repos.surge": (b) => Number.isFinite(+b["repos.currentYear"]) && Number.isFinite(+b["repos.before"]) && +b["repos.currentYear"] > +b["repos.before"],
  "stars.isMelodai": (b) => b["stars.maxId"] === "melodai",
  // Kapitel IV dek: „Alle 7 laufen …“ when every ski film is also on jupeters.de, else „5 davon laufen …“ [WP3]
  "films.skiAllOnJp": (b) => +b["films.skiOnJp"] > 0 && +b["films.skiOnJp"] === +b["films.ski"],
  "films.skiSomeOnJp": (b) => Number.isFinite(+b["films.skiOnJp"]) && +b["films.skiOnJp"] < +b["films.ski"],
};

/** A section whose module failed to load (flaky network) is retried this often, with backoff. */
const MAX_ATTEMPTS = 3;

const mounted = new Map();
const attempts = new Map();

/* ── Section stylesheets (not render-blocking, §8) ─────────────────────────────────────────────── */

const sheets = new Map();
/** `load`, then the first idle moment (≤ 600 ms): below-the-fold work never delays `load` itself. */
const pageLoaded = new Promise((resolve) => {
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(() => resolve(), { timeout: 600 }) : setTimeout(resolve, 50));
  if (document.readyState === "complete") idle();
  else addEventListener("load", idle, { once: true });
});

/** Adds <link rel=stylesheet> once; resolves when it loaded or failed (one retry), never rejects. */
function loadSheet(href) {
  if (sheets.has(href)) return sheets.get(href);
  const attach = (url) =>
    new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = () => resolve(true);
      link.onerror = () => {
        link.remove();
        resolve(false);
      };
      document.head.append(link);
    });
  const done = attach(href).then((ok) => ok || attach(`${href}?r=1`));
  const settled = Promise.race([done, new Promise((r) => setTimeout(r, 5000))]).then(() => {});
  sheets.set(href, settled);
  return settled;
}

const ALL_SHEETS = [...new Set(SECTIONS.flatMap((e) => e.css ?? []))];
let allRequested = false;
/** Every section sheet, now (after `load`, on an in-page jump, or on reload/back mid-page). */
function loadAllSheets() {
  if (allRequested) return;
  allRequested = true;
  ALL_SHEETS.forEach(loadSheet);
}

function onScreen(el) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight;
}

/** Waits for the section's sheets. Off-screen sections before `load` wait for `load` (budget §8). */
async function sheetsFor(entry, root) {
  if (!entry.css?.length) return;
  if (!entry.critical && !allRequested && !onScreen(root)) await pageLoaded;
  await Promise.all(entry.css.map(loadSheet));
}

/* ── data-bind ───────────────────────────────────────────────────────────────────────────────────── */

export function applyBindings(bindings = {}, root = document) {
  for (const el of root.querySelectorAll("[data-bind]")) {
    const key = el.dataset.bind;
    if (Object.prototype.hasOwnProperty.call(bindings, key)) {
      // Same formatter as scripts/prerender.mjs, so runtime text equals the prerendered text.
      const value = formatBinding(bindings[key]);
      if (value !== "" && el.textContent !== value) el.textContent = value;
    }
  }
  for (const el of root.querySelectorAll("[data-show-if]")) {
    const flag = FLAGS[el.dataset.showIf];
    el.hidden = !(flag && flag(bindings));
  }
}

/* ── Mounting ────────────────────────────────────────────────────────────────────────────────────── */

function makeCtx(name, data) {
  return { data, router, motion, announce, bus: document, storage, format, name };
}

async function mountSection(entry, data) {
  if (mounted.has(entry.name)) return;
  const root = document.querySelector(entry.selector);
  if (!root) return;
  mounted.set(entry.name, null);
  let mod;
  const tried = attempts.get(entry.name) ?? 0;
  // Off-screen sections wait for `load` (§8).
  const early = entry.when !== "visible" || allRequested || onScreen(root);
  if (!early) await pageLoaded;
  // Lazy data files this section reads (data.needFor, WP1), then the bindings again.
  const lazyData = entry.when === "visible" ? data.then((d) => d?.needFor?.(entry.name).then(() => applyBindings(d.bindings))).catch(() => {}) : null;
  try {
    [mod] = await Promise.all([entry.load(tried), sheetsFor(entry, root), lazyData]);
  } catch (error) {
    // Fetch failed: retry later under a fresh URL (?r=n; the failed one stays cached).
    mounted.delete(entry.name);
    const n = tried + 1;
    attempts.set(entry.name, n);
    // The fresh URL failed too: a static dependency is stuck in the module map.
    if (n >= 2 && (await reloadOnce(entry, error))) return;
    if (n < MAX_ATTEMPTS) setTimeout(() => mountSection(entry, data), 800 * n);
    else giveUp(entry, root, data, error);
    return;
  }
  try {
    if (typeof mod.mount !== "function") return;
    const handle = await mod.mount(root, makeCtx(entry.name, data));
    mounted.set(entry.name, handle ?? null);
    root.dataset.mounted = "";
  } catch (error) {
    console.warn(`[lmf] Abschnitt „${entry.name}“ konnte nicht starten:`, error);
  }
}

let reloading = false;

/**
 * A failed module fetch (entry and static imports) stays cached for the page's life, so only a
 * reload helps once a fresh URL failed too. Reload once per tab session (key shared with the boot
 * watchdog in index.html, so no loop), only for a fetch failure (TypeError) and when the server answers.
 * Never while the visitor is busy: scrolled past the first screen, a dialog open or a probe running
 * would all be lost, so then the section stays in its no-JS form instead.
 */
function busy() {
  return scrollY >= innerHeight || router.isWerk() || !!document.querySelector("dialog[open], .probe-stage.is-live");
}

async function reloadOnce(entry, error) {
  if (reloading) return true;
  if (!(error instanceof TypeError) || busy()) return false;
  try {
    if (sessionStorage.getItem("lmf-reloaded")) return false;
    if (!(await fetch(new URL(entry.src, import.meta.url), { method: "HEAD", cache: "no-store" })).ok) return false;
    sessionStorage.setItem("lmf-reloaded", "1");
  } catch {
    return false;
  }
  reloading = true;
  console.warn(`[lmf] „${entry.name}“: Modul hängt im Cache, lade einmal neu.`);
  location.reload();
  return true;
}

/** A section that cannot load stays usable in its no-JS form. */
function giveUp(entry, root, data, error) {
  console.warn(`[lmf] Abschnitt „${entry.name}“ konnte nicht geladen werden:`, error);
  mounted.set(entry.name, null);
  root.dataset.failed = "";
  if (entry.name === "lager") {
    const list = document.getElementById("lager-static");
    if (list) list.hidden = false;
  }
  if (entry.name === "werkbank") router.degrade(werkFallback(data));
}

/** Without the Werkbank, #werk/<id> points at the project's line in the prerendered list. */
function werkFallback(data) {
  return async (id) => {
    const d = await data;
    const project = d?.byId?.get(id);
    const list = document.getElementById("lager-static");
    if (!list || !project) {
      toast("Dieses Projekt gibt’s hier nicht (mehr).");
      scrollToTarget(document.getElementById("lager"));
      return;
    }
    list.hidden = false;
    const item =
      list.querySelector(`[data-werk="${CSS.escape(id)}"]`) ??
      [...list.querySelectorAll("a")].find((a) => project.link && a.getAttribute("href") === project.link)?.closest("li");
    toast("Die Werkbank klemmt gerade. Hier ist der direkte Link.");
    if (!item) return scrollToTarget(list);
    await scrollToTarget(item);
    item.querySelector("a")?.focus({ preventScroll: true });
  };
}

function whenIdle(fn, timeout = 1500) {
  const run = () => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 200));
  if (document.readyState === "complete") run();
  else addEventListener("load", run, { once: true });
}

const WERK_LINK = 'a[href^="#werk/"]';

/** Mounts on the first sign that a Werkstück is wanted, else on idle. */
function onIntent(entry, data) {
  const go = () => {
    document.removeEventListener("pointerover", reach, true);
    document.removeEventListener("focusin", reach, true);
    removeEventListener("hashchange", hash);
    document.removeEventListener("lmf:open", go);
    mountSection(entry, data);
  };
  const reach = (e) => {
    if (e.target instanceof Element && e.target.closest(WERK_LINK)) go();
  };
  const hash = () => {
    if (router.isWerk()) go();
  };
  if (router.isWerk()) return go();
  document.addEventListener("pointerover", reach, { capture: true, passive: true });
  document.addEventListener("focusin", reach, true);
  addEventListener("hashchange", hash);
  document.addEventListener("lmf:open", go);
  whenIdle(go, 3000);
}

function schedule(data) {
  const lazy = [];
  for (const entry of SECTIONS) {
    if (entry.when === "eager") mountSection(entry, data);
    else if (entry.when === "intent") onIntent(entry, data);
    else if (entry.when === "idle") whenIdle(() => mountSection(entry, data));
    else lazy.push(entry);
  }
  if (!("IntersectionObserver" in window)) {
    lazy.forEach((entry) => whenIdle(() => mountSection(entry, data)));
    return;
  }
  const bySelector = new Map();
  const io = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        if (!record.isIntersecting) continue;
        io.unobserve(record.target);
        const entry = bySelector.get(record.target);
        if (entry) mountSection(entry, data);
      }
    },
    { rootMargin: "100% 0px" },
  );
  for (const entry of lazy) {
    const el = document.querySelector(entry.selector);
    if (!el) continue;
    bySelector.set(el, entry);
    io.observe(el);
  }
}

/* ── Boot ────────────────────────────────────────────────────────────────────────────────────────── */

function boot() {
  // The watchdog in index.html falls back to the no-JS layout when this never happens.
  document.documentElement.dataset.booted = "";
  initTheme();
  initMotionToggle();
  initNav();

  // The only Date.now() use on the site (§2.10).
  const year = document.getElementById("current-year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Reload/Back mid-page restores the scroll before `load`: the sheets must not wait.
  const nav = performance.getEntriesByType?.("navigation")?.[0]?.type;
  if (nav === "reload" || nav === "back_forward" || (location.hash && !router.isWerk())) loadAllSheets();
  pageLoaded.then(loadAllSheets);
  watchAnchors({ beforeJump: loadAllSheets });

  const data = loadData();
  schedule(data);
  // werkbank.css and probes.css stay lazy: js/werkbank/werkbank.js loads its sheet before the
  // dialog opens (the Meisterstücke list it too, for the shared spec-sheet styles), and
  // js/probes/index.js loads probes.css with the first probe.
  whenIdle(loadAllSheets, 3000);

  data.then((d) => {
    applyBindings(d?.bindings ?? {});
    document.dispatchEvent(new CustomEvent("lmf:data", { detail: { data: d } }));
  });

  // Deep links (#kontakt, old #about …) land once the async sections above have their height.
  data.then(() => {
    if (!location.hash || router.isWerk()) return;
    let target = null;
    try {
      target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch {}
    if (target) requestAnimationFrame(() => scrollToTarget(target, { instant: true }));
  });
}

boot();

/** Debug/test handle (read-only use). */
export const __lmf = { mounted, SECTIONS, FLAGS };
