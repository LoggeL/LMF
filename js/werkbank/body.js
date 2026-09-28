/**
 * Werkbank body renderers  [WP2]  (spec §2.5, §5.4)
 * Pure string renderers for the hero, the story/highlights/Probestück/media/lineage column, the
 * Werkstattdaten aside and the Gepunzt footer. Split from werkbank.js and loaded with the spec sheet,
 * Punze and language bar on the first intent/open, so the idle-mounted Werkbank stays small (§8).
 *
 *   renderHero(project, film, details, facadeModule?)          → SafeHtml
 *   renderBody(project, film, details, { byId, stock, asOf, next }) → SafeHtml
 *   renderPunzeFor(project, details)                           → string („Gepunzt · n Quellen“ + popover)
 */
import { html, raw, icon, safeUrl } from "../lib/dom.js";
import { alloyOf, stockLabel, ALLOY_SHORT, formatDate } from "../lib/derive.js";
import { renderRohling, thumb } from "../render/plate.js";
import { THUMBS } from "../render/thumbs.js";
import { renderSpecsheet, renderToolChips, refMark, gluedLink } from "../render/specsheet.js";
import { renderPunze, renderSourceList, punzeLine, supportsPopover, withLang } from "./punze.js";
import { renderLanguages } from "./languages.js";

const ARCHIVED_NOTE = "Dieses Projekt gehört zum Archiv. Der ursprüngliche Link wird hier zur Dokumentation angezeigt.";
// The link was replaced by the GitHub-Pages copy (Palatina: the old domain is gone, see its story).
const ARCHIVED_COPY_NOTE = "Dieses Projekt gehört zum Archiv. Die alte Domain ist weg, verlinkt ist das Archiv auf GitHub Pages.";
export const archivedNote = (p) =>
  p.linkLabel === "Archiv ansehen" && /^https:\/\/[\w-]+\.github\.io\//.test(p.link ?? "") ? ARCHIVED_COPY_NOTE : ARCHIVED_NOTE;
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
    return html`<figure class="wb-hero-media wb-hero-media--strip screen">
      <img src="${strip.src}" alt="${strip.alt || ""}" width="${strip.width}" height="${strip.height}" decoding="async">
      ${strip.caption ? html`<figcaption class="meta">${strip.caption}${Number.isInteger(strip.source) ? refMark("src", p.id, strip.source) : ""}</figcaption>` : ""}
    </figure>`;
  }
  return html`<div class="wb-hero-media${p.image ? "" : " wb-hero-media--rohling"}">${raw(poster)}</div>`;
}

function notes(p, film, d) {
  const list = [];
  if (p.contentNote) list.push(p.contentNote);
  if (p.archived) list.push(archivedNote(p));
  if (d?.note) list.push(d.note);
  if (film?.note) list.push(film.note);
  if (!list.length) return "";
  return html`<aside class="wb-note" aria-label="Hinweis">
    <p class="wb-note-stamp meta" aria-hidden="true">Hinweis</p>
    ${list.map((t) => html`<p>${t}</p>`)}
  </aside>`;
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
    <h3 id="wb-media-title" class="wb-h3">Medien</h3>
    <div class="wb-media-strip" role="group" aria-label="Medien" tabindex="0">${items.map(
      (m) => html`<figure class="wb-media-item">
        <img src="${m.src}" alt="${m.alt || ""}" width="${m.width || 960}" height="${m.height || 600}" loading="lazy" decoding="async">
        ${m.caption ? html`<figcaption class="meta">${m.caption}${Number.isInteger(m.source) ? refMark("src", p.id, m.source) : ""}</figcaption>` : ""}
      </figure>`,
    )}</div>
  </section>`;
}

function lineage(p, d, { byId, stock }) {
  const related = (p.related ?? []).map((id) => byId.get(id)).filter(Boolean);
  const repos = (d?.relatedRepos ?? []).filter((r) => r.fullName && !r.private);
  if (!related.length && !repos.length) return "";
  return html`<section class="wb-block wb-lineage" aria-labelledby="wb-lineage-title">
    <h3 id="wb-lineage-title" class="wb-h3">Stammbaum</h3>
    ${related.length
      ? html`<ul class="wb-related" role="list">${related.map((r) => {
          const a = alloyOf(r) ?? "web";
          return html`<li data-alloy="${a}"><a class="wb-related-link" href="#werk/${r.id}" data-project-id="${r.id}"><span class="wb-related-no meta">${stockLabel(stock.get(r.id))}</span><span class="wb-related-title">${r.title}</span><span class="wb-related-cat meta">${ALLOY_SHORT[a]} · ${r.category}</span>${icon("arrow-right")}</a></li>`;
        })}</ul>`
      : ""}
    ${repos.length
      ? html`<ol class="wb-repos" role="list">${repos.map(
          (r) => html`<li>
            <span class="wb-repo-role">${r.role}</span>
            ${gluedLink(safeUrl(`https://github.com/${r.fullName}`), r.fullName, "wb-repo-name")}
            <span class="wb-repo-facts meta">${r.createdAt ? html`Repo angelegt <time datetime="${r.createdAt}">${formatDate(r.createdAt)}</time>` : ""}${Number.isFinite(r.commits) ? html` · ${r.commits} Commits` : ""}${Number.isInteger(d.refs?.repo) ? refMark("src", p.id, d.refs.repo) : ""}</span>
          </li>`,
        )}</ol>`
      : ""}
  </section>`;
}

export function renderBody(p, film, d, { byId, stock, asOf, next = null }) {
  const story = d?.story?.length ? d.story : p.summary && p.description && p.description !== p.summary ? [p.description] : [];
  const F = (t) => withLang(t, d?.foreign);
  const aside = html`<aside class="wb-aside" aria-label="Werkstattdaten">
    <details class="wb-specs" open>
      <summary><h3 class="wb-h3">Werkstattdaten</h3></summary>
      ${raw(renderSpecsheet(p, d, { asOf, film }))}
      ${raw(renderLanguages(d?.languages, { ref: Number.isInteger(d?.refs?.repo) ? refMark("src", p.id, d.refs.repo) : "" }))}
      ${d?.stack?.length
        ? html`<div class="wb-tools-wrap"><h4 class="wb-aside-title meta">Werkzeug</h4>${raw(renderToolChips(d.stack))}</div>`
        : ""}
    </details>
  </aside>`;
  // A one-paragraph story next to an 11-row sheet leaves a hole: stack them, sheet in two columns.
  const media = mediaBlock(p, d);
  const storyLen = story.reduce((n, t) => n + String(t).length, 0);
  const short = (d || !p.details) && storyLen < 400 && !media && !d?.highlights?.length && !p.probe;
  // A drop cap would swallow an opening quote („Die Chroniken …“ → a huge „„D“).
  const cap = /^[\p{L}\p{N}]/u.test(String(story[0] ?? ""));
  return html`${notes(p, film, d)}
  <div class="wb-cols${short ? " wb-cols--short" : ""}">
    <div class="wb-main">
      ${story.length
        ? html`<section class="wb-block wb-story${cap ? "" : " wb-story--nocap"}" aria-labelledby="wb-story-title"><h3 id="wb-story-title" class="wb-h3">Die Geschichte</h3>${story.map((t) => html`<p>${F(t)}</p>`)}</section>`
        : ""}
      ${d?.highlights?.length
        ? html`<section class="wb-block" aria-labelledby="wb-hl-title"><h3 id="wb-hl-title" class="wb-h3">Was drinsteckt</h3><ul class="rivets wb-rivets" role="list">${d.highlights.map((h) => html`<li>${F(h)}</li>`)}</ul></section>`
        : ""}
      ${probeBlock(p)}
      ${media}
      ${d?.funFact?.text && Number.isInteger(d.funFact.source)
        ? html`<section class="wb-block wb-fun" aria-labelledby="wb-fun-title"><h3 id="wb-fun-title" class="wb-h3">Randnotiz</h3><p>${F(d.funFact.text)}${refMark("src", p.id, d.funFact.source)}</p></section>`
        : ""}
      ${lineage(p, d, { byId, stock })}
    </div>
    ${aside}
  </div>
  <div class="wb-foot">
    ${d?.sources?.length
      ? html`<section class="wb-sources" aria-labelledby="wb-sources-title">
          <h3 id="wb-sources-title" class="wb-h3">${icon("punze", "i wb-sources-i")} Gepunzt</h3>
          ${raw(renderSourceList({ id: p.id, sources: d.sources, prefix: "src", when: true, foreign: d.foreign }))}
          ${punzeLine(p.title, "punze-line wb-line")}
        </section>`
      : ""}
    ${next && next.id !== p.id
      ? html`<button type="button" class="wb-next-card" data-wb-go="1" data-alloy="${alloyOf(next) ?? "web"}">
          <span class="meta">Nächstes Werkstück</span>
          <span class="wb-next-title">${next.title}</span>
          ${icon("arrow-right")}
        </button>`
      : ""}
  </div>`;
}

export const renderPunzeFor = (p, d) =>
  d?.sources?.length ? renderPunze({ id: p.id, title: p.title, sources: d.sources, prefix: "wb", popover: supportsPopover(), foreign: d.foreign }) : "";
