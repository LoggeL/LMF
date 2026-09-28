/**
 * Zeitraffer: every public repo on a horizontal timeline (spec §2.6, §6.4)  [WP5]
 * A year is as wide as it is busy (120 + 14 px per repo, ×0.7 below 1024 px), linear inside.
 * Lanes: Meilensteine · Im Portfolio · one per language (greedy packing into sub-rows).
 * Opens at the Stand. One roving tab stop: ←/→ in time, ↑/↓ lanes, Home/End, Enter opens.
 * Tooltip, drag-to-pan, the arrow keys, year jumps and „abspielen“ live in ./zeitraffer-extras.js,
 * loaded on the first pointer, focus, key or play intent (budget §8).
 * The page loads ./zeitraffer.pack.js (comments and whitespace stripped): after editing this file,
 * run node scripts/pack-zr.mjs. Portfolio chip images come from one sprite (make-zr-sprite.mjs).
 */
import { html, raw, escapeHtml, EXT_SUFFIX } from "../lib/dom.js";
import { dayValue, daysBetween, formatDate, yearOf, fillBindings, reposByYear, GLOW_DAYS, GLOW_LABEL } from "../lib/derive.js";
import { laneOf, KIND_LABEL, milestoneDate, yearSpan, repoWord, markLang } from "../render/schichtbuch-static.js";
import { ZR_SPRITE } from "../render/zr-sprite.js";

export const LANES = ["Marker", "Portfolio", "JavaScript", "TypeScript", "HTML/CSS", "Python", "Andere"].map((key) => ({
  key,
  label: { Marker: "Meilensteine", Portfolio: "Im Portfolio" }[key] ?? key,
}));

// Clips: thumbnail + two-line title, every one labelled; crowded years just get more rows.
const G = {
  gutter: 132,
  stroke: { w: 8, gap: 2, h: 12 },
  clip: { w: 166, gap: 3, h: 34 },
  flag: { w: 220, gap: 6, h: 66, rows: 3 },
  pad: 10,
};

export const scaleFor = (width) => (width >= 1024 ? 1 : 0.7);

export function glowOfRepo(repo, asOf) {
  const d = daysBetween(repo.p, asOf);
  return !(d <= GLOW_DAYS.warm) ? "abgekuehlt" : d <= GLOW_DAYS.glueht ? "glueht" : "warm";
}

/** Greedy interval packing. g.rows: flags keep to three rows and slide right (it.lx) in a
 *  cluster, a leader ties them to their date. */
function pack(items, g) {
  const ends = [];
  const lim = g.rows ?? 1e9;
  for (const it of items.sort((a, b) => a.x - b.x)) {
    let row = ends.findIndex((end, i) => i < lim && end <= it.x);
    if (row < 0 && ends.length < lim) row = ends.push(0) - 1;
    it.lx = it.x;
    if (row < 0 && g.rows) it.lx = ends[(row = ends.indexOf(Math.min(...ends)))];
    if (row < 0) row = ends.findIndex((end) => end <= it.x);
    if (row < 0) row = ends.push(0) - 1;
    ends[row] = it.lx + g.w + g.gap;
    it.row = row;
  }
  return ends.length ? ends : [0];
}

/** Pure layout → { years, lanes, xOf, dateAt, nowX, … } in track pixels. */
export function layout(data, scale = 1) {
  const asOf = data.snapshot?.asOf ?? data.reposAsOf;
  const repos = [...(data.repos ?? [])].sort((a, b) => a.c.localeCompare(b.c));
  const by = reposByYear(repos);
  const years = yearSpan({ ...data, repos });
  const max = Math.max(1, ...years.map((y) => by[y] ?? 0));
  let x0 = G.gutter;
  const segs = years.map((y) => {
    const n = by[y] ?? 0;
    const w = Math.round((120 + 14 * n) * scale);
    const seg = { y, n, x: x0, w, heat: n ? Math.min(5, 1 + Math.floor((n / max) * 4.999)) : 0, share: n / max };
    x0 += w;
    return seg;
  });
  const bySeg = new Map(segs.map((s) => [s.y, s]));
  function xOf(iso) {
    const s = String(iso ?? "");
    const seg = bySeg.get(yearOf(s));
    if (!seg) return NaN;
    if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return seg.x;
    const start = Date.UTC(seg.y, 0, 1);
    return seg.x + ((dayValue(s) - start) / (Date.UTC(seg.y + 1, 0, 1) - start)) * seg.w;
  }
  const nowX = Number.isFinite(xOf(asOf)) ? xOf(asOf) : x0;
  /** Playhead → { year, month }, clamped to the Stand: nothing after asOf is ever shown. */
  function dateAt(at) {
    if (at >= nowX - 1 && asOf) return { year: yearOf(asOf), month: +asOf.slice(5, 7) };
    const seg = segs.find((s) => at >= s.x && at < s.x + s.w) ?? (at < G.gutter ? segs[0] : segs[segs.length - 1]);
    return { year: seg.y, month: Math.floor(Math.min(0.9999, Math.max(0, (at - seg.x) / seg.w)) * 12) + 1 };
  }

  const byId = data.byId instanceof Map ? data.byId : new Map((data.projects ?? []).map((p) => [p.id, p]));
  const lanes = new Map(LANES.map((l) => [l.key, { ...l, items: [] }]));
  let right = nowX;
  repos.forEach((r, i) => {
    const item = { type: "repo", i, x: xOf(r.c), repo: r, glow: glowOfRepo(r, asOf) };
    lanes.get(laneOf(r.l)).items.push(item);
    const project = r.id && byId.get(r.id);
    if (project) lanes.get("Portfolio").items.push({ type: "project", x: item.x, repo: r, project, glow: item.glow });
  });
  (data.milestones ?? []).forEach((m, i) => {
    const x = xOf(m.date);
    if (!Number.isFinite(x)) return;
    // Only the year is sourced → the flag stands at the start of a bracket over the whole year
    // (cut at the Stand), never on a made-up 1 January.
    const seg = m.precision === "year" ? bySeg.get(yearOf(m.date)) : null;
    const span = seg ? Math.min(seg.x + seg.w, nowX) - seg.x : 0;
    lanes.get("Marker").items.push({ type: "marker", i, x, span, m, text: fillBindings(m.text, data.bindings ?? {}) });
  });
  for (const lane of lanes.values()) {
    const g = lane.key === "Marker" ? G.flag : lane.key === "Portfolio" ? G.clip : G.stroke;
    const ends = pack(lane.items, g);
    lane.rows = ends.length;
    right = Math.max(right, ...ends);
    lane.rowH = g.h;
    lane.height = lane.rows * g.h + G.pad * 2;
    lane.items.sort((a, b) => a.x - b.x || a.row - b.row);
  }
  return { width: Math.round(right + 16), years: segs, lanes: [...lanes.values()], xOf, dateAt, nowX, total: repos.length, asOf, repoXs: repos.map((r) => xOf(r.c)) };
}

/* ── Rendering ─────────────────────────────────────────────────────────────────────────────── */

const px = (n) => `${Math.round(n * 10) / 10}px`;
/** Chip thumbnails: one cell of the 2× sprite (scripts/make-zr-sprite.mjs), not a 640 w plate thumb. */
const chipImg = (image) => {
  const i = ZR_SPRITE.cells[image ?? ""];
  return i === undefined
    ? html`<span class="zr-pclip-blank"></span>`
    : html`<span class="zr-pclip-img" style="background-image:url(${ZR_SPRITE.src});background-size:${ZR_SPRITE.n * 40}px 25px;background-position:${-i * 40}px 0"></span>`;
};

function itemHtml(lane, it) {
  const top = G.pad + it.row * lane.rowH;
  // Keyboard stops: everything that opens something, plus milestone flags. Unnamed repos stay in
  // the lanes and the counts (and in the list's tables) but are not stops: Enter would do nothing.
  const stop = it.type !== "repo" || it.repo.id || it.repo.n;
  const common = raw(`data-zr-item${stop ? ` data-zr-nav tabindex="-1"` : ""} data-x="${it.x.toFixed(1)}" style="left:${px(it.lx)};top:${px(top)}"`);
  if (it.type === "marker") {
    const lead = it.lx - it.x > 1 ? html`<i class="zr-lead" style="left:${px(it.x)};top:${px(top + lane.rowH - 2)};width:${px(it.lx - it.x)}"></i>` : "";
    const { m } = it;
    const src = (m.sources ?? []).find((s) => /^https:\/\//.test(s.url));
    const date = milestoneDate(m);
    const when = it.span ? `${date}, genaues Datum nicht belegt` : date;
    const label = `${when}, ${KIND_LABEL[m.kind] ?? m.kind}: ${it.text}${src ? ` Quelle: ${src.label}` : ""}`;
    const inner = html`<span class="zr-flag-date">${date}${it.span ? html`<span class="zr-flag-vague"> · im Lauf des Jahres</span>` : ""}</span><span class="zr-flag-text">${markLang(it.text)}</span>`;
    const attrs = raw(`class="zr-flag" data-kind="${escapeHtml(m.kind)}" ${common}`);
    return html`${lead}${src
      ? html`<a href="${src.url}" target="_blank" rel="noopener noreferrer" aria-label="${label}${EXT_SUFFIX}" ${attrs}>${inner}</a>`
      : html`<span role="img" aria-label="${label}" ${attrs}>${inner}</span>`}`;
  }
  const r = it.repo;
  const made = `Repo angelegt ${formatDate(r.c)}`;
  if (it.type === "project") {
    const p = it.project;
    return html`<a class="zr-pclip" data-alloy="${p.groups?.[0] ?? ""}" data-glow="${it.glow}" data-project-id="${p.id}" href="#werk/${p.id}" aria-label="${p.title}, ${made}. Werkstück öffnen" data-tip="${p.title} · ${made} · zuletzt dran ${formatDate(r.p)}" ${common}>${chipImg(p.image)}<span class="zr-pclip-title">${p.title}</span></a>`;
  }
  // The name doubles as the tooltip (extras), so the glow word is in both: colour never alone.
  const label = `${r.n ? `Repo ${r.n}` : "Öffentliches Repo"}, angelegt am ${formatDate(r.c)}, Sprache ${r.l || "keine Angabe"}, zuletzt dran am ${formatDate(r.p)} (${GLOW_LABEL[it.glow]})`;
  const attrs = raw(`class="zr-clip" ${common} data-repo data-glow="${it.glow}"${r.n ? ` data-name="${escapeHtml(r.n)}"` : ""}`);
  // In the portfolio → the Werkbank; allowlisted name → GitHub; otherwise an unnamed mark.
  const href = r.id ? `#werk/${r.id}` : r.n && `https://github.com/LoggeL/${encodeURIComponent(r.n)}`;
  if (!href) return html`<span role="img" aria-label="${label}" ${attrs}></span>`;
  const ext = !r.id;
  return html`<a href="${href}"${ext ? raw(` target="_blank" rel="noopener noreferrer"`) : ""} aria-label="${label}${ext ? EXT_SUFFIX : ". Werkstück öffnen"}" ${attrs}></a>`;
}

export function renderTrack(L) {
  const now = px(L.nowX);
  return html`<div class="zr-track" style="width:${px(L.width)}"><div class="zr-ruler" aria-hidden="true"><span class="zr-lane-label">Jahr · Repos</span>${L.years.map(
    (s) =>
      html`<div class="zr-year" data-year="${s.y}" data-count="${s.n}" style="left:${px(s.x)};width:${px(s.w)}"><span class="zr-year-label"><span class="zr-year-num">${s.y}</span> <span class="zr-year-n">· ${s.n}</span></span><span class="zr-heat" data-heat="${s.heat}" style="width:${px(Math.max(s.n ? 6 : 0, Math.min(s.share * (s.w - 16), L.nowX - s.x - 12)))}"></span></div>`,
  )}${L.asOf ? html`<span class="zr-now-label" style="left:${now}">Stand ${formatDate(L.asOf)}</span>` : ""}</div><div class="zr-lines" aria-hidden="true">${L.lanes[0].items.map(
    (it) => html`<span data-kind="${it.m.kind}"${it.span ? raw(` data-span style="left:${px(it.x)};width:${px(it.span)}"`) : raw(` style="left:${px(it.x)}"`)}></span>`,
  )}<i class="zr-future" style="left:${now}"></i></div>${L.lanes.map(
    (lane) =>
      html`<div class="zr-lane" data-lane="${lane.key}" style="height:${px(lane.height)}"><span class="zr-lane-label"><span class="zr-lane-name">${lane.label}</span> <span class="zr-lane-count">${lane.items.length}</span></span>${lane.items.map((it) => itemHtml(lane, it))}</div>`,
  )}</div>`;
}

/* ── Mount ─────────────────────────────────────────────────────────────────────────────────── */

export function mountZeitraffer(host, data, ctx) {
  const { motion } = ctx;
  const wrap = document.createElement("div");
  wrap.className = "zr screen";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Zeitraffer, öffentliche Repos nach Datum");
  host.append(wrap);
  const use = (n) => `<svg class="i i-${n}" aria-hidden="true" focusable="false"><use href="#i-${n}"></use></svg>`;
  wrap.innerHTML = `<div class="zr-bar"><div class="zr-years" role="group" aria-label="Zu einem Jahr springen"></div><p class="zr-readout meta" aria-hidden="true"></p><button class="zr-play button button--ghost" type="button" aria-pressed="false" data-heat>${use("play")}${use("pause")}<span>Zeitraffer abspielen</span></button></div>
<div class="zr-viewport"><div class="zr-scroll"></div><div class="zr-playhead" aria-hidden="true"></div><div class="zr-tip" id="zr-tip" role="tooltip" hidden></div></div>
<div class="zr-foot"><ul class="zr-legend meta" role="list"><li><span class="zr-swatch" data-glow="glueht"></span>glüht: bis ${GLOW_DAYS.glueht} Tage vor dem Stand gepusht</li><li><span class="zr-swatch" data-glow="warm"></span>warm: bis ${GLOW_DAYS.warm} Tage</li><li><span class="zr-swatch" data-glow="abgekuehlt"></span>abgekühlt: länger her</li><li><span class="zr-swatch zr-swatch--flag"></span>Fähnchen: Meilenstein mit Quelle</li><li><span class="zr-swatch zr-swatch--span"></span>Klammer: nur das Jahr ist belegt</li></ul>
<p class="zr-keys meta"><span class="vh">Bedienung: </span><kbd>←</kbd><kbd>→</kbd> durch die Zeit · <kbd>↑</kbd><kbd>↓</kbd> Spur wechseln · <kbd>Enter</kbd> öffnet</p></div>`;

  const $ = (s) => wrap.querySelector(s);
  const scroller = $(".zr-scroll");
  const out = $(".zr-readout");
  const playBtn = $(".zr-play");
  const yearsNav = $(".zr-years");
  const playhead = $(".zr-playhead");
  const offs = [];
  const on = (t, type, fn, o) => (t.addEventListener(type, fn, o), offs.push(() => t.removeEventListener(type, fn, o)));
  // Shared with the extras: st.pinned (at the Stand until the user moves away), st.playing.
  const st = { L: null, pinned: true, playing: 0 };
  let scale = scaleFor(innerWidth);
  let gw = G.gutter;
  let raf = 0;
  let clips = [];
  const maxLeft = () => scroller.scrollWidth - scroller.clientWidth;

  function build() {
    st.L = layout(data, scale);
    scroller.innerHTML = String(renderTrack(st.L));
    yearsNav.innerHTML = String(html`${st.L.years.map((s) => html`<button class="zr-yearchip" type="button" data-year="${s.y}" aria-label="Zu ${s.y} springen, ${s.n} ${repoWord(s.n)}">${s.y}</button>`)}`);
    const marks = scroller.querySelectorAll('[data-lane="Marker"] [data-zr-nav]');
    const first = marks[marks.length - 1] ?? scroller.querySelector("[data-zr-nav]");
    if (first) first.tabIndex = 0;
    // [el, left, width (measured lazily), left of the next item in the same row]
    clips = [];
    for (const lane of scroller.querySelectorAll('[data-lane="Marker"], [data-lane="Portfolio"]')) {
      const rows = {};
      for (const el of lane.querySelectorAll("[data-zr-item]")) (rows[el.style.top] ??= []).push([el, parseFloat(el.style.left), 0, Infinity]);
      for (const row of Object.values(rows)) row.sort((a, b) => a[1] - b[1]).forEach((c, i) => clips.push(((c[3] = row[i + 1]?.[1] ?? Infinity), c)));
    }
    fit();
  }
  function fit() {
    if (!st.L || !scroller.clientWidth) return;
    gw = parseFloat(getComputedStyle(wrap).getPropertyValue("--gutter-w")) || G.gutter;
    if (st.pinned) scroller.scrollLeft = maxLeft();
    readout();
  }
  /** The playhead travels with the scroll: left edge on the first year, the Stand at the end. */
  const span = () => scroller.clientWidth - (st.L.width - st.L.nowX) - gw;
  function readout() {
    const L = st.L;
    if (!L) return;
    const max = maxLeft();
    const ph = max > 0 ? gw + (scroller.scrollLeft / max) * span() : L.nowX;
    playhead.style.left = px(ph);
    // Flags and chips whose start slid under the sticky lane labels would show a cut-off name
    // („nscripator“): they stick to the edge like a sticky label while there is room in their
    // row, and step back (fade out) once the next item would be covered.
    const edge = scroller.scrollLeft + gw;
    for (const c of clips) {
      const [el, left, , next] = c;
      c[2] ||= el.offsetWidth;
      const need = left < edge - 2 && left + c[2] > edge && el !== document.activeElement ? edge - left : 0;
      const fits = need <= next - 4 - left - c[2];
      el.style.translate = need && fits ? `${need}px 0` : "";
      el.classList.toggle("is-under", !!need && !fits);
    }
    const at = scroller.scrollLeft + ph;
    const end = scroller.scrollLeft >= max - 2;
    const d = L.dateAt(end ? Infinity : at);
    const n = end ? L.total : L.repoXs.filter((x) => x <= at + 0.5).length;
    const text = `${String(d.month).padStart(2, "0")}.${d.year} · ${n} von ${L.total} Repos bis hier`;
    if (out.textContent === text) return;
    out.textContent = text;
    // Exactly one current year chip.
    for (const c of yearsNav.children) +c.dataset.year === d.year ? c.setAttribute("aria-current", "true") : c.removeAttribute("aria-current");
  }

  /* Extras (tooltip, drag, play, arrow keys, year jumps): loaded once on the first intent. The
     keys are claimed here synchronously, so the page never scrolls while the module arrives. */
  let ex = null;
  let exP = null;
  function rove(el) {
    scroller.querySelectorAll('[data-zr-item][tabindex="0"]').forEach((n) => (n.tabIndex = -1));
    el.tabIndex = 0;
  }
  const api = { wrap, scroller, playBtn, st, motion, announce: ctx.announce, maxLeft, readout, on, rove, gw: () => gw, span: () => span() };
  const extras = () => (exP ??= import("./zeitraffer-extras.js").then((m) => (ex = m.default(api))));
  const intent = () => extras().catch(() => {});
  on(wrap, "pointerenter", intent, { once: true });
  on(wrap, "focusin", intent);
  on(playBtn, "click", () => extras().then((x) => x.toggle()));
  on(scroller, "keydown", (e) => {
    if (!/^(Arrow(Left|Right|Up|Down)|Home|End)$/.test(e.key) || !e.target.closest?.("[data-zr-nav]")) return;
    e.preventDefault();
    extras().then((x) => x.key(e));
  });
  on(yearsNav, "click", (e) => {
    const y = +e.target.closest("[data-year]")?.dataset.year;
    if (y) extras().then((x) => x.jump(y));
  });
  on(scroller, "focusin", (e) => {
    const el = e.target.closest?.("[data-zr-nav]");
    if (el) (rove(el), el.classList.remove("is-under"));
  });
  on(scroller, "scroll", () => {
    if (!st.playing) {
      st.pinned = scroller.scrollLeft >= maxLeft() - 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(readout);
    }
    ex?.onScroll();
  }, { passive: true });
  on(scroller, "pointerdown", () => ex?.stop());
  on(document, "keydown", (e) => {
    if (e.key === "Escape") ex?.hideTip();
    if (e.target !== playBtn) ex?.stop();
  });
  const syncCalm = (calm) => {
    playBtn.hidden = calm;
    if (calm) ex?.stop();
  };
  syncCalm(motion.calm);
  offs.push(motion.onCalmChange(syncCalm));

  const io = new IntersectionObserver(([e]) => e.isIntersecting || ex?.stop());
  io.observe(wrap);
  const ro = new ResizeObserver(() => {
    const next = scaleFor(innerWidth);
    if (next !== scale) {
      scale = next;
      build();
    } else fit();
  });
  ro.observe(scroller);
  offs.push(() => (io.disconnect(), ro.disconnect()));

  build();

  return {
    el: wrap,
    layout: () => st.L,
    refresh: readout,
    destroy() {
      ex?.destroy();
      offs.forEach((off) => off());
      wrap.remove();
    },
  };
}
