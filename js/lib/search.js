/**
 * Lager search (spec §5.3, §3.13)  [WP2] — pure, Node-importable.
 *   filterProjects(projects, "all"|"web"|"games"|"ai"|"film", query, { details?, films }?) → input order,
 *     AND across normalize()d tokens · tokens(q) · matches(p, toks, opts) · score(p, toks, opts) (omnibox)
 *   highlight(text, q) → SafeHtml <mark> · sortProjects(list, "lager"|"neu"|"alt"|"az", ctx)
 */
import { normalize, haystack, lastWorkedOn } from "./derive.js";
import { html, raw, escapeHtml } from "./dom.js";

export const SORTS = ["lager", "neu", "alt", "az"];
export const SORT_LABEL = { lager: "Wie im Lager", neu: "Zuletzt bearbeitet", alt: "Älteste zuerst", az: "A–Z" };

const pick = (store, id) => (store instanceof Map ? store.get(id) : store?.[id]);

/** Normalised, de-duplicated search tokens. */
export function tokens(query) {
  return [...new Set(normalize(query).split(" ").filter(Boolean))];
}

const hayCache = new WeakMap();
function hay(project, opts) {
  const d = pick(opts?.details, project.id);
  const f = pick(opts?.films, project.id);
  const key = `${d ? 1 : 0}${f ? 1 : 0}`;
  const cached = hayCache.get(project);
  if (cached && cached.key === key) return cached.text;
  const text = haystack(project, d, f);
  hayCache.set(project, { key, text });
  return text;
}

/* Tokens ≤ 3 chars match word starts only („Öl“ → „ol“ must not hit „Kolping“). */
const SHORT = 3;
const WORD = /[\p{L}\p{N}]/u;
function findToken(text, t, from = 0) {
  if (t.length > SHORT) return text.indexOf(t, from);
  for (let at = text.indexOf(t, from); at >= 0; at = text.indexOf(t, at + 1)) if (at === 0 || !WORD.test(text[at - 1])) return at;
  return -1;
}
const hasToken = (text, t) => findToken(text, t) >= 0;

export function matches(project, toks, opts) {
  if (!toks.length) return true;
  const text = hay(project, opts);
  return toks.every((t) => hasToken(text, t));
}

/** Compatible with the legacy js/projects.js signature (projects, filter, query). */
export function filterProjects(projects, filter = "all", query = "", opts = {}) {
  const toks = tokens(query);
  return (projects ?? []).filter(
    (p) => (filter === "all" || (Array.isArray(p.groups) && p.groups.includes(filter))) && matches(p, toks, opts),
  );
}

/** Relevance: title prefix > title word > title contains > anywhere. Only for ranking UIs (omnibox). */
export function score(project, toks, opts) {
  if (!toks.length) return 0;
  const title = normalize(project.title);
  const text = hay(project, opts);
  let s = 0;
  for (const t of toks) {
    if (!hasToken(text, t)) return 0;
    if (title.startsWith(t)) s += 8;
    else if (title.split(" ").some((w) => w.startsWith(t))) s += 5;
    else if (title.includes(t)) s += 3;
    else s += 1;
  }
  return s;
}

/**
 * Sort a result list. `ctx.films` (Map) lets "neu" fall back to film upload dates.
 * lager: JSON order · neu: pushedAt desc, then film upload desc, dateless last
 * alt: year asc (JSON order breaks ties, yearless last) · az: localeCompare("de")
 */
export function sortProjects(list, s = "lager", ctx = {}) {
  const arr = [...list];
  const index = new Map((ctx.order ?? list).map((p, i) => [p.id, i]));
  const idx = (p) => index.get(p.id) ?? 0;
  if (s === "neu") {
    const key = (p) => {
      if (p.repo?.pushedAt) return [0, p.repo.pushedAt];
      const up = lastWorkedOn(p, ctx.films);
      return up ? [1, up] : [2, ""];
    };
    return arr.sort((a, b) => {
      const [ga, da] = key(a);
      const [gb, db] = key(b);
      return ga - gb || (da < db ? 1 : da > db ? -1 : 0) || idx(a) - idx(b);
    });
  }
  if (s === "alt") {
    const y = (p) => (Number.isInteger(p.year) ? p.year : 9999);
    return arr.sort((a, b) => y(a) - y(b) || idx(a) - idx(b));
  }
  if (s === "az") return arr.sort((a, b) => String(a.title).localeCompare(String(b.title), "de", { sensitivity: "base" }) || idx(a) - idx(b));
  return arr.sort((a, b) => idx(a) - idx(b));
}

/* Highlighting: fold char by char like normalize() (same passes, same order), keeping each folded
   char's span in the original text. */

function foldWithMap(text) {
  const src = String(text ?? "");
  let arr = [];
  let i = 0;
  for (const ch of src) {
    const start = i;
    i += ch.length;
    const folded = ch.toLocaleLowerCase("de").normalize("NFD").replace(/\p{M}/gu, "").replace(/ß/g, "ss");
    for (const f of folded) arr.push({ c: f, s: start, e: i });
  }
  for (const [a, b] of [
    ["a", "e"],
    ["o", "e"],
    ["u", "e"],
  ]) {
    const next = [];
    for (let k = 0; k < arr.length; k++) {
      if (arr[k].c === a && arr[k + 1]?.c === b) {
        next.push({ c: a, s: arr[k].s, e: arr[k + 1].e });
        k++;
      } else next.push(arr[k]);
    }
    arr = next;
  }
  arr = arr.filter((x) => !/['’‘`´]/.test(x.c));
  // Whitespace runs collapse to one space, as in normalize().
  const out = [];
  for (const x of arr) {
    const ws = /\s/.test(x.c);
    if (ws && out.length && out[out.length - 1].c === " ") {
      out[out.length - 1].e = x.e;
      continue;
    }
    out.push(ws ? { ...x, c: " " } : x);
  }
  return { src, chars: out, folded: out.map((x) => x.c).join("") };
}

/** Original-text ranges [start, end) that match any token. Merged and sorted. */
export function matchRanges(text, query) {
  const toks = tokens(query);
  if (!toks.length || !text) return [];
  const { chars, folded } = foldWithMap(text);
  const ranges = [];
  for (const t of toks) {
    let from = 0;
    for (;;) {
      const at = findToken(folded, t, from);
      if (at < 0) break;
      ranges.push([chars[at].s, chars[at + t.length - 1].e]);
      from = at + t.length;
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

/** Escaped text with <mark> around every match. Returns SafeHtml (use in html``). */
export function highlight(text, query) {
  const src = String(text ?? "");
  const ranges = matchRanges(src, query);
  if (!ranges.length) return html`${src}`;
  let out = "";
  let pos = 0;
  for (const [s, e] of ranges) {
    out += escapeHtml(src.slice(pos, s)) + "<mark>" + escapeHtml(src.slice(s, e)) + "</mark>";
    pos = e;
  }
  out += escapeHtml(src.slice(pos));
  return raw(out);
}

export default filterProjects;
