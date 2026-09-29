/**
 * Lager „Liste“ view (spec §2.4)  [WP2]
 * Pure: `(list, ctx) => string`, Node-importable. Split from plate.js so the table code is only
 * fetched when someone switches to the list (keeps the before-load JS inside the §8 budget).
 *
 *   renderTable(list, ctx)   → a real <table> with sortable headers (ctx from plateContext + { query, sort })
 *   stackText(project, ctx)  → „Sprache“: the primary language from plateContext (repo, else language
 *                              tag). Films have none; their length sits in the fold line.
 */
import { html, raw } from "../lib/dom.js";
import { alloyOf, glowOf, glowLabel, stockLabel, GROUP_LABEL, formatDate } from "../lib/derive.js";
import { highlight } from "../lib/search.js";
import { filmOf, softHyphens, yearText } from "./plate.js";

/** Liste „Sprache“: the primary language, same source as the plate stamp (films: none). */
export function stackText(p, ctx = {}) {
  return ctx.lang?.get?.(p.id) ?? "";
}

/* „Nº“ (U+00BA) reads as „N Ordinal“ in German TTS: show the glyph, say „Nummer“. */
const NO = html`<span aria-hidden="true">Nº</span><span class="vh">Nummer</span>`;
const noLabel = (label) => (String(label).startsWith("Nº") ? html`${NO}${String(label).slice(2)}` : label);

/* ── the table ─────────────────────────────────────────────────────────────────── */

const SORTABLE = { projekt: "az", jahr: "alt", zuletzt: "neu" };
const SORT_DIR = { az: "ascending", alt: "ascending", neu: "descending" };

function th(label, key, sort) {
  const s = SORTABLE[key];
  if (!s) return html`<th scope="col" class="lt-${key}">${label}</th>`;
  const active = sort === s;
  return html`<th scope="col" class="lt-${key}"${active ? raw(` aria-sort="${SORT_DIR[s]}"`) : ""}>
    <button type="button" class="lt-sort" data-sort="${s}" aria-pressed="${active ? "true" : "false"}">${label}<span class="lt-sort-mark" aria-hidden="true">${active ? (SORT_DIR[s] === "ascending" ? "↑" : "↓") : "↕"}</span></button>
  </th>`;
}

export function renderTable(list, ctx = {}) {
  const q = ctx.query ?? "";
  const rows = list.map((p) => {
    const alloy = alloyOf(p) ?? "web";
    const glow = glowOf(p, ctx.asOf);
    const n = ctx.stock?.get?.(p.id);
    const stack = stackText(p, ctx);
    const len = filmOf(ctx, p.id)?.duration;
    const g = glow ? glowLabel(glow) : "";
    // „Zuletzt dran“ = last push; films have no repo, their upload date is what „neu“ sorts by.
    const pushed = p.repo?.pushedAt ?? null;
    const uploaded = pushed ? null : (filmOf(ctx, p.id)?.uploaded ?? null);
    const when = pushed ?? uploaded;
    const whenText = when ? `${uploaded ? "hochgeladen" : "zuletzt dran"} ${formatDate(when, "monthShort")}` : "";
    return html`<tr class="project-card lager-row" data-glow="${glow ?? "none"}" data-alloy="${alloy}" data-id="${p.id}" data-heat style="--alloy: var(--alloy-${alloy})">
      <td class="lt-no">${n ? noLabel(stockLabel(n)) : ""}</td>
      <td class="lt-projekt">
        <a class="project-link" href="#werk/${p.id}" data-project-id="${p.id}">${softHyphens(highlight(p.title, q))}</a>
        ${p.isNew ? html` <span class="plate-badge plate-badge--new">Neu dabei</span>` : ""}
        <span class="lt-fold"><span class="lt-fold-narrow">${[GROUP_LABEL[alloy], yearText(p)].filter(Boolean).join(" · ")}</span>${[stack, len ? `Länge ${len}` : "", g, whenText].filter(Boolean).join(" · ")}</span>
      </td>
      <td class="lt-legierung"><span class="lt-swatch" aria-hidden="true"></span>${GROUP_LABEL[alloy]}</td>
      <td class="lt-jahr">${yearText(p)}</td>
      <td class="lt-stack">${stack}</td>
      <td class="lt-glut">${g ? html`<span class="lt-glow">${g}</span>` : ""}</td>
      <td class="lt-zuletzt">${when ? html`<time class="lt-date" datetime="${String(when).slice(0, 10)}">${formatDate(when, "monthShort")}</time>${uploaded ? html`<span class="lt-note"> hochgeladen</span>` : ""}` : ""}</td>
    </tr>`;
  });
  return String(html`<table class="lager-table">
  <caption class="vh">Alle Projekte als Liste</caption>
  <thead><tr>${th(NO, "no", ctx.sort)}${th("Projekt", "projekt", ctx.sort)}${th("Legierung", "legierung", ctx.sort)}${th("Jahr", "jahr", ctx.sort)}${th("Sprache", "stack", ctx.sort)}${th("Glut", "glut", ctx.sort)}${th("Zuletzt dran", "zuletzt", ctx.sort)}</tr></thead>
  <tbody>${rows}</tbody>
</table>`);
}

export default renderTable;
