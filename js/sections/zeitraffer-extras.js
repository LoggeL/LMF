/**
 * Zeitraffer extras  [WP5]: tooltip (hover/focus, Escape closes it, WCAG 1.4.13), drag-to-pan
 * with a mouse, the roving arrow keys (←/→ in time, ↑/↓ lanes, Home/End; only items that open
 * something or carry a milestone are stops), the year jumps, and „Zeitraffer abspielen“ (rewind,
 * then scrollLeft → Stand over 12 s; any input or scrolling the timeline off screen stops it).
 * Loaded by ./zeitraffer.js on the first pointer, focus, key, year or play intent.
 */
export default function extras({ wrap, scroller, playBtn, st, motion, announce, maxLeft, readout, on, rove, gw, span }) {
  const tip = wrap.querySelector(".zr-tip");
  let tipFor = null;
  /** Text: data-tip where it adds something (portfolio chips), otherwise the item's own name. */
  function showTip(el) {
    const text = el?.dataset.tip ?? el?.getAttribute("aria-label")?.replace(/ \(öffnet neue Seite\)$/, "");
    if (!text) return;
    tipFor?.removeAttribute("aria-describedby");
    tipFor = el;
    tip.textContent = text;
    tip.hidden = false;
    // A tooltip that repeats the accessible name is not wired as its description (no double read).
    if (el.dataset.tip) el.setAttribute("aria-describedby", "zr-tip");
    const v = tip.parentNode.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const above = r.top - v.top - tip.offsetHeight - 8;
    tip.style.left = `${Math.min(Math.max(8, r.left - v.left + r.width / 2 - tip.offsetWidth / 2), v.width - tip.offsetWidth - 8)}px`;
    tip.style.top = `${above < 4 ? r.bottom - v.top + 8 : above}px`;
  }
  function hideTip() {
    tip.hidden = true;
    tipFor?.removeAttribute("aria-describedby");
    tipFor = null;
  }

  function stop() {
    if (!st.playing) return;
    cancelAnimationFrame(st.playing);
    st.playing = 0;
    wrap.classList.remove("is-playing");
    playBtn.lastChild.textContent = "Zeitraffer abspielen";
    playBtn.setAttribute("aria-pressed", "false");
    removeEventListener("wheel", stop);
    removeEventListener("touchstart", stop);
    st.pinned = scroller.scrollLeft >= maxLeft() - 2;
    readout();
  }
  function play() {
    const max = maxLeft();
    if (max <= 0 || motion.calm) return;
    if (scroller.scrollLeft >= max - 2) scroller.scrollLeft = 0;
    const from = scroller.scrollLeft;
    const dur = 12000 * (1 - from / max);
    const t0 = performance.now();
    st.pinned = false;
    wrap.classList.add("is-playing");
    playBtn.lastChild.textContent = "Anhalten";
    playBtn.setAttribute("aria-pressed", "true");
    addEventListener("wheel", stop, { passive: true });
    addEventListener("touchstart", stop, { passive: true });
    const step = (t) => {
      const f = Math.min(1, (t - t0) / dur);
      scroller.scrollLeft = from + (max - from) * f;
      readout();
      st.playing = requestAnimationFrame(step);
      if (f >= 1) {
        stop();
        announce?.("Zeitraffer am Stand angekommen.");
      }
    };
    st.playing = requestAnimationFrame(step);
  }

  /* Drag to pan (mouse only); hover shows the tooltip while focus is elsewhere. */
  let drag = null;
  const onUp = () => {
    if (drag?.moved) {
      const swallow = (ev) => (ev.preventDefault(), ev.stopPropagation());
      scroller.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => scroller.removeEventListener("click", swallow, { capture: true }));
    }
    drag = null;
    wrap.classList.remove("is-dragging");
  };
  const hoverTip = (e) => {
    const el = e.target.closest?.("[data-zr-item]");
    if (el && el !== tipFor && !scroller.contains(document.activeElement)) showTip(el);
  };
  on(scroller, "focusin", (e) => showTip(e.target.closest?.("[data-zr-item]")));
  on(scroller, "focusout", (e) => !scroller.contains(e.relatedTarget) && hideTip());
  on(scroller, "pointerleave", () => !scroller.contains(document.activeElement) && hideTip());
  on(scroller, "pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button === 0) drag = { x: e.clientX, left: scroller.scrollLeft, id: e.pointerId };
  });
  on(scroller, "pointermove", (e) => {
    if (!drag) return hoverTip(e);
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) {
      drag.moved = true;
      scroller.setPointerCapture?.(drag.id);
      wrap.classList.add("is-dragging");
    }
    if (drag.moved) scroller.scrollLeft = drag.left - dx;
  });
  on(scroller, "pointerup", onUp);
  on(scroller, "pointercancel", onUp);

  // Catch up with the intent that loaded this module (a hovered or focused item).
  const active = scroller.contains(document.activeElement) ? document.activeElement : scroller.querySelector("[data-zr-item]:hover");
  if (active) showTip(active.closest("[data-zr-item]"));

  /* Roving tabindex: the key was claimed (preventDefault) by the core module. */
  const items = (lane) => [...lane.querySelectorAll("[data-zr-nav]")];
  function key(e) {
    const el = e.target.closest?.("[data-zr-nav]");
    if (!el) return;
    const lane = el.closest(".zr-lane");
    const list = items(lane);
    const i = list.indexOf(el);
    const lanes = [...scroller.querySelectorAll(".zr-lane")].filter((l) => l.querySelector("[data-zr-nav]"));
    const li = lanes.indexOf(lane);
    const near = (l) => l && items(l).reduce((b, n) => (Math.abs(n.dataset.x - el.dataset.x) < Math.abs(b.dataset.x - el.dataset.x) ? n : b));
    const to = { ArrowRight: list[i + 1], ArrowLeft: list[i - 1], ArrowDown: near(lanes[li + 1]), ArrowUp: near(lanes[li - 1]), Home: list[0], End: list[list.length - 1] }[e.key];
    if (!to) return;
    rove(to);
    to.focus({ preventScroll: true });
    // .zr-scroll has scroll-padding for the sticky labels, so "nearest" keeps clips clear of them.
    to.scrollIntoView({ block: "nearest", inline: "nearest", behavior: motion.scrollBehavior });
    setTimeout(() => document.activeElement === to && showTip(to), motion.calm ? 0 : 320);
  }
  /** Solves scrollLeft so the travelling playhead lands on 1 January of that year. */
  function jump(y) {
    const seg = st.L?.years.find((s) => s.y === y);
    if (!seg) return;
    stop();
    scroller.scrollTo({ left: Math.max(0, (seg.x + 1 - gw()) / (1 + span() / Math.max(1, maxLeft()))), behavior: motion.scrollBehavior });
  }

  return {
    showTip,
    hideTip,
    stop,
    key,
    jump,
    toggle: () => (st.playing ? stop() : play()),
    onScroll() {
      if (tipFor && document.activeElement === tipFor) showTip(tipFor);
      else if (tipFor) hideTip();
    },
    destroy() {
      stop();
      hideTip();
    },
  };
}
