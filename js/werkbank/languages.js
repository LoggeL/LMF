/**
 * Language bar „Legierung laut GitHub“ (spec §5.4)  [WP2]
 * Pure string renderer. The stacked bar is decoration (aria-hidden); the adjacent <ul> carries the
 * real numbers with a German decimal comma. Shares under 2 % are grouped as „Rest“.
 *
 *   languageParts(languages)                  → [{ name, pct, step }]
 *   renderLanguages(languages, { ref })       → string ("" when there is nothing to show)
 */
import { html } from "../lib/dom.js";
import { percent } from "../lib/format.js";

export const REST = "Rest";

export function languageParts(languages) {
  if (!languages || typeof languages !== "object") return [];
  const entries = Object.entries(languages)
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .sort((a, b) => b[1] - a[1]);
  const main = entries.filter(([, v]) => v >= 2);
  const rest = entries.filter(([, v]) => v < 2).reduce((s, [, v]) => s + v, 0);
  const parts = main.slice(0, 5).map(([name, pct], i) => ({ name, pct, step: i }));
  const overflow = main.slice(5).reduce((s, [, v]) => s + v, 0) + rest;
  if (overflow > 0) parts.push({ name: REST, pct: Math.round(overflow * 10) / 10, step: 5 });
  return parts;
}

export function renderLanguages(languages, { ref = "" } = {}) {
  const parts = languageParts(languages);
  if (!parts.length) return "";
  const total = parts.reduce((s, p) => s + p.pct, 0) || 100;
  return String(html`<div class="wb-langs">
    <div class="wb-langs-head"><h4 class="wb-aside-title meta">Legierung laut GitHub</h4>${ref}</div>
    <div class="wb-lang-bar" aria-hidden="true">${parts.map(
      (p) => html`<span class="wb-lang-seg" data-step="${p.step}" style="--w: ${((p.pct / total) * 100).toFixed(2)}%"></span>`,
    )}</div>
    <ul class="wb-lang-list" role="list">${parts.map(
      (p) => html`<li data-step="${p.step}"><span class="wb-lang-dot" aria-hidden="true"></span><span class="wb-lang-name">${p.name}</span> <span class="wb-lang-pct">${percent(p.pct)}</span></li>`,
    )}</ul>
  </div>`);
}

export default renderLanguages;
