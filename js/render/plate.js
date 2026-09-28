/**
 * Plate renderer (spec §2.4, §4.5, §5.3)  [WP2] — pure strings, Node-importable (Lager, Noch warm, prerender).
 *   plateContext(data, extra?) · renderPlate(p, ctx) · renderPlates(list, ctx) · renderRohling(p)
 *   plateStamps(p, ctx) · splitTitle(title) · langOf(p, lang)
 * ctx = { asOf, stock, lang, films, query?, variant?: "regal"|"rail", sort?, eager?, strips? }
 * Everything goes through html`` (escaped); the Liste table is ./table.js (lazy, §8).
 */
import { html, raw, icon } from "../lib/dom.js";
import { alloyOf, glowOf, glowLabel, stockNumbers, stockLabel, ALLOY_SHORT, ART_STYLES, formatDate } from "../lib/derive.js";
import { highlight } from "../lib/search.js";
import { THUMBS } from "./thumbs.js";

export const filmOf = (ctx, id) => (ctx?.films instanceof Map ? ctx.films.get(id) : null);

/* Language tag fallback when repos.json has no row (other owners, private repos); for all such
   projects it equals the top entry of details.languages. */
const LANG_TAGS = { typescript: "TypeScript", javascript: "JavaScript", python: "Python", html: "HTML", css: "CSS", kotlin: "Kotlin", java: "Java" };

/** Primary language: repos.json first, else the first language tag. */
export function langOf(p, lang) {
  return lang?.get?.(p.id) ?? (p.tags ?? []).map((t) => LANG_TAGS[String(t).toLowerCase()]).find(Boolean) ?? "";
}

/** Builds the render context once per data load. */
export function plateContext(data = {}, extra = {}) {
  const projects = data.projects ?? [];
  const lang = new Map();
  for (const r of data.repos ?? []) if (r.id && r.l && !lang.has(r.id)) lang.set(r.id, r.l);
  for (const p of projects) if (!lang.has(p.id) && !p.groups?.includes("film")) {
    const l = langOf(p);
    if (l) lang.set(p.id, l);
  }
  return {
    asOf: data.snapshot?.asOf ?? null,
    stock: stockNumbers(projects),
    lang,
    films: data.films instanceof Map ? data.films : null,
    query: "",
    variant: "regal",
    ...extra,
  };
}

/** „ShareX · Afterimage“ → { main: "ShareX", sub: "Afterimage" }; titles without „ · “ stay whole. */
export function splitTitle(title) {
  const t = String(title ?? "");
  const at = t.indexOf(" · ");
  return at > 0 ? { main: t.slice(0, at), sub: t.slice(at + 3) } : { main: t, sub: "" };
}

/* Long title compounds break at a syllable (rendered HTML only). */
const SOFT = [
  ["Strahlschlaufenreaktor", "Strahl\u00ADschlaufen\u00ADreaktor"],
  ["Kolpingtheater", "Kolping\u00ADtheater"],
];
export function softHyphens(markup) {
  let out = String(markup);
  for (const [word, soft] of SOFT) out = out.split(word).join(soft);
  return raw(out);
}

/** Year text: curated yearLabel wins, else year. */
export const yearText = (p) => (p.yearLabel ? String(p.yearLabel) : Number.isInteger(p.year) ? String(p.year) : "");

/** Stamp row facts, only fields that exist. */
export function plateStamps(p, ctx = {}) {
  const out = [];
  const glow = glowOf(p, ctx.asOf);
  const film = filmOf(ctx, p.id);
  if (ctx.variant === "rail") {
    if (glow) out.push({ text: glowLabel(glow), cls: "stamp--glow" });
    if (p.repo?.pushedAt) out.push({ text: `zuletzt dran ${formatDate(p.repo.pushedAt)}`, cls: "stamp--date", iso: p.repo.pushedAt });
    return out;
  }
  const y = yearText(p);
  if (y) out.push({ text: y, cls: "stamp--year" });
  if (film?.duration) out.push({ text: film.duration, cls: "stamp--duration", label: "Länge" });
  const lang = ctx.lang?.get?.(p.id);
  if (lang) out.push({ text: lang, cls: "stamp--lang" });
  const stars = p.repo && !p.repo.private ? p.repo.stars : null;
  if (Number.isFinite(stars) && stars > 0) out.push({ text: String(stars), cls: "stamp--stars", star: true });
  if (glow) out.push({ text: glowLabel(glow), cls: "stamp--glow" });
  return out;
}

function stampRow(p, ctx, id = "") {
  const items = plateStamps(p, ctx);
  if (!items.length) return "";
  return html`<ul class="stamps plate-stamps" role="list"${id ? raw(` id="${id}"`) : ""}>${items.map(
    (s) =>
      html`<li class="${s.cls}">${s.cls === "stamp--glow" ? html`<span class="stamp-ember" aria-hidden="true"></span>` : ""}${s.star ? html`${icon("star", "i plate-star")}<span class="vh">Sterne: </span>` : ""}${
        s.iso ? html`<time datetime="${s.iso}">${s.text}</time>` : s.text
      }</li>`,
  )}</ul>`;
}

/* ── Rohling: typographic blank, clearly not a screenshot (§4.5) ─────────────────────────────── */

/** Tiny deterministic hash → [0,1) generator, so a Rohling looks the same everywhere. */
function seeded(str) {
  let h = 2166136261;
  for (const c of String(str)) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const r1 = (n) => Math.round(n * 10) / 10;

const ETCH = {
  /* sound-wave grooves */
  music(rand) {
    let d = "";
    const n = 46;
    for (let i = 0; i < n; i++) {
      const x = 8 + (i * 144) / (n - 1);
      const env = Math.sin((i / (n - 1)) * Math.PI);
      const h = r1(4 + env * (10 + rand() * 24));
      d += `M${r1(x)} ${r1(50 - h)}V${r1(50 + h)}`;
    }
    return `<path d="${d}" stroke-width="1.4" stroke-linecap="round"/>`;
  },
  /* viewfinder marks */
  capture() {
    const c = (x, y, dx, dy) => `M${x} ${y + dy * 12}V${y}H${x + dx * 18}`;
    return `<path d="${c(10, 10, 1, 1)}${c(150, 10, -1, 1)}${c(10, 90, 1, -1)}${c(150, 90, -1, -1)}" stroke-width="1.6"/>
      <path d="M80 42v16M72 50h16" stroke-width="1"/><circle cx="80" cy="50" r="14" stroke-width=".8" stroke-dasharray="2 3"/>
      <circle cx="20" cy="20" r="2.4" class="rohling-dot"/>`;
  },
  /* 98-bevel */
  retro() {
    return `<rect x="14" y="12" width="132" height="76" stroke-width="1"/>
      <path d="M16 86V14h128" stroke-width="2" class="rohling-hi"/><path d="M144 14v72H16" stroke-width="2"/>
      <path d="M18 18h124v9H18z" stroke-width=".8"/><path d="M128 20h5v5h-5zM135 20h5v5h-5z" stroke-width=".8"/>`;
  },
  /* organic etch: drifting contour lines */
  organic(rand) {
    let out = "";
    const cx = 60 + rand() * 40;
    const cy = 40 + rand() * 20;
    for (let k = 1; k <= 7; k++) {
      const rx = k * 11 + rand() * 4;
      const ry = k * 7 + rand() * 3;
      out += `<ellipse cx="${r1(cx + k * 1.5)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" transform="rotate(${r1(-12 + rand() * 24)} ${r1(cx)} ${r1(cy)})" stroke-width=".8"/>`;
    }
    return out;
  },
  /* gauge ticks */
  widget(rand) {
    let d = "";
    const cx = 80;
    const cy = 78;
    for (let i = 0; i <= 30; i++) {
      const a = Math.PI + (i / 30) * Math.PI;
      const r0 = i % 5 === 0 ? 44 : 49;
      d += `M${r1(cx + Math.cos(a) * r0)} ${r1(cy + Math.sin(a) * r0)}L${r1(cx + Math.cos(a) * 54)} ${r1(cy + Math.sin(a) * 54)}`;
    }
    const a = Math.PI + (0.25 + rand() * 0.5) * Math.PI;
    return `<path d="${d}" stroke-width="1.1"/><path d="M${cx} ${cy}L${r1(cx + Math.cos(a) * 40)} ${r1(cy + Math.sin(a) * 40)}" stroke-width="1.8" class="rohling-needle"/><circle cx="${cx}" cy="${cy}" r="3"/>`;
  },
  /* film perforations */
  film() {
    let holes = "";
    for (let x = 6; x < 160; x += 12) holes += `<rect x="${x}" y="5" width="6" height="7" rx="1"/><rect x="${x}" y="88" width="6" height="7" rx="1"/>`;
    return `${holes}<path d="M0 17H160M0 83H160" stroke-width=".8"/><path d="M53 17V83M107 17V83" stroke-width=".6" stroke-dasharray="1 3"/>`;
  },
};

export function renderRohling(p, { cls = "" } = {}) {
  const style = ART_STYLES.includes(p.art) ? p.art : alloyOf(p) === "film" ? "film" : "widget";
  const etch = ETCH[style](seeded(p.id));
  return html`<div class="rohling rohling--${style}${cls ? ` ${cls}` : ""}" data-alloy="${alloyOf(p) ?? ""}" aria-hidden="true">
    <svg class="rohling-etch" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" focusable="false">${raw(etch)}</svg>
    <span class="rohling-mark">Rohling</span>
    <span class="rohling-title">${p.artTitle || p.title}</span>
    <span class="rohling-cat">${p.category}</span>
  </div>`;
}

/** assets/img/thumbs/<Name>-<w>.webp for an image in THUMBS. */
export const thumb = (image, w) => `assets/img/thumbs/${image.split("/").pop().replace(/\.webp$/, "")}-${w}.webp`;

/** Image, strip or Rohling (16:10). Decorative (alt=""): the link names the project. */
export function plateMedia(p, ctx = {}, eager = false) {
  const film = alloyOf(p) === "film";
  if (p.image) {
    const widths = THUMBS[p.image] ?? [];
    const sizes = ctx.variant === "rail" ? "(min-width:1024px) 360px, 85vw" : "(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw";
    const src = widths.length ? thumb(p.image, widths[widths.length - 1]) : p.image;
    const srcset = widths.map((w) => `${thumb(p.image, w)} ${w}w`).join(", ");
    return html`<div class="plate-media${film ? " plate-media--film" : ""}">
      <img src="${src}"${srcset ? raw(` srcset="${srcset}" sizes="${sizes}"`) : ""} alt="" width="960" height="600" loading="${eager ? "eager" : "lazy"}" decoding="async">
    </div>`;
  }
  const strip = ctx.strips?.get?.(p.id);
  if (strip?.src) {
    return html`<div class="plate-media plate-media--strip screen">
      <img src="${strip.src}" alt="" width="${strip.width || 945}" height="${strip.height || 147}" loading="lazy" decoding="async">
    </div>`;
  }
  return html`<div class="plate-media plate-media--rohling">${renderRohling(p)}</div>`;
}

function plateTitle(p, q, id) {
  const { main, sub } = splitTitle(p.title);
  return html`<h3 class="plate-title" id="${id}"><span class="plate-title-text">${softHyphens(highlight(main, q))}${
    sub ? html`<span class="vh"> · </span><span class="plate-title-sub">${highlight(sub, q)}</span>` : ""
  }</span>${icon("arrow-right", "i plate-arrow")}</h3>`;
}

/**
 * One plate. The whole card is the link (a.project-link → #werk/<id>); the h3 lives inside.
 * Named by the title („Bomberman (Werkstück öffnen)“), described by badges, kicker, summary and
 * stamps; no aria-label, so screen readers in browse mode still read everything inside the link.
 * Ids carry a prefix per list (Noch warm and the Lager can show the same project at once).
 */
export function renderPlate(p, ctx = {}, index = 0) {
  const alloy = alloyOf(p) ?? "web";
  const glow = glowOf(p, ctx.asOf);
  const n = ctx.stock?.get?.(p.id);
  const q = ctx.query ?? "";
  const summary = p.summary || p.description;
  const eager = Number.isInteger(ctx.eager) && index < ctx.eager;
  const rail = ctx.variant === "rail";
  const id = `${ctx.idPrefix ?? (rail ? "w" : "l")}-${p.id}`;
  const stamps = stampRow(p, ctx, `${id}-st`);
  const described = [`${id}-b`, rail ? "" : `${id}-k`, summary ? `${id}-s` : "", stamps ? `${id}-st` : ""].filter(Boolean).join(" ");
  return String(html`<article class="${rail ? "plate plate--rail" : "project-card plate"}" data-heat data-glow="${glow ?? "none"}" data-alloy="${alloy}" data-id="${p.id}" style="--alloy: var(--alloy-${alloy})">
  <a class="project-link" href="#werk/${p.id}" data-project-id="${p.id}" aria-labelledby="${id}-t ${id}-o" aria-describedby="${described}">
    <span class="plate-top">
      ${n ? html`<span class="plate-no" aria-hidden="true">${stockLabel(n)}</span>` : ""}
      <span class="plate-badges" id="${id}-b">
        ${p.isNew ? html`<span class="plate-badge plate-badge--new">Neu dabei</span>` : ""}
        ${p.contentNote ? html`<span class="plate-badge plate-badge--note">Hinweis</span>` : ""}
        <span class="chip chip--alloy plate-alloy">${ALLOY_SHORT[alloy]}</span>
      </span>
    </span>
    ${plateMedia(p, ctx, eager)}
    ${p.archived ? html`<span class="plate-seal" aria-hidden="true">Ausgemustert</span>` : ""}
    <span class="plate-body">
      ${plateTitle(p, q, `${id}-t`)}
      ${rail ? "" : html`<span class="plate-kicker" id="${id}-k">${p.category}</span>`}
      ${summary ? html`<span class="plate-summary" id="${id}-s">${highlight(summary, q)}</span>` : ""}
    </span>
    ${stamps}
    <span class="vh" id="${id}-o">(Werkstück öffnen)</span>
  </a>
</article>`);
}

export function renderPlates(list, ctx = {}) {
  return list.map((p, i) => renderPlate(p, ctx, i)).join("");
}

export default renderPlate;
