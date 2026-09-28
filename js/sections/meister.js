/**
 * Meisterstücke · Kapitel I–III, Zwischenstück, Universum, Probestück-Mounts  [WP4]  (spec §2.3, §5.6)
 *
 * Binds data/chapters.json to the static chapter markup in index.html:
 *   · Werkstattdaten: the static <dl> is rebuilt from projects.json + details/<id>.json, every
 *     value with a source mark (¹²³, the same source as in the Werkbank) that opens the Punze
 *   · Punze button + popover per chapter
 *   · Probestück: mounted when the stage is within one viewport, destroyed when > 2 away
 *   · Kolpingtheater-Universum (Kapitel I) via ./universe.js
 *   · Zwischenstück: repo creation stamps + the 81-second ruler, computed from repo.createdTs
 * Kapitel IV (#kapitel-iv) belongs to WP3 (sections/film.js) and is not touched here.
 * Without details a chapter keeps its static copy; nothing is invented to fill a gap.
 */

import { html, raw, escapeHtml, safeUrl } from "../lib/dom.js";
import { mountProbe } from "../probes/index.js";
import { renderUniverse } from "./universe.js";
import { renderPunze, supportsPopover, sourceLabel } from "../werkbank/punze.js";
import { repoValue, specRows } from "../render/specsheet.js";

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
const extIcon = raw('<svg class="i" aria-hidden="true" focusable="false"><use href="#i-arrow-ne"></use></svg><span class="vh"> (öffnet neue Seite)</span>');

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
      if (details && Array.isArray(details.sources) && details.sources.length) {
        bindSpecsheet(article, project, details);
        bindPunze(article, project, details);
        article.dataset.bound = "";
      }
    });

  /* ── Universum (Kapitel I) ── */
  const uvMount = root.querySelector('[data-mount="universe"]');
  const uvCfg = chapters.find((c) => c.universe);
  if (uvMount && uvCfg && Array.isArray(data.universe) && data.universe.length) {
    const uv = renderUniverse(uvMount, data.universe, { motion: ctx.motion, byId: data.byId });
    cleanups.push(() => uv.destroy());
  }

  /* ── Zwischenstück: three repos, 81 seconds ── */
  bindDreiwelten(root, data);

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

/* ── Werkstattdaten ──────────────────────────────────────────────────────────────────────────────── */

function bindSpecsheet(article, p, d) {
  const sheet = article.querySelector('[data-mount="specsheet"]');
  const dl = sheet?.querySelector("dl");
  if (!dl) return;
  const n = d.sources.length;
  // A mark names its source („Quelle 10: GitHub API“), so a screen reader's links list says what it is.
  const srcName = (i) => sourceLabel(d.sources[i]).split(" · ")[0];
  const sup = (i) => (Number.isInteger(i) && i >= 0 && i < n ? html`<sup class="src-mark"><a href="#msrc-${p.id}-${i + 1}" data-src="${i}" aria-label="Quelle ${i + 1}: ${srcName(i)}">${i + 1}</a></sup>` : "");
  // Every row cites the same source as in the Werkbank: the indices come from the shared
  // render/specsheet.js rules (specRows), never from a second, local guess.
  const src = Object.fromEntries(specRows(p, d).map((r) => [r.key, r.src]));
  const rows = [];
  const row = (dt, dd, ref) => rows.push(html`<div><dt>${dt}</dt><dd>${dd}${sup(ref)}</dd></div>`);

  if (Number.isFinite(p.year) && "begonnen" in src) row("Begonnen", String(p.yearLabel ?? p.year), src.begonnen);
  if (p.repo?.fullName && !p.repo.private && "repo" in src) {
    const url = p.source && /github\.com/.test(p.source) ? p.source : `https://github.com/${p.repo.fullName}`;
    // owner on a muted line, the repo name and its ¹ glued (the Werkbank's renderer, one look)
    rows.push(html`<div><dt>Repo</dt><dd>${repoValue(p.repo.fullName, safeUrl(url), sup(src.repo))}</dd></div>`);
  }
  if (Number.isFinite(d.commits) && "commits" in src) {
    const by = d.commitsBy && Number.isFinite(d.commitsBy.LoggeL) ? html` <span class="spec-sub">(${d.commitsBy.LoggeL} von mir)</span>` : "";
    row("Commits", html`${d.commits}${by}`, src.commits);
  }
  if (p.repo?.pushedAt && "zuletzt" in src) row("Zuletzt dran", fmtDate(p.repo.pushedAt), src.zuletzt);
  if (p.repo?.createdAt && "angelegt" in src) row("Repo angelegt", fmtDate(p.repo.createdAt), src.angelegt);
  if (p.link && p.live?.status === "live" && "live" in src) {
    row(
      "Live",
      html`<a href="${safeUrl(p.link)}" target="_blank" rel="noopener noreferrer">${hostOf(p.link)} ${extIcon}</a>${p.live.checkedAt ? html` <span class="spec-sub">geprüft ${fmtDate(p.live.checkedAt)}</span>` : ""}`,
      src.live,
    );
  }
  // „Stand“ is in the summary line („Werkstattdaten · Stand …“), not repeated as a row
  if (rows.length < 2) return;
  dl.innerHTML = String(html`${rows}`);
  sheet.classList.add("is-bound");
}

/* ── Punze („Gepunzt · n Quellen“) ───────────────────────────────────────────────────────────────── */

// Same Punze as in the Werkbank (js/werkbank/punze.js): one look, one closing line, one behaviour.
// The chapter only adds ids to the list items so the ¹²³ marks in the Werkstattdaten can land on them.
function bindPunze(article, p, d) {
  const slot = article.querySelector('[data-mount="punze"]');
  if (!slot) return;
  const popover = supportsPopover();
  slot.innerHTML = renderPunze({ id: p.id, title: p.title, sources: d.sources, prefix: "ch", popover });
  if (!slot.firstElementChild) return;
  slot.querySelectorAll(".punze-list > li").forEach((li, i) => {
    li.id = `msrc-${p.id}-${i + 1}`;
    li.tabIndex = -1;
  });
  slot.classList.add("is-bound");

  // source marks open the Punze and land on their entry
  article.addEventListener("click", (e) => {
    const a = e.target.closest?.("sup.src-mark a[data-src]");
    if (!a || !article.contains(a)) return;
    e.preventDefault();
    const pop = slot.querySelector(".punze-pop[popover]");
    const details = slot.querySelector("details");
    if (pop?.showPopover && !pop.matches(":popover-open")) pop.showPopover();
    if (details) details.open = true;
    const li = slot.querySelector(`#msrc-${CSS.escape(p.id)}-${Number(a.dataset.src) + 1}`);
    if (li) {
      li.focus({ preventScroll: Boolean(pop?.showPopover) });
      li.classList.remove("is-flash");
      void li.offsetWidth;
      li.classList.add("is-flash");
    }
  });
}

/* ── Zwischenstück ───────────────────────────────────────────────────────────────────────────────── */

function bindDreiwelten(root, data) {
  const section = root.querySelector("#dreiwelten");
  if (!section) return;
  const cards = [...section.querySelectorAll(".dreiwelten-card[data-project-id]")];
  const stamps = cards.map((card) => {
    const p = data.byId?.get(card.dataset.projectId);
    const ts = p?.repo?.createdTs ? Date.parse(p.repo.createdTs) : NaN;
    return { card, p, ts };
  });
  if (stamps.some((s) => !Number.isFinite(s.ts))) return;
  const t0 = Math.min(...stamps.map((s) => s.ts));
  const span = Math.max(...stamps.map((s) => s.ts)) - t0;
  // German local time, like every other time on the site (UTC 19:00:38 → 21:00:38 MESZ)
  const clock = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const hms = (t) => clock.format(new Date(t));

  // index.html reserves the stamp line and the ruler (no jump when they fill in)
  for (const { card, ts } of stamps) {
    let s = card.querySelector(".dreiwelten-stamp");
    if (s?.childElementCount) continue;
    if (!s) {
      s = document.createElement("span");
      s.className = "dreiwelten-stamp meta";
      card.append(s);
    }
    const delta = Math.round((ts - t0) / 1000);
    s.innerHTML = String(html`Repo angelegt ${hms(ts)} Uhr <b>+${delta} s</b>`);
  }

  let ruler = section.querySelector(".dreiwelten-ruler");
  if (ruler?.childElementCount || !(span > 0)) return;
  const seconds = Math.round(span / 1000);
  if (!ruler) {
    ruler = document.createElement("div");
    ruler.className = "dreiwelten-ruler";
    ruler.setAttribute("aria-hidden", "true");
    section.querySelector(".dreiwelten-list")?.after(ruler);
  }
  const ticks = [];
  for (let s = 0; s <= seconds; s += 10) ticks.push(s);
  // marks that (nearly) share a second stack upwards instead of overlapping
  const at = stamps.map(({ ts }) => ((ts - t0) / span) * 100);
  const rows = at.map((a, i) => at.slice(0, i).filter((b) => Math.abs(a - b) < 6).length);
  ruler.innerHTML = String(html`
    <div class="dreiwelten-ruler-track" style="--rows:${Math.max(...rows)}">
      ${ticks.map((s) => html`<i style="--at:${((s / seconds) * 100).toFixed(2)}%"></i>`)}
      ${stamps.map((_, i) => html`<b class="dreiwelten-ruler-mark" style="--at:${at[i].toFixed(2)}%;--row:${rows[i]}">${i + 1}</b>`)}
    </div>
    <p class="dreiwelten-ruler-scale meta"><span>${hms(t0)}</span><span>${seconds} Sekunden</span><span>${hms(t0 + span)} Uhr</span></p>`);
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
