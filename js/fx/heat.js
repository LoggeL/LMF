/**
 * Heat under the hand (§5.2)  [WP3]
 * One delegated, rAF-throttled pointermove on document. Every [data-heat] element gets the pointer
 * position as --mx / --my (percent), which css/fx.css and base.css turn into a local hot spot.
 * Keyboard focus resets the spot to the token default (50% / 40%) so focus looks like heat.
 * Rects are cached per hovered element and dropped on scroll/resize.
 */
let active = null;

export function init() {
  if (active) return active;
  let el = null;
  let rect = null;
  let ev = null;
  let raf = 0;

  const apply = () => {
    raf = 0;
    if (!ev) return;
    const target = ev.target instanceof Element ? ev.target.closest("[data-heat]") : null;
    if (target !== el) {
      el = target;
      rect = null;
    }
    if (!el) return;
    rect ??= el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    el.style.setProperty("--mx", `${(((ev.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(((ev.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
  };
  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    ev = e;
    if (!raf) raf = requestAnimationFrame(apply);
  };
  const drop = () => {
    rect = null;
  };
  const onFocus = (e) => {
    const t = e.target instanceof Element ? e.target.closest("[data-heat]") : null;
    if (t && (e.target.matches(":focus-visible") || !t.matches(":hover"))) {
      t.style.removeProperty("--mx");
      t.style.removeProperty("--my");
    }
  };

  document.addEventListener("pointermove", onMove, { passive: true });
  addEventListener("scroll", drop, { passive: true, capture: true });
  addEventListener("resize", drop, { passive: true });
  document.addEventListener("focusin", onFocus);

  active = {
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      removeEventListener("scroll", drop, { capture: true });
      removeEventListener("resize", drop);
      document.removeEventListener("focusin", onFocus);
      active = null;
    },
  };
  return active;
}

export default init;
