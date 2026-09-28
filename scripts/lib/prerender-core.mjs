/**
 * Prerender core, shared by scripts/prerender.mjs (writes) and scripts/validate.mjs (freshness).
 *
 * - `<!-- prerender:NAME -->…<!-- /prerender:NAME -->` blocks are filled with the output of a
 *   pure renderer from js/render/*.js (see RENDERERS). Missing renderer modules are skipped and
 *   the block is left untouched, so the script can run before WP2/WP5 deliver their renderers.
 * - Every element with `data-bind="key"` (no child elements) gets `formatBinding(bindings[key])`.
 */
import { access } from "node:fs/promises";
import { formatBinding } from "../../js/lib/derive.js";

const ROOT = new URL("../../", import.meta.url);

/** Marker name → renderer module (relative to the site root). Unknown markers try js/render/<name>.js. */
export const RENDERERS = {
  lager: "js/render/lager-static.js",
  "schichtbuch-table": "js/render/schichtbuch-static.js",
  abspann: "js/render/credits.js",
  abseits: "js/render/abseits-static.js",
};

/**
 * Minimal built-in renderers, used only while the owning package's js/render module does not
 * exist yet, so the no-JS page never shows stale data. The real renderer always wins.
 */
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const FALLBACKS = {
  lager: (data) =>
    `<ol id="lager-static" class="lager-static" aria-label="Alle Projekte">${(data.projects ?? [])
      .map((p) => `<li id="werk/${esc(p.id)}"><a href="${esc(p.link)}">${esc(p.title)}</a> · ${esc(p.category)}${p.year ? ` · ${esc(p.yearLabel ?? p.year)}` : ""} — ${esc(p.summary || p.description)}</li>`)
      .join("")}</ol>`,
};

const BLOCK_RE = /<!--\s*prerender:([\w-]+)\s*-->([\s\S]*?)<!--\s*\/prerender:\1\s*-->/g;
const BIND_RE = /<([a-zA-Z][\w-]*)(\s[^<>]*?\bdata-bind="([^"]+)"[^<>]*)>([^<]*)<\/\1>/g;

const escapeText = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());

async function loadRenderer(name) {
  const rel = RENDERERS[name] ?? `js/render/${name}.js`;
  const url = new URL(rel, ROOT);
  try {
    await access(url);
  } catch {
    return { missing: rel };
  }
  const mod = await import(url.href);
  const base = rel.split("/").pop().replace(/\.js$/, "");
  const candidates = [
    mod.default,
    mod.render,
    mod[camel(`render-${name}`)],
    mod[camel(`render-${base}`)],
    mod[camel(name)],
    mod[camel(base)],
    ...Object.values(mod).filter((v) => typeof v === "function"),
  ];
  const fn = candidates.find((c) => typeof c === "function");
  return fn ? { fn, rel } : { missing: `${rel} (no exported renderer function)` };
}

/**
 * Renders `html` with `data`. Returns { html, blocks: [{name, status, detail}], binds: {filled, unknown[]} }.
 * status: "rendered" | "skipped" | "error".
 */
export async function prerenderHtml(html, data) {
  const blocks = [];
  const names = [...html.matchAll(BLOCK_RE)].map((m) => m[1]);
  const outputs = new Map();
  for (const name of new Set(names)) {
    let r = await loadRenderer(name);
    if (r.missing && FALLBACKS[name]) r = { fn: FALLBACKS[name], rel: `WP1 fallback (${r.missing} not there yet)` };
    if (r.missing) {
      blocks.push({ name, status: "skipped", detail: `renderer missing: ${r.missing}` });
      continue;
    }
    try {
      const out = await r.fn(data, { marker: name, bindings: data.bindings, asOf: data.snapshot?.asOf });
      if (typeof out !== "string") throw new Error(`renderer returned ${typeof out}`);
      outputs.set(name, out.trim());
      blocks.push({ name, status: "rendered", detail: r.rel });
    } catch (e) {
      blocks.push({ name, status: "error", detail: `${r.rel}: ${e.message}` });
    }
  }
  let next = html.replace(BLOCK_RE, (whole, name) =>
    outputs.has(name) ? `<!-- prerender:${name} -->${outputs.get(name)}<!-- /prerender:${name} -->` : whole,
  );

  const unknown = [];
  let filled = 0;
  next = next.replace(BIND_RE, (whole, tag, attrs, key, text) => {
    if (!Object.prototype.hasOwnProperty.call(data.bindings, key)) {
      unknown.push(key);
      return whole;
    }
    filled++;
    return `<${tag}${attrs}>${escapeText(formatBinding(data.bindings[key]))}</${tag}>`;
  });
  return { html: next, blocks, binds: { filled, unknown: [...new Set(unknown)] } };
}

/** Lists the data-bind keys used in a document. */
export const bindKeys = (html) => [...new Set([...html.matchAll(BIND_RE)].map((m) => m[3]))];
