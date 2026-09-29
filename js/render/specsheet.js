/**
 * Werkstück facts (spec §2.5, §5.4)  [WP2]
 * Pure, Node-importable. Reused by the Meisterstücke chapters (WP4).
 *
 *   specRows(project, details, { film })  → [{ key, label, value (SafeHtml|string), src (index|null) }]
 *   factCells(project, details, { film, asOf }) → [{ key, label, value, sub }]  the Werkbank's fact strip (≤ 4)
 *   ribbons(project, details, { film })   → ["Das Theater ist … nominiert."]  one-line facts under the title
 *   renderFacts(project, details, { film, asOf }) → "<dl class=wb-facts>…" ("" when there is nothing to show)
 *   gluedLink(url, label, cls?)           → external link whose ↗ stays glued to the last word
 *   withLang(text, foreign)               → marks quoted English with <span lang> (WCAG 3.1.2)
 *   renderToolChips(stack)                → buttons that filter the Lager by tool
 *
 * The sources stay in the data (details.sources): a row whose source cannot be resolved is still
 * omitted instead of being shown unsourced, but the page shows facts, not footnotes.
 * Private repos never show their name or a link.
 */
import { html, raw, icon, safeUrl } from "../lib/dom.js";
import { ALLOY_SHORT, GLOW_DAYS, daysBetween, formatDate, yearOf } from "../lib/derive.js";
import { dateLong } from "../lib/format.js";
import { yearText } from "./plate.js";

/**
 * Marks foreign-language passages. `foreign` comes from the details JSON:
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

/** Label with `tail` (the ↗) glued to its last word or slug segment, so the arrow never wraps alone. */
export function glueTail(text, tail, foreign = null) {
  const src = String(text ?? "");
  const body = src.slice(0, -1);
  const at = Math.max(body.lastIndexOf(" "), body.lastIndexOf("/"));
  const head = src.slice(0, at + 1);
  const last = src.slice(at + 1);
  const split = (Array.isArray(foreign) ? foreign : []).some((f) => f?.text && src.includes(f.text) && !head.includes(f.text) && !last.includes(f.text));
  if (split) return html`${withLang(src, foreign)}${tail}`;
  const wbr = head.endsWith("/") ? html`<wbr>` : "";
  return html`${at > 0 ? html`${withLang(head, foreign)}${wbr}` : ""}<span class="nw">${withLang(at > 0 ? last : src, foreign)}${tail}</span>`;
}

/** External link whose ↗ stays glued to the last word (or slug segment) of its label. */
export const gluedLink = (url, label, cls = "") =>
  html`<a${cls ? raw(` class="${cls}"`) : ""} href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${glueTail(label, html`<span class="ext-i"> ${icon("arrow-ne")}</span>`)}<span class="vh"> (öffnet neue Seite)</span></a>`;

const validIdx = (details, i) => Number.isInteger(i) && i >= 0 && i < (details?.sources?.length ?? 0);

/** Source index whose URL matches `url` (ignoring a trailing slash), else fallback. */
export function sourceFor(details, url, fallback = null) {
  const norm = (u) => String(u ?? "").replace(/\/+$/, "");
  const i = (details?.sources ?? []).findIndex((s) => norm(s.url) === norm(url));
  return i >= 0 ? i : fallback;
}

const LIVE_TEXT = { live: "online", offline: "offline" };

/** Every fact the data can back, with the index of the source it rests on (data only, not shown). */
export function specRows(p, d, { film } = {}) {
  const rows = [];
  const refs = d?.refs ?? {};
  const add = (key, label, value, src) => {
    if (value === undefined || value === null || value === "") return;
    if (src !== "none" && !validIdx(d, src)) return; // unsourced → omitted
    rows.push({ key, label, value, src: src === "none" ? null : src });
  };
  const alloys = (p.groups ?? []).map((g) => ALLOY_SHORT[g]).filter(Boolean);
  add("legierung", "Legierung", alloys.join(" · "), "none");

  if (film) {
    const video = validIdx(d, refs.video) ? refs.video : sourceFor(d, `https://www.youtube.com/watch?v=${film.youtubeId}`, 0);
    add("titel", film.youtubeId ? "Titel auf YouTube" : "Titel", film.realTitle, video);
    add("jahr", "Jahr", yearText(p), video);
    if (film.uploaded) add("hochgeladen", "Hochgeladen", html`<time datetime="${film.uploaded}">${formatDate(film.uploaded)}</time>`, video);
    add("laenge", "Länge", film.duration, video);
    if (Array.isArray(film.parts) && film.parts.length) {
      const parts = html`<ol class="spec-parts" role="list">${film.parts.map(
        (part, i) => html`<li><span class="spec-part-no">Teil ${i + 1}</span> ${gluedLink(part.url, part.title)} <span class="spec-part-len nb">${part.duration}</span></li>`,
      )}</ol>`;
      add("teile", "Teile", parts, sourceFor(d, film.parts[0].url, video));
    }
    add("ort", "Ort", film.location, video);
    if (film.quote) add("beschreibung", "Beschreibung", html`<q>${film.quote}</q>`, video);
    else if (film.paraphrase) add("beschreibung", "Laut Beschreibung", film.paraphrase, video);
    if (Array.isArray(film.alsoOn) && film.alsoOn.length) {
      add("auch", "Auch auf", html`${film.alsoOn.map((a, i) => html`${i ? ", " : ""}${gluedLink(a.url, a.label)}`)}`, sourceFor(d, film.alsoOn[0].url, video));
    }
    if (Array.isArray(film.roles) && film.roles.length) {
      const roleSrc = (d?.sources ?? []).findIndex((s) => /Rolle/.test(s.label));
      add("rolle", "Rolle", film.roles.join(", "), roleSrc >= 0 ? roleSrc : video);
    }
  } else {
    const repoRef = validIdx(d, refs.repo) ? refs.repo : null;
    add("begonnen", "Begonnen", yearText(p), repoRef ?? 0);
    const r = p.repo;
    if (r?.pushedAt) add("zuletzt", "Zuletzt dran", html`<time datetime="${r.pushedAt}">${formatDate(r.pushedAt)}</time>`, repoRef);
    if (r?.createdAt) add("angelegt", "Repo angelegt", html`<time datetime="${r.createdAt}">${formatDate(r.createdAt)}</time>`, repoRef);
    if (Number.isFinite(d?.commits)) add("commits", "Commits", String(d.commits), repoRef);
    if (r && !r.private && Number.isFinite(r.stars) && r.stars > 0) add("sterne", "Sterne", String(r.stars), repoRef);
    if (p.live && LIVE_TEXT[p.live.status]) {
      const liveRef = validIdx(d, refs.live) ? refs.live : sourceFor(d, p.link);
      add("live", "Live", LIVE_TEXT[p.live.status], liveRef);
    }
    if (r?.fullName && !r.private) {
      add("repo", "Repo", { repo: r.fullName }, sourceFor(d, `https://github.com/${r.fullName}`, repoRef));
    } else if (r?.private) {
      add("repo", "Repo", "privat", repoRef);
    }
  }
  for (const f of d?.facts ?? []) add(`fact-${f.key ?? f.label}`, f.label, String(f.value), f.source);
  return rows;
}

/** Stars earn a place in the strip only when they say something. Commits never do. */
export const STARS_WORTH_SHOWING = 25;
/** The strip is one row: at most four cells. */
export const MAX_FACT_CELLS = 4;

/**
 * The fact strip: up to four things worth knowing at a glance: the year (or the length), the
 * project's own numbers (arenas, seats, pipeline steps), and only then when I last worked on it
 * (for a piece that has cooled off, and only when that is not its own year) or a real star count.
 * Only facts specRows can back make it in; a fact of kind „ribbon“ is a sentence under the title
 * instead (see ribbons()). `asOf` (the snapshot date) decides whether a piece has cooled off.
 */
export function factCells(p, d, { film, asOf } = {}) {
  const rows = new Map(specRows(p, d, { film }).map((r) => [r.key, r]));
  // facts with a kind are not cells: „ribbon“ is a sentence under the title, „probe“ only backs a Probestück
  const ribbonKeys = new Set((d?.facts ?? []).filter((f) => f.kind).map((f) => `fact-${f.key ?? f.label}`));
  const out = [];
  const put = (key, label, value, sub = "") => {
    if (value !== undefined && value !== null && value !== "") out.push({ key, label, value, sub });
  };
  if (film) {
    if (rows.has("jahr")) put("jahr", "Jahr", yearText(p));
    // the player's badge already shows the length
    if (rows.has("laenge") && !/^[\w-]{11}$/.test(film.youtubeId ?? "")) put("laenge", "Länge", film.duration);
    // „Ort: Portes du Soleil“ under the title „Portes du Soleil“ says nothing new
    if (rows.has("ort") && !String(p.title ?? "").includes(film.location)) put("ort", "Ort", film.location);
    if (rows.has("teile")) put("teile", "Teile", String(film.parts.length));
    if (rows.has("rolle")) put("rolle", film.roles.length > 1 ? "Rollen" : "Rolle", film.roles.join(", "));
  } else if (rows.has("begonnen")) put("jahr", "Jahr", yearText(p));
  for (const [key, row] of rows) if (key.startsWith("fact-") && !ribbonKeys.has(key)) put(key, row.label, row.value);
  if (!film) {
    const r = p.repo;
    const pushed = r?.pushedAt ? r.pushedAt.slice(0, 10) : "";
    const cooled = pushed && yearOf(pushed) !== p.year && (!asOf || daysBetween(pushed, asOf) > GLOW_DAYS.warm);
    if (rows.has("zuletzt") && cooled) put("zuletzt", "Zuletzt dran", html`<time datetime="${pushed}">${dateLong(pushed.slice(0, 7))}</time>`);
    if (rows.has("sterne") && r.stars >= STARS_WORTH_SHOWING) put("sterne", "Sterne", String(r.stars));
  }
  // a lone year is no strip (the hero says when; werkbank.js puts it in the kicker if not)
  if (out.length === 1 && out[0].key === "jahr") return [];
  return out.slice(0, MAX_FACT_CELLS);
}

/** Facts of kind „ribbon“ (a nomination, say): one sentence each, shown under the title. */
export function ribbons(p, d, opts = {}) {
  const keys = new Set(specRows(p, d, opts).map((r) => r.key));
  return (d?.facts ?? []).filter((f) => f.kind === "ribbon" && f.text && keys.has(`fact-${f.key ?? f.label}`)).map((f) => f.text);
}

export function renderFacts(p, d, opts = {}) {
  const cells = factCells(p, d, opts);
  if (!cells.length) return "";
  // Short values (2024, 172, 3:41) set big; words and links („Portes du Soleil“, „jupeters.de“) smaller.
  // Only really long values („Portes du Soleil, Frankreich“) take a whole row on phones.
  const len = (c) => String(c.value).replace(/<span class="vh">[^<]*<\/span>/g, "").replace(/<[^>]*>/g, "").trim().length;
  const long = (c) => typeof c.value !== "string" || len(c) > 12;
  const wide = (c) => len(c) > 18;
  return String(html`<dl class="wb-facts" data-cells="${cells.length}" aria-label="Eckdaten">${cells.map(
    (c) => html`<div class="wb-fact wb-fact--${c.key}${long(c) ? " wb-fact--long" : ""}${wide(c) ? " wb-fact--wide" : ""}"><dt>${c.label}</dt><dd>${c.value}${c.sub ? html`<span class="wb-fact-sub">${c.sub}</span>` : ""}</dd></div>`,
  )}</dl>`);
}

/** Stack chips → buttons that filter the Lager („{Tool} im Lager zeigen“). */
export function renderToolChips(stack = []) {
  if (!stack.length) return "";
  return String(html`<ul class="wb-tools" role="list">${stack.map(
    (t) => html`<li><button type="button" class="chip wb-tool" data-tool="${t}" title="${t} im Lager zeigen">${t}${icon("search", "i wb-tool-i")}<span class="vh"> im Lager zeigen</span></button></li>`,
  )}</ul>`);
}

export { raw };
export default renderFacts;
