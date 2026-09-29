/**
 * Noch warm: what is on the anvil right now (spec §2.2, §5.5)  [WP2]
 * Top 8 by repo.pushedAt (desc), native horizontal scroll with snap plus visible ‹ › buttons.
 * Plates reuse js/render/plate.js with variant "rail" (stamp row: only the glow badge, „glüht“ / „warm“).
 */
import { html, icon, $ } from "../lib/dom.js";
import { plateContext, renderPlate } from "../render/plate.js";
import { loadStrips } from "./lager.js";

export const RAIL_SIZE = 8;

/** Pure: the rail's projects, most recent push first; ties keep JSON order. */
export function warmList(projects = [], n = RAIL_SIZE) {
  return projects
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => typeof p.repo?.pushedAt === "string")
    .sort((a, b) => (a.p.repo.pushedAt < b.p.repo.pushedAt ? 1 : a.p.repo.pushedAt > b.p.repo.pushedAt ? -1 : a.i - b.i))
    .slice(0, n)
    .map(({ p }) => p);
}

export async function mount(root, ctx) {
  const list = $('[data-mount="warm-plates"]', root);
  const rail = $('[data-mount="warm-rail"]', root);
  const controls = $("[data-rail-controls]", root);
  const prev = $('[data-rail="prev"]', root);
  const next = $('[data-rail="next"]', root);
  const data = await ctx.data;
  const projects = data?.projects;

  if (!projects || !list) {
    if (list)
      list.outerHTML = String(
        html`<p class="warm-error">Gerade nicht erreichbar. <a href="https://github.com/LoggeL" target="_blank" rel="noopener noreferrer">Zu GitHub ${icon("arrow-ne")}<span class="vh"> (öffnet neue Seite)</span></a></p>`,
      );
    return { destroy() {} };
  }

  const items = warmList(projects);
  const pctx = plateContext(data, { variant: "rail", strips: new Map() });
  list.innerHTML = items.map((p, i) => `<li class="warm-item">${renderPlate(p, pctx, i)}</li>`).join("");
  for (const el of list.querySelectorAll(".plate")) el.classList.add("is-fresh");
  root.dataset.state = "ready";
  loadStrips(data, pctx.strips, list);
  // The rail snapped to the end tile before the plates arrived; Chrome keeps that snap target.
  rail.scrollTo({ left: 0, behavior: "instant" });

  const step = (dir) => rail.scrollBy({ left: dir * 0.9 * rail.clientWidth, behavior: ctx.motion.calm ? "auto" : "smooth" });
  const sync = () => {
    const max = rail.scrollWidth - rail.clientWidth - 2;
    const atStart = rail.scrollLeft <= 2;
    const atEnd = rail.scrollLeft >= max;
    prev?.setAttribute("aria-disabled", String(atStart));
    next?.setAttribute("aria-disabled", String(atEnd));
    root.toggleAttribute("data-at-start", atStart);
    root.toggleAttribute("data-at-end", atEnd);
  };
  const onPrev = () => step(-1);
  const onNext = () => step(1);
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      sync();
    });
  };
  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);
  rail.addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  const prefetch = (e) => {
    const link = e.target instanceof Element ? e.target.closest(".project-link") : null;
    if (link) data.details?.prefetch?.(link.dataset.projectId);
  };
  rail.addEventListener("pointerover", prefetch, { passive: true });
  rail.addEventListener("focusin", prefetch);
  if (controls) controls.hidden = false;
  sync();

  return {
    destroy() {
      prev?.removeEventListener("click", onPrev);
      next?.removeEventListener("click", onNext);
      rail.removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      rail.removeEventListener("pointerover", prefetch);
      rail.removeEventListener("focusin", prefetch);
      cancelAnimationFrame(raf);
    },
  };
}
