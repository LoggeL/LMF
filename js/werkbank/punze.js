/**
 * Punze: the hallmark on every Werkstück (spec §1.2, §5.4)  [WP2]
 * A stamped button „Gepunzt · {n} Quellen“ that opens a native popover „Woher ich das weiß“
 * (fallback: <details>) listing every source with its check date. Reusable on chapter spec sheets
 * and partner cards (WP4/WP5):
 *
 *   import { mountPunze, renderPunze, renderSourceList } from "../werkbank/punze.js";
 *   mountPunze(slotEl, { id, title, sources })                → renders into the slot
 *   renderPunze({ id, title, sources, prefix, popover })      → string (button + popover)
 *   renderSourceList({ id, sources, prefix })                 → string, <ol> whose items carry the
 *                                                               ids the ¹²³ marks point at (#{prefix}-{id}-{n})
 *
 * Private sources (source.private) never show a link or the repo name.
 * `foreign` ([{ text, lang }] from details.foreign) marks quoted English in labels with <span lang>.
 * The string renderers are pure (Node-importable); only mountPunze() touches the DOM.
 */
import { html, icon, safeUrl } from "../lib/dom.js";
import { formatDate } from "../lib/derive.js";

export const PUNZE_TITLE = "Woher ich das weiß";
export const PUNZE_LINE = "Alles hier ist belegt. Wenn was nicht stimmt, sag Bescheid.";
const MAIL = "hyper.xjo@gmail.com";

export const supportsPopover = () => typeof HTMLElement !== "undefined" && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, "popover");

export const punzeLabel = (n) => `Gepunzt · ${n} ${n === 1 ? "Quelle" : "Quellen"}`;

/**
 * Public label of a source; private repos lose their name. Only the repo's own owner/name token is
 * replaced (file paths such as „src/app/api/route.ts“ stay as they are).
 */
export function sourceLabel(s) {
  let label = String(s?.label ?? "");
  if (s?.private) {
    label = label.replace(/Repo\s+[\w.-]+\/[\w.-]+\s*\(privat, nicht öffentlich einsehbar\)/, "Privates Repo (nicht öffentlich einsehbar)");
    const full = String(s.url ?? "").match(/github\.com\/(?:repos\/)?([\w.-]+\/[\w.-]+)/)?.[1]?.replace(/\.git$/, "");
    if (full) label = label.split(full).join("privates Repo");
  }
  return label;
}

/** The check date most sources share: printed once („Alles geprüft am …“), rows only show a differing one. */
export function commonCheck(sources = []) {
  const n = new Map();
  for (const s of sources) if (s?.checkedAt) n.set(s.checkedAt, (n.get(s.checkedAt) ?? 0) + 1);
  let best = null;
  for (const [d, c] of n) if (!best || c > n.get(best)) best = d;
  return best;
}

/** „Alles geprüft am 28.09.2026“ (or „Geprüft am …, wo nicht anders vermerkt“ if some rows differ). */
export function checkedLine(sources = [], cls = "punze-when meta") {
  const common = commonCheck(sources);
  if (!common) return "";
  const all = sources.every((s) => s?.checkedAt === common);
  const date = html`<time datetime="${common}">${formatDate(common)}</time>`;
  return html`<p class="${cls}">${all ? html`Alles geprüft am ${date}` : html`Geprüft am ${date}, wo nicht anders vermerkt`}</p>`;
}

/**
 * Marks foreign-language passages (WCAG 3.1.2). `foreign` comes from the details JSON:
 * [{ text: "Drag the reactor. Click to capture.", lang: "en" }]; every exact occurrence is wrapped.
 */
export function withLang(text, foreign) {
  const src = String(text ?? "");
  const list = (Array.isArray(foreign) ? foreign : []).filter((f) => f?.text && /^[a-z]{2,3}(-[A-Za-z]{2})?$/.test(f.lang ?? "") && src.includes(f.text));
  if (!list.length) return html`${src}`;
  let parts = [src];
  for (const f of list) {
    parts = parts.flatMap((part) => {
      if (typeof part !== "string" || !part.includes(f.text)) return [part];
      const out = [];
      part.split(f.text).forEach((chunk, i) => {
        if (i) out.push(html`<span lang="${f.lang}">${f.text}</span>`);
        if (chunk) out.push(chunk);
      });
      return out;
    });
  }
  return html`${parts}`;
}

const mailto = (title) => `mailto:${MAIL}?subject=${encodeURIComponent(`Da stimmt was nicht: ${title ?? "LMF"}`)}`;

/**
 * Label with `tail` (the ↗) glued to its last word, so the arrow never wraps onto a line of its own.
 * A foreign-language phrase that spans the last space keeps its lang span and is left unglued.
 */
export function glueTail(text, tail, foreign = null) {
  const src = String(text ?? "");
  // Break before the last word, or after the last „/“ of a repo slug (LoggeL/<wbr>MelodAI).
  const body = src.slice(0, -1);
  const at = Math.max(body.lastIndexOf(" "), body.lastIndexOf("/"));
  const head = src.slice(0, at + 1);
  const last = src.slice(at + 1);
  const split = (Array.isArray(foreign) ? foreign : []).some((f) => f?.text && src.includes(f.text) && !head.includes(f.text) && !last.includes(f.text));
  if (split) return html`${withLang(src, foreign)}${tail}`;
  const wbr = head.endsWith("/") ? html`<wbr>` : "";
  return html`${at > 0 ? html`${withLang(head, foreign)}${wbr}` : ""}<span class="punze-nw">${withLang(at > 0 ? last : src, foreign)}${tail}</span>`;
}

function sourceItem(s, { itemId = "", common = null, foreign = null } = {}) {
  const text = sourceLabel(s);
  const url = s.private ? "#" : safeUrl(s.url);
  const ext = url === "#" ? "" : html`<span class="ext-i">\u00A0${icon("arrow-ne")}</span>`;
  // The shared date is printed once above the list; screen readers still hear it per row.
  const same = common && s.checkedAt === common;
  const date = s.checkedAt ? html`<time datetime="${s.checkedAt}">${formatDate(s.checkedAt)}</time>` : "";
  const inner =
    date && !same
      ? html`${withLang(text, foreign)} <span class="punze-checked">· geprüft am ${date}${ext}</span>`
      : glueTail(text, html`${date ? html`<span class="vh"> · geprüft am ${date}</span>` : ""}${ext}`, foreign);
  const body =
    url === "#"
      ? html`<span class="punze-src">${inner}</span>`
      : html`<a class="punze-src" href="${url}" target="_blank" rel="noopener noreferrer">${inner}<span class="vh"> (öffnet neue Seite)</span></a>`;
  return html`<li${itemId ? html` id="${itemId}"` : ""}>${body}</li>`;
}

export function renderSourceList({ id, sources = [], prefix = "src", when = false, foreign = null } = {}) {
  if (!sources.length) return "";
  const common = commonCheck(sources);
  return String(html`${when ? checkedLine(sources) : ""}<ol class="punze-list" role="list">${sources.map((s, i) => sourceItem(s, { itemId: `${prefix}-${id}-${i + 1}`, common, foreign }))}</ol>`);
}

/** „Alles hier ist belegt. Wenn was nicht stimmt, sag Bescheid.“ with the last words as mailto. */
export function punzeLine(title, cls = "punze-line") {
  return html`<p class="${cls}">Alles hier ist belegt. Wenn was nicht stimmt, <a href="${mailto(title)}">sag Bescheid.</a></p>`;
}

function popBody({ title, sources, headingId, foreign }) {
  const common = commonCheck(sources);
  return html`<div class="punze-pop-head">
      <p class="punze-pop-kicker meta">${icon("punze", "i punze-pop-i")} Gepunzt</p>
      <h3 class="punze-pop-title" id="${headingId}">${PUNZE_TITLE}</h3>
      ${checkedLine(sources)}
    </div>
    <div class="punze-pop-scroll" tabindex="0" role="group" aria-label="Quellen">
      <ol class="punze-list" role="list">${sources.map((s) => sourceItem(s, { common, foreign }))}</ol>
    </div>`;
}

export function renderPunze({ id, title = "", sources = [], prefix = "wb", popover = true, foreign = null } = {}) {
  if (!id || !sources.length) return "";
  const popId = `punze-${prefix}-${id}`;
  const headingId = `${popId}-title`;
  const label = punzeLabel(sources.length);
  if (popover) {
    return String(html`<button type="button" class="punze-button" popovertarget="${popId}" aria-haspopup="dialog">${icon("punze", "i punze-i")}<span>${label}</span></button>
<div id="${popId}" class="punze-pop" popover role="dialog" aria-labelledby="${headingId}">
  ${popBody({ title, sources, headingId, foreign })}
  <div class="punze-pop-foot">
    ${punzeLine(title)}
    <button type="button" class="punze-close" popovertarget="${popId}" popovertargetaction="hide">Schließen ${icon("close")}</button>
  </div>
</div>`);
  }
  return String(html`<details class="punze-details">
  <summary class="punze-button">${icon("punze", "i punze-i")}<span>${label}</span></summary>
  <div class="punze-pop punze-pop--inline" role="group" aria-labelledby="${headingId}">${popBody({ title, sources, headingId, foreign })}<div class="punze-pop-foot">${punzeLine(title)}</div></div>
</details>`);
}

/** DOM helper for other packages. Returns { destroy }. */
export function mountPunze(slot, { id, title, sources, prefix = "ch" } = {}) {
  if (!slot) return { destroy() {} };
  slot.innerHTML = renderPunze({ id, title, sources, prefix, popover: supportsPopover() });
  return {
    destroy() {
      slot.textContent = "";
    },
  };
}

export default renderPunze;
