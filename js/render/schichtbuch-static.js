/**
 * Schichtbuch list view (spec §2.6, §6.4 „list view“)  [WP5]
 *
 * Pure renderer: (data, opts) => string. Node-importable (scripts/prerender.mjs fills
 * `<!-- prerender:schichtbuch-table -->`), and js/sections/schichtbuch.js uses the same
 * function when the block is empty at runtime.
 *
 * One block per year from the first sourced year (the first YouTube upload, 2014) to the
 * year of `snapshot.asOf`: heading „{yyyy} · {n} Repos“, the milestones of that year (each
 * with its source links) and a collapsible table of the repos created that year.
 * Repo names appear only when repos.json carries one (allowlisted by the snapshot script).
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

/** Display date of a milestone by its precision. */
export const milestoneDate = (m) => formatDate(m.date, m.precision === "year" ? "year" : m.precision === "month" ? "month" : "day");

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

/** Compact on purpose (it is prerendered into index.html): same-tab links, the ↗ comes from CSS. */
function sourceLinks(sources = []) {
  return sources
    .filter((s) => /^https:\/\//.test(s.url ?? ""))
    .map((s) => html`<a class="ms-src" href="${safeUrl(s.url, "https://lmf.logge.top/")}">${s.label}</a>`);
}

function milestoneItem(m, bindings) {
  return html`<li class="ms" data-kind="${m.kind}" data-date="${m.date}">
<p class="ms-date meta"><time datetime="${m.date}">${milestoneDate(m)}</time> <span class="ms-kind">${KIND_LABEL[m.kind] ?? m.kind}</span></p>
<p class="ms-text">${markLang(fillBindings(m.text, bindings))}</p>
<p class="ms-sources meta"><span class="ms-sources-label">Quelle:</span> ${sourceLinks(m.sources)}</p>
</li>`;
}

function repoName(r) {
  if (!r.n) return "öffentliches Repo";
  return `<a href="https://github.com/LoggeL/${encodeURIComponent(r.n)}">${escapeHtml(r.n)}</a>`;
}

/** Compact on purpose (140 rows live in index.html): optional end tags are omitted, which is valid HTML. */
export function repoTable(year, rows) {
  const body = rows.map((r) => `<tr><td>${formatDate(r.c, "dayMonth")}<td>${repoName(r)}<td>${escapeHtml(r.l || "keine Angabe")}`).join("\n");
  return raw(`<details class="sb-repos"><summary><span class="sb-summary-open">Repos zeigen</span><span class="sb-summary-close">Repos ausblenden</span></summary>
<table class="sb-table"><caption class="vh">Öffentliche Repos, angelegt ${year}</caption>
<thead><tr><th scope="col">Angelegt<th scope="col">Repo<th scope="col">Sprache</thead>
<tbody>
${body}
</tbody></table></details>`);
}

/**
 * @param {object} data   Data object (lib/data.js shape): repos, milestones, snapshot, bindings
 * @param {object} [opts] { bindings }
 * @returns {string}
 */
export default function renderSchichtbuchStatic(data = {}, opts = {}) {
  const bindings = opts.bindings ?? data.bindings ?? {};
  // In index.html (prerender, opts.marker set) the per-repo tables are left out to keep the
  // page small; the year headings carry the counts. js/sections/schichtbuch.js adds the tables.
  const tables = opts.tables ?? !opts.marker;
  const repos = Array.isArray(data.repos) ? [...data.repos].sort((a, b) => a.c.localeCompare(b.c)) : null;
  const milestones = Array.isArray(data.milestones) ? data.milestones : [];
  if (!repos && !milestones.length) return "";
  const by = repos ? reposByYear(repos) : {};
  const max = Math.max(1, ...Object.values(by));
  const years = yearSpan({ ...data, repos: repos ?? [] });

  const blocks = years.map((y) => {
    const ms = milestones.filter((m) => yearOf(m.date) === y);
    const rows = repos ? repos.filter((r) => yearOf(r.c) === y) : [];
    const n = by[y] ?? 0;
    if (!ms.length && !rows.length && !repos) return "";
    return html`<div class="sb-year" id="jahr-${y}" data-year="${y}" data-count="${n}" style="--share:${(n / max).toFixed(3)}">
<h3 class="sb-year-title"><span class="sb-year-num">${y}</span>${repos ? html` <span class="sb-year-count">· ${n} ${repoWord(n)}</span>` : ""}</h3>
<div class="sb-year-body">${ms.length ? html`<ol class="sb-ms" role="list">${ms.map((m) => milestoneItem(m, bindings))}</ol>` : ""}${tables && rows.length ? repoTable(y, rows) : ""}</div>
</div>`;
  });

  return String(html`<div class="sb-log" data-sb-log>${blocks}</div>`)
    .replace(/\n+/g, "\n")
    .trim();
}
