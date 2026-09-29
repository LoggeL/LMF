#!/usr/bin/env node
/**
 * research → data (spec §3.1–§3.12). Dev-only, idempotent, output committed.
 *
 *   node scripts/import-research.mjs        (npm run import)
 *
 * Reads docs/research/*.json plus the current data/*.json and writes:
 *   data/projects.json   (fixes §3.2 as a patch table, new projects §3.4, screenshots §3.5)
 *   data/details/<id>.json (§3.6)
 *   data/films.json      (§3.7)
 *   data/milestones.json (§3.9)
 *   data/chapters.json, data/universe.json (§3.10)
 *   data/partners.json   (§3.12)
 *
 * Rules:
 * - Only facts that carry a source are imported. A details file without at least one
 *   https source is refused (the script exits non-zero).
 * - Values that scripts/snapshot-github.mjs refreshes (project.repo, details.commits,
 *   details.languages, details.commitsBy, relatedRepos[].commits) are preserved from the
 *   existing files when present, so running import after snapshot changes nothing.
 * - Portfolio, not report: every written file goes through scripts/lib/portfolio-copy.mjs last
 *   (visitor phrasing, no forensics); the sources stay untouched.
 * - Not imported: interactionIdeas, caveats, private README facts marked „nicht verwenden“,
 *   Marathon personal data, other people's Spotify reports, place names for the night walks.
 */
import { readFile, writeFile, mkdir, readdir, access } from "node:fs/promises";
import { stringifyProjects } from "./lib/json.mjs";
import { polish, assertPolished } from "./lib/portfolio-copy.mjs";

const ROOT = new URL("../", import.meta.url);
const at = (p) => new URL(p, ROOT);
const readJson = async (p) => JSON.parse(await readFile(at(p), "utf8"));
const exists = (p) => access(at(p)).then(() => true, () => false);
const CHECKED = "2026-09-28";

const EXCLUDED_EARLY = new Set(((await exists("docs/decisions.json")) ? await readJson("docs/decisions.json") : {}).excludedProjects ?? []);
const order = (await readJson("scripts/order.json")).filter((id) => !EXCLUDED_EARLY.has(id));
const deep = await readJson("docs/research/projects-deep.json");
const persona = await readJson("docs/research/film-network-persona.json");
const newWork = await readJson("docs/research/new-work.json");
const decisions = (await exists("docs/decisions.json")) ? await readJson("docs/decisions.json") : {};
/** Owner decision: projects that never appear anywhere (docs/decisions.json → excludedProjects). */
const EXCLUDED = new Set(decisions.excludedProjects ?? []);
const notExcluded = (id) => !EXCLUDED.has(id);
const current = await readJson("data/projects.json");
const byIdCurrent = new Map(current.map((p) => [p.id, p]));

let probeIds = null;
if (await exists("js/probes/index.js")) {
  try {
    probeIds = new Set((await import(at("js/probes/index.js"))).PROBE_IDS ?? []);
  } catch {
    probeIds = null;
  }
}

/* ============================================================ tables */

/** GitHub repo behind each project (snapshot-github.mjs reads the same table via repo.fullName). */
const REPO_OF = {
  "bomberman-web": "LoggeL/bomberman-web",
  melodai: "LoggeL/MelodAI",
  "theater-website": "Kolpingtheater-Ramsen/next-theater",
  "learn-ai": "LoggeL/learn-guide",
  kniffel: "LoggeL/kniffel",
  "sharex-capture-engine": "LoggeL/sharex-capture-engine",
  "sharex-win98": "LoggeL/sharex-win98",
  "sharex-afterimage": "LoggeL/sharex-afterimage-lab",
  "geo-game": "LoggeL/geo-games",
  "jet-loop-reactor": "LoggeL/jet-loop-reactor",
  "spotify-viz": "LoggeL/spotify-viz",
  beatguessr: "LoggeL/BeatGuessr",
  "coop-sudoku": "LoggeL/coop-sudoku",
  arcanum: "LoggeL/arcanum",
  "voxel-blitz": "LoggeL/voxel-blitz",
  "bulli-drive": "LoggeL/Bulli-Drive",
  oilbert: "LoggeL/OilbertsAdventure",
  transcripator: "LoggeL/TranscripatorWeb",
  "codex-quota-widget": "LoggeL/codex-quota-widget",
  loggerythm: "LoggeL/LoggeRythm",
  setlist: "LoggeL/setlist",
  "marathon-trainer": "LoggeL/marathon-trainer",
  "powerpoint-karaoke": "LoggeL/PowerPointKaraoke",
  "poolparty-website": "realjupeters/realjupeters.github.io",
  "voll-o-meter": "LoggeL/VollOMeter",
  spyfall: "LoggeL/spyfall",
  "palatina-films-website": "LoggeL/PalatinaFilms",
  "corona-board": "LoggeL/CoronaBoard",
};
const PRIVATE_REPOS = new Set(["LoggeL/geo-games", "LoggeL/marathon-trainer"]);
const repoUrl = (full) => `https://github.com/${full}`;

/** §3.2 fixes (and a few source/visibility corrections backed by research). `null` deletes a key. */
const FIXES = {
  "skiing-2019": { link: "https://www.youtube.com/watch?v=-VTPliFOTA0", title: "Ski 2019 · Feldberg" },
  // Visible film titles in German, like „Ski 2023“ (films.json → realTitle keeps the YouTube title).
  "skiing-2024-epic": {
    title: "Ski 2024 · Epic Cut",
    // old data: „stunning drone shots“; research: drone shots only per portfolio data, no panoramas
    description: "Unser Skiurlaub in Flachau als Aftermovie mit Drohnenaufnahmen.",
  },
  "skiing-2024-fun": { title: "Ski 2024 · Fun Cut" },
  "skiing-2022": { title: "Ski 2022 · Zillertal" },
  "skiing-2020": { title: "Ski 2020 · Bad Gastein" },
  // Summary only from research (bomberman story: one engine for local and online).
  "bomberman-web": { summary: "Bomben, Bots und Kettenreaktionen. Lokal und online läuft dieselbe Engine." },
  setlist: {
    title: "Bands",
    category: "Musik & Web",
    link: "https://bands.logge.top",
    source: "https://github.com/LoggeL/setlist",
    description:
      "Mein Musiktagebuch: Bands, die ich noch live sehen will, Bands, die ich schon gesehen habe, dazu Vorschauen und ein Song-Tagebuch. Hieß mal Sonic Noir, dann Setlist, jetzt Bands.",
    imageAlt: "Setlist, frühere Version von Bands",
  },
  "palatina-films-website": {
    link: "https://loggel.github.io/PalatinaFilms/",
    linkLabel: "Archiv ansehen",
    // a website (about films), not a film: the Film chip and the Abspann both count the 15 films
    groups: ["web"],
    archived: true,
    source: "https://github.com/LoggeL/PalatinaFilms",
  },
  "voll-o-meter": {
    description:
      "Ein augenzwinkernder Promillerechner mit anpassbaren Getränken. Installierbar, die Daten bleiben im Browser. Nur eine Schätzung: keine Messung und keine Grundlage für Entscheidungen zur Fahrtüchtigkeit.",
    tags: ["javascript", "localstorage", "web-app"],
    link: "https://loggel.github.io/VollOMeter/",
    source: "https://github.com/LoggeL/VollOMeter",
  },
  "marathon-trainer": {
    description:
      "Mein Trainings-Cockpit mit Countdown, 14-Wochen-Plan und Workout-Log. Workouts speichere ich mit Strava-Link, ausgewertet werden sie von einem externen KI-Agenten.",
    tags: ["nextjs", "typescript", "sqlite", "recharts"],
    groups: ["web"],
    source: null,
    // MarathonTrainer.webp shows the race, its date, goal time, pace and the training log (spec §3.2:
    // no goal time, PB or calendar details anywhere). The file stays on disk, unreferenced.
    image: null,
    imageAlt: null,
    art: "widget",
  },
  // Legierung = groups[0] (spec §1.1). Category „KI & Audio“ → KI leads, Web stays as second group.
  transcripator: {
    groups: ["ai", "web"],
    description:
      "Audio rein, Text raus, Zusammenfassung obendrauf. Angefangen als Telegram-Bot, heute auch als Web-App zum Hochladen oder direkt Aufnehmen.",
    tags: ["python", "flask", "whisper", "gemini"],
    source: "https://github.com/LoggeL/TranscripatorWeb",
  },
  "poolparty-website": {
    description:
      "Anmeldung, Mitbringliste, Helfer und Musikwünsche für die JP Poolparty. Gemeinsam mit realjupeters gebaut. Dahinter läuft mein Backend jpCore.",
    tags: ["javascript", "fastify", "sqlite"],
    source: "https://github.com/realjupeters/realjupeters.github.io",
    linkLabel: "Zur Website",
  },
  "geo-game": { tags: ["nextjs", "react", "typescript", "leaflet"], source: null },
  // Checked 28.09.2026: LoggeL/OilbertsAdventure@a467686 has no getContext/<canvas> in game.js or index.html.
  oilbert: {
    description: "Ein Endless-Runner mit einem rot-weißen VW-Bus in der Hauptrolle, gebaut mit JavaScript, HTML und CSS.",
    tags: ["game", "javascript", "css"],
    source: "https://github.com/LoggeL/OilbertsAdventure",
  },
  "theater-website": {
    groups: ["web"],
    // research stack (projects-deep.json): Next.js 15, TS, React, Tailwind, Resend, QR, BlurHash, Sharp,
    // Recharts, Docker; „cloudflare“ came from the old English description and is not sourced
    tags: ["nextjs", "tailwindcss", "typescript", "docker"],
    source: "https://github.com/Kolpingtheater-Ramsen/next-theater",
    linkLabel: "Zur Website",
    // The old screenshot (Kolpingtheater.webp) shows ensemble faces; spec §2.3: no ensemble faces anywhere.
    // New live capture of the booking step (28.09.2026): seat plan, no people.
    image: "assets/img/KolpingtheaterSaalplan.webp",
    imageAlt: "Saalplan der Ticketbuchung auf kolpingtheater-ramsen.de: sieben Reihen vor der Bühne",
  },
  // category repeated the year („Film · 2026“); the other ski films say „Aftermovie“
  // description: YouTube description („Aftermovie Skifahren 2026 in Portes du Soleil“, „in vertikal“)
  "skiing-2026": {
    category: "Aftermovie",
    description: "Der Aftermovie unseres Skiurlaubs 2026 in Portes du Soleil, diesmal im Hochformat geschnitten.",
  },
  "sailing-2019": { groups: ["film"], title: "Segeln 2019" },
  "sailing-2022": { groups: ["film"], title: "Segeln 2022" },
  spyfall: { image: "assets/img/spyfall.webp", source: "https://github.com/LoggeL/spyfall" },
  // Sources pointed at the live pages; research gives the repos.
  "sharex-capture-engine": { source: "https://github.com/LoggeL/sharex-capture-engine" },
  "sharex-win98": { source: "https://github.com/LoggeL/sharex-win98" },
  "sharex-afterimage": { source: "https://github.com/LoggeL/sharex-afterimage-lab" },
  kniffel: { source: "https://github.com/LoggeL/kniffel" },
  "spotify-viz": { source: "https://github.com/LoggeL/spotify-viz" },
  "learn-ai": { groups: ["ai", "web"], source: "https://github.com/LoggeL/learn-guide" },
  "coop-sudoku": { source: "https://github.com/LoggeL/coop-sudoku" },
  beatguessr: { source: "https://github.com/LoggeL/BeatGuessr" },
  melodai: { source: "https://github.com/LoggeL/MelodAI" },
  // „Zum Archiv“, not „Archiv ansehen“: werkbank.js reads that label on a github.io link as „die alte
  // Domain ist weg“, which is only true for Palatina Films. Corona Board always lived on GitHub Pages.
  "corona-board": { source: "https://github.com/LoggeL/CoronaBoard", linkLabel: "Zum Archiv" },
  loggerythm: { linkLabel: "Repo ansehen" },
  // An Android widget for the Codex quota (Kotlin), not a web app: KI leads, „Web & Apps“ stays second.
  // A Kotlin/Android AppWidget with no web part (research): KI only, so no „KI · Web“ Legierung.
  "codex-quota-widget": { groups: ["ai"], linkLabel: "Repo ansehen" },
  // CTA labels (§2.13): websites say „Zur Website“ (as the chapter CTA does), the archive says so.
  "voxel-blitz": { linkLabel: "Repo ansehen" },
  "bulli-drive": { linkLabel: "Repo ansehen" },
  // old data: „hot tubs and cocktail bars“; nothing sourced on friends or summer evenings
  "poolparty-2021": { description: "Der offizielle Aftermovie der JP Poolparty 2021, mit Whirlpool und Cocktailbar." },
  // the deck count needs its date (research checked the live gallery on 28.09.2026)
  "powerpoint-karaoke": {
    description:
      "Eine Galerie spielbarer Decks für PowerPoint Karaoke im Look einer Office-Oberfläche. Stand 28.09.2026 sind es 17 deutsche Präsentationen mit je zehn Folien, von „Elternabend als kommunales Strafgericht“ bis „Spa in der Hölle: Businessplan“. Mit Zufallsdeck, Panik-Notiz und Präsentationsmodus.",
    summary: "Absurde Decks. Vortragen musst du trotzdem selbst.",
  },
};

/** §3.5 screenshot swaps (Codex keeps its Rohling; its strip goes into details.media). */
const SCREENSHOTS = {
  "sharex-capture-engine": ["assets/img/ShareXCaptureEngine.webp", "Startseite des ShareX-Konzepts Capture Engine mit 3D-Reaktor"],
  "sharex-win98": ["assets/img/ShareXWin98.webp", "ShareX-98-Konzept: Windows-98-Desktop mit geöffnetem Capture Center"],
  "sharex-afterimage": ["assets/img/ShareXAfterimage.webp", "ShareX-Konzept Afterimage Lab, Startseite"],
  loggerythm: ["assets/img/LoggeRythm.webp", "LoggeRythm: Warteschlange im Webplayer (offizieller Screenshot aus dem Repo)"],
};

/** Alt texts for the new screenshots, written from each research imageNote. */
const NEW_ALT = {
  arcanum: "Die 3D-Kammer des Erzmagiers in Arcanum, ohne Titel-Overlay",
  "voxel-blitz": "Hauptmenü von Voxel Blitz (offizieller Screenshot aus dem Repo)",
  "bulli-drive": "Bulli Drive: Main Street in Bulli Bay (offizieller Screenshot aus dem Repo)",
  "jet-loop-reactor": "3D-Modell des Strahlschlaufenreaktors mit Reglern für die Betriebsparameter",
  "powerpoint-karaoke": "Deck-Galerie von PowerPoint Karaoke im Office-Look",
};

/**
 * Alt texts for the screenshots and film stills that had none (the Werkbank shows them as its main,
 * informative image). Written from what each file shows (checked by eye 28.09.2026) and from the
 * sourced titles; the MelodAI, Bomberman and Ski 2026 texts are the ones Meisterstücke already uses
 * for the same files. People in film stills are not named.
 */
const IMAGE_ALT = {
  "bomberman-web": "Bomberman-Motiv: Bomben-Roboter in einer Neon-Arena, daneben eine Explosion in Kreuzform",
  melodai: "MelodAI-Player: Songauswahl mit Bibliothek und getrennten Reglern für Gesang und Instrumental",
  "learn-ai": "Learn AI: das Kapitel „Tokenization“ unter Large Language Models, links die Themenliste",
  "skiing-2026": "Vorschaubild des Aftermovies: Berggipfel in Portes du Soleil, Schriftzug „Aftermovie Ski Trip 2026“",
  kniffel: "Kniffel Mehrspieler: Startseite mit Namensfeld, Icon-Auswahl und den Knöpfen „Raum erstellen“ und „Join“",
  "geo-game": "GeoGames: Europakarte mit den Symbolen der Tagesspiele, darunter die Kacheln von StadtPin bis Länder-Check",
  "spotify-viz": "Spotify Listening Report: Kennzahlen von 2017 bis 2026 und die Kacheln „Records & Extremes“",
  beatguessr: "BeatGuessr: Auswahl des Spielmodus, oben der Modus „Classic“",
  "coop-sudoku": "Coop Sudoku: Spielfeld mit Zahlenblock, den Modi „Coop“ und „Versus“ und Punkten für drei Spieler",
  oilbert: "Oilbert’s Adventure: ein rot-weißer VW-Bus auf einer grünen Plattform, oben Score und Speed",
  transcripator: "Transcripator: Startseite „AI Audio Transcription“ mit Feld zum Hochladen oder Aufnehmen",
  "poolparty-website": "Website der JP Poolparty: Seite „Poolparty 2022“ mit dem JP-Logo",
  infected: "Titelbild des Kurzfilms „Infected“: Schriftzug vor einer Stadtsilhouette mit Biohazard-Zeichen",
  exception: "Titelkarte des Kurzfilms „Exception“ im YouTube-Player",
  selantis: "Standbild aus „Die Chroniken von Selantis“: zwei Darsteller in mittelalterlichen Kostümen",
  "skiing-2024-epic": "Vorschaubild des Epic Cuts: ein Skifahrer zwischen Feuerstreifen auf dem Weg ins Tal",
  "skiing-2024-fun": "Standbild aus dem Fun Cut: ein Skifahrer mit Helm in Nahaufnahme, Untertitel „nach dem Sturz lief es wie wild.“",
  "skiing-2022": "Standbild aus dem Zillertal-Aftermovie: ein Skifahrer jubelt mit erhobenen Stöcken über den Wolken",
  "sailing-2022": "Standbild aus „Segeln 2022“: ein blaues Segelschiff im Hafen",
  "poolparty-2021": "Standbild aus dem Poolparty-Aftermovie 2021: nachts beleuchtete Zelte und ein Whirlpool im Garten",
  "skiing-2020": "Standbild aus „Bad Gastein 2020“: ein Snowboarder auf der Piste",
  "bodensee-2020": "Standbild aus „Bodensee 2020“: Blick vom Bug eines Motorboots über den See",
  "poolparty-2020": "Standbild aus dem Poolparty-Aftermovie 2020: Garten in der Dämmerung mit grünem Laser und Partyzelt",
  "skiing-2019": "Standbild aus „Feldberg 2019“: ein Skifahrer springt über eine Box, dahinter der Sessellift",
  "sailing-2019": "Standbild aus „Segeln 2019“: Blick vom Deck eines Segelschiffs über den Hafen",
  "voll-o-meter": "Voll-O-Meter: Knöpfe für die Getränkearten und darunter die geschätzte Promille-Anzeige",
  spyfall: "Spyfall: Startbildschirm mit Spieleranzahl, Start-Knopf und Einstellungen",
  "palatina-films-website": "Startseite der Palatina-Films-Website: das Logo über einem Standbild aus einem Film",
  "corona-board": "Corona Board: Weltkarte der aktiven Fälle in logarithmischer Skala",
};

/** Curated extras (§3.4 table, probes, relations, content notes). */
const EXTRA = {
  "bulli-drive": { related: ["oilbert"] },
  oilbert: { related: ["bulli-drive"] },
  "theater-website": { probe: "theater-saalplan" },
  "bomberman-web": { probe: "bomberman-chain" },
  melodai: { probe: "melodai-mixer" },
  transcripator: { probe: "transcripator-pow" },
  beatguessr: { probe: "beatguessr-years" },
  "sharex-capture-engine": { related: ["sharex-win98", "sharex-afterimage"] },
  "sharex-win98": { related: ["sharex-capture-engine", "sharex-afterimage"] },
  "sharex-afterimage": { related: ["sharex-capture-engine", "sharex-win98"] },
  "poolparty-website": { related: ["poolparty-2020", "poolparty-2021"] },
  selantis: { yearLabel: "2015–2020", related: ["palatina-films-website"] },
  "palatina-films-website": { related: ["selantis"] },
  "skiing-2024-epic": { related: ["skiing-2024-fun"] },
  "skiing-2024-fun": { related: ["skiing-2024-epic"] },
};

const SKI_2023 = {
  id: "skiing-2023",
  title: "Ski 2023",
  category: "Aftermovie",
  description: "Der Ski-Aftermovie 2023. Auf YouTube mit Grüßen an den FI-Toaster und die unsichtbaren Backbleche.",
  link: "https://www.youtube.com/watch?v=CLalueWRmLI",
  tags: ["aftermovie", "skiing", "editing"],
  groups: ["film"],
  year: 2023,
  isNew: true,
};

/* ============================================================ helpers */

const clone = (v) => JSON.parse(JSON.stringify(v));
/** Keeps projects.json small (≤ 40 KB): `private` only when true, `createdTs` only for the ShareX trio. */
const TS_IDS = new Set(["sharex-capture-engine", "sharex-win98", "sharex-afterimage"]);
function compactRepo(id, repo) {
  const r = { fullName: repo.fullName };
  if (repo.private) r.private = true;
  for (const k of ["stars", "createdAt", "pushedAt"]) if (repo[k] !== undefined) r[k] = repo[k];
  if (TS_IDS.has(id) && repo.createdTs) r.createdTs = repo.createdTs;
  return r;
}
const dateOnly = (iso) => (typeof iso === "string" ? iso.slice(0, 10) : undefined);

const ABBR_END = /(?:\b(?:z|u|d|a|h|o|s|v|B|ca|bzw|Nr|vs|inkl|ggf|etc|evtl|bspw|St|Dr|Mio|Mrd)\.|\d\.)$/;
/** Splits German prose into sentences without breaking „z. B.“, „u. a.“ or „25. Oktober“. */
function sentences(text) {
  const raw = String(text).trim().split(/(?<=[.!?…][“”"»]?)\s+(?=[„"»A-ZÄÖÜ0-9])/);
  const out = [];
  for (const piece of raw) {
    if (out.length && ABBR_END.test(out[out.length - 1])) out[out.length - 1] += " " + piece;
    else out.push(piece);
  }
  return out;
}
/** Groups sentences into ≤ 3 paragraphs, wording unchanged; split points balance the lengths. */
function paragraphs(text) {
  if (!text) return [];
  const s = sentences(text);
  const n = s.length <= 2 ? 1 : s.length <= 5 ? 2 : 3;
  if (n === 1) return [s.join(" ")];
  const len = (a, b) => s.slice(a, b).join(" ").length;
  let best = null;
  for (let i = 1; i < s.length; i++) {
    for (let j = n === 3 ? i + 1 : s.length; j <= s.length - (n === 3 ? 1 : 0); j++) {
      const parts = n === 3 ? [len(0, i), len(i, j), len(j, s.length)] : [len(0, i), len(i, s.length)];
      const score = Math.max(...parts);
      if (!best || score < best.score) best = { score, cuts: n === 3 ? [i, j] : [i] };
      if (n === 2) break;
    }
  }
  const cuts = [0, ...best.cuts, s.length];
  return cuts.slice(0, -1).map((c, k) => s.slice(c, cuts[k + 1]).join(" "));
}
/** Keeps only the listed sentences (0-based) of a research text, wording unchanged. */
const pick = (text, idx) => {
  const s = sentences(text);
  return idx.map((i) => s[i]).filter(Boolean).join(" ");
};

/** ISO dates in visible prose → dd.mm.yyyy („deckt 2017-10-16 bis 2026-04-17 ab“ reads as a range). */
const deDate = (iso) => iso.split("-").reverse().join(".");
function germanDates(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/deckt (\d{4}-\d{2}-\d{2}) bis (\d{4}-\d{2}-\d{2}) ab/g, (_, a, b) => `deckt den Zeitraum vom ${deDate(a)} bis ${deDate(b)} ab`)
    .replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (m) => deDate(m));
}

/** Human label for a URL. */
function baseLabel(url) {
  const u = new URL(url);
  const path = u.pathname.replace(/\/$/, "");
  if (u.hostname === "github.com") {
    const [owner, repo, kind, , ...rest] = path.slice(1).split("/");
    if (!repo) return `GitHub ${owner}`;
    if ((kind === "blob" || kind === "tree") && rest.length) return `Repo ${owner}/${repo}: ${rest.join("/")}`;
    if (kind === "commit") return `Commit in ${owner}/${repo}`;
    return `Repo ${owner}/${repo}`;
  }
  if (u.hostname === "api.github.com") return `GitHub API ${path.replace(/^\/(repos|users)\//, "")}`;
  if (/youtube\.com$|youtu\.be$/.test(u.hostname)) return u.pathname === "/playlist" ? "YouTube-Playlist" : "YouTube";
  return `Live-Seite ${u.hostname}${path}`;
}
function cleanNote(note = "") {
  return note
    .replace(/live geprüft \d{4}-\d{2}-\d{2}/g, "")
    .replace(/geprüft \d{4}-\d{2}-\d{2}/g, "")
    .replace(/^privat:\s*/, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;:]+|[\s,;:]+$/g, "");
}

/** Sources collector: dedupes by URL, merges labels, returns indices. */
class Sources {
  constructor() {
    this.list = [];
  }
  add(url, note, extra = {}) {
    if (!/^https:\/\//.test(url)) return -1;
    url = url.replace(/[.,;]+$/, "");
    const full = Object.keys(PRIVATE_REPOS_BY_URL).find((u) => url.startsWith(u));
    const isPrivate = Boolean(full) || extra.private;
    let idx = this.list.findIndex((s) => s.url === url);
    const n = cleanNote(note);
    if (idx === -1) {
      let label = extra.label ?? baseLabel(url);
      if (isPrivate) label += " (privat, nicht öffentlich einsehbar)";
      if (n) label += ` · ${n}`;
      const entry = { label, url, checkedAt: extra.checkedAt ?? CHECKED };
      if (isPrivate) entry.private = true;
      this.list.push(entry);
      idx = this.list.length - 1;
    } else if (n && !extra.label && !this.list[idx].label.includes(n)) {
      this.list[idx].label += ` · ${n}`;
    }
    return idx;
  }
  index(url) {
    return this.list.findIndex((s) => s.url === url);
  }
}
const PRIVATE_REPOS_BY_URL = Object.fromEntries([...PRIVATE_REPOS].map((f) => [repoUrl(f), f]));

/** Parses a research source string ("URL (note)", several URLs joined by „und“ or commas). */
function addResearchSource(src, str) {
  const segments = String(str).split(/,\s+(?=https?:)|\s+und\s+(?=https?:)/);
  const out = [];
  for (const seg of segments) {
    const url = (/https?:\/\/[^\s,;)]+/.exec(seg) || [])[0];
    if (!url) continue;
    const note = (/\(([^()]*)\)/.exec(seg) || [])[1] ?? "";
    out.push(src.add(url, note));
  }
  return out;
}

/* ============================================================ projects */

const deepById = new Map(deep.map((d) => [d.id, d]));
const filmById = new Map(persona.films.map((f) => [f.id, f]));
const showSerotonin = decisions.serotonin === "show";
const proposed = newWork.proposedProjects.filter((p) => p.id !== "serotonin" || showSerotonin);
const proposedById = new Map(proposed.map((p) => [p.id, p]));

const NEW_FIELDS = ["id", "title", "category", "description", "summary", "link", "linkLabel", "tags", "groups", "source", "image"];

function applyPatch(p, patch = {}) {
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete p[k];
    else p[k] = clone(v);
  }
}

const projects = [];
for (const id of order) {
  let p;
  if (proposedById.has(id)) {
    const r = proposedById.get(id);
    p = {};
    for (const k of NEW_FIELDS) if (r[k] !== undefined) p[k] = clone(r[k]);
    p.imageAlt = NEW_ALT[id];
    p.isNew = true;
    p.year = r.yearStarted;
    if (r.contentNote) p.contentNote = r.contentNote;
  } else if (id === "skiing-2023") {
    p = clone(SKI_2023);
    if (await exists("assets/img/Skiing2023.webp")) {
      p.image = "assets/img/Skiing2023.webp";
      p.imageAlt = "Vorschaubild des Videos „Aftermovie Ski 2023“";
    } else {
      p.art = "film";
      p.artTitle = "SKI\n2023";
    }
  } else if (byIdCurrent.has(id)) {
    p = clone(byIdCurrent.get(id));
    delete p.isNew;
    const d = deepById.get(id);
    const f = filmById.get(id);
    if (d?.yearStarted) p.year = d.yearStarted;
    else if (f?.year) p.year = f.year;
  } else {
    throw new Error(`order.json lists ${id}, but neither data nor research has it`);
  }
  // an existing skiing-2023 keeps its data (idempotence)
  if (id === "skiing-2023" && byIdCurrent.has(id)) {
    const prev = byIdCurrent.get(id);
    for (const k of ["repo", "live"]) if (prev[k]) p[k] = clone(prev[k]);
  }
  applyPatch(p, FIXES[id]);
  if (SCREENSHOTS[id]) {
    p.image = SCREENSHOTS[id][0];
    p.imageAlt = SCREENSHOTS[id][1];
    delete p.art;
    delete p.artTitle;
  }
  if (p.image && !p.imageAlt && IMAGE_ALT[id]) p.imageAlt = IMAGE_ALT[id];
  if (p.image && !p.imageAlt) throw new Error(`${id}: image ${p.image} without imageAlt (add it to IMAGE_ALT)`);
  const extra = clone(EXTRA[id] ?? {});
  if (extra.probe && probeIds && !probeIds.has(extra.probe)) delete extra.probe;
  if (extra.probe && !probeIds && extra.probe === "beatguessr-years") delete extra.probe; // P2, only once registered
  applyPatch(p, extra);
  if (p.isNew === false) delete p.isNew;
  if (p.related) {
    p.related = p.related.filter(notExcluded);
    if (!p.related.length) delete p.related;
  }

  // repo block: keep the snapshot's values when present, otherwise seed from research
  const full = REPO_OF[id];
  if (full) {
    const prev = byIdCurrent.get(id)?.repo;
    const d = deepById.get(id);
    const seed = d?.repo
      ? {
          fullName: full,
          private: Boolean(d.repo.private),
          stars: d.repo.stars,
          createdAt: dateOnly(d.repo.createdAt),
          createdTs: d.repo.createdAt,
          pushedAt: dateOnly(d.repo.pushedAt),
        }
      : { fullName: full, private: PRIVATE_REPOS.has(full) };
    p.repo = prev?.fullName === full ? { ...seed, ...prev } : seed;
    p.repo = compactRepo(id, p.repo);
    if (p.repo.private) delete p.source;
  } else delete p.repo;

  // live status (link check from research)
  const d = deepById.get(id);
  if (d?.liveCheck) p.live = { status: d.liveStatus, checkedAt: d.liveCheck.checkedAt };
  if (id === "setlist" || id === "palatina-films-website") p.live = { status: "live", checkedAt: CHECKED };
  if (proposedById.has(id)) {
    const r = proposedById.get(id);
    const liveChecked = r.evidence.some((e) => /^Live-Seite geprüft/.test(e));
    p.live = { status: liveChecked ? "live" : "repo-only", checkedAt: CHECKED };
  }
  p.details = true;
  projects.push(p);
}

/* ============================================================ details */

const REPO_REF_LABEL = "GitHub API · Repo-Metadaten, Commits, Sprachen";

/** Extra sources per project (sub-pages the research checked, the Oilbert source check). */
const EXTRA_SOURCES = {
  "theater-website": [
    ["https://kolpingtheater-ramsen.de/booking", "Buchung: „Romeo und Julia“, je 68 Plätze"],
    ["https://kolpingtheater-ramsen.de/about", "Über uns"],
    ["https://kolpingtheater-ramsen.de/team", "Teamseite: Bote / Diener in „Creepshow“, Crew „Website“"],
  ],
  oilbert: [
    [
      "https://github.com/LoggeL/OilbertsAdventure/blob/a467686553386b8678674311f60b9dafea2ee81d/game.js",
      "Quellcode geprüft: kein Canvas (getContext) in game.js und index.html",
    ],
  ],
};

/** Story/highlight edits the spec requires (§3.4, §3.6). */
const STORY_OVERRIDE = {
  "marathon-trainer":
    "Mein Trainings-Cockpit: Countdown zur Startlinie, 14-Wochen-Plan, Tagesansicht und Rennbereitschaft. Das Projekt ist mit meinen Zielen gewachsen und hatte schon mehrere Leben. Workouts lassen sich mit Strava-Link speichern, die KI-Analyse läuft über meinen Agenten.",
  "bulli-drive": null, // handled below (adds the sentence about Oilbert)
};
/**
 * Corrections to research prose, applied to story and funFact before they are split. Each pattern
 * must match, otherwise the import stops (the research text changed and the fix needs a look).
 */
const TEXT_FIX = {
  beatguessr: [
    // research typo: 1960–2025 are 66 Jahrgänge (data/probes/beatguessr.meta.json counts.years = 66;
    // 10 per year × 66 = 660); validate.mjs rule 7 compares the number with the meta file
    [/660 Songs aus 65 Jahren/, "660 Songs aus 66 Jahrgängen"],
    // one time zone: created 2025-12-24T23:46:35Z = 25.12.2025, 00:46 Uhr in Germany. No calendar date
    // here: the spec sheet's „Repo angelegt“ shows the API's UTC date (24.12.2025) next to it.
    [
      /Das Repo wurde am 24\.12\.2025 um 23:46 UTC angelegt, also kurz vor Mitternacht an Heiligabend \(UTC\), und startete mit README und Pages-Deploy am selben Abend\./,
      "Angelegt habe ich das Repo in der Weihnachtsnacht, um 00:46 Uhr deutscher Zeit, gleich mit README und Pages-Deploy.",
    ],
  ],
  "coop-sudoku": [
    // research slip (review round 3): 02:38 is the repo's created_at (01:38:07Z); the oldest commit
    // 51b84d5 „Initial commit: Coop Sudoku by LMF“ is dated 2025-12-25T01:37:21Z = 02:37 Uhr
    [/Initial Commit am 25\.12\.2025 um 02:38 Uhr/, "Initial Commit am 25.12.2025 um 02:37 Uhr"],
  ],
};
function fixText(id, text) {
  if (typeof text !== "string") return text;
  for (const [re, to] of TEXT_FIX[id] ?? []) if (re.test(text)) text = text.replace(re, to);
  return text;
}
function checkTextFixes(id, ...texts) {
  const blob = texts.filter((t) => typeof t === "string").join("\n");
  for (const [re] of TEXT_FIX[id] ?? []) if (!re.test(blob)) throw new Error(`${id}: TEXT_FIX pattern ${re} no longer matches the research text`);
}
const HIGHLIGHT_FILTER = {
  "marathon-trainer": (h) => !/Countdown bis zum Start|Frankfurt|25\.10\./.test(h),
};
/** funFact selection: sentence indices to keep (omitted → keep all; [] → drop). */
const FUNFACT_PICK = {
  "marathon-trainer": [], // personal goals
  "sharex-capture-engine": [], // „etwa 90 Sekunden“ – the page computes the exact spread instead
  melodai: [], // typed star count + a private predecessor
  kniffel: [0],
  setlist: [0],
  "learn-ai": [1],
  oilbert: [0],
  spyfall: [1],
};

const FACTS = {
  "learn-ai": [{ key: "topics", label: "Themen", value: "68", url: "https://learn.logge.top" }],
  "theater-website": [
    { key: "play", label: "Gebucht wird", value: "Romeo und Julia", url: "https://kolpingtheater-ramsen.de/booking" },
    { key: "seats", label: "Plätze pro Vorstellung", value: "68", url: "https://kolpingtheater-ramsen.de/booking" },
    {
      key: "nomination",
      label: "Nominiert (das Theater)",
      value: "Deutscher Engagementpreis 2026",
      url: "https://kolpingtheater-ramsen.de",
    },
  ],
  "powerpoint-karaoke": [{ key: "decks", label: "Decks", value: "17", url: "https://loggel.github.io/PowerPointKaraoke/" }],
  beatguessr: [{ key: "songs", label: "Songs", value: "660", url: "https://loggel.github.io/BeatGuessr/" }],
  spyfall: [{ key: "places", label: "Orte", value: "33", url: "https://loggel.github.io/spyfall/" }],
  "codex-quota-widget": [{ key: "release", label: "Aktuelles Release", value: "v1.0.3", url: "https://github.com/LoggeL/codex-quota-widget" }],
};

const MEDIA = {
  "theater-website": [
    {
      src: "assets/img/KolpingtheaterSaalplan.webp",
      alt: "Saalplan der Buchung: sieben Reihen A bis G vor der Bühne, freie Plätze als Kästchen",
      caption: "Platzwahl im Saalplan, Live-Screenshot vom 28.09.2026 (Vorstellung am 28.12.2026, nichts gebucht)",
      kind: "screenshot",
      width: 1440,
      height: 900,
      url: "https://kolpingtheater-ramsen.de/booking",
    },
  ],
  "codex-quota-widget": [
    {
      src: "assets/img/CodexQuotaWidget.webp",
      alt: "Codex-Quota-Widget mit zwei Testkonten „Privat“ und „Arbeit“, je mit Verbrauchsbalken, Prognose und Reset in sechs Tagen",
      caption: "Widget-Vorschau mit Testdaten (aus dem Repo)",
      kind: "strip",
      width: 945,
      height: 147,
      url: "https://github.com/LoggeL/codex-quota-widget",
    },
  ],
  arcanum: [
    {
      src: "assets/img/Arcanum.webp",
      alt: "Die 3D-Kammer des Erzmagiers in Arcanum",
      caption: "Titel-Overlay für den Screenshot ausgeblendet (Start braucht Pointer-Lock).",
      kind: "screenshot",
      width: 1440,
      height: 900,
      url: "https://loggel.github.io/arcanum/",
    },
  ],
  loggerythm: [
    {
      src: "assets/img/LoggeRythm.webp",
      alt: "LoggeRythm: Warteschlange im Webplayer",
      caption: "Offizieller Screenshot aus dem Repo (docs/screenshots/01-queue.png)",
      kind: "screenshot",
      width: 1440,
      height: 900,
      url: "https://github.com/LoggeL/LoggeRythm",
    },
  ],
  "voxel-blitz": [
    {
      src: "assets/img/VoxelBlitz.webp",
      alt: "Hauptmenü von Voxel Blitz",
      caption: "Offizieller Screenshot aus dem Repo (docs/screenshots/main-menu.png). Eine öffentliche Instanz gibt es nicht.",
      kind: "screenshot",
      width: 1440,
      height: 900,
      url: "https://github.com/LoggeL/voxel-blitz",
    },
  ],
  "bulli-drive": [
    {
      src: "assets/img/BulliDrive.webp",
      alt: "Bulli Drive: ein VW Bulli auf der Main Street von Bulli Bay",
      caption: "Offizieller Screenshot aus dem Repo (docs/screenshot.jpg)",
      kind: "screenshot",
      width: 1440,
      height: 810,
      url: "https://github.com/LoggeL/Bulli-Drive",
    },
  ],
};

const NOTES = {
  loggerythm: "Ein privates Demo-Projekt, kein öffentlicher Streamingdienst. Deshalb verlinke ich nur das Repo.",
  "voxel-blitz": "Braucht einen eigenen Spielserver. Verlinkt ist deshalb das Repo.",
  "bulli-drive": "Braucht einen eigenen Spielserver. Verlinkt ist deshalb das Repo.",
  "marathon-trainer": "Das Repo ist privat. Ziele, Zeiten und Termine zeige ich hier bewusst nicht.",
  "geo-game": "Das Repo ist privat. Die Spiele selbst sind öffentlich.",
};

/** Film details: short first-person stories from sourced facts, plus funFacts. */
const FILM_DETAILS = {
  "skiing-2020": {
    story: ["Für Bad Gastein habe ich das Material mit Flowframes von 25 auf 50 Bilder pro Sekunde hochgerechnet. In der Videobeschreibung auf YouTube steht dazu ein Vergleich."],
  },
  "skiing-2026": {
    story: ["Diesmal im Hochformat geschnitten. In der Beschreibung auf YouTube steht: „Die Welt steht schief diesmal in vertikal.“"],
  },
  "skiing-2024-fun": {
    funFact: { text: "Auf jupeters.de heißt dieser Schnitt „Skifahren 2024 - Trash Version“.", url: "https://jupeters.de" },
  },
  "skiing-2022": { funFact: { text: "Die YouTube-Beschreibung besteht aus zwei Wörtern: „Hallo Welt“.", url: "https://www.youtube.com/watch?v=GVPzXOix2sk" } },
  exception: {
    funFact: { text: "Die Beschreibung auf YouTube lautet bis heute „Beschreibung hier einfügen“.", url: "https://www.youtube.com/watch?v=uhlAo1chnlM" },
  },
  "bodensee-2020": {
    // research: upload 16.09.2020, repo LMF created 27.08.2020 (created ≠ online, so no „online ging“)
    story: ["Eines der ersten Videos, nachdem ich das Repo dieser Seite angelegt hatte. In der YouTube-Beschreibung steht nur der Link zu lmf.logge.top."],
  },
  "poolparty-2020": { story: ["Der offizielle Aftermovie der JP Poolparty 2020. So ist er auch auf jupeters.de verlinkt."] },
  "poolparty-2021": {
    story: ["Der offizielle Aftermovie der JP Poolparty 2021, veröffentlicht auf dem Kanal der Poolparty. Dieselbe Fassung liegt auch auf meinem Kanal."],
  },
  selantis: {
    story: [
      "„Die Chroniken von Selantis“ war das erste Projekt von Palatina Films und gleichzeitig der Grund, warum es Palatina Films gibt. Geplant war ein Kurzfilm in einer mittelalterlichen Welt, am Ende wurde alles größer.",
      "Bei „Die Chroniken von Selantis“ habe ich die VFX gemacht und im dritten Teil meine erste Hauptrolle gespielt: Harras.",
    ],
  },
};

function buildDeepDetails(id, prev) {
  const d = deepById.get(id);
  const src = new Sources();
  const full = REPO_OF[id];
  const publicRepo = full && !PRIVATE_REPOS.has(full);
  for (const s of d.sources) addResearchSource(src, s);
  for (const [url, note] of EXTRA_SOURCES[id] ?? []) src.add(url, note);
  const refs = {};
  if (full) refs.repo = src.add(`https://api.github.com/repos/${full}`, "", { label: REPO_REF_LABEL, private: !publicRepo });
  if (d.liveCheck?.url) {
    let liveUrl = d.liveCheck.url;
    if (id === "setlist") liveUrl = "https://bands.logge.top";
    if (id === "palatina-films-website") liveUrl = "https://loggel.github.io/PalatinaFilms/";
    const i = src.index(liveUrl) >= 0 ? src.index(liveUrl) : src.add(liveUrl, "");
    refs.live = i;
  }
  checkTextFixes(id, d.story, d.funFact);
  const story = fixText(id, germanDates(STORY_OVERRIDE[id] ?? d.story));
  const out = { id, story: paragraphs(story) };
  const hf = HIGHLIGHT_FILTER[id];
  out.highlights = hf ? d.highlights.filter(hf) : [...d.highlights];
  out.stack = [...d.stack];
  if (prev?.languages) out.languages = prev.languages;
  else if (d.repo?.languages) out.languages = d.repo.languages;
  if (Number.isFinite(prev?.commits)) out.commits = prev.commits;
  else if (Number.isFinite(d.repo?.commits)) out.commits = d.repo.commits;
  if (prev?.commitsBy) out.commitsBy = prev.commitsBy;
  else if (id === "theater-website") out.commitsBy = { LoggeL: 249, total: d.repo.commits };
  else if (id === "poolparty-website") out.commitsBy = { LoggeL: 123, total: d.repo.commits };
  addFacts(out, id, src);
  if (d.funFact) {
    const keep = FUNFACT_PICK[id];
    const fun = fixText(id, d.funFact);
    const text = keep === undefined ? fun : pick(fun, keep);
    if (text) out.funFact = { text, source: 0 };
  }
  const related = (d.relatedRepos ?? [])
    .filter((r) => !r.private)
    .map((r) => {
      const fullName = r.url.replace("https://github.com/", "");
      const prevRel = prev?.relatedRepos?.find((x) => x.fullName === fullName);
      return {
        role: r.role,
        fullName,
        createdAt: dateOnly(r.createdAt),
        commits: prevRel?.commits ?? r.commits,
      };
    });
  if (related.length) out.relatedRepos = related;
  addMedia(out, id, src);
  if (NOTES[id]) out.note = NOTES[id];
  out.refs = refs;
  out.sources = src.list;
  return out;
}

function evidenceUrl(e, p) {
  const repo = p.source?.startsWith("https://github.com/") ? p.source : null;
  const repoRoot = REPO_OF[p.id] ? repoUrl(REPO_OF[p.id]) : repo;
  if (/^Live-Seite|^index\.html-Meta/.test(e)) return p.live?.status === "live" ? p.link : repoRoot;
  const file = /^([\w./-]+\.(?:md|js|json|html|ts))\b/.exec(e);
  if (file && !/^README/.test(e)) return `${repoRoot}/blob/HEAD/${file[1]}`;
  return repoRoot;
}

function buildNewDetails(id, p, prev) {
  const r = proposedById.get(id);
  const src = new Sources();
  const refs = {};
  for (const e of r.evidence) {
    const url = evidenceUrl(e, p);
    let note = e.replace(/\s*geprüft \d{4}-\d{2}-\d{2}:?\s*/, ": ").replace(/:\s*$/, "").trim();
    // quoted repo descriptions with transliterated umlauts („ueber“) are not repeated verbatim
    if (/„[^“]*\b(ueber|fuer|Ueber)\b[^“]*“/.test(note)) note = note.replace(/:\s*„[^“]*“/, "");
    const i = src.add(url, "", { label: note });
    if (/^Live-Seite/.test(e) && i >= 0) refs.live = i;
    else if (i >= 0 && src.list[i].label !== note && !src.list[i].label.includes(note)) src.list[i].label += ` · ${note}`;
  }
  const full = REPO_OF[id];
  refs.repo = src.add(`https://api.github.com/repos/${full}`, "", { label: REPO_REF_LABEL });
  let story = STORY_OVERRIDE[id] ?? r.story;
  // review round 3: „Der große Bruder von Oilbert.“ was unsourced (the two only share the VW bus)
  if (id === "bulli-drive") story = `${r.story} Wie in Oilbert’s Adventure fährt auch hier ein VW-Bus.`;
  const out = { id, story: paragraphs(story) };
  const hf = HIGHLIGHT_FILTER[id];
  out.highlights = hf ? r.highlights.filter(hf) : [...r.highlights];
  out.stack = [...r.stack];
  if (prev?.languages) out.languages = prev.languages;
  if (Number.isFinite(prev?.commits)) out.commits = prev.commits;
  addFacts(out, id, src);
  addMedia(out, id, src);
  if (NOTES[id]) out.note = NOTES[id];
  if (r.contentNote) out.note = r.contentNote;
  out.refs = refs;
  out.sources = src.list;
  return out;
}

function addFacts(out, id, src) {
  const facts = (FACTS[id] ?? []).map((f) => {
    const s = src.index(f.url) >= 0 ? src.index(f.url) : src.add(f.url, "");
    return { key: f.key, label: f.label, value: f.value, source: s };
  });
  if (facts.length) out.facts = facts;
}
function addMedia(out, id, src) {
  const media = (MEDIA[id] ?? []).map(({ url, ...m }) => ({
    ...m,
    source: src.index(url) >= 0 ? src.index(url) : src.add(url, ""),
  }));
  if (media.length) out.media = media;
}

/* ============================================================ films */

const JP = { label: "jupeters.de", url: "https://jupeters.de" };
const LMF_PLAYLIST = "https://www.youtube.com/playlist?list=PLUron51rWgonAUClr3JBHolLHY-KBhoH5";
const ski2023 = persona.relatedVideosNotInPortfolio.find((v) => v.url.endsWith("CLalueWRmLI"));
const FILM_META = {
  "skiing-2026": { series: "ski", location: "Portes du Soleil", aspect: "9:16", stillFocus: 0.62, quote: "Die Welt steht schief diesmal in vertikal.", jp: true },
  "skiing-2024-fun": { series: "ski", location: "Flachau", quote: "Ist in nem Fiebertraum entstanden. Bitte keine Erwatungen [sic] an die Qualität.", jp: true },
  "skiing-2024-epic": { series: "ski", location: "Flachau", quote: "Mal was anders... Community Version kommt noch", jp: true },
  "skiing-2023": { series: "ski", quote: "Grüße gehen raus an den FI-Toaster und die unsichtbaren Backbleche.", jp: true },
  "skiing-2022": { series: "ski", location: "Zillertal", quote: "Hallo Welt", jp: true },
  "skiing-2020": {
    series: "ski",
    location: "Bad Gastein",
    paraphrase: "Von 25 auf 50 Bilder pro Sekunde hochgerechnet, mit Flowframes.",
    jp: true,
  },
  "skiing-2019": { series: "ski", location: "Feldberg", jp: true, playlist: true },
  "sailing-2019": { series: "segeln", location: "IJsselmeer", jp: true, playlist: true },
  "sailing-2022": { series: "segeln", location: "IJsselmeer", jp: true },
  "poolparty-2020": { series: "poolparty", location: "Ramsen", quote: "Aftermovie 2020", jp: true },
  "poolparty-2021": { series: "poolparty", location: "Ramsen", jp: true, playlist: true },
  "bodensee-2020": { series: "bodensee", location: "Bodensee", jp: true },
  infected: { series: "kurzfilm", playlist: true },
  exception: { series: "kurzfilm", playlist: true },
  selantis: { series: "palatina" },
};
function secondsToDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
const films = [];
for (const p of projects.filter((x) => x.groups.includes("film") && FILM_META[x.id])) {
  const meta = FILM_META[p.id];
  const r = p.id === "skiing-2023" ? null : filmById.get(p.id);
  const f = { id: p.id };
  const src = [];
  if (p.id === "skiing-2023") {
    Object.assign(f, {
      youtubeId: "CLalueWRmLI",
      realTitle: ski2023.title,
      uploaded: ski2023.upload,
      duration: ski2023.duration,
    });
    src.push({ label: "YouTube", url: ski2023.url });
  } else if (p.id === "selantis") {
    f.realTitle = "Die Chroniken von Selantis";
    f.uploaded = r.parts[0].upload;
    f.duration = secondsToDuration(r.durationSeconds);
    f.year = 2015;
    f.parts = r.parts.map((part) => ({
      title: part.title.replace(/^Die Chroniken von Selantis - /, ""),
      duration: secondsToDuration(part.durationSeconds),
      uploaded: part.upload,
      url: part.url,
    }));
    f.roles = ["VFX", "Homepage", "Schauspieler", "Hauptrolle Harras (Teil 3)"];
    src.push({ label: "YouTube-Playlist „Selantis“", url: p.link });
    for (const part of r.parts) src.push({ label: `YouTube: ${part.title}`, url: part.url });
    src.push({ label: "Palatina-Films-Website: selantis.html", url: "https://github.com/LoggeL/PalatinaFilms/blob/master/selantis.html" });
    src.push({ label: "Palatina-Films-Website: team.html (Rolle: VFX, Homepage, Schauspieler)", url: "https://github.com/LoggeL/PalatinaFilms/blob/master/team.html" });
  } else {
    const yt = r.sources.find((s) => /youtube\.com\/watch/.test(s));
    f.youtubeId = new URL(yt).searchParams.get("v");
    f.realTitle = r.realTitle;
    f.uploaded = /^\d{4}-\d{2}-\d{2}/.exec(r.uploadDate)[0];
    f.duration = r.duration;
    src.push({ label: "YouTube", url: `https://www.youtube.com/watch?v=${f.youtubeId}` });
  }
  if (meta.series) f.series = meta.series;
  if (meta.location) f.location = meta.location;
  if (meta.aspect) f.aspect = meta.aspect;
  // Presentation only: horizontal focus (0–1) for cropping a landscape YouTube still into a 9:16 gate,
  // chosen by eye so the burned-in title card is not cut mid-word (Skiing2026.webp: the peaks).
  if (Number.isFinite(meta.stillFocus)) f.stillFocus = meta.stillFocus;
  if (meta.quote) f.quote = meta.quote;
  if (meta.paraphrase) f.paraphrase = meta.paraphrase;
  if (meta.jp) {
    f.alsoOn = [clone(JP)];
    src.push({ label: "jupeters.de (Filme der Gruppe)", url: JP.url });
  }
  if (meta.playlist) src.push({ label: "YouTube-Playlist „LMF“", url: LMF_PLAYLIST });
  if (!f.roles) f.roles = [];
  f.sources = src.map((s) => ({ ...s, checkedAt: CHECKED }));
  films.push(f);
}

function buildFilmDetails(id, prev) {
  const film = films.find((f) => f.id === id);
  const src = new Sources();
  for (const s of film.sources) src.add(s.url, "", { label: s.label });
  const extra = FILM_DETAILS[id] ?? {};
  const out = { id };
  if (extra.story) out.story = extra.story;
  if (extra.funFact) out.funFact = { text: extra.funFact.text, source: src.index(extra.funFact.url) >= 0 ? src.index(extra.funFact.url) : src.add(extra.funFact.url, "") };
  addMedia(out, id, src);
  if (NOTES[id]) out.note = NOTES[id];
  out.refs = { video: 0 };
  out.sources = src.list;
  return out;
}

/* ============================================================ excluded projects in details */

/**
 * Repo/Pages slugs of the excluded projects' repos (docs/decisions.json → excludedRepos). Sources in
 * other projects' details that point there are dropped. The excluded projects themselves carry no
 * config in this script: nothing here can bring them back if the exclusion list changes.
 */
const EXCLUDED_SLUGS = (decisions.excludedRepos ?? []).map((full) => full.split("/")[1]).filter(Boolean);
const excludedUrl = (url = "") =>
  EXCLUDED_SLUGS.some((slug) => new RegExp(`(github\\.com/LoggeL|loggel\\.github\\.io)/${slug}(/|$|#|\\?)`, "i").test(url));
const DETAIL_TEXT = {
  "theater-website": {
    // the note is about Rampenlicht, so its mark points at that repo (not the next-theater README)
    funFactSource: "https://github.com/LoggeL/rampenlicht",
    funFact:
      "Rund ums Theater sind weitere Spielereien entstanden, alle als öffentliche Repos, zum Beispiel „Rampenlicht“ (ein Online-Kartenspiel mit den echten Theatermitgliedern als Karten) und eine Jubiläums-Slideshow.",
  },
};
/** Drops sources that point at excluded projects and remaps every numeric `source` index. */
function scrubExcluded(id, det) {
  const text = DETAIL_TEXT[id];
  if (text?.funFact && det.funFact) det.funFact.text = text.funFact;
  if (text?.funFactSource && det.funFact) {
    const i = (det.sources ?? []).findIndex((s) => s.url === text.funFactSource);
    if (i < 0) throw new Error(`${id}: funFact source ${text.funFactSource} not among the sources`);
    det.funFact.source = i; // remapped below with every other index
  }
  if (!det.sources?.length) return;
  const map = new Map();
  const kept = [];
  det.sources.forEach((src, i) => {
    if (excludedUrl(src.url)) return;
    map.set(i, kept.length);
    kept.push(src);
  });
  if (kept.length === det.sources.length) return;
  const walk = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        const item = node[i];
        if (item && typeof item === "object" && typeof item.source === "number" && !map.has(item.source)) node.splice(i, 1);
        else walk(item);
      }
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        if (k === "sources") continue;
        if (k === "refs" && v && typeof v === "object") {
          for (const [rk, rv] of Object.entries(v)) {
            if (typeof rv !== "number") continue;
            if (map.has(rv)) v[rk] = map.get(rv);
            else delete v[rk];
          }
          continue;
        }
        if (k === "source" && typeof v === "number") {
          if (map.has(v)) node[k] = map.get(v);
          else delete node[k];
        } else walk(v);
      }
    }
  };
  walk(det);
  det.sources = kept;
  if (det.relatedRepos) det.relatedRepos = det.relatedRepos.filter((r) => !excludedUrl(`https://github.com/${r.fullName}`));
}

/* ============================================================ write details */

await mkdir(at("data/details/"), { recursive: true });
const detailsWritten = [];
for (const p of projects) {
  const file = `data/details/${p.id}.json`;
  const prev = (await exists(file)) ? await readJson(file) : null;
  let det;
  if (deepById.has(p.id)) det = buildDeepDetails(p.id, prev);
  else if (proposedById.has(p.id)) det = buildNewDetails(p.id, p, prev);
  else if (films.some((f) => f.id === p.id)) det = buildFilmDetails(p.id, prev);
  else throw new Error(`No research for ${p.id}`);
  if (!det.sources.length) throw new Error(`${p.id}: refusing details without a source`);
  if (det.story && !det.story.length) delete det.story;
  scrubExcluded(p.id, det);
  await writeFile(at(file), JSON.stringify(polish(file, det), null, 2) + "\n");
  detailsWritten.push(p.id);
}
// stale details files (projects that left the order) are removed from the index, not deleted
const stale = (await readdir(at("data/details/"))).filter((f) => f.endsWith(".json") && !detailsWritten.includes(f.slice(0, -5)));
if (stale.length) console.warn(`Stale details files (no project): ${stale.join(", ")}`);

/* ============================================================ projects.json */

const KEY_ORDER = [
  "id", "title", "category", "description", "summary", "link", "linkLabel", "tags", "groups",
  "image", "imageAlt", "art", "artTitle", "source", "isNew", "archived", "year", "yearLabel",
  "repo", "live", "probe", "contentNote", "details", "related",
];
const sortKeys = (o) => Object.fromEntries(Object.keys(o).sort((a, b) => KEY_ORDER.indexOf(a) - KEY_ORDER.indexOf(b)).map((k) => [k, o[k]]));
const ordered = projects.map(sortKeys);
await writeFile(at("data/projects.json"), stringifyProjects(polish("data/projects.json", ordered)));

/* ============================================================ films.json */

await writeFile(at("data/films.json"), JSON.stringify(films, null, 2) + "\n");

/* ============================================================ milestones.json */

const yt = (id) => ({ label: "YouTube", url: `https://www.youtube.com/watch?v=${id}` });
const gh = (full, label) => ({ label: label ?? `Repo ${full}`, url: `https://github.com/${full}` });
const milestones = [
  { date: "2014-11-22", precision: "day", kind: "film", text: "Mein erstes Video: „AE Test“, sieben Sekunden After Effects.", sources: [yt("wHEcSFBkM0s")] },
  {
    date: "2015",
    precision: "year",
    kind: "film",
    text: "Selantis Teil 1 wird gedreht. Palatina Films entsteht dafür.",
    sources: [{ label: "Palatina-Films-Website: selantis.html", url: "https://github.com/LoggeL/PalatinaFilms/blob/master/selantis.html" }],
  },
  { date: "2015-04-15", precision: "day", kind: "code", text: "GitHub-Account angelegt.", sources: [{ label: "GitHub API users/LoggeL", url: "https://api.github.com/users/LoggeL" }] },
  {
    date: "2017-03-29",
    precision: "day",
    kind: "film",
    text: "Selantis Teil 1 geht auf YouTube, Teil 2 am Tag danach.",
    sources: [{ label: "YouTube-Playlist „Selantis“", url: "https://www.youtube.com/playlist?list=PLUron51rWgon7UQuXYib-eS6MZtTybpvw" }],
  },
  { date: "2017-07-12", precision: "day", kind: "code", text: "Erstes öffentliches Repo: BetterDiscordThemes.", sources: [gh("LoggeL/BetterDiscordThemes")] },
  { date: "2018-06-15", precision: "day", kind: "web", text: "Die Palatina-Films-Website, meine erste richtige Website.", sources: [gh("LoggeL/PalatinaFilms")], projectId: "palatina-films-website" },
  { date: "2019-02-19", precision: "day", kind: "film", text: "Feldberg 2019, der erste Ski-Aftermovie in meiner LMF-Playlist.", sources: [yt("-VTPliFOTA0"), { label: "YouTube-Playlist „LMF“", url: LMF_PLAYLIST }], projectId: "skiing-2019" },
  {
    date: "2020-03-22",
    precision: "day",
    kind: "film",
    text: "Selantis Teil 3. Meine erste Hauptrolle: Harras.",
    sources: [yt("c9oV3Lh2Lyw"), { label: "Palatina-Films-Website: team.html", url: "https://github.com/LoggeL/PalatinaFilms/blob/master/team.html" }],
    projectId: "selantis",
  },
  {
    date: "2020-08-27",
    precision: "day",
    kind: "film",
    text: "Der Kanaltrailer fürs Kolpingtheater, „Produziert von LMF“. Am selben Tag lege ich das Repo dieser Seite an.",
    sources: [yt("hlvHRI5d3qc"), gh("LoggeL/LMF")],
  },
  {
    date: "2020-09-24",
    precision: "day",
    kind: "galerie",
    text: "Die erste von {gallery.nights} Nächten mit der Handykamera. Die Galerie baue ich parallel.",
    sources: [
      { label: "Galerie im Repo (Dateinamen der Fotos)", url: "https://github.com/LoggeL/LMF/tree/master/gallery" },
      { label: "Erstes Galerie-Commit", url: "https://github.com/LoggeL/LMF/commit/52c7a825bafb72e907aa208f7f4b54297e94434b" },
    ],
  },
  {
    date: "2020-09-27",
    precision: "day",
    kind: "galerie",
    text: "Commit in der Galerie: „im getting tired of this“.",
    sources: [{ label: "Commit 1f3440a", url: "https://github.com/LoggeL/LMF/commit/1f3440a3f44f81a58e0e9fd967f0bb447e9ed0df" }],
  },
  { date: "2020-12-05", precision: "day", kind: "film", text: "Bad Gastein 2020, mit Flowframes von 25 auf 50 Bilder pro Sekunde gerechnet.", sources: [yt("KYahVktrq_I")], projectId: "skiing-2020" },
  { date: "2021-01-25", precision: "day", kind: "film", text: "Den Aftermovie zu „Der Kristall der Träume“ entruckelt und auf 60 fps gebracht.", sources: [yt("YOi_lhZ7eJI")] },
  { date: "2021-07-05", precision: "day", kind: "code", text: "kolpingCore, mein erstes Backend fürs Theater.", sources: [gh("LoggeL/kolpingCore")] },
  { date: "2022-12-27", precision: "day", kind: "film", text: "Kurzfilm „Exception“.", sources: [yt("uhlAo1chnlM")], projectId: "exception" },
  { date: "2023-12-29", precision: "day", kind: "film", text: "Kurzfilm „Infected“, 12:22.", sources: [yt("6iNdfsbZWHs")], projectId: "infected" },
  { date: "2024-10-21", precision: "day", kind: "code", text: "MelodAI.", sources: [gh("LoggeL/MelodAI")], projectId: "melodai" },
  {
    // one time zone (German local time): BeatGuessr created 2025-12-24T23:46:35Z = 25.12. 00:46 Uhr,
    // coop-sudoku: oldest commit 51b84d5 „Initial commit: Coop Sudoku by LMF“ authored/committed
    // 2025-12-25T01:37:21Z = 02:37 Uhr (the repo itself was created 01:38:07Z; review round 3)
    date: "2025-12-25",
    precision: "day",
    kind: "code",
    text: "Weihnachtsnacht: Kurz nach Mitternacht (00:46 Uhr) lege ich BeatGuessr an, um 02:37 Uhr kommt das erste Commit von Coop Sudoku.",
    sources: [gh("LoggeL/BeatGuessr"), gh("LoggeL/coop-sudoku")],
  },
  {
    date: "2026",
    precision: "year",
    kind: "life",
    text: "„Creepshow“: auf der Bühne als Bote / Diener, dahinter die Website.",
    sources: [{ label: "Teamseite kolpingtheater-ramsen.de", url: "https://kolpingtheater-ramsen.de/team" }],
    projectId: "theater-website",
  },
  {
    date: "2026-07-15",
    precision: "day",
    kind: "web",
    text: "Drei ShareX-Konzepte in {sharex.seconds} Sekunden angelegt.",
    sources: [gh("LoggeL/sharex-capture-engine"), gh("LoggeL/sharex-win98"), gh("LoggeL/sharex-afterimage-lab")],
  },
].map((m) => ({ ...m, sources: m.sources.map((s) => ({ ...s, checkedAt: CHECKED })) }));
await writeFile(at("data/milestones.json"), JSON.stringify(polish("data/milestones.json", milestones), null, 2) + "\n");

/* ============================================================ chapters.json */

const chapters = [
  { n: "I", alloy: "web", anchor: "theater-website", probe: "theater-saalplan", universe: true },
  { n: "II", alloy: "games", anchor: "bomberman-web", probe: "bomberman-chain" },
  { n: "III", alloy: "ai", anchor: "melodai", probe: "melodai-mixer", more: ["learn-ai", "transcripator", "codex-quota-widget"] },
  { n: "IV", alloy: "film", series: "ski", more: ["selantis", "infected", "exception", "poolparty-2021", "sailing-2022", "bodensee-2020"] },
];
await writeFile(at("data/chapters.json"), JSON.stringify(chapters, null, 2) + "\n");

/* ============================================================ universe.json */

const universe = {
  nodes: [
    { label: "Website", kind: "web", year: 2025, projectId: "theater-website", text: "Die aktuelle Theaterseite: Programm, Chronik, Galerien und Buchung im Saalplan mit QR-Ticket, Kalendereintrag und Google-Wallet-Ticket.", url: "https://github.com/Kolpingtheater-Ramsen/next-theater" },
    { label: "Vorgänger-Website", kind: "web", year: 2020, text: "Schon 2020 stand die Theaterseite in meinem ersten Portfolio unter „Websites“.", url: "https://github.com/LoggeL/LMF/blob/master/index.old.html" },
    { label: "kolpingCore", kind: "werkzeug", year: 2021, text: "Mein erstes Backend fürs Theater.", url: "https://github.com/LoggeL/kolpingCore" },
    { label: "TicketTheater", kind: "werkzeug", year: 2024, text: "Ein kleines Ticketsystem mit Captcha und Bestätigungsmail, der Vorgänger der heutigen Buchung.", url: "https://github.com/LoggeL/TicketTheater" },
    { label: "Skript", kind: "werkzeug", year: 2026, text: "Ein interaktives Drehbuch-System für die Proben, als installierbare Web-App.", url: "https://github.com/Kolpingtheater-Ramsen/Skript" },
    { label: "CyberScreen", kind: "werkzeug", year: 2024, text: "Die Videozuspielung für das Stück „Nexus“.", url: "https://github.com/Kolpingtheater-Ramsen/CyberScreen" },
    { label: "TheaterApp", kind: "werkzeug", year: 2026, text: "Eine Flutter-App mit Terminen, Rollen, Drehbuchleser und Push-Benachrichtigungen.", url: "https://github.com/LoggeL/TheaterApp" },
    { label: "Creepshow-Slideshow", kind: "werkzeug", year: 2026, text: "Eine kinematografische Jubiläums-Slideshow, als eigenständige HTML-Datei.", url: "https://github.com/LoggeL/theater-slideshow" },
    { label: "Rampenlicht", kind: "spiel", year: 2026, text: "Ein Online-Kartenspiel mit den Theatermitgliedern als Karten.", url: "https://github.com/LoggeL/rampenlicht" },
    { label: "Kanaltrailer", kind: "film", year: 2020, text: "Der Kanaltrailer des Theaters. In der Beschreibung steht: „Produziert von LMF“.", url: "https://www.youtube.com/watch?v=hlvHRI5d3qc" },
    { label: "Kristall der Träume, restauriert", kind: "film", year: 2021, text: "Den Aftermovie zu „Der Kristall der Träume“ habe ich entruckelt und auf 60 fps gebracht.", url: "https://www.youtube.com/watch?v=YOi_lhZ7eJI" },
  ],
};
// an array of nodes (the Data contract in main.js types `universe` as Array); every node carries its source url
universe.nodes = universe.nodes.filter((n) => !n.projectId || notExcluded(n.projectId));
await writeFile(at("data/universe.json"), JSON.stringify(universe.nodes, null, 2) + "\n");

/* ============================================================ partners.json */

const partners = await readJson("data/partners.json");
const PARTNER_PATCH = {
  gummibaerenbande: {
    // film-network-persona.json: the invite discord.gg/K7Tjtfq was created by the account „logge.top“
    description: "Eine deutschsprachige Gaming-Community auf Discord. Der Einladungslink hier stammt von meinem Account.",
    sources: [{ label: "Discord-Einladung (Invite-API)", url: "https://discord.com/api/v9/invites/K7Tjtfq?with_counts=true" }],
  },
  kolpingtheater: {
    place: "Ramsen",
    // one game left after the owner's exclusions (Rampenlicht, universe.json kind „spiel“); validate.mjs rule 8 checks it
    description: "Theatergruppe in Ramsen. Website, Werkzeuge, ein Kartenspiel und 2026 eine Rolle auf der Bühne.",
    sources: [
      { label: "Teamseite kolpingtheater-ramsen.de", url: "https://kolpingtheater-ramsen.de/team" },
      { label: "GitHub-Organisation Kolpingtheater-Ramsen", url: "https://github.com/Kolpingtheater-Ramsen" },
    ],
  },
  "palatina-films": {
    link: "https://loggel.github.io/PalatinaFilms/",
    description: "Die Filmgruppe, für die ich VFX gemacht, die Website gebaut und mitgespielt habe.",
    sources: [
      { label: "Palatina-Films-Website: team.html", url: "https://github.com/LoggeL/PalatinaFilms/blob/master/team.html" },
      { label: "Archiv der Website", url: "https://loggel.github.io/PalatinaFilms/" },
    ],
  },
  jp: {
    place: "Ramsen",
    sources: [
      { label: "jpCore-README: „the annual event in Ramsen, Germany“", url: "https://github.com/LoggeL/jpCore" },
      { label: "jupeters.de", url: "https://jupeters.de" },
    ],
  },
  cfw: {
    description: "Ein YouTube-Kanal über Ausflüge, Reisen und Wanderungen. Für CFW habe ich ein Karteikartensystem gebaut.",
    link: "https://www.youtube.com/channel/UClU8mK17SZwqCLDES0olV1w",
    sources: [
      { label: "YouTube-Kanal CFW", url: "https://www.youtube.com/channel/UClU8mK17SZwqCLDES0olV1w" },
      { label: "Repo LoggeL/kartei: „Karteikartensystem für CFW“", url: "https://github.com/LoggeL/kartei" },
    ],
  },
  xenon: {
    // docs/research/film-network-persona.json: xenon-support-bot, „grounded in the official Xenon documentation“;
    // an official use by Xenon is not documented, so the card says it is Logge's own, unofficial bot.
    description: "Mein eigenes Projekt: ein KI-Support-Bot, der nur aus der offiziellen Xenon-Doku antwortet. Kein offizieller Xenon-Bot.",
    link: "https://github.com/LoggeL/xenon-support-bot",
    sources: [
      { label: "xenon.bot", url: "https://xenon.bot" },
      { label: "Repo LoggeL/xenon-support-bot", url: "https://github.com/LoggeL/xenon-support-bot" },
    ],
  },
};
for (const p of partners) {
  const patch = PARTNER_PATCH[p.id];
  if (!patch) continue;
  applyPatch(p, patch);
  if (p.sources) p.sources = p.sources.map((s) => ({ ...s, checkedAt: CHECKED }));
}
await writeFile(at("data/partners.json"), JSON.stringify(polish("data/partners.json", partners), null, 2) + "\n");
assertPolished();

console.log(
  `Imported ${projects.length} projects, ${detailsWritten.length} details, ${films.length} films, ${milestones.length} milestones, ${universe.nodes.length} universe nodes, ${partners.length} partners.`,
);
