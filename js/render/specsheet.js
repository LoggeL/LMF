/**
 * Werkstattdaten spec sheet (spec §2.5, §5.4)  [WP2]
 * Pure: `(project, details, opts) => string`. Reused by the Meisterstücke chapters (WP4).
 *
 *   renderSpecsheet(project, details, { asOf, film, prefix = "src", title = true }) → "<dl class=spec-list>…"
 *   specRows(project, details, opts)  → [{ key, label, value (SafeHtml|string), src (index|null) }]
 *   refMark(prefix, id, index)        → <sup> link to the footer source #{prefix}-{id}-{n}
 *   repoValue(fullName, url?, mark?)  → owner on a muted line, the repo name + ¹ glued (never split)
 *
 * Honesty rules baked in:
 *  - Every row except „Legierung“ and „Stand“ carries a source mark. A row whose source cannot be
 *    resolved is omitted instead of being shown unsourced.
 *  - Private repos never show their name or a link.
 *  - `repo.createdAt` is only ever labelled „Repo angelegt“.
 */
import { html, raw, extLink, icon, safeUrl } from "../lib/dom.js";
import { ALLOY_SHORT, formatDate } from "../lib/derive.js";
import { yearText } from "./plate.js";
import { glueTail } from "../werkbank/punze.js";

/** External link whose ↗ stays glued to the last word (or slug segment) of its label. */
export const gluedLink = (url, label, cls = "") =>
  html`<a${cls ? raw(` class="${cls}"`) : ""} href="${url}" target="_blank" rel="noopener noreferrer">${glueTail(label, html`<span class="ext-i">\u00A0${icon("arrow-ne")}</span>`)}<span class="vh"> (öffnet neue Seite)</span></a>`;

const validIdx = (details, i) => Number.isInteger(i) && i >= 0 && i < (details?.sources?.length ?? 0);

/** Source index whose URL matches `url` (ignoring a trailing slash), else fallback. */
export function sourceFor(details, url, fallback = null) {
  const norm = (u) => String(u ?? "").replace(/\/+$/, "");
  const i = (details?.sources ?? []).findIndex((s) => norm(s.url) === norm(url));
  return i >= 0 ? i : fallback;
}

export function refMark(prefix, id, index) {
  const n = index + 1;
  return html`<sup class="ref"><a href="#${prefix}-${id}-${n}"><span class="vh">Quelle </span>${n}</a></sup>`;
}

const LIVE_TEXT = { live: "online", offline: "offline" };

/**
 * A repo slug never breaks inside a word: „Kolpingtheater-Ramsen/“ sits on its own muted line and
 * „next-theater ↗¹“ stays in one piece. The link's accessible name is still the full slug.
 */
export function repoValue(fullName, url = `https://github.com/${fullName}`, mark = "") {
  const at = String(fullName ?? "").indexOf("/");
  if (at < 0) return html`<span class="nb">${extLink(url, fullName, "spec-repo")}${mark}</span>`;
  const owner = fullName.slice(0, at + 1);
  const name = fullName.slice(at + 1);
  return html`<span class="spec-repo-owner" aria-hidden="true">${owner}</span><span class="nb">${extLink(url, html`<span class="vh">${owner}</span>${name}`, "spec-repo")}${mark}</span>`;
}


export function specRows(p, d, { asOf, film } = {}) {
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
        (part, i) => html`<li><span class="spec-part-no">Teil ${i + 1}</span> ${gluedLink(safeUrl(part.url), part.title)} <span class="spec-part-len nb">${part.duration}</span></li>`,
      )}</ol>`;
      add("teile", "Teile", parts, sourceFor(d, film.parts[0].url, video));
    }
    add("ort", "Ort", film.location, video);
    if (film.quote) add("beschreibung", "Beschreibung", html`<q>${film.quote}</q>`, video);
    else if (film.paraphrase) add("beschreibung", "Laut Beschreibung", film.paraphrase, video);
    if (Array.isArray(film.alsoOn) && film.alsoOn.length) {
      add("auch", "Auch auf", html`${film.alsoOn.map((a, i) => html`${i ? ", " : ""}${gluedLink(safeUrl(a.url), a.label)}`)}`, sourceFor(d, film.alsoOn[0].url, video));
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
    if (Number.isFinite(d?.commits)) {
      const by = d.commitsBy;
      const mine = by && Number.isFinite(by.LoggeL) && Number.isFinite(by.total) ? ` (${by.LoggeL} von mir)` : "";
      add("commits", "Commits", `${d.commits}${mine}`, repoRef);
    }
    if (r && !r.private && Number.isFinite(r.stars) && r.stars > 0) add("sterne", "Sterne", String(r.stars), repoRef);
    if (p.live && LIVE_TEXT[p.live.status]) {
      const liveRef = validIdx(d, refs.live) ? refs.live : sourceFor(d, p.link);
      add("live", "Live", `${LIVE_TEXT[p.live.status]}, geprüft ${formatDate(p.live.checkedAt)}`, liveRef);
    }
    if (r?.fullName && !r.private) {
      add("repo", "Repo", { repo: r.fullName }, sourceFor(d, `https://github.com/${r.fullName}`, repoRef));
    } else if (r?.private) {
      add("repo", "Repo", "privat", repoRef);
    }
  }
  for (const f of d?.facts ?? []) add(`fact-${f.key ?? f.label}`, f.label, String(f.value), f.source);
  if (asOf) add("stand", "Stand", html`<time datetime="${asOf}">${formatDate(asOf)}</time>`, "none");
  return rows;
}

/**
 * Glues the source mark to the value so ¹ never wraps alone: strings keep their last word (the last
 * two when the last one is a number or date, „geprüft 28.09.2026¹“, „Engagementpreis 2026¹“; „Teil 3“
 * is one word) with the mark. Short elements and single short links are glued whole; a quote glues
 * only its last word, a list puts the mark into its last item. Long values may always wrap.
 */
function withMark(value, mark) {
  if (value && typeof value === "object" && typeof value.repo === "string") return repoValue(value.repo, undefined, mark);
  if (!mark) return value;
  if (typeof value === "string") {
    value = value.replace(/\b(Teil|Nr\.|Kapitel) (\d)/g, "$1\u00A0$2");
    let at = value.lastIndexOf(" ");
    if (at > 0 && /^[\d.,:/–-]+$/.test(value.slice(at + 1))) {
      const prev = value.lastIndexOf(" ", at - 1);
      if (value.slice(prev + 1, at).length <= 16) at = prev;
    }
    return at < 0 ? html`<span class="nb">${value}${mark}</span>` : html`${value.slice(0, at + 1)}<span class="nb">${value.slice(at + 1)}${mark}</span>`;
  }
  const str = String(value);
  // <q>…</q> (film descriptions): the closing quote and the mark stay with the last word.
  const q = /^<q>([^<]*)<\/q>$/.exec(str);
  if (q) {
    const at = q[1].lastIndexOf(" ");
    return at < 0
      ? html`<span class="nb">${value}${mark}</span>`
      : html`<q>${raw(q[1].slice(0, at + 1))}<span class="nb">${raw(q[1].slice(at + 1))}</span></q>${mark}`;
  }
  // Lists (film parts): the mark goes into the last item, after its last word.
  if (/<\/li><\/ol>$/.test(str)) return raw(str.replace(/<\/li><\/ol>$/, `${mark}</li></ol>`));
  const links = str.split("<a ").length - 1;
  const text = str.replace(/<[^>]+>/g, "");
  return (links === 0 && text.length < 24) || (links === 1 && text.length < 36) ? html`<span class="nb">${value}${mark}</span>` : html`${value}${mark}`;
}

export function renderSpecsheet(p, d, opts = {}) {
  const prefix = opts.prefix ?? "src";
  const rows = specRows(p, d, opts);
  return String(html`<dl class="spec-list wb-spec">${rows.map(
    (r) => html`<div class="spec-row spec-row--${r.key}"><dt>${r.label}</dt><dd>${withMark(r.value, r.src !== null ? refMark(prefix, p.id, r.src) : "")}</dd></div>`,
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
export default renderSpecsheet;
