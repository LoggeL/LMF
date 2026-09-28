/**
 * Probestücke · registry and mount API  [WP4]  (spec §5.7)
 *
 *   import { PROBE_IDS, mountProbe } from "./probes/index.js";
 *   const handle = await mountProbe(stage, "bomberman-chain", { motion, announce, storage, signal, chip });
 *   handle.pause(); handle.resume(); handle.destroy();
 *
 * Every probe module exports `mount(stage, ctx) → { destroy(), pause(), resume() }` plus
 * `KIND` ("nachbau" | "echt") and `CHIP` (the visible explanation sentence).
 *
 * ctx (all optional):
 *   motion    lib/motion.js object (live .calm, .onCalmChange) — falls back to prefers-reduced-motion
 *   calm      boolean snapshot (used when no motion object is passed)
 *   announce  lib/announce.js function (polite, throttled)
 *   storage   lib/storage.js default export ({ local, session })
 *   signal    AbortSignal — aborting it destroys the probe
 *   chip      true → the probe renders its own Nachbau/Echt chip row (Werkbank). Chapters in
 *             index.html carry a static chip row, so meister.js passes false.
 *
 * Node-importable: nothing touches `window`/`document` at import time.
 *
 * Shipped as a pack (§8 „probes ≤ 22 KB gz“): scripts/pack-probes.mjs builds js/probes/index.js
 * (this registry + Saalplan, Bomberman, Mixer: the three the chapters mount) and js/probes/werk.js
 * (Hashsuche, Jahresregler: Werkbank only) from these sources. Edit here, then re-run the script;
 * tests/probes.spec.js fails when the pack is stale or over budget.
 */

export const PROBE_IDS = ["bomberman-chain", "melodai-mixer", "theater-saalplan", "transcripator-pow", "beatguessr-years"];

const REGISTRY = {
  "bomberman-chain": { kind: "nachbau", load: () => import("./bomberman.js") },
  "melodai-mixer": { kind: "nachbau", load: () => import("./mixer.js") },
  "theater-saalplan": { kind: "nachbau", load: () => import("./saalplan.js") },
  "transcripator-pow": { kind: "echt", load: () => import("./hashsuche.js") },
  "beatguessr-years": { kind: "echt", load: () => import("./jahresregler.js") }, // P2
};

const CSS_HREF = "css/probes.css";
let cssReady = null;

/**
 * probes.css is lazy (main.js injects it on idle); a probe that mounts earlier loads it itself.
 * A sheet that fails is asked for once more; the toys carry their own colours meanwhile.
 */
function ensureCss() {
  if (typeof document === "undefined") return Promise.resolve();
  if (cssReady) return cssReady;
  const href = new URL(CSS_HREF, document.baseURI).href;
  const existing = [...document.querySelectorAll('link[rel="stylesheet"]')].find((l) => l.href === href);
  cssReady = new Promise((resolve) => {
    if (existing?.sheet) return resolve();
    let retried = false;
    const add = (url) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.append(link);
      return link;
    };
    const watch = (link) => {
      link.addEventListener("load", () => resolve(), { once: true });
      link.addEventListener(
        "error",
        () => {
          if (retried) return resolve();
          retried = true;
          watch(add(`${CSS_HREF}?r=1`));
        },
        { once: true },
      );
    };
    watch(existing ?? add(CSS_HREF));
    setTimeout(resolve, 1500); // never block a probe on a stylesheet
  });
  return cssReady;
}

/** A calm source that works with or without lib/motion.js. */
export function calmSource(ctx = {}) {
  const m = ctx.motion;
  if (m && "calm" in m) return m;
  const mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  return {
    get calm() {
      return Boolean(ctx.calm) || Boolean(mq?.matches) || document.documentElement.dataset.motion === "paused";
    },
    onCalmChange() {
      return () => {};
    },
  };
}

/** Throttled polite announcer that works without lib/announce.js. */
export function announcer(ctx = {}) {
  if (typeof ctx.announce === "function") return ctx.announce;
  let el = null;
  return (text) => {
    if (!text) return;
    el ??= document.getElementById("announcer-polite");
    if (!el) {
      el = document.createElement("div");
      el.id = "announcer-polite";
      el.className = "vh";
      el.setAttribute("aria-live", "polite");
      document.body.append(el);
    }
    el.textContent = "";
    requestAnimationFrame(() => (el.textContent = text));
  };
}

let uid = 0;
/** Unique id prefix for aria wiring inside a probe. */
export const nextId = (prefix) => `${prefix}-${++uid}`;

/**
 * Mounts a probe into its stage. Keeps the stage's static fallback (image + „Probestück braucht
 * JavaScript“) and restores it on destroy, so unmounting when far away is invisible.
 */
export async function mountProbe(stage, id, ctx = {}) {
  const entry = REGISTRY[id];
  if (!entry || !stage) throw new Error(`Unbekanntes Probestück: ${id}`);
  const fallback = [...stage.childNodes];
  let mod;
  try {
    [mod] = await Promise.all([entry.load(), ensureCss()]);
  } catch (error) {
    showJammed(stage, ctx);
    throw error;
  }
  if (ctx.signal?.aborted) return { destroy() {}, pause() {}, resume() {} };

  // Safety net for the keyboard (WCAG 2.4.11): a probe that still grows on mount must not push the
  // focused control below it out of view. Only when it was in view before, so a reader who scrolled
  // away on purpose is never yanked back.
  const active = typeof document !== "undefined" ? document.activeElement : null;
  const watch = active && active !== document.body && !stage.contains(active) && stage.compareDocumentPosition(active) & 4 && inView(active);

  const shell = document.createElement("div");
  shell.className = "probe-live";
  stage.replaceChildren(shell);
  stage.classList.add("is-live");
  stage.dataset.probeState = "live";

  let inner;
  try {
    inner = await mod.mount(shell, { ...ctx, id, kind: entry.kind });
  } catch (error) {
    stage.replaceChildren(...fallback);
    stage.classList.remove("is-live");
    delete stage.dataset.probeState;
    showJammed(stage, ctx);
    throw error;
  }

  if (ctx.chip && mod.CHIP) {
    const row = document.createElement("p");
    row.className = "probe-chip-row probe-chip-row--inline";
    const chip = document.createElement("span");
    chip.className = "chip chip--probe";
    chip.textContent = entry.kind === "echt" ? "Echt" : "Nachbau";
    const text = document.createElement("span");
    text.className = "probe-chip-text";
    text.textContent = mod.CHIP;
    row.append(chip, " ", text);
    shell.append(row); // inside the stage, so its reserved height (meister.css) covers the chip too
    const prevDestroy = inner.destroy;
    inner.destroy = () => {
      row.remove();
      prevDestroy.call(inner);
    };
  }

  if (watch) requestAnimationFrame(() => document.activeElement === active && !inView(active) && active.scrollIntoView({ block: "nearest" }));

  let destroyed = false;
  const handle = {
    id,
    kind: entry.kind,
    pause: () => inner.pause?.(),
    resume: () => inner.resume?.(),
    destroy() {
      if (destroyed) return true;
      destroyed = true;
      try {
        inner.destroy?.();
      } finally {
        stage.replaceChildren(...fallback);
        stage.classList.remove("is-live");
        delete stage.dataset.probeState;
      }
      return true;
    },
  };
  ctx.signal?.addEventListener("abort", () => handle.destroy(), { once: true });
  return handle;
}

function inView(el) {
  const r = el.getBoundingClientRect();
  return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight;
}

/** §2.11: „Das Probestück klemmt gerade. Das Original geht aber: {Ausprobieren ↗}“ */
function showJammed(stage, ctx) {
  if (stage.querySelector(".probe-jammed")) return;
  const p = document.createElement("p");
  p.className = "probe-jammed chip chip--note";
  p.append("Das Probestück klemmt gerade.");
  if (ctx.originalUrl) {
    p.append(" Das Original geht aber: ");
    const a = document.createElement("a");
    a.href = ctx.originalUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = 'Ausprobieren <svg class="i" aria-hidden="true" focusable="false"><use href="#i-arrow-ne"></use></svg><span class="vh"> (öffnet neue Seite)</span>';
    p.append(a);
  }
  stage.querySelector(".chip--note")?.replaceWith(p) ?? stage.append(p);
}
