#!/usr/bin/env node
/**
 * npm run check — every rule from spec §3.15, plus the budget and language checks WP1 owns.
 *
 * Output: one line per failed rule („✗“), warnings („!“) and skipped rules („–“, a dependency
 * of another work package does not exist yet). Exit code 1 if any rule failed.
 *
 * Flags: --quiet (only failures and the summary)
 */
import { readFile, readdir, stat, access } from "node:fs/promises";
import { readdirSync, existsSync } from "node:fs";
import { dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ART_STYLES, GROUPS, glowOf, reposByYear, yearOf, youtubeId, normalize, dayValue,
} from "../js/lib/derive.js";
import { loadDataFs, ROOT } from "./lib/node-data.mjs";
import { prerenderHtml } from "./lib/prerender-core.mjs";
import { hasGps } from "./lib/exif.mjs";

const quiet = process.argv.includes("--quiet");
const at = (p) => new URL(p, ROOT);
const path = (p) => fileURLToPath(at(p));
const readText = (p) => readFile(at(p), "utf8");
const readJson = async (p) => JSON.parse(await readText(p));
const exists = (p) => access(at(p)).then(() => true, () => false);

const errors = [];
const warnings = [];
const skipped = [];
const passed = [];
function rule(n, title, fn) {
  return { n, title, fn };
}
function fail(n, msg) {
  errors.push(`✗ [${n}] ${msg}`);
}
function warn(n, msg) {
  warnings.push(`! [${n}] ${msg}`);
}
function skip(n, msg) {
  skipped.push(`– [${n}] ${msg}`);
}

/** Exact-case file existence (GitHub Pages is case-sensitive; macOS is not). */
function existsExact(rel) {
  const full = path(rel);
  const dir = dirname(full);
  try {
    return readdirSync(dir).includes(basename(full));
  } catch {
    return false;
  }
}
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isIso = (s) => typeof s === "string" && ISO.test(s) && !Number.isNaN(dayValue(s));
const httpsUrl = (u) => {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
};

/* ------------------------------------------------------------------ load */

const data = await loadDataFs();
const decisions = (await exists("docs/decisions.json")) ? await readJson("docs/decisions.json") : {};
const order = await readJson("scripts/order.json");
const allowlist = (await readJson("scripts/repo-allowlist.json")).repos;
const projects = data.projects ?? [];
const asOf = data.snapshot?.asOf;
const asOfYear = yearOf(asOf);
const byId = data.byId;
const detailsFiles = (await readdir(at("data/details/"))).filter((f) => f.endsWith(".json"));
const details = new Map();
for (const f of detailsFiles) details.set(f.slice(0, -5), await readJson(`data/details/${f}`));
const indexHtml = await readText("index.html");
const films = (await exists("data/films.json")) ? await readJson("data/films.json") : null;
/** Projects the redesign added (research proposals, Serotonin only when shown) + skiing-2023. */
const ADDED_PROJECTS = [
  ...((await exists("docs/research/new-work.json")) ? (await readJson("docs/research/new-work.json")).proposedProjects ?? [] : [])
    .map((p) => p.id)
    .filter((id) => id !== "serotonin" || decisions.serotonin === "show"),
  "skiing-2023",
];

/** _config.yml → exclude: paths kept in the repo but left out of the Pages artifact. */
const PAGES_EXCLUDED = ((await exists("_config.yml")) ? await readText("_config.yml") : "")
  .split("\n")
  .map((l) => l.match(/^\s*-\s*(\S+)/)?.[1])
  .filter(Boolean);
/** Jekyll 3 semantics: a pattern excludes a path it equals or prefixes (directories end in „/“). */
const pagesExcluded = (rel) => PAGES_EXCLUDED.some((p) => rel === p || rel.startsWith(p.endsWith("/") ? p : `${p}/`));

let probeIds = null;
if (await exists("js/probes/index.js")) {
  try {
    probeIds = new Set((await import(at("js/probes/index.js").href)).PROBE_IDS ?? []);
  } catch (e) {
    probeIds = null;
    warn(4, `js/probes/index.js could not be imported in Node: ${e.message}`);
  }
}

/* ------------------------------------------------------------------ rules */

const RULES = [
  rule(0, "data files load", () => {
    for (const k of data.failed) fail(0, `data file for „${k}“ missing or malformed`);
    if (!asOf || !isIso(asOf)) fail(0, "snapshot.asOf missing or not ISO");
  }),

  rule(1, "projects: required fields, groups, ids", () => {
    const ids = new Set();
    for (const p of projects) {
      for (const key of ["id", "title", "category", "description", "link"])
        if (typeof p[key] !== "string" || !p[key].trim()) fail(1, `${p.id}: missing ${key}`);
      if (!Array.isArray(p.tags)) fail(1, `${p.id}: tags must be an array`);
      if (!Array.isArray(p.groups) || !p.groups.length || !p.groups.every((g) => GROUPS.includes(g)))
        fail(1, `${p.id}: invalid groups ${JSON.stringify(p.groups)}`);
      if (!/^[a-z0-9-]+$/.test(p.id)) fail(1, `${p.id}: id must match /^[a-z0-9-]+$/`);
      if (ids.has(p.id)) fail(1, `duplicate id ${p.id}`);
      ids.add(p.id);
      if (p.description && p.description.length > 320) fail(1, `${p.id}: description longer than 320 characters`);
    }
  }),

  rule(2, "projects: https links, exact-case images or art", () => {
    for (const p of projects) {
      if (!httpsUrl(p.link)) fail(2, `${p.id}: link must be https`);
      if (p.source && !httpsUrl(p.source)) fail(2, `${p.id}: source must be https`);
      if (p.image) {
        if (!existsExact(p.image)) fail(2, `${p.id}: image ${p.image} missing (exact case)`);
      } else if (!ART_STYLES.includes(p.art)) fail(2, `${p.id}: neither image nor a valid art style`);
    }
  }),

  rule(3, "projects: year, repo dates, live status", () => {
    for (const p of projects) {
      if (p.year !== undefined && (!Number.isInteger(p.year) || p.year < 2014 || p.year > asOfYear))
        fail(3, `${p.id}: year ${p.year} outside 2014–${asOfYear}`);
      for (const k of ["createdAt", "pushedAt"]) {
        const v = p.repo?.[k];
        if (v === undefined) continue;
        if (!isIso(v)) fail(3, `${p.id}: repo.${k} is not an ISO date`);
        else if (v > asOf) fail(3, `${p.id}: repo.${k} ${v} is after asOf ${asOf}`);
      }
      if (p.live && !["live", "repo-only", "offline"].includes(p.live.status)) fail(3, `${p.id}: live.status ${p.live.status}`);
      if (p.live && !isIso(p.live.checkedAt)) fail(3, `${p.id}: live.checkedAt not ISO`);
      if (p.repo?.private && p.source) fail(3, `${p.id}: private repo must not expose a source link`);
    }
  }),

  rule(4, "probes exist in js/probes/index.js", () => {
    const used = projects.filter((p) => p.probe).map((p) => [p.id, p.probe]);
    const chapterProbes = (data.chapters ?? []).filter((c) => c.probe).map((c) => [`chapter ${c.n}`, c.probe]);
    if (!probeIds) {
      skip(4, `js/probes/index.js (WP4) not available yet; ${used.length + chapterProbes.length} probe references unchecked`);
      return;
    }
    for (const [who, probe] of [...used, ...chapterProbes]) if (!probeIds.has(probe)) fail(4, `${who}: probe „${probe}“ not in PROBE_IDS`);
  }),

  rule(5, "related ids, details flag ⇔ file", () => {
    for (const p of projects) {
      for (const r of p.related ?? []) if (!byId.has(r)) fail(5, `${p.id}: related id ${r} does not exist`);
      const has = details.has(p.id);
      if (Boolean(p.details) !== has) fail(5, `${p.id}: details flag ${Boolean(p.details)} but file ${has ? "exists" : "missing"}`);
    }
    for (const id of details.keys()) if (!byId.has(id)) fail(5, `data/details/${id}.json has no project`);
  }),

  rule(6, "count and order match scripts/order.json", () => {
    if (projects.length !== order.length) fail(6, `projects.json has ${projects.length} entries, order.json ${order.length}`);
    const ids = projects.map((p) => p.id);
    const firstDiff = ids.findIndex((id, i) => id !== order[i]);
    if (firstDiff !== -1) fail(6, `order differs at position ${firstDiff + 1}: ${ids[firstDiff]} ≠ ${order[firstDiff]}`);
    const size = Buffer.byteLength(JSON.stringify(projects));
    return size;
  }),

  rule(7, "regression denylist", async () => {
    const g = (id) => byId.get(id);
    const text = (p) => (p ? JSON.stringify(p) : "");
    if (/Offline-Modus/.test(text(g("voll-o-meter")))) fail(7, "voll-o-meter mentions Offline-Modus");
    if (/Strava-Anbindung|KI-gestützt/.test(text(g("marathon-trainer")))) fail(7, "marathon-trainer: Strava-Anbindung / KI-gestützt");
    if (/Express/.test(text(g("poolparty-website")))) fail(7, "poolparty-website mentions Express");
    if (g("geo-game")?.tags.includes("vanilla-js")) fail(7, "geo-game tagged vanilla-js");
    if (g("transcripator")?.tags.includes("nextjs")) fail(7, "transcripator tagged nextjs");
    for (const p of projects)
      if ((/^sailing-/.test(p.id) || p.id === "theater-website") && p.groups.includes("ai")) fail(7, `${p.id} has the ai group`);
    const links = projects.flatMap((p) => [p.link, p.source].filter(Boolean));
    for (const l of links) {
      if (/setlist\.logge\.top|palatina-films\.de/.test(l)) fail(7, `dead link ${l}`);
      if (/watch\?v=VTPliFOTA0/.test(l)) fail(7, `broken Feldberg link ${l}`);
    }
    const partnerLinks = (data.partners ?? []).map((p) => p.link);
    for (const l of partnerLinks) if (/palatina-films\.de/.test(l)) fail(7, `dead partner link ${l}`);
    if (/Züge und Boote/.test(JSON.stringify(data.partners ?? []))) fail(7, "partners: CFW still „Züge und Boote“");
    // research typo „660 Songs aus 65 Jahren“ (1960–2025 are 66): the number must match the song data
    if (await exists("data/probes/beatguessr.meta.json")) {
      const years = (await readJson("data/probes/beatguessr.meta.json")).counts?.years;
      const blob = JSON.stringify(details.get("beatguessr") ?? {}) + text(g("beatguessr"));
      for (const m of blob.matchAll(/aus (\d+) (Jahren|Jahrgängen)/g))
        if (Number(m[1]) !== years) fail(7, `beatguessr: „${m[0]}“, but beatguessr.meta.json counts ${years} Jahrgänge`);
    }
    // one time zone per sentence (review round 2: „kurz vor Mitternacht (UTC) … 02:38 Uhr deutscher Zeit“)
    for (const m of data.milestones ?? []) if (/\bUTC\b/.test(m.text) && /deutscher Zeit/.test(m.text)) fail(7, `milestone ${m.date} mixes UTC and German time`);
    // the Werkbank shows project.image as its main, informative picture: it needs a German alt text
    for (const p of projects) if (p.image && !(typeof p.imageAlt === "string" && p.imageAlt.trim())) fail(7, `${p.id}: image without imageAlt`);
    // Spec: the 15 added projects + skiing-2023 are new; minus the owner's exclusions (28.09.2026) that
    // leaves 6. Counted from the research list so a change to excludedProjects keeps this honest.
    const excludedSet = new Set(decisions.excludedProjects ?? []);
    const expectedNew = ADDED_PROJECTS.filter((id) => !excludedSet.has(id));
    const isNew = projects.filter((p) => p.isNew).map((p) => p.id);
    const missingNew = expectedNew.filter((id) => byId.has(id) && !isNew.includes(id));
    const extraNew = isNew.filter((id) => !expectedNew.includes(id));
    if (missingNew.length || extraNew.length)
      warn(7, `isNew on ${isNew.length} projects, expected ${expectedNew.length} (the added projects + skiing-2023 without the owner's exclusions)${missingNew.length ? `; missing: ${missingNew.join(", ")}` : ""}${extraNew.length ? `; unexpected: ${extraNew.join(", ")}` : ""}`);
  }),

  rule(8, "owner exclusions (docs/decisions.json → excludedProjects)", async () => {
    const excluded = decisions.excludedProjects ?? [];
    if (!excluded.length) return;
    const set = new Set(excluded);
    for (const p of projects) {
      if (set.has(p.id)) fail(8, `project ${p.id} is excluded by the owner`);
      for (const r of p.related ?? []) if (set.has(r)) fail(8, `${p.id}.related → excluded ${r}`);
    }
    for (const id of details.keys()) if (set.has(id)) fail(8, `data/details/${id}.json belongs to an excluded project`);
    for (const c of data.chapters ?? []) for (const id of [c.anchor, ...(c.more ?? [])]) if (set.has(id)) fail(8, `chapter ${c.n} → excluded ${id}`);
    for (const n of data.universe ?? []) if (set.has(n.projectId)) fail(8, `universe node → excluded ${n.projectId}`);
    for (const m of data.milestones ?? []) if (set.has(m.projectId)) fail(8, `milestone → excluded ${m.projectId}`);
    // copy that only fit with the excluded theatre games (Theatermon, Creepshow-RPG): the Kolping
    // partner card may say „Spiele“ only while the universe lists more than one theatre game
    const theatreGames = (data.universe ?? []).filter((n) => n.kind === "spiel").length;
    const kolping = (data.partners ?? []).find((p) => p.id === "kolpingtheater");
    if (kolping && theatreGames <= 1 && /\bSpiele\b/.test(kolping.description ?? ""))
      fail(8, `partners: kolpingtheater says „Spiele“, universe.json has ${theatreGames} theatre game(s)`);
    const pages = [["index.html", indexHtml]];
    for (const f of ["404.html", "gallery/index.html"]) if (await exists(f)) pages.push([f, await readText(f)]);
    for (const [f, html] of pages)
      for (const id of excluded)
        if (html.includes(`#werk/${id}"`) || html.includes(`data-project-id="${id}"`) || html.includes(`data-project-ref="${id}"`)) fail(8, `${f} links excluded ${id}`);
  }),

  rule(9, "privacy denylist", async () => {
    const re = /2:59|3:05|Pace|JGA|Urlaub|Festival|25\.10\./;
    const blob = JSON.stringify(byId.get("marathon-trainer") ?? {}) + JSON.stringify(details.get("marathon-trainer") ?? {});
    const m = re.exec(blob);
    if (m) fail(9, `marathon-trainer contains „${m[0]}“`);
    // The only screenshot of the Marathon Trainer shows race, date, goal time and the training log;
    // text rules cannot see that, so any image or media on this project fails (§3.2, §3.16 #5).
    const marathon = byId.get("marathon-trainer");
    if (marathon?.image) fail(9, `marathon-trainer has an image (${marathon.image}); its screenshots show goal time and race date`);
    if (details.get("marathon-trainer")?.media?.length) fail(9, "marathon-trainer details carry media; its screenshots show goal time and race date");
    if (!decisions.allowPlaceNames) {
      const files = ["index.html", "gallery/index.html", "404.html", ...(await readdir(at("data/"))).filter((f) => f.endsWith(".json")).map((f) => `data/${f}`), ...detailsFiles.map((f) => `data/details/${f}`)];
      // the city is stored base64-encoded so this public file does not name it either
      const city = new RegExp(Buffer.from("S2Fpc2Vyc2xhdXRlcm4=", "base64").toString("utf8"));
      for (const f of files) if ((await exists(f)) && city.test(await readText(f))) fail(9, `${f} names the city of the night walks`);
    }
  }),

  rule(10, "serotonin only with owner approval", () => {
    if (byId.has("serotonin") && decisions.serotonin !== "show") fail(10, "serotonin is listed without docs/decisions.json serotonin: show");
  }),

  rule(11, "details: id, sources, checkedAt", () => {
    for (const [file, d] of details) {
      if (d.id !== file) fail(11, `data/details/${file}.json: id „${d.id}“ ≠ filename`);
      if (!Array.isArray(d.sources) || d.sources.length < 1) {
        fail(11, `${file}: needs ≥ 1 source`);
        continue;
      }
      d.sources.forEach((s, i) => {
        const relOk = typeof s.url === "string" && (s.url === "index.old.html" || s.url.startsWith("gallery/"));
        if (!httpsUrl(s.url) && !relOk) fail(11, `${file}: source ${i} url „${s.url}“ is not https`);
        if (!isIso(s.checkedAt)) fail(11, `${file}: source ${i} checkedAt missing/not ISO`);
        if (typeof s.label !== "string" || !s.label.trim()) fail(11, `${file}: source ${i} has no label`);
      });
    }
  }),

  rule(12, "details: source indices", () => {
    for (const [file, d] of details) {
      const ok = (i) => Number.isInteger(i) && i >= 0 && i < (d.sources?.length ?? 0);
      for (const f of d.facts ?? []) if (!ok(f.source)) fail(12, `${file}: fact „${f.label}“ has invalid source ${f.source}`);
      for (const m of d.media ?? []) if (!ok(m.source)) fail(12, `${file}: media ${m.src} has invalid source ${m.source}`);
      if (d.funFact && !ok(d.funFact.source)) fail(12, `${file}: funFact has invalid source`);
      for (const [k, v] of Object.entries(d.refs ?? {})) if (!ok(v)) fail(12, `${file}: refs.${k} = ${v} invalid`);
    }
  }),

  rule(13, "details: languages, media, story, highlights", () => {
    for (const [file, d] of details) {
      if (d.languages) {
        const sum = Object.values(d.languages).reduce((s, n) => s + n, 0);
        if (sum < 95 || sum > 105) fail(13, `${file}: languages sum to ${sum.toFixed(1)}`);
      }
      for (const m of d.media ?? []) {
        if (!existsExact(m.src)) fail(13, `${file}: media ${m.src} missing (exact case)`);
        if (!m.alt) fail(13, `${file}: media ${m.src} has no alt`);
      }
      if (d.story !== undefined && (!Array.isArray(d.story) || d.story.length < 1 || d.story.length > 4 || d.story.some((s) => typeof s !== "string" || !s.trim())))
        fail(13, `${file}: story must be 1–4 non-empty paragraphs`);
      if (d.highlights !== undefined && (d.highlights.length < 3 || d.highlights.length > 6)) warn(13, `${file}: ${d.highlights.length} highlights (spec 3–6)`);
      if (JSON.stringify(d).length > 6 * 1024) warn(13, `${file}: larger than 6 KB`);
    }
  }),

  rule(14, "films.json", () => {
    if (!films) return fail(14, "data/films.json missing");
    const ids = new Set();
    for (const f of films) {
      const p = byId.get(f.id);
      if (!p || !p.groups.includes("film")) fail(14, `film ${f.id} is not a film project`);
      if (ids.has(f.id)) fail(14, `film ${f.id} listed twice`);
      ids.add(f.id);
      const linkId = p ? youtubeId(p.link) : null;
      if (linkId && !f.youtubeId) fail(14, `${f.id}: project links a video, film has no youtubeId`);
      if (f.youtubeId !== undefined) {
        if (!/^[\w-]{11}$/.test(f.youtubeId)) fail(14, `${f.id}: youtubeId „${f.youtubeId}“ malformed`);
        if (linkId !== f.youtubeId) fail(14, `${f.id}: youtubeId ${f.youtubeId} ≠ link id ${linkId}`);
        if (!isIso(f.uploaded)) fail(14, `${f.id}: uploaded missing/not ISO`);
      }
      if (f.duration !== undefined && !/^\d+:\d\d(:\d\d)?$/.test(f.duration)) fail(14, `${f.id}: duration „${f.duration}“`);
      if (f.uploaded !== undefined && !isIso(f.uploaded)) fail(14, `${f.id}: uploaded not ISO`);
      for (const s of f.sources ?? []) if (!httpsUrl(s.url)) fail(14, `${f.id}: source ${s.url} not https`);
      if (!f.sources?.length) fail(14, `${f.id}: no sources`);
    }
    for (const p of projects) if (p.groups[0] === "film" && !ids.has(p.id)) warn(14, `${p.id}: film project without films.json entry`);
  }),

  rule(15, "milestones, universe, chapters", () => {
    const ms = data.milestones ?? [];
    for (let i = 1; i < ms.length; i++) if (String(ms[i].date) < String(ms[i - 1].date)) fail(15, `milestones not sorted at ${ms[i].date}`);
    for (const m of ms) {
      if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(m.date)) fail(15, `milestone date „${m.date}“`);
      if (!["film", "code", "web", "life", "galerie"].includes(m.kind)) fail(15, `milestone ${m.date}: kind ${m.kind}`);
      if (!(m.sources ?? []).some((s) => httpsUrl(s.url))) fail(15, `milestone ${m.date}: needs an https source`);
      if (m.projectId && !byId.has(m.projectId)) fail(15, `milestone ${m.date}: projectId ${m.projectId} unknown`);
    }
    for (const n of data.universe ?? []) {
      if (!httpsUrl(n.url)) fail(15, `universe node „${n.label}“ needs an https url`);
      if (n.projectId && !byId.has(n.projectId)) fail(15, `universe node „${n.label}“: projectId unknown`);
    }
    for (const c of data.chapters ?? []) {
      if (c.anchor && (!byId.has(c.anchor) || !details.has(c.anchor))) fail(15, `chapter ${c.n}: anchor ${c.anchor} missing or without details`);
      for (const id of c.more ?? []) if (!byId.has(id)) fail(15, `chapter ${c.n}: more id ${id} unknown`);
    }
  }),

  rule(16, "repos.json / snapshot.json", () => {
    const repos = data.repos ?? [];
    if (data.reposAsOf !== asOf) fail(16, `repos.asOf ${data.reposAsOf} ≠ snapshot.asOf ${asOf}`);
    for (const r of repos) {
      if (r.n !== undefined && !Object.prototype.hasOwnProperty.call(allowlist, r.n)) fail(16, `repo name ${r.n} not in allowlist`);
      if (r.id !== undefined && allowlist[r.n] !== r.id) fail(16, `repo ${r.n}: id ${r.id} ≠ allowlist`);
      if (r.id !== undefined && !byId.has(r.id)) fail(16, `repo ${r.n}: project ${r.id} unknown`);
      if ("fork" in r || "f" in r || "private" in r) fail(16, "repos.json must not carry fork/private flags");
      if (!isIso(r.c) || !isIso(r.p)) fail(16, `repo row with bad dates ${JSON.stringify(r)}`);
      if (r.p > asOf) fail(16, `repo ${r.n ?? r.c}: pushed after asOf`);
    }
    const by = reposByYear(repos);
    const sum = Object.values(by).reduce((s, n) => s + n, 0);
    if (sum !== repos.length) fail(16, "reposByYear does not sum to repos.length");
    if (repos.length !== data.snapshot?.github?.ownPublicRepos) fail(16, `repos.length ${repos.length} ≠ snapshot ownPublicRepos ${data.snapshot?.github?.ownPublicRepos}`);
    const snapBy = data.snapshot?.github?.reposByYear ?? {};
    for (const y of new Set([...Object.keys(by), ...Object.keys(snapBy)])) if ((by[y] ?? 0) !== (snapBy[y] ?? 0)) fail(16, `reposByYear[${y}] ${by[y]} ≠ snapshot ${snapBy[y]}`);
  }),

  rule(17, "index.html prerender freshness", async () => {
    const res = await prerenderHtml(indexHtml, data);
    for (const b of res.blocks) {
      if (b.status === "skipped") skip(17, `prerender:${b.name}: ${b.detail}`);
      if (b.status === "error") fail(17, `prerender:${b.name}: ${b.detail}`);
    }
    for (const k of res.binds.unknown) fail(17, `data-bind="${k}" has no binding in lib/derive.js`);
    if (res.html !== indexHtml) fail(17, "index.html is stale. Run npm run prerender");
    if (!res.blocks.length) warn(17, "index.html has no prerender markers");
  }),

  rule(18, "no typed data numbers in index.html copy", () => {
    const text = indexHtml
      .replace(/<head>[\s\S]*?<\/head>/i, " ")
      .replace(/<!--\s*prerender:([\w-]+)\s*-->[\s\S]*?<!--\s*\/prerender:\1\s*-->/g, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<([a-zA-Z][\w-]*)\s[^<>]*\bdata-bind="[^"]*"[^<>]*>[^<]*<\/\1>/g, " ")
      .replace(/<([a-zA-Z][\w-]*)\s[^<>]*\baria-hidden="true"[^<>]*>\s*[\d§ ./]+\s*<\/\1>/g, " ") // decorative section numbers („03“)
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|\s+/g, " ");
    const re = /\b\d+\s+(Projekte|Repos|Fotos|Filme|Nächte)\b/g;
    for (const m of text.matchAll(re)) fail(18, `typed number in copy: „${m[0]}“`);
  }),

  rule(19, "required DOM hooks", () => {
    const ids = ["project-search", "project-count", "projects-container", "load-more", "empty-state", "reset-filters", "werkbank", "close-modal", "modal-title", "modal-link", "menu-toggle", "navigation", "theme-toggle", "motion-toggle", "lager-static"];
    for (const id of ids) if (!new RegExp(`\\bid="${id}"`).test(indexHtml)) fail(19, `#${id} missing`);
    const filters = (indexHtml.match(/\bdata-filter="/g) ?? []).length;
    if (filters !== 5) fail(19, `[data-filter] × ${filters}, expected 5`);
    const pc = /<[^>]*\bid="project-count"[^>]*>/.exec(indexHtml)?.[0] ?? "";
    if (pc && !/role="status"/.test(pc)) fail(19, "#project-count needs role=status");
    if (!/class="[^"]*\bcontact-mail\b/.test(indexHtml)) fail(19, ".contact-mail missing");
  }),

  rule(20, "gallery: 77 links matching images.json", async () => {
    const html = await readText("gallery/index.html");
    const images = data.gallery ?? [];
    const grids = [...html.matchAll(/<div class="photo-grid"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => m[1]).join("");
    const hrefs = [...grids.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1]);
    if (hrefs.length !== 77) fail(20, `gallery has ${hrefs.length} .photo-grid links, expected 77`);
    const names = new Set(images.map((i) => i.name));
    for (const h of hrefs) {
      const n = /([^/]+)\.jpe?g$/i.exec(h)?.[1];
      if (!n || !names.has(n)) fail(20, `gallery link ${h} not in images.json`);
    }
    if (hrefs[0] && hrefs[0] !== "assets/img/large/IMG_20200924_233029.jpg") fail(20, `first gallery href is ${hrefs[0]}`);
  }),

  rule(21, "gallery originals without GPS (after approval)", async () => {
    const dir = "gallery/assets/img/original/";
    const files = (await readdir(at(dir))).filter((f) => /\.jpe?g$/i.test(f));
    let n = 0;
    for (const f of files) if (hasGps(await readFile(at(dir + f)))) n++;
    const unserved = pagesExcluded(dir);
    if (decisions.stripGps === "done") {
      if (n) fail(21, `${n} originals still contain GPS`);
    } else if (!n) return;
    else if (unserved)
      skip(21, `GPS strip pending owner approval: ${n} of ${files.length} originals still carry GPS; not published (_config.yml excludes ${dir}), scripts/strip-gps.mjs is ready, not run`);
    else fail(21, `${n} of ${files.length} originals carry GPS and ${dir} is published. Exclude it in _config.yml until the owner approves scripts/strip-gps.mjs`);
    if (unserved) {
      // nothing live may link a file that is not published
      const live = [indexHtml, await readText("gallery/index.html"), JSON.stringify(data.gallery ?? [])].join("\n");
      if (/img\/original\//.test(live)) fail(21, `${dir} is excluded from Pages but a live page or images.json links it`);
    }
  }),

  rule(22, "fonts", async () => {
    const dir = "assets/fonts/";
    const files = await readdir(at(dir));
    const required = ["InstrumentSerif-Regular.woff2", "InstrumentSerif-Italic.woff2", "Montserrat-var.woff2", "JetBrainsMono-var.woff2"];
    for (const f of required) if (!files.includes(f)) fail(22, `${dir}${f} missing`);
    let total = 0;
    for (const f of required.filter((f) => files.includes(f))) total += (await stat(at(dir + f))).size;
    if (total > 125 * 1024) fail(22, `fonts total ${(total / 1024).toFixed(1)} KB > 125 KB`);
    for (const lic of ["OFL-InstrumentSerif.txt", "OFL-Montserrat.txt", "OFL-JetBrainsMono.txt"]) if (!files.includes(lic)) fail(22, `${dir}${lic} missing`);
    const extra = files.filter((f) => f.endsWith(".woff2") && !required.includes(f));
    if (extra.length) {
      // _config.yml → exclude: files kept in the repo but left out of the Pages artifact
      const pagesExcluded = new Set(
        ((await exists("_config.yml")) ? await readText("_config.yml") : "")
          .split("\n")
          .map((l) => l.match(/^\s*-\s*(\S+)/)?.[1])
          .filter(Boolean),
      );
      const live = ["index.html", "404.html", "gallery/index.html", "gallery/css/gallery.css", "css/tokens.css", "css/base.css", "css/lmf.css", "css/lmf.min.css"];
      const sources = await Promise.all(live.map(async (f) => [f, (await exists(f)) ? await readText(f) : ""]));
      for (const f of extra) {
        const users = sources.filter(([, s]) => s.includes(f)).map(([name]) => name);
        if (!users.length) fail(22, `${dir}${f}: more than the 4 font files and nothing references it. Delete it`);
        else if (pagesExcluded.has(dir + f) && users.every((u) => pagesExcluded.has(u)))
          skip(22, `legacy font ${f} (used only by ${users.join(", ")}) is excluded from the Pages artifact via _config.yml; delete together with that CSS once the lead approves`);
        else warn(22, `legacy font ${f} is still referenced by ${users.join(", ")}; delete it once nothing uses it (spec §4.1)`);
      }
    }
  }),

  rule(23, "asset cleanup", async () => {
    if (existsSync(path("assets/img/avifenc.exe"))) warn(23, "assets/img/avifenc.exe (10 MB) still present. Spec §8 wants it deleted; kept on the owner's instruction, delete manually");
    const imgs = await readdir(at("assets/img/"));
    const corpus = [indexHtml, JSON.stringify(projects), JSON.stringify([...details.values()])];
    for (const f of ["css/lmf.css", "css/base.css", "css/tokens.css", "404.html", "gallery/index.html", "site.webmanifest"]) if (await exists(f)) corpus.push(await readText(f));
    // runtime modules load some images themselves (e.g. js/gl/esse.js → logo-sdf.png)
    for (const f of await readdir(at("js/"), { recursive: true })) if (f.endsWith(".js")) corpus.push(await readText(`js/${f}`));
    const blob = corpus.join("\n");
    // a file _config.yml keeps out of the artifact must not be referenced (it would 404 once deployed)
    for (const f of imgs) if (pagesExcluded(`assets/img/${f}`) && f !== "avifenc.exe" && blob.includes(`img/${f}`)) fail(23, `assets/img/${f} is excluded from Pages but still referenced`);
    const unreferenced = imgs.filter((f) => /\.(png|jpe?g)$/i.test(f) && !blob.includes(f) && !pagesExcluded(`assets/img/${f}`));
    if (unreferenced.length) warn(23, `unreferenced png/jpg originals in assets/img: ${unreferenced.join(", ")}`);
  }),

  rule(24, "pure search checks", async () => {
    let filterProjects;
    let from;
    if (await exists("js/lib/search.js")) {
      try {
        filterProjects = (await import(at("js/lib/search.js").href)).filterProjects;
        from = "js/lib/search.js";
      } catch (e) {
        warn(24, `js/lib/search.js not importable in Node: ${e.message}`);
      }
    }
    if (!filterProjects) {
      filterProjects = (await import(at("js/projects.js").href)).filterProjects;
      from = "js/projects.js";
    }
    const ids = (arr) => arr.map((p) => p.id);
    const checks = [
      [() => filterProjects(projects, "film", "Infected").length === 1, "film + „Infected“ → 1"],
      [() => filterProjects(projects, "games", "MelodAI").length === 0, "games + „MelodAI“ → 0"],
      [() => filterProjects(projects, "all", "  BOMBERMAN  ")[0]?.id === "bomberman-web", "„  BOMBERMAN  “ → bomberman-web first"],
      [() => ids(filterProjects(projects, "all", "kolping")).includes("theater-website"), "„kolping“ finds theater-website"],
      [() => ids(filterProjects(projects, "all", "oilberts")).includes("oilbert"), "„oilberts“ finds oilbert"],
    ];
    for (const [fn, label] of checks) {
      let ok = false;
      try {
        ok = fn();
      } catch (e) {
        label += ` (threw ${e.message})`;
      }
      if (!ok) {
        if (from === "js/projects.js" && /oilberts/.test(label)) warn(24, `${label}: fails with the legacy filter in ${from}; WP2's lib/search.js (normalize) fixes it`);
        else fail(24, `${label} (${from})`);
      }
    }
    // the shared normalize() makes the umlaut/apostrophe folding work on both sides
    if (!normalize("Oilbert’s Adventure").includes("oilberts")) fail(24, "normalize() does not fold apostrophes");
    if (normalize("Übersee") !== normalize("Uebersee")) fail(24, "normalize() does not fold ue/ü");
  }),

  rule(25, "glowOf fixtures, reposByYear", () => {
    const A = "2026-09-28";
    const fx = [
      [{ groups: ["web"], repo: { pushedAt: "2026-09-26" } }, "glueht"],
      [{ groups: ["web"], repo: { pushedAt: "2026-08-29" } }, "glueht"],
      [{ groups: ["web"], repo: { pushedAt: "2026-08-28" } }, "warm"],
      [{ groups: ["web"], repo: { pushedAt: "2026-04-01" } }, "warm"],
      [{ groups: ["web"], repo: { pushedAt: "2026-03-01" } }, "abgekuehlt"],
      [{ groups: ["film"] }, "fertig"],
      [{ groups: ["web"] }, null],
      [{ groups: ["web"], archived: true, repo: { pushedAt: "2026-09-26" } }, "ausgemustert"],
    ];
    fx.forEach(([p, want], i) => {
      const got = glowOf(p, A);
      if (got !== want) fail(25, `glowOf fixture ${i}: ${got} ≠ ${want}`);
    });
    const by = reposByYear(data.repos ?? []);
    const want = data.snapshot?.github?.reposByYear?.[asOfYear];
    if (by[asOfYear] !== want) fail(25, `reposByYear[${asOfYear}] ${by[asOfYear]} ≠ snapshot ${want}`);
  }),

  rule(26, "partners and socials", async () => {
    for (const file of ["partners", "socials"]) {
      for (const item of data[file] ?? []) {
        if (!["https:", "mailto:"].includes(new URL(item.link).protocol)) fail(26, `${file}: ${item.id} link must be https or mailto`);
        if (item.image && !existsExact(item.image)) fail(26, `${file}: ${item.id} image ${item.image} missing`);
        if (item.video && !existsExact(item.video)) fail(26, `${file}: ${item.id} video ${item.video} missing`);
        for (const s of item.sources ?? []) if (!httpsUrl(s.url) || !isIso(s.checkedAt)) fail(26, `${file}: ${item.id} source ${s.url}`);
      }
    }
  }),

  rule(27, "budgets and language", async () => {
    const size = (await stat(at("data/projects.json"))).size;
    if (size > 40 * 1000) fail(27, `projects.json is ${(size / 1000).toFixed(1)} KB (budget 40 KB)`);
    const snap = (await stat(at("data/snapshot.json"))).size;
    if (snap > 2 * 1024) fail(27, `snapshot.json is ${snap} B (budget 2 KB)`);
    const reposSize = (await stat(at("data/repos.json"))).size;
    if (reposSize > 12 * 1024) fail(27, `repos.json is ${reposSize} B (budget 12 KB)`);
    // Umlaute: German copy never uses ae/oe/ue transliterations
    const translit = /\b(fuer|ueber|Ueber|zurueck|Rueck|waehrend|koennen|moecht|groess|schoen|Loesung|Aender|aender|Maerz|spaet|haeufig|naechst|Naecht|geprueft|Pruef|Buehne|Traeume|Schluessel|Gebaeude|hoer|Hoer)\w*/;
    const strings = [];
    const walk = (v, where) => {
      if (typeof v === "string") {
        if (!/^https?:|^assets\/|^data\//.test(v)) strings.push([where, v]);
      } else if (Array.isArray(v)) v.forEach((x) => walk(x, where));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!["url", "link", "source", "fullName", "src", "image", "n", "id"].includes(k)) walk(x, where);
    };
    walk(projects, "projects.json");
    for (const [id, d] of details) walk(d, `details/${id}.json`);
    walk(films ?? [], "films.json");
    walk(data.milestones ?? [], "milestones.json");
    walk(data.universe ?? [], "universe.json");
    walk(data.partners ?? [], "partners.json");
    for (const [where, s] of strings) {
      const m = translit.exec(s);
      if (m) fail(27, `${where}: transliterated umlaut „${m[0]}“ in „${s.slice(0, 60)}…“`);
    }
  }),
];

for (const r of RULES) {
  try {
    await r.fn();
  } catch (e) {
    fail(r.n, `${r.title}: validator crashed: ${e.stack?.split("\n").slice(0, 2).join(" ") ?? e}`);
  }
  if (!errors.some((e) => e.startsWith(`✗ [${r.n}]`))) passed.push(r.n);
}

if (!quiet) {
  for (const s of skipped) console.log(s);
  for (const w of warnings) console.log(w);
}
for (const e of errors) console.error(e);
console.log(
  `\n${errors.length ? "FAILED" : "OK"}: ${RULES.length - new Set(errors.map((e) => e.slice(3, e.indexOf("]")))).size}/${RULES.length} rule groups pass · ${projects.length} projects · ${details.size} details · ${films?.length ?? 0} films · ${data.repos?.length ?? 0} repos · Stand ${asOf}` +
    `${warnings.length ? ` · ${warnings.length} warnings` : ""}${skipped.length ? ` · ${skipped.length} skipped (waiting for other packages)` : ""}`,
);
process.exit(errors.length ? 1 : 0);
