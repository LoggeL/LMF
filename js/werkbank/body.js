/**
 * Werkbank body renderers  [WP2]  (spec §2.5, §5.4)
 * Pure string renderers for the hero and the project page below the title: a fact strip, then the
 * story, highlights, Probestück, media, a side note and related Werkstücke, with the tools beside
 * it, and the next Werkstück at the end.
 *
 *   renderHero(project, film, details, facadeModule?)                → SafeHtml
 *   renderBody(project, film, details, { byId, stock, next, asOf })  → SafeHtml
 */
import { html, raw, icon } from "../lib/dom.js";
import { alloyOf, stockLabel, ALLOY_SHORT } from "../lib/derive.js";
import { renderRohling, thumb } from "../render/plate.js";
import { THUMBS } from "../render/thumbs.js";
import { renderFacts, ribbons, specRows, renderToolChips, withLang } from "../render/specsheet.js";

/** Image captions say what the picture shows; where it came from stays in the data. */
export function caption(text) {
  const t = String(text ?? "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/,\s*(Live-)?Screenshot\b.*$/i, "")
    .trim();
  if (!t || /^(Offizieller Screenshot|Titel-Overlay)|aus dem Repo/i.test(t)) return "";
  return t.replace(/\.$/, "");
}
/** Story text reads as copy, not as a report: „… markiert wurde (Stand 28.09.2026).“ → „… markiert wurde.“ */
const unstamp = (text) => String(text ?? "").replace(/\s*\(Stand [^)]*\)/g, "");

export function renderHero(p, film, d, facadeMod = null) {
  const alt = p.imageAlt || (film ? `Vorschaubild des Videos „${film.realTitle || p.title}“` : `Screenshot von ${p.title}`);
  // Stills get the 640/960 thumbs (the original, always wider than 960, is the top rung). Without a
  // srcset the image keeps its natural size (inline-size: auto), so small originals are never blown up.
  // Film posters stay one file: werkbank.js caps the facade at the poster's natural width.
  const widths = film ? [] : (THUMBS[p.image] ?? []);
  const srcset = widths.length ? [...widths.map((w) => `${thumb(p.image, w)} ${w}w`), `${p.image} 1920w`].join(", ") : "";
  const poster = p.image
    ? String(
        srcset
          ? html`<img class="wb-hero-img" src="${p.image}" srcset="${srcset}" sizes="(min-width: 1100px) 1040px, calc(100vw - 32px)" alt="${alt}" width="960" height="600" decoding="async" fetchpriority="high">`
          : html`<img class="wb-hero-img" src="${p.image}" alt="${alt}" width="960" height="600" decoding="async" fetchpriority="high">`,
      )
    : String(renderRohling(p, { cls: "wb-hero-rohling" }));
  const facade = film && facadeMod?.renderFacade ? facadeMod.renderFacade(p, film, { poster, bed: p.image }) : "";
  if (facade) return html`<div class="wb-hero-media wb-hero-media--film">${raw(facade)}</div>`;
  const strip = (d?.media ?? []).find((m) => m.kind === "strip");
  if (!p.image && strip) {
    const cap = caption(strip.caption);
    return html`<figure class="wb-hero-media wb-hero-media--strip screen">
      <img src="${strip.src}" alt="${strip.alt || ""}" width="${strip.width}" height="${strip.height}" decoding="async">
      ${cap ? html`<figcaption class="meta">${cap}</figcaption>` : ""}
    </figure>`;
  }
  return html`<div class="wb-hero-media${p.image ? "" : " wb-hero-media--rohling"}">${raw(poster)}</div>`;
}

function notes(p, film, d) {
  const list = [];
  if (p.contentNote) list.push(p.contentNote);
  // an archived piece says so once, in the header status („Ausgemustert“); no extra note
  if (d?.note) list.push(d.note);
  if (film?.note) list.push(film.note);
  if (!list.length) return "";
  return html`<aside class="wb-note" aria-label="Hinweis">${list.map((t) => html`<p>${t}</p>`)}</aside>`;
}

function probeBlock(p) {
  if (!p.probe) return "";
  const poster = p.image ? html`<img src="${p.image}" alt="${p.imageAlt || ""}" width="960" height="600" loading="lazy" decoding="async">` : renderRohling(p);
  // The probe renders its own Nachbau/Echt chip row (WP4, ctx.chip = true) once it is live.
  return html`<section class="wb-block wb-probe" aria-labelledby="wb-probe-title">
    <h3 id="wb-probe-title" class="wb-h3">Probestück</h3>
    <div class="probe-stage wb-probe-stage" data-probe="${p.probe}">${poster}</div>
  </section>`;
}

function mediaBlock(p, d) {
  const items = (d?.media ?? []).filter((m) => m.kind !== "strip" && m.src !== p.image);
  if (!items.length) return "";
  return html`<section class="wb-block wb-media" aria-labelledby="wb-media-title">
    <h3 id="wb-media-title" class="wb-h3">Einblicke</h3>
    <div class="wb-media-strip${items.length > 1 ? " is-scroller" : ""}"${items.length > 1 ? raw(' role="group" aria-label="Einblicke" tabindex="0"') : ""}>${items.map((m) => {
      const cap = caption(m.caption);
      return html`<figure class="wb-media-item">
        <img src="${m.src}" alt="${m.alt || ""}" width="${m.width || 960}" height="${m.height || 600}" loading="lazy" decoding="async">
        ${cap ? html`<figcaption>${cap}</figcaption>` : ""}
      </figure>`;
    })}</div>
  </section>`;
}

/** Film parts (Selantis): the three videos, each a link out. */
function partsBlock(rows) {
  const parts = rows.find((r) => r.key === "teile");
  if (!parts) return "";
  return html`<section class="wb-block wb-parts" aria-labelledby="wb-parts-title"><h3 id="wb-parts-title" class="wb-h3">Die Teile</h3>${parts.value}</section>`;
}

/** The film's own description, as a pull quote (no attribution line: it is the film speaking). */
function quoteBlock(film, rows) {
  const row = rows.find((r) => r.key === "beschreibung");
  if (!row) return "";
  return html`<figure class="wb-quote">
    <blockquote><p>${film.quote ? html`„${film.quote}“` : film.paraphrase}</p></blockquote>
  </figure>`;
}

/** Related Werkstücke (a family tree of pieces in the Lager, not a repo index). */
function lineage(p, { byId, stock }) {
  const related = (p.related ?? []).map((id) => byId.get(id)).filter(Boolean);
  if (!related.length) return "";
  return html`<section class="wb-block wb-lineage" aria-labelledby="wb-lineage-title">
    <h3 id="wb-lineage-title" class="wb-h3">Verwandt</h3>
    <ul class="wb-related" role="list">${related.map((r) => {
      const a = alloyOf(r) ?? "web";
      return html`<li data-alloy="${a}"><a class="wb-related-link" href="#werk/${r.id}" data-project-id="${r.id}"><span class="wb-related-no meta">${stockLabel(stock.get(r.id))}</span><span class="wb-related-title">${r.title}</span><span class="wb-related-cat meta">${ALLOY_SHORT[a]} · ${r.category}</span>${icon("arrow-right")}</a></li>`;
    })}</ul>
  </section>`;
}

function nextCard(next) {
  if (!next) return "";
  const widths = THUMBS[next.image] ?? [];
  const src = next.image ? (widths.length ? thumb(next.image, widths[0]) : next.image) : "";
  const alloy = alloyOf(next) ?? "web";
  return html`<button type="button" class="wb-next-card${src ? " has-media" : ""}" data-wb-go="1" data-alloy="${alloy}" style="--alloy: var(--alloy-${alloy})">
    <span class="wb-next-text">
      <span class="wb-next-kicker meta">Nächstes Werkstück</span>
      <span class="wb-next-title">${next.title}</span>
      <span class="wb-next-cat">${next.category}</span>
      ${icon("arrow-right", "i wb-next-i")}
    </span>
    ${src ? html`<span class="wb-next-media" aria-hidden="true"><img src="${src}" alt="" width="640" height="400" loading="lazy" decoding="async"></span>` : ""}
  </button>`;
}

export function renderBody(p, film, d, { byId, stock, next = null, asOf = null }) {
  const story = d?.story?.length ? d.story : p.summary && p.description && p.description !== p.summary ? [p.description] : [];
  const F = (t) => withLang(unstamp(t), d?.foreign);
  const rows = specRows(p, d, { film });
  const tools = d?.stack?.length ? html`<div class="wb-tools-wrap"><h3 class="wb-aside-title meta">Werkzeug</h3>${raw(renderToolChips(d.stack))}</div>` : "";
  // the tools say what it is built with; no language percentages
  const aside = tools ? html`<aside class="wb-aside" aria-label="Werkzeug">${tools}</aside>` : "";
  // A drop cap would swallow an opening quote („Die Chroniken …“ → a huge „„D“).
  const cap = /^[\p{L}\p{N}]/u.test(String(story[0] ?? ""));
  // A one-paragraph story beside the tools leaves a hole: stack them.
  const media = mediaBlock(p, d);
  const storyLen = story.reduce((n, t) => n + String(t).length, 0);
  const short = aside && (d || !p.details) && storyLen < 400 && !media && !d?.highlights?.length && !p.probe;
  const ribbon = ribbons(p, d, { film });
  return html`${ribbon.length ? html`<p class="wb-ribbon">${ribbon.map((t, i) => html`${i ? " " : ""}${t}`)}</p>` : ""}
  ${raw(renderFacts(p, d, { film, asOf }))}
  ${notes(p, film, d)}
  <div class="wb-cols${!aside ? " wb-cols--solo" : short ? " wb-cols--short" : ""}">
    <div class="wb-main">
      ${story.length
        ? html`<section class="wb-block wb-story${cap ? "" : " wb-story--nocap"}" aria-labelledby="wb-story-title"><h3 id="wb-story-title" class="wb-h3">Die Geschichte</h3>${story.map((t) => html`<p>${F(t)}</p>`)}</section>`
        : ""}
      ${film ? quoteBlock(film, rows) : ""}
      ${d?.highlights?.length
        ? html`<section class="wb-block" aria-labelledby="wb-hl-title"><h3 id="wb-hl-title" class="wb-h3">Was drinsteckt</h3><ul class="rivets wb-rivets" role="list">${d.highlights.map((h) => html`<li>${F(h)}</li>`)}</ul></section>`
        : ""}
      ${film ? partsBlock(rows) : ""}
      ${probeBlock(p)}
      ${media}
      ${d?.funFact?.text && Number.isInteger(d.funFact.source)
        ? html`<section class="wb-block wb-fun" aria-labelledby="wb-fun-title"><h3 id="wb-fun-title" class="wb-h3">Nebenbei</h3><p>${F(d.funFact.text)}</p></section>`
        : ""}
      ${lineage(p, { byId, stock })}
    </div>
    ${aside}
  </div>
  ${next && next.id !== p.id ? html`<div class="wb-foot">${nextCard(next)}</div>` : ""}`;
}
