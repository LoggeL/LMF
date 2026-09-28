/**
 * Pure derivations over the LMF data (spec §3.13). Node-importable: nothing in
 * this module touches window or document, and nothing reads the clock. Every
 * date comparison is measured against `snapshot.asOf`, never `Date.now()`.
 *
 * Owner: WP1. Consumers: main.js (data-bind), lager, warm, werkbank,
 * schichtbuch, werkstatt, abseits, scripts/prerender.mjs, scripts/validate.mjs.
 */

/** The four alloys, in chapter order. */
export const GROUPS = ["web", "games", "ai", "film"];

/** Filter/chip text for each alloy (plain words, §1.5). */
export const GROUP_LABEL = { web: "Web & Apps", games: "Games", ai: "KI", film: "Film" };

/** Short alloy name as used in the stamp rows and Werkstattdaten. */
export const ALLOY_SHORT = { web: "Web", games: "Games", ai: "KI", film: "Film" };

/** Forge flavour for each alloy (temper colour names, only for headings/legend). */
export const ALLOY_COLOUR = { web: "Strohgelb", games: "Purpur", ai: "Blau", film: "Rotglut" };

/** Glow keys are ASCII (CSS/data attributes); labels carry the Umlaute. */
export const GLOW_LABEL = {
  glueht: "glüht",
  warm: "warm",
  abgekuehlt: "abgekühlt",
  fertig: "fertig",
  ausgemustert: "ausgemustert",
};

/** Thresholds in days since the last push (inclusive), see the colour legend §2.4. */
export const GLOW_DAYS = { glueht: 30, warm: 180 };

/** Rohling (typographic blank) variants that validate accepts for `art`. */
export const ART_STYLES = ["music", "capture", "retro", "organic", "widget", "film"];

const DAY = 86400000;
const pad2 = (n) => String(n).padStart(2, "0");

/** Parses "YYYY-MM-DD" (or a full ISO timestamp) as a UTC day. Returns NaN on junk. */
export function dayValue(iso) {
  if (typeof iso !== "string") return NaN;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
}

/** Whole days from `a` to `b` (both ISO dates). */
export function daysBetween(a, b) {
  return Math.round((dayValue(b) - dayValue(a)) / DAY);
}

/** Year of an ISO date string, or NaN. */
export const yearOf = (iso) => (typeof iso === "string" ? Number(iso.slice(0, 4)) : NaN);

/**
 * German date formatting without Intl surprises: "28.09.2026".
 * `precision` "month" → "09.2026", "year" → "2026", "dayMonth" → "28.09.".
 */
export function formatDate(iso, precision = "day") {
  if (typeof iso !== "string" || !/^\d{4}/.test(iso)) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (precision === "year" || !m) return y;
  if (precision === "month" || !d) return `${m}.${y}`;
  if (precision === "dayMonth") return `${d}.${m}.`;
  return `${d}.${m}.${y}`;
}

/** Main category ("Legierung") of a project: the first group. */
export function alloyOf(project) {
  return project?.groups?.[0] ?? null;
}

/**
 * Glow state of a project at `asOf` (§3.13):
 * archived → "ausgemustert"; a repo push date → glueht (≤30 d) / warm (≤180 d) / abgekuehlt;
 * otherwise films are "fertig"; everything else has no label (null).
 */
export function glowOf(project, asOf) {
  if (!project) return null;
  if (project.archived) return "ausgemustert";
  const pushed = project.repo?.pushedAt;
  if (pushed && asOf) {
    const d = daysBetween(pushed, asOf);
    if (Number.isNaN(d)) return null;
    return d <= GLOW_DAYS.glueht ? "glueht" : d <= GLOW_DAYS.warm ? "warm" : "abgekuehlt";
  }
  return project.groups?.includes("film") ? "fertig" : null;
}

/** Visible glow word (with Umlaute) or "" when there is none. */
export const glowLabel = (glow) => GLOW_LABEL[glow] ?? "";

/**
 * Stock numbers: chronological index by (year ?? 9999, JSON order), 1-based.
 * Returns Map(id → number). Use `stockLabel(n)` for "Nº 017".
 */
export function stockNumbers(projects = []) {
  const order = projects
    .map((p, i) => ({ id: p.id, y: Number.isInteger(p.year) ? p.year : 9999, i }))
    .sort((a, b) => a.y - b.y || a.i - b.i);
  return new Map(order.map((e, n) => [e.id, n + 1]));
}

export const stockLabel = (n) => (Number.isInteger(n) ? `Nº ${String(n).padStart(3, "0")}` : "");

/** Map(id → "Nº 017"), the form named in the spec. */
export function stockNo(projects = []) {
  const nums = stockNumbers(projects);
  return new Map([...nums].map(([id, n]) => [id, stockLabel(n)]));
}

/**
 * Search normalisation, applied to both the query and the haystack:
 * lower case (de), strip diacritics, ß → ss, ae/oe/ue → a/o/u, drop apostrophes,
 * collapse whitespace.
 */
export function normalize(value) {
  return String(value ?? "")
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u")
    .replace(/['’‘`´]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Searchable text for a project. `details` and `film` are optional. */
export function haystack(project, details, film) {
  return normalize(
    [
      project?.title,
      project?.summary,
      project?.description,
      project?.category,
      ...(project?.tags ?? []),
      ...(details?.stack ?? []),
      project?.year,
      film?.location,
    ]
      .filter((v) => v !== undefined && v !== null)
      .join(" "),
  );
}

/** Repos per creation year: { 2017: 1, …, 2026: 62 }. Accepts repos.json rows ({c}) or {createdAt}. */
export function reposByYear(repos = []) {
  const out = {};
  for (const r of repos) {
    const y = yearOf(r.c ?? r.createdAt);
    if (Number.isFinite(y)) out[y] = (out[y] ?? 0) + 1;
  }
  return out;
}

/** Parses "IMG_YYYYMMDD_HHMMSS" into parts; null if it does not match. */
export function parsePhotoName(name) {
  const m = /IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})?/.exec(String(name));
  if (!m) return null;
  return {
    date: `${m[1]}-${m[2]}-${m[3]}`,
    hour: +m[4],
    minute: +m[5],
    time: `${m[4]}:${m[5]}`,
  };
}

/** Night key of a photo: a photo taken before 12:00 belongs to the previous evening. */
export function nightOf(name) {
  const p = parsePhotoName(name);
  if (!p) return null;
  if (p.hour >= 12) return p.date;
  const d = new Date(dayValue(p.date) - DAY);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Unique nights (sorted ISO dates) for a list of photo names. */
export function nights(names = []) {
  return [...new Set(names.map(nightOf).filter(Boolean))].sort();
}

/**
 * Summary of the night gallery: totals, nights, first/last calendar day and the
 * hour window („zwischen 20 und 2 Uhr“: first evening hour, last morning hour + 1).
 */
export function galleryStats(names = []) {
  const photos = names.map(parsePhotoName).filter(Boolean);
  if (!photos.length) return null;
  const dates = photos.map((p) => p.date).sort();
  const evening = photos.filter((p) => p.hour >= 12).map((p) => p.hour);
  const morning = photos.filter((p) => p.hour < 12).map((p) => p.hour);
  const all = photos.map((p) => p.hour);
  return {
    total: photos.length,
    nights: nights(names).length,
    first: dates[0],
    last: dates[dates.length - 1],
    hourFrom: evening.length ? Math.min(...evening) : Math.min(...all),
    hourTo: morning.length ? Math.max(...morning) + 1 : Math.max(...all) + 1,
  };
}

/** Accepts gallery/assets/data/images.json rows ({name}) or plain strings. */
export const photoNames = (images) =>
  Array.isArray(images) ? images.map((i) => (typeof i === "string" ? i : i?.name)).filter(Boolean) : [];

/** YouTube video id from a watch/short/youtu.be URL, or null (playlists → null). */
export function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = /^\/(?:shorts|embed)\/([\w-]{11})/.exec(u.pathname);
      if (m) return m[1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/**
 * The three ShareX concept repos: shared creation date and the spread of their
 * creation timestamps in seconds (81 at the 28.09.2026 snapshot). Needs `repo.createdTs`.
 */
export const SHAREX_IDS = ["sharex-capture-engine", "sharex-win98", "sharex-afterimage"];
export function sharexStats(projects = []) {
  const ts = SHAREX_IDS.map((id) => projects.find((p) => p.id === id)?.repo?.createdTs)
    .filter(Boolean)
    .map((t) => Date.parse(t));
  if (ts.length !== SHAREX_IDS.length || ts.some(Number.isNaN)) return null;
  const min = Math.min(...ts);
  const d = new Date(min);
  return {
    date: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    seconds: Math.round((Math.max(...ts) - min) / 1000),
  };
}

/** The public project repo with the most stars (ties → earlier JSON order). */
export function computeMaxStars(projects = []) {
  let best = null;
  for (const p of projects) {
    if (!p.repo || p.repo.private || !Number.isFinite(p.repo.stars)) continue;
    if (!best || p.repo.stars > best.repo.stars) best = p;
  }
  return best ? { id: best.id, stars: best.repo.stars } : null;
}

/** Sorts by last push desc; film uploads (films Map/array) come next; dateless last. */
export function lastWorkedOn(project, films) {
  if (project?.repo?.pushedAt) return project.repo.pushedAt;
  const film = films instanceof Map ? films.get(project?.id) : films?.find?.((f) => f.id === project?.id);
  return film?.uploaded ?? null;
}

/* ------------------------------------------------------------------ tools */

const TOOL_RULES = [
  [/^next\.?js( \d+(\.x)?)?$/, "Next.js"],
  [/^typescript$/, "TypeScript"],
  [/^(javascript|vanilla js|vanilla javascript|js)$/, "JavaScript"],
  [/^three\.?js( \d[\d.x]*)?$/, "Three.js"],
  [/^react( \d+)?$/, "React"],
  [/^sqlite\b.*$/, "SQLite"],
  [/^tailwind ?css( v?\d+)?$/, "Tailwind CSS"],
  [/^python( \d[\d.]*)?$/, "Python"],
  [/^flask( \+ flask-socketio)?$/, "Flask"],
  [/^web ?audio( api)?$/, "Web Audio"],
  [/^docker( compose)?$/, "Docker"],
  [/^github pages$/, "GitHub Pages"],
  [/^canvas( api)?$/, "Canvas"],
  [/^vite( \d+)?$/, "Vite"],
  [/^node(\.js)?( \d+)?$/, "Node.js"],
  [/^websockets?$/, "WebSocket"],
  [/^html5?$/, "HTML"],
  [/^css3?$/, "CSS"],
  [/^leaflet$/, "Leaflet"],
  [/^localstorage$/, "localStorage"],
];

/** Canonical tool name for a stack/tag string (§5.10 normalize map); unknown → as written. */
export function canonicalTool(raw) {
  const written = String(raw ?? "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!written) return "";
  const key = written.toLocaleLowerCase("de");
  for (const [re, name] of TOOL_RULES) if (re.test(key)) return name;
  return written;
}

/** Splits compound stack strings ("Three.js / React Three Fiber", "jpCore: A, B") into tools. */
export function splitStack(raw) {
  let s = String(raw ?? "");
  const prefixed = /^[^:()]{1,24}:\s+(.+)$/.exec(s);
  if (prefixed) return prefixed[1].split(/,\s*/).flatMap(splitStack);
  s = s.replace(/\s*\([^)]*\)/g, "");
  return s.split(/\s+\/\s+/).map((t) => t.trim()).filter(Boolean);
}

/**
 * Werkzeugwand counts: every project counts a tool once, from `details.stack`
 * (fallback: `tags`). `detailsById` is a Map or plain object of loaded details.
 * Returns [{ tool, count, ids }] sorted by count desc, then name (de).
 */
export function toolCounts(projects = [], detailsById = {}) {
  const get = (id) => (detailsById instanceof Map ? detailsById.get(id) : detailsById?.[id]);
  const tally = new Map();
  for (const p of projects) {
    const stack = get(p.id)?.stack;
    const raw = Array.isArray(stack) && stack.length ? stack.flatMap(splitStack) : p.tags ?? [];
    const tools = new Set(raw.map(canonicalTool).filter(Boolean));
    for (const tool of tools) {
      const entry = tally.get(tool) ?? { tool, count: 0, ids: [] };
      entry.count += 1;
      entry.ids.push(p.id);
      tally.set(tool, entry);
    }
  }
  return [...tally.values()].sort((a, b) => b.count - a.count || a.tool.localeCompare(b.tool, "de"));
}

/* --------------------------------------------------------------- bindings */

const filmList = (films) => (films instanceof Map ? [...films.values()] : Array.isArray(films) ? films : []);

/**
 * Every computed number the copy can bind to via `<span data-bind="key">`.
 * Missing inputs simply leave their keys out (consumers keep the prerendered text).
 * `data` is the Data object from lib/data.js (or the Node equivalent in prerender).
 * `data.detailsById` (optional, Map or object) enables per-project facts.
 */
export function bindings(data = {}) {
  const b = {};
  const asOf = data.snapshot?.asOf ?? data.repos?.asOf ?? null;
  const currentYear = asOf ? yearOf(asOf) : null;
  if (asOf) {
    b["snapshot.asOf"] = formatDate(asOf);
    b["currentYear"] = currentYear;
  }

  const projects = Array.isArray(data.projects) ? data.projects : null;
  if (projects) {
    b["projects.total"] = projects.length;
    for (const g of GROUPS) b[`projects.${g}`] = projects.filter((p) => p.groups?.includes(g)).length;
    b["projects.new"] = projects.filter((p) => p.isNew).length;
    const sx = sharexStats(projects);
    if (sx) {
      b["sharex.seconds"] = sx.seconds;
      b["sharex.date"] = formatDate(sx.date);
    }
    const star = computeMaxStars(projects);
    if (star) {
      b["stars.maxId"] = star.id;
      b["stars.max"] = star.stars;
    }
  }

  const gh = data.snapshot?.github;
  if (gh?.createdAt) b["github.sinceYear"] = yearOf(gh.createdAt);
  if (data.snapshot?.youtube?.firstUpload) {
    b["youtube.firstUpload"] = formatDate(data.snapshot.youtube.firstUpload);
    b["youtube.firstYear"] = yearOf(data.snapshot.youtube.firstUpload);
  }

  const repos = Array.isArray(data.repos) ? data.repos : Array.isArray(data.repos?.repos) ? data.repos.repos : null;
  if (repos && currentYear) {
    const by = reposByYear(repos);
    const years = Object.keys(by).map(Number).sort((a, z) => a - z);
    b["repos.total"] = repos.length;
    b["repos.currentYear"] = by[currentYear] ?? 0;
    b["repos.previousYear"] = by[currentYear - 1] ?? 0;
    b["repos.firstYear"] = years[0];
    b["repos.beforeUntil"] = currentYear - 2;
    b["repos.before"] = years.filter((y) => y < currentYear - 1).reduce((s, y) => s + by[y], 0);
  }

  const films = filmList(data.films);
  if (films.length) {
    const ski = films.filter((f) => f.series === "ski");
    b["films.total"] = films.length;
    b["films.ski"] = ski.length;
    const skiYears = ski.map((f) => yearOf(f.uploaded)).filter(Number.isFinite);
    if (skiYears.length) b["films.skiFirstYear"] = Math.min(...skiYears);
    b["films.skiOnJp"] = ski.filter((f) => f.alsoOn?.some((a) => /jupeters\.de/.test(a.url ?? a.label))).length;
  }

  const g = galleryStats(photoNames(data.gallery));
  if (g) {
    b["gallery.total"] = g.total;
    b["gallery.nights"] = g.nights;
    const sameYear = g.first.slice(0, 4) === g.last.slice(0, 4);
    b["gallery.first"] = formatDate(g.first, sameYear ? "dayMonth" : "day");
    b["gallery.last"] = formatDate(g.last);
    b["gallery.hourFrom"] = g.hourFrom;
    b["gallery.hourTo"] = g.hourTo;
  }

  if (Array.isArray(data.milestones)) b["milestones.total"] = data.milestones.length;
  if (Array.isArray(data.partners)) b["partners.total"] = data.partners.length;

  const det = data.detailsById;
  const theater = det instanceof Map ? det.get("theater-website") : det?.["theater-website"];
  if (theater?.commitsBy) {
    if (Number.isFinite(theater.commitsBy.LoggeL)) b["theater.commitsLogge"] = theater.commitsBy.LoggeL;
    if (Number.isFinite(theater.commitsBy.total)) b["theater.commitsTotal"] = theater.commitsBy.total;
  }
  const seats = theater?.facts?.find((f) => f.key === "seats");
  if (seats) b["theater.seats"] = seats.value;

  for (const k of Object.keys(b)) if (b[k] === undefined || b[k] === null || Number.isNaN(b[k])) delete b[k];
  return b;
}

/** Replaces `{binding.key}` tokens in data text (e.g. milestones). Unknown keys stay visible as-is. */
export function fillBindings(text, b = {}) {
  return String(text ?? "").replace(/\{([\w.]+)\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(b, key) ? String(b[key]) : m,
  );
}

/** True if a text still contains unfilled `{key}` tokens. */
export const hasTokens = (text) => /\{[\w.]+\}/.test(String(text ?? ""));

/**
 * Text for a `data-bind` span. Shared by scripts/prerender.mjs and main.js so the
 * prerendered and the runtime text are identical. Numbers ≥ 10 000 get a German
 * thousands separator; everything else is printed as is.
 */
export function formatBinding(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.abs(value) >= 10000 ? value.toLocaleString("de-DE") : String(value);
  }
  return value === undefined || value === null ? "" : String(value);
}
