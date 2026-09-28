/**
 * Abspann: generated credits (spec §2.7, §5.11)  [WP5]
 *
 * Pure renderer: (data, opts) => string, prerendered into `<!-- prerender:abspann -->` and
 * reused at runtime by js/sections/abspann.js. Every block is built from data and is
 * omitted when its data is missing. The partners are not repeated here: the Zunft sits
 * directly above the credits. Nothing here is typed in by hand except the two
 * sourced role lines (AUCH ALS), whose sources are named next to them.
 */
import { html } from "../lib/dom.js";
import { formatDate, yearOf } from "../lib/derive.js";

/**
 * Partner categories in data/partners.json are partly English. Visible copy is German, so
 * they are translated here (translation only, no new facts).
 */
export const PARTNER_CATEGORY_DE = {
  Gaming: "Gaming",
  Theater: "Theater",
  "Movie Group": "Filmgruppe",
  "Event Management": "Events",
  Media: "Medien",
  "Discord Bot": "Discord-Bot",
};
export const partnerCategory = (c) => PARTNER_CATEGORY_DE[c] ?? c ?? "";

/**
 * AUCH ALS — sourced roles:
 *  Palatina Films team.html („VFX, Homepage, Schauspieler“), data/films.json → selantis.roles
 *  kolpingtheater-ramsen.de/team 2026: Cast „Bote / Diener“ (Creepshow), Crew „Website“
 */
const ALSO_AS = [
  { roles: ["Bote / Diener", "Website"], who: "Kolpingtheater Ramsen" },
];

const filmList = (films) => (films instanceof Map ? [...films.values()] : Array.isArray(films) ? films : []);

function palatinaRoles(data) {
  const selantis = filmList(data.films).find((f) => f.id === "selantis");
  const roles = (selantis?.roles ?? []).filter((r) => !/^Hauptrolle/.test(r));
  return roles.length ? [{ roles, who: "Palatina Films" }] : [];
}

function locations(data) {
  const byId = data.byId instanceof Map ? data.byId : new Map((data.projects ?? []).map((p) => [p.id, p]));
  const seen = new Set();
  return filmList(data.films)
    .filter((f) => f.location)
    .map((f) => ({ label: f.location, year: byId.get(f.id)?.year ?? yearOf(f.uploaded), up: f.uploaded ?? "" }))
    .filter((f) => Number.isFinite(f.year))
    .sort((a, b) => a.year - b.year || a.up.localeCompare(b.up))
    .map((f) => `${f.label} ${f.year}`)
    .filter((s) => (seen.has(s) ? false : seen.add(s)));
}

/** Primary languages of the public repos, counted and sorted desc (then by name). */
export function languageCounts(repos = []) {
  const tally = new Map();
  for (const r of repos) if (r.l) tally.set(r.l, (tally.get(r.l) ?? 0) + 1);
  return [...tally].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de"));
}

const block = (key, label, body, cls = "") =>
  body ? html`<div class="credit${cls ? ` ${cls}` : ""}" data-block="${key}"><dt>${label}</dt>${body}</div>` : "";

/**
 * @param {object} data  Data object: films, byId/projects, repos, snapshot, bindings
 * @param {object} [opts] { bindings }
 */
export default function renderCredits(data = {}, opts = {}) {
  const b = opts.bindings ?? data.bindings ?? {};
  const asOf = data.snapshot?.asOf ?? data.reposAsOf ?? null;
  const also = [...palatinaRoles(data), ...ALSO_AS];
  const places = locations(data);
  const langs = Array.isArray(data.repos) ? languageCounts(data.repos) : [];
  const material = [
    ["projects.total", "Projekte"],
    ["films.total", "Filme"],
    ["gallery.total", "Fotos"],
    ["repos.total", "öffentliche Repos"],
  ].filter(([k]) => b[k] !== undefined);
  // „15 Filme“ counts data/films.json; the Lager's Film chip counts every Werkstück in the Film
  // alloy. Name the difference instead of leaving two numbers that seem to disagree.
  const filmIds = new Set(filmList(data.films).map((f) => f.id));
  const filmExtra = b["films.total"] !== undefined ? (data.projects ?? []).filter((p) => p.groups?.includes("film") && !filmIds.has(p.id)) : [];
  const filmNote = filmExtra.length
    ? html`<dd class="credit-note">Im Lager zählt unter Film auch ${filmExtra.map((p, i) => html`${i ? (i === filmExtra.length - 1 ? " und " : ", ") : ""}${p.title}${p.groups.includes("web") ? " (Website)" : ""}`)} mit.</dd>`
    : "";

  const out = html`<dl class="credits">
${block("titel", "Logge Media Forge", html`<dd class="credit-lead">Ein Rohschnitt von Logge</dd>`, "credit--title")}
${block("code", "Code · Kamera · KI", html`<dd class="credit-name">Logge</dd>`)}
${block(
  "auch-als",
  "Auch als",
  also.length ? also.map((a) => html`<dd><span class="credit-name">${a.roles.join(" · ")}</span> <span class="credit-role">${a.who}</span></dd>`) : "",
)}
${block("drehorte", "Drehorte", places.length ? places.map((p) => html`<dd class="credit-name">${p}</dd>`) : "")}
${block(
  "sprachen",
  "Sprachen",
  langs.length
    ? html`${langs.map(([l, n]) => html`<dd><span class="credit-name">${l}</span> <span class="credit-count">${n}</span></dd>`)}${asOf ? html`<dd class="credit-note">Hauptsprache laut GitHub · Stand ${formatDate(asOf)}</dd>` : ""}`
    : "",
)}
${block(
  "material",
  "Material",
  material.length ? html`${material.map(([k, label]) => html`<dd><span class="credit-count">${b[k]}</span> <span class="credit-name">${label}</span></dd>`)}${filmNote}` : "",
)}
</dl>
<p class="credits-end"><span class="credits-motto">Aus Neugier. <em>Gemacht.</em></span> <span class="credits-cut meta">Rohschnitt, kein Final Cut.</span></p>`;
  return String(out).replace(/\n+/g, "\n").trim();
}
