/**
 * Prerendered no-JS archive (spec §5.3 „Prerender“)  [WP2]
 * Pure: `(data, opts) => string`. scripts/prerender.mjs writes the result between
 * `<!-- prerender:lager -->` markers in index.html. Every project, JSON order, external links:
 *   <li id="werk/{id}"><a href="{link}">{title}</a><span class="ls"> · </span>{category} · {year} — {summary}</li>
 * The row id makes every #werk/<id> link on the page resolve without JS (chapters, films).
 * The Lager hides this list after its interactive render; on a data failure it stays visible.
 */
import { html, safeUrl } from "../lib/dom.js";

export function renderLagerStatic(data = {}) {
  // The meta line starts its own row: the „ · “ after the title
  // is only for CSS-less reading (.ls is hidden in lager.css). No Nº here: the list is in JSON order,
  // the real Nº (year order) lives on the plates and in the Werkbank (lager.css drops the counter).
  const items = (data.projects ?? []).map((p) => {
    const meta = [p.category, p.yearLabel ?? p.year].filter((v) => v !== undefined && v !== null && v !== "").join(" · ");
    const text = [meta, p.summary || p.description].filter(Boolean).join(" — ");
    return html`<li id="werk/${p.id}"><a href="${safeUrl(p.link, "https://lmf.logge.top/")}">${p.title}</a>${
      text ? html`<span class="ls"> · </span>${text}` : ""
    }</li>`;
  });
  return String(html`<ol id="lager-static" class="lager-static" aria-label="Alle Projekte">${items}</ol>`);
}

export default renderLagerStatic;
