/**
 * #werk/<id> router  [LEAD]  (spec §5.4)
 *
 * The URL is the source of truth: plates and chapter CTAs are plain links to "#werk/<id>".
 * The browser pushes the history entry; the router reacts to `hashchange`.
 *
 *   router.start({ open, close, has })   register the Werkbank (WP2) — call once, after data is ready.
 *        open(id, { from, pushed, direct }) → show the dialog for `id`
 *                                            from: the trigger element (link that was clicked) or null
 *                                            direct: true when the page was loaded with the hash
 *        close({ from })                  → hide the dialog; `from` = element to restore focus to
 *        has(id)                          → boolean, is this a known project id?
 *   router.go(id, { from })     open programmatically (pushes an entry, like a link click)
 *   router.replace(id)          prev/next: location.replace — no history spam, Back still closes
 *   router.close()              if we pushed: history.back(); else replaceState → "#lager"
 *   router.current               id currently open (or null)
 *   router.lastTrigger           element that opened the current Werkstück (or null)
 *   router.parse(hash)           → id | null (case-insensitive, trailing slashes ignored)
 *   router.isWerk(hash)          → true for anything that starts with #werk/ (well-formed or not)
 *   router.degrade(fallback)     the Werkbank could not load: #werk/<id> calls fallback(id) instead
 *                                (main.js points at the project's line in the no-JS list)
 *
 * Malformed Werk hashes (#werk/MelodAI, #werk/melodai/, #werk/melodai?utm=x) are normalised in
 * place; #werk/ with no usable id counts as unknown.
 * Unknown ids (§2.11): toast „Dieses Projekt gibt's hier nicht (mehr).“, the dialog stays closed,
 * the URL is replaced with #lager and the page scrolls there.
 * Other modules can request an open with `document.dispatchEvent(new CustomEvent("lmf:open", {detail:{id}}))`.
 */

import { toast } from "./announce.js";
import { scrollToTarget } from "./scroll.js";

const ROUTE = /^#werk\/([a-z0-9-]+)$/;
export const UNKNOWN_TEXT = "Dieses Projekt gibt’s hier nicht (mehr).";

let handlers = null;
let current = null;
let pushed = false;
let lastTrigger = null;
let pendingTrigger = null;
let started = false;
let navigated = false;

function decode(hash) {
  try {
    return decodeURIComponent(hash || "");
  } catch {
    return hash || "";
  }
}

export function parse(hash = typeof location !== "undefined" ? location.hash : "") {
  // Tracking tails appended to hash links (#werk/melodai?utm=…, …&x, …#y) are not part of the id.
  const bare = decode(hash).trim().replace(/^(#[^?&#]*)[?&#].*$/s, "$1");
  const m = ROUTE.exec(bare.toLowerCase().replace(/\/+$/, ""));
  return m ? m[1] : null;
}

export function isWerk(hash = typeof location !== "undefined" ? location.hash : "") {
  return /^#werk\//i.test(decode(hash));
}

function clean(hash = "#lager") {
  history.replaceState(history.state, "", location.pathname + location.search + hash);
}

/** Unknown-id text in #project-count (§2.11), muted there: the toast announces it once. */
function quietStatus(status) {
  status.setAttribute("aria-live", "off");
  status.textContent = UNKNOWN_TEXT;
  clearTimeout(quietStatus.timer);
  quietStatus.timer = setTimeout(() => status.removeAttribute("aria-live"), 1500);
}

function unknown() {
  const status = document.getElementById("project-count");
  if (status) quietStatus(status);
  // The Lager may mount after this (it waits for its stylesheet) and would overwrite the status
  // with its count: show it again once, right after its first render.
  const lager = document.getElementById("lager");
  if (status && lager && !lager.hasAttribute("data-mounted")) {
    const mo = new MutationObserver(() => {
      if (!lager.hasAttribute("data-mounted")) return;
      mo.disconnect();
      quietStatus(status);
    });
    mo.observe(lager, { attributes: true, attributeFilter: ["data-mounted"] });
  }
  toast(UNKNOWN_TEXT);
  clean("#lager");
  // Sections above the Lager may still be mounting: keep homing in until the layout settles. [WP2]
  if (lager) scrollToTarget(lager, { instant: true });
}

function sync({ direct = false } = {}) {
  if (!handlers) return;
  const id = parse();
  if (!id && isWerk()) {
    // #werk/ with nothing usable after it: same as an unknown id.
    if (current) {
      const from = lastTrigger;
      current = null;
      handlers.close({ from });
    }
    unknown();
    return;
  }
  if (id && location.hash !== `#werk/${id}`) clean(`#werk/${id}`);
  if (id) {
    if (!handlers.has(id)) {
      if (current) {
        const from = lastTrigger;
        current = null;
        handlers.close({ from });
      }
      unknown();
      return;
    }
    if (id === current) return;
    const from = direct ? null : pendingTrigger;
    pendingTrigger = null;
    if (!current) {
      pushed = !direct;
      lastTrigger = from;
    }
    current = id;
    handlers.open(id, { from, pushed, direct });
  } else if (current) {
    const from = lastTrigger;
    current = null;
    pushed = false;
    handlers.close({ from });
  }
}

function onClick(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest('a[href^="#werk/"]') : null;
  if (link) pendingTrigger = link;
}

export const router = {
  parse,
  isWerk,
  get current() {
    return current;
  },
  get lastTrigger() {
    return lastTrigger;
  },
  start(h) {
    handlers = h;
    if (started) return;
    started = true;
    // A #werk/ link clicked before the Werkbank mounted counts as a pushed open, not a direct load.
    if (isWerk()) sync({ direct: !navigated });
  },
  go(id, { from = null } = {}) {
    pendingTrigger = from;
    if (location.hash === `#werk/${id}`) sync();
    else location.hash = `werk/${id}`;
  },
  degrade(fallback) {
    handlers = {
      has: () => true,
      open: (id) => {
        current = null;
        pushed = false;
        clean("#lager");
        fallback(id);
      },
      close() {},
    };
    started = true;
    if (isWerk()) sync({ direct: true });
  },
  replace(id) {
    const url = location.pathname + location.search + `#werk/${id}`;
    location.replace(url);
  },
  close() {
    if (!current) return;
    if (pushed && parse(location.hash)) {
      history.back();
      return;
    }
    const from = lastTrigger;
    current = null;
    pushed = false;
    clean("#lager");
    handlers?.close({ from });
  },
};

// Listen from import time (main.js imports this eagerly) so clicks on #werk/ links made before the
// lazily mounted Werkbank calls start() still record their trigger.
if (typeof document !== "undefined") {
  document.addEventListener("click", onClick, true);
  document.addEventListener("lmf:open", (event) => {
    const id = event.detail?.id;
    if (id) router.go(id, { from: event.detail.from ?? null });
  });
  window.addEventListener("hashchange", () => {
    navigated = true;
    sync();
  });
}

export default router;
