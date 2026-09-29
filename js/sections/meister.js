/**
 * Meisterstücke · Kapitel I–III, Zwischenstück, Universum, Probestück-Mounts  [WP4]  (spec §2.3, §5.6)
 *
 * Binds data/chapters.json to the static chapter markup in index.html:
 *   · Fact strip (Seit · the project's own number · Stack): the year is refreshed from
 *     projects.json ([data-project-year]); the rest is curated copy
 *   · Probestück: mounted when the stage is within one viewport, destroyed when > 2 away
 *   · Kolpingtheater-Universum (Kapitel I) via ./universe.js
 * The Zwischenstück (ShareX) is static: three window cards, no timeline.
 * Kapitel IV (#kapitel-iv) belongs to WP3 (sections/film.js) and is not touched here.
 * Without details a chapter keeps its static copy; nothing is invented to fill a gap.
 * The sources stay in data/details/*.json; nothing on the page cites them.
 */

import { escapeHtml } from "../lib/dom.js";
import { mountProbe } from "../probes/index.js";
import { renderUniverse } from "./universe.js";

const fmtDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
};
const hostOf = (url) => {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname.replace(/\/$/, ""));
  } catch {
    return "";
  }
};

export async function mount(root, ctx) {
  const data = await ctx.data;
  const cleanups = [];
  const handles = new Map(); // stage → probe handle (or a pending promise)
  if (!data) return { destroy() {} };

  const chapters = Array.isArray(data.chapters) ? data.chapters : [];

  /* ── Probestücke ── */
  const stages = [...root.querySelectorAll('[data-mount="probe"][data-probe]')].filter((s) => !s.closest("#kapitel-iv"));
  // JS runs, so the static „Probestück braucht JavaScript“ is wrong here. The poster stays the
  // fallback while a stage is unmounted (far away or still loading), with a neutral note.
  for (const s of stages) {
    const note = s.querySelector(":scope > .chip--note:not(.probe-jammed)");
    if (note) note.textContent = "Probestück lädt …";
  }
  const probeCtx = (stage) => {
    const pid = stage.dataset.projectRef || stage.closest("[data-project]")?.dataset.project;
    const p = pid ? data.byId?.get(pid) : null;
    return { motion: ctx.motion, announce: ctx.announce, storage: ctx.storage, chip: false, originalUrl: p?.link };
  };
  const mountStage = (stage) => {
    if (handles.has(stage)) return;
    const pending = mountProbe(stage, stage.dataset.probe, probeCtx(stage))
      .then((h) => {
        if (handles.get(stage) === pending) handles.set(stage, h);
        else h.destroy(); // unmounted while loading
        return h;
      })
      .catch((error) => {
        console.warn(`[lmf] Probestück „${stage.dataset.probe}“:`, error);
        handles.delete(stage);
      });
    handles.set(stage, pending);
  };
  const unmountStage = (stage) => {
    const h = handles.get(stage);
    if (!h || typeof h.then === "function") return;
    if (stage.contains(document.activeElement)) return; // never yank a toy out from under the keyboard
    handles.delete(stage);
    h.destroy();
  };

  if ("IntersectionObserver" in window) {
    const near = new IntersectionObserver((rec) => rec.forEach((r) => r.isIntersecting && mountStage(r.target)), { rootMargin: "100% 0px" });
    const far = new IntersectionObserver((rec) => rec.forEach((r) => !r.isIntersecting && unmountStage(r.target)), { rootMargin: "200% 0px" });
    stages.forEach((s) => {
      near.observe(s);
      far.observe(s);
    });
    cleanups.push(() => {
      near.disconnect();
      far.disconnect();
    });
  } else stages.forEach(mountStage);

  /* ── chapters I–III ── */
  // details load in parallel and never hold up the toys
  const bound = [...root.querySelectorAll("article.chapter[data-chapter]")]
    .filter((article) => article.id !== "kapitel-iv")
    .map(async (article) => {
      const cfg = chapters.find((c) => c.n === article.dataset.chapter);
      const id = cfg?.anchor ?? article.dataset.project;
      const project = id ? data.byId?.get(id) : null;
      if (!project) return;
      const details = await Promise.resolve(data.details?.get(id)).catch(() => null);
      if (details) article.dataset.bound = "";
    });

  /* ── Universum (Kapitel I) ── */
  const uvMount = root.querySelector('[data-mount="universe"]');
  const uvCfg = chapters.find((c) => c.universe);
  if (uvMount && uvCfg && Array.isArray(data.universe) && data.universe.length) {
    const uv = renderUniverse(uvMount, data.universe, { motion: ctx.motion, byId: data.byId });
    cleanups.push(() => uv.destroy());
  }

  /* ── „Begonnen“ fallbacks come from projects.json, never typed ── */
  for (const dd of root.querySelectorAll("[data-project-year]")) {
    const p = data.byId?.get(dd.dataset.projectYear);
    if (p && (p.yearLabel || Number.isFinite(p.year))) dd.textContent = String(p.yearLabel ?? p.year);
  }

  /* ── „Weiterlesen“: a chapter shows its first paragraph (CSS); the button opens the rest ── */
  const onMore = (e) => {
    const btn = e.target.closest?.(".story-more");
    if (!btn || !root.contains(btn)) return;
    const chapter = btn.closest("article.chapter");
    const open = !chapter.classList.contains("is-open");
    chapter.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Weniger" : "Weiterlesen";
    // the reader continues where the new text starts (a paragraph, the rivets or the pipeline)
    const next = [...chapter.querySelectorAll(".chapter-story > p ~ p, .chapter-story > .rivets, .pipeline")].find((el) => el.getClientRects().length);
    if (open && next) {
      next.tabIndex = -1;
      next.focus({ preventScroll: true });
    }
  };
  root.addEventListener("click", onMore);
  cleanups.push(() => root.removeEventListener("click", onMore));

  /* ── Kapitel III: the pipeline listens to the mixer (steps 05–06 glow while the song runs) ── */
  cleanups.push(bindPipeline(root, ctx.motion));

  const offCalm = ctx.motion?.onCalmChange?.((calm) => {
    for (const h of handles.values()) if (h && typeof h.then !== "function") (calm ? h.pause : h.resume)?.();
  });
  if (offCalm) cleanups.push(offCalm);

  await Promise.allSettled(bound);

  return {
    handles,
    destroy() {
      cleanups.forEach((fn) => fn());
      for (const [stage, h] of handles) {
        if (typeof h?.then === "function") handles.set(stage, null);
        else h?.destroy?.();
      }
      handles.clear();
    },
  };
}

/* ── Pipeline (Kapitel III) ──────────────────────────────────────────────────────────────────────── */

// Hitze kommt schnell (90 ms), Kälte langsam (1.6 s, meister.css): while the mixer plays, 05 „Zeilen
// bauen“ and 06 „Wiedergabe“ glow, and every new line strikes them once more.
function bindPipeline(root, motion) {
  const chapter = root.querySelector("#kapitel-iii");
  const steps = chapter ? [...chapter.querySelectorAll(".pipeline > li")] : [];
  if (steps.length < 6) return () => {};
  const live = steps.slice(4);
  const onProbe = (e) => {
    const { playing, line } = e.detail ?? {};
    chapter.querySelector(".pipeline").classList.toggle("is-running", Boolean(playing));
    for (const li of live) li.classList.toggle("is-hot", Boolean(playing));
    if (playing && Number.isInteger(line) && !motion?.calm) {
      for (const li of live) li.querySelector(".pipeline-no")?.animate?.([{ transform: "scale(1.18)" }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(.34,1.56,.64,1)" });
    }
  };
  chapter.addEventListener("lmf:probe", onProbe);
  return () => chapter.removeEventListener("lmf:probe", onProbe);
}

export const __test = { fmtDate, hostOf, escapeHtml };
