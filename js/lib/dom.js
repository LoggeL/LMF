/**
 * DOM helpers  [LEAD]
 *
 * Node-importable: nothing here touches `window`/`document` at import time, so the pure
 * renderers in js/render/*.js can use `html`` ` and `escapeHtml` inside scripts/prerender.mjs.
 *
 *   $(sel, root?)            → first match or null
 *   $$(sel, root?)           → Array of matches
 *   html`<p>${text}</p>`     → SafeHtml (auto-escapes every interpolation; nests; arrays join)
 *   raw(string)              → SafeHtml that is inserted verbatim (only for trusted markup)
 *   escapeHtml(value)        → escaped string
 *   on(target, type, [selector], handler, [options]) → off()  (delegation when selector given)
 *   icon(name, cls?)         → SafeHtml for a sprite icon (aria-hidden)
 *   extLink(href, label, cls?) → SafeHtml for an external link with the SR suffix + ↗ icon
 *
 * `html` returns an object with toString(), so `el.innerHTML = html`…`` and `String(html`…`)`
 * both work. Renderers that must return a plain string do `return String(html`…`)`.
 */

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" };

/** Escapes a value for HTML text and attribute contexts. null/undefined → "". */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (c) => ESC[c]);
}

/** Marker class for already-safe markup. */
export class SafeHtml {
  constructor(value) {
    this.value = String(value);
  }
  toString() {
    return this.value;
  }
  toJSON() {
    return this.value;
  }
}

/** Wraps trusted markup so `html` inserts it without escaping. */
export const raw = (value) => new SafeHtml(value ?? "");

function part(value) {
  if (value === null || value === undefined || value === false) return "";
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(part).join("");
  return escapeHtml(value);
}

/** Tagged template: escapes every interpolation unless it is SafeHtml (or an array of them). */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += part(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}

/** Allows only http(s), mailto and same-origin relative URLs; everything else becomes "#". */
export function safeUrl(value, base = typeof location !== "undefined" ? location.href : "https://lmf.logge.top/") {
  try {
    const url = new URL(String(value ?? ""), base);
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? String(value).trim() : "#";
  } catch {
    return "#";
  }
}

/** Sprite icon. Names: arrow-ne, arrow-se, arrow-down, arrow-up, arrow-right, arrow-left, close, play, pause, theme, punze, rivet, star, search, logo. */
export function icon(name, cls = "i") {
  return html`<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
}

/** Visually hidden suffix for links that open a new page (§2.13). */
export const EXT_SUFFIX = " (öffnet neue Seite)";

/** External link: text + ↗ icon + SR suffix, new tab, no referrer. */
export function extLink(href, label, cls = "") {
  return html`<a${cls ? raw(` class="${escapeHtml(cls)}"`) : ""} href="${safeUrl(href)}" target="_blank" rel="noopener noreferrer">${label} ${icon("arrow-ne")}<span class="vh">${EXT_SUFFIX}</span></a>`;
}

/* ── Runtime-only helpers (need a document when called) ─────────────────────────────────────────── */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/**
 * Adds a listener and returns a function that removes it.
 * on(el, "click", handler)                     → direct
 * on(el, "click", "[data-x]", (e, match) => …) → delegated; `match` is the closest matching element
 */
export function on(target, type, selectorOrHandler, handlerOrOptions, maybeOptions) {
  let handler;
  let options;
  if (typeof selectorOrHandler === "function") {
    handler = selectorOrHandler;
    options = handlerOrOptions;
  } else {
    const selector = selectorOrHandler;
    const inner = handlerOrOptions;
    options = maybeOptions;
    handler = (event) => {
      const match = event.target instanceof Element ? event.target.closest(selector) : null;
      if (match && (target === document || target === window || target.contains(match))) inner(event, match);
    };
  }
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/** Parses markup into a DocumentFragment (for append without innerHTML on the parent). */
export function fragment(markup) {
  const t = document.createElement("template");
  t.innerHTML = String(markup);
  return t.content;
}

/** True when the event target is a text-entry field (shortcuts must be ignored there). */
export function isTyping(target = document.activeElement) {
  if (!(target instanceof Element)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) {
    return !["button", "checkbox", "radio", "range", "reset", "submit", "color", "file", "image"].includes(target.type);
  }
  return false;
}
