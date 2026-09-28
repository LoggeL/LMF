/**
 * Amboss-Schlag (§5.2)  [WP3]
 * Buttons, filter chips, „Mehr entdecken“, Probestück buttons and anything with [data-anvil]:
 *   press      → .is-struck (translateY 2px, scaleY .965 over --d-strike, back over --d-rebound; CSS)
 *   background → flashes towards --heat-4 for one frame (--strike 1 → 0), cools over --d-cool
 *   sparks     → 6 <i> in one shared aria-hidden overlay, WAAPI, 380–620 ms, ≤ 30 alive page-wide
 * Calm: colour flash only, instant; no sparks. Sound is P2 and not part of this module.
 */
import { motion } from "../lib/motion.js";

const TARGETS = ".button, button.chip, .chip--filter, #load-more, .probe-button, [data-anvil]";
const MAX_LIVE = 30;
let active = null;

export function init() {
  if (active) return active;
  let overlay = null;
  let live = 0;

  const layer = () => {
    if (overlay?.isConnected) return overlay;
    overlay = document.createElement("div");
    overlay.className = "fx-sparks";
    overlay.setAttribute("aria-hidden", "true");
    document.body.append(overlay);
    return overlay;
  };

  function sparks(x, y) {
    const box = layer();
    const n = Math.min(6, MAX_LIVE - live);
    for (let i = 0; i < n; i++) {
      const s = document.createElement("i");
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95;
      const v = 26 + Math.random() * 38;
      const dx = Math.cos(a) * v;
      const dy = Math.sin(a) * v;
      const dur = 380 + Math.random() * 240;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      box.append(s);
      live++;
      const anim = s.animate(
        [
          { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy * 0.7}px)) scale(.9)`, opacity: 1, offset: 0.45 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 28}px)) scale(.4)`, opacity: 0 },
        ],
        { duration: dur, easing: "cubic-bezier(.2,.6,.4,1)" },
      );
      const done = () => {
        s.remove();
        live--;
      };
      anim.onfinish = done;
      anim.oncancel = done;
    }
  }

  function strike(el, x, y) {
    el.classList.add("is-struck");
    setTimeout(() => el.classList.remove("is-struck"), 90);
    const calm = motion.calm;
    try {
      el.animate([{ "--strike": 1 }, { "--strike": 0 }], calm ? { duration: 140, easing: "steps(1, end)" } : { duration: 1600, easing: "cubic-bezier(.16,1,.3,1)" });
    } catch {
      /* registered-property animation unsupported */
    }
    if (!calm && live < MAX_LIVE) sparks(x, y);
  }

  const onDown = (e) => {
    if (e.button > 0) return;
    const el = e.target instanceof Element ? e.target.closest(TARGETS) : null;
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    strike(el, e.clientX, e.clientY);
  };
  const onKey = (e) => {
    if (e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
    const el = e.target instanceof Element ? e.target.closest(TARGETS) : null;
    if (!el || el !== e.target || el.disabled) return;
    if (e.key === " " && el.tagName === "A") return;
    const r = el.getBoundingClientRect();
    strike(el, r.left + r.width / 2, r.top + r.height * 0.4);
  };

  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("keydown", onKey);

  active = {
    destroy() {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      overlay?.remove();
      active = null;
    },
  };
  return active;
}

export default init;
