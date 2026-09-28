/**
 * Compatibility module  [WP2]  (spec §6.1)
 * Older code and scripts/validate.mjs import these three helpers from here. Signatures unchanged:
 *   escapeHtml(value) → string
 *   safeUrl(value)    → the URL if it is http(s)/mailto, else "#"
 *   filterProjects(projects, filter, query) → Project[]
 * The implementations now live in js/lib/dom.js and js/lib/search.js (umlaut/apostrophe folding).
 */
export { escapeHtml, safeUrl } from "./lib/dom.js";
export { filterProjects } from "./lib/search.js";
