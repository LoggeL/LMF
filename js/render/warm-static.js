/**
 * Prerendered Noch warm (no-JS)  [WP0]
 * Pure: `(data, opts) => string`. scripts/prerender.mjs writes the result between
 * `<!-- prerender:warm-static -->` markers inside the rail's <ol>. js/sections/warm.js replaces
 * it with the real plates; with JS on, base.css hides these rows so the first screen never shifts.
 * Same pick as warm.js → warmList(): most recent repo push first, ties keep JSON order.
 * Each row links to #werk/<id>, which resolves to the project's row in #lager-static without JS.
 */
import { html } from "../lib/dom.js";

export const WARM_STATIC_SIZE = 3;

export function renderWarmStatic(data = {}, { n = WARM_STATIC_SIZE } = {}) {
  const items = (data.projects ?? [])
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => typeof p.repo?.pushedAt === "string")
    .sort((a, b) => (a.p.repo.pushedAt < b.p.repo.pushedAt ? 1 : a.p.repo.pushedAt > b.p.repo.pushedAt ? -1 : a.i - b.i))
    .slice(0, n)
    .map(
      ({ p }) =>
        html`<li class="warm-static"><a href="#werk/${p.id}">${p.title}</a><span class="meta">${p.category}</span></li>`,
    );
  return items.map(String).join("");
}

export default renderWarmStatic;
