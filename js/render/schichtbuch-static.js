/**
 * Schichtbuch list view (spec §2.6, §6.4 „list view“)  [WP5]
 *
 * Pure renderer: (data, opts) => string. Node-importable (scripts/prerender.mjs fills
 * `<!-- prerender:schichtbuch-table -->`), and js/sections/schichtbuch.js uses the same
 * function when the block is empty at runtime.
 *
 * One block per year from the first sourced year (the first YouTube upload, 2014) to the
 * year of `snapshot.asOf`: heading „{yyyy}“ with a quiet „{n} Repos“ (from 2 up) and the thin heat
 * bar, then the milestones of that year. No per-repo ledger: the Zeitraffer already shows every
 * repo. A year with neither milestones nor repos is left out. A milestone whose source is something
 * a visitor wants to open (a video, a playlist, a repo) links its text there; the sources stay in
 * data/milestones.json, the page shows no citation lines.
 */
import { html, raw, safeUrl, escapeHtml } from "../lib/dom.js";
import { reposByYear, fillBindings, formatDate, yearOf } from "../lib/derive.js";

/** Milestone kinds → visible label (plain words; colour is never the only carrier). */
export const KIND_LABEL = { film: "Film", code: "Code", web: "Web", life: "Bühne", galerie: "Galerie" };

/** Repo lane of the Zeitraffer, shared with js/sections/zeitraffer.js. */
export function laneOf(language) {
  if (language === "HTML" || language === "CSS") return "HTML/CSS";
  if (language === "JavaScript" || language === "TypeScript" || language === "Python") return language;
  return "Andere";
}

/** English phrases quoted in milestone texts (commit messages) → lang="en" (WCAG 3.1.2). */
const EN_PHRASES = ["im getting tired of this"];
export function markLang(text) {
  let out = escapeHtml(text);
  for (const p of EN_PHRASES) out = out.split(escapeHtml(p)).join(`<span lang="en">${escapeHtml(p)}</span>`);
  return raw(out);
}

/** Display date of a milestone: month and year („Nov. 2014“), or the year alone; the day stays in <time datetime>. */
export const milestoneDate = (m) => formatDate(m.date, m.precision === "year" ? "year" : "monthShort");

/** Years shown: first sourced year (YouTube / milestones / repos) … year(asOf). */
export function yearSpan(data) {
  const asOf = data.snapshot?.asOf ?? data.reposAsOf;
  const candidates = [
    yearOf(data.snapshot?.youtube?.firstUpload),
    ...(data.milestones ?? []).map((m) => yearOf(m.date)),
    ...(data.repos ?? []).map((r) => yearOf(r.c)),
  ].filter(Number.isFinite);
  const last = Number.isFinite(yearOf(asOf)) ? yearOf(asOf) : Math.max(...candidates);
  const first = Math.min(...candidates, last);
  const years = [];
  for (let y = first; y <= last; y++) years.push(y);
  return years;
}

export const repoWord = (n) => (n === 1 ? "Repo" : "Repos");
/** A year's repo count is worth a word from two up („1 Repo“ reads like a ledger line). */
export const COUNT_FROM = 2;

/** Sources worth opening for a visitor: a YouTube video or playlist, or a repo's front page. */
const WATCHABLE = /^https:\/\/(www\.)?(youtube\.com\/(watch\?v=|playlist\?list=)|youtu\.be\/)/;
const REPO_HOME = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

/** The one link a milestone text carries (or null): the first video, else the first repo. */
export function milestoneLink(m) {
  const urls = (m.sources ?? []).map((s) => s.url ?? "");
  return urls.find((u) => WATCHABLE.test(u)) ?? urls.find((u) => REPO_HOME.test(u)) ?? null;
}

/** Compact on purpose (it is prerendered into index.html): same-tab link, the ↗ comes from CSS. */
function milestoneItem(m, bindings) {
  const text = markLang(fillBindings(m.text, bindings));
  const url = milestoneLink(m);
  return html`<li class="ms" data-kind="${m.kind}" data-date="${m.date}">
<p class="ms-date meta"><time datetime="${m.date}">${milestoneDate(m)}</time> <span class="ms-kind">${KIND_LABEL[m.kind] ?? m.kind}</span></p>
<p class="ms-text">${url ? html`<a class="ms-link" href="${safeUrl(url, "https://lmf.logge.top/")}">${text}</a>` : text}</p>
</li>`;
}

/**
 * @param {object} data   Data object (lib/data.js shape): repos, milestones, snapshot, bindings
 * @param {object} [opts] { bindings }
 * @returns {string}
 */
export default function renderSchichtbuchStatic(data = {}, opts = {}) {
  const bindings = opts.bindings ?? data.bindings ?? {};
  const repos = Array.isArray(data.repos) ? [...data.repos].sort((a, b) => a.c.localeCompare(b.c)) : null;
  const milestones = Array.isArray(data.milestones) ? data.milestones : [];
  if (!repos && !milestones.length) return "";
  const by = repos ? reposByYear(repos) : {};
  const max = Math.max(1, ...Object.values(by));
  const years = yearSpan({ ...data, repos: repos ?? [] });

  const blocks = years.map((y) => {
    const ms = milestones.filter((m) => yearOf(m.date) === y);
    const n = by[y] ?? 0;
    if (!ms.length && !n) return "";
    return html`<div class="sb-year" id="jahr-${y}" data-year="${y}" data-count="${n}" style="--share:${(n / max).toFixed(3)}">
<h3 class="sb-year-title"><span class="sb-year-num">${y}</span>${repos && n >= COUNT_FROM ? html` <span class="sb-year-count">${n} ${repoWord(n)}</span>` : ""}</h3>
<div class="sb-year-body">${ms.length ? html`<ol class="sb-ms" role="list">${ms.map((m) => milestoneItem(m, bindings))}</ol>` : ""}</div>
</div>`;
  });

  return String(html`<div class="sb-log" data-sb-log>${blocks}</div>`)
    .replace(/\n+/g, "\n")
    .trim();
}
