/**
 * In-page jumps that land where they should  [LEAD]
 *
 * Why: the page below the fold is not final when a jump starts. `content-visibility:auto` sections
 * are measured with a placeholder size until they render, sections mount one viewport ahead
 * (IntersectionObserver), section CSS arrives after `load`, and probe stages swap poster ↔ live.
 * A native smooth scroll aims at the target's position at click time and stops there, so
 * „Kontakt“ used to end up somewhere in the Werkstatt.
 *
 *   scrollToTarget(el, { instant })  scrolls el under the sticky header (scroll-padding-top) and
 *                                    keeps homing in while the layout moves: every frame the goal is
 *                                    re-measured; if it moved, the scroll is re-aimed. Done once the
 *                                    goal and the scroll position agree for ~300 ms (or after 4 s,
 *                                    then one instant correction). Wheel/touch/keys cancel it.
 *   watchAnchors({ beforeJump })     same-document links (href="#…", not #werk/) and hashchange
 *                                    to a non-#werk/ fragment run scrollToTarget. The browser's own
 *                                    fragment navigation (history entry, focus starting point) still
 *                                    happens; this only takes over the scrolling.
 *
 * Calm (reduced motion or „Bewegung pausieren“) → instant jumps.
 */

import { motion } from "./motion.js";

const EPS = 2;
const SETTLE_MS = 300;
const GIVE_UP_MS = 4000;

let active = null;

function padTop() {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
}

function goalFor(el) {
  const root = document.documentElement;
  const max = Math.max(0, root.scrollHeight - innerHeight);
  const top = scrollY + el.getBoundingClientRect().top - padTop();
  return Math.round(Math.max(0, Math.min(max, top)));
}

export function cancelScroll() {
  active?.cancel();
}

/**
 * @param {Element} el
 * @param {{instant?: boolean}} [opts]
 * @returns {Promise<void>} resolves when settled or cancelled
 */
export function scrollToTarget(el, { instant = motion.calm } = {}) {
  active?.cancel();
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    const behavior = instant ? "instant" : "smooth";
    const t0 = performance.now();
    let planned = goalFor(el);
    let stableSince = 0;
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      removeEventListener("wheel", cancel, true);
      removeEventListener("touchstart", cancel, true);
      removeEventListener("keydown", onKey, true);
      if (active === ctrl) active = null;
      resolve();
    };
    const cancel = () => stop();
    const onKey = (e) => {
      if (!["Shift", "Control", "Alt", "Meta", "Tab"].includes(e.key)) stop();
    };
    const ctrl = { cancel };
    active = ctrl;
    addEventListener("wheel", cancel, { capture: true, passive: true });
    addEventListener("touchstart", cancel, { capture: true, passive: true });
    addEventListener("keydown", onKey, true);

    // Long jumps: cut to one screen before the goal, then glide in. Crossing 20 000 px smoothly
    // mounts every section on the way (the goal keeps moving) and takes seconds; the last screen
    // of travel is what the eye reads as the motion anyway.
    const distance = planned - scrollY;
    if (!instant && Math.abs(distance) > 3 * innerHeight) {
      scrollTo({ top: planned - Math.sign(distance) * innerHeight, behavior: "instant" });
      planned = goalFor(el);
    }
    scrollTo({ top: planned, behavior });
    const tick = (now) => {
      if (!el.isConnected) return stop();
      const goal = goalFor(el);
      if (Math.abs(goal - planned) > EPS) {
        // The page moved under us (a section rendered or mounted): re-aim from where we are.
        planned = goal;
        stableSince = 0;
        scrollTo({ top: goal, behavior });
      } else if (Math.abs(scrollY - goal) <= EPS) {
        stableSince ||= now;
        if (now - stableSince >= SETTLE_MS) return stop();
      } else {
        stableSince = 0;
      }
      if (now - t0 > GIVE_UP_MS) {
        scrollTo({ top: goalFor(el), behavior: "instant" });
        return stop();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });
}

function targetOf(hash) {
  if (!hash || hash === "#" || hash.startsWith("#werk/") || hash.startsWith("#werk%2F")) return null;
  let id;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
  return document.getElementById(id);
}

/**
 * @param {{beforeJump?: () => void}} [opts] beforeJump runs first (main.js loads the section CSS
 *        right away, so the layout the jump aims at is the final one as early as possible).
 */
export function watchAnchors({ beforeJump } = {}) {
  const jump = (el) => {
    beforeJump?.();
    // After the browser's own fragment navigation has started (same task → next frame).
    requestAnimationFrame(() => scrollToTarget(el));
  };
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    const el = targetOf(link.getAttribute("href"));
    if (el) jump(el);
  });
  addEventListener("hashchange", () => {
    const el = targetOf(location.hash);
    if (el) jump(el);
  });
}

export default scrollToTarget;
