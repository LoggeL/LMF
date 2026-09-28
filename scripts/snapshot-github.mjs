#!/usr/bin/env node
/**
 * GitHub snapshot (spec §3.8). Dev-only; needs an authenticated `gh` CLI.
 *
 *   node scripts/snapshot-github.mjs [--as-of YYYY-MM-DD] [--skip-projects]   (npm run snapshot)
 *
 * Writes in one run:
 *   data/repos.json     own public non-fork repos of LoggeL, sorted by createdAt;
 *                       names only for repos in scripts/repo-allowlist.json
 *   data/snapshot.json  asOf, GitHub account facts, per-year counts, sources
 * and refreshes, for every project with `repo.fullName`:
 *   data/projects.json        repo.{stars, createdAt, pushedAt, private} (+ createdTs for the ShareX trio)
 *   data/details/<id>.json    commits, languages (percent, one decimal), commitsBy (org/co-owned repos),
 *                             relatedRepos[].commits
 *
 * asOf defaults to today (local date). Numbers mixing forks or private repos are never written.
 */
import { execFileSync } from "node:child_process";
import { readFile, writeFile, access } from "node:fs/promises";
import { stringifyProjects, stringifyRepos, writeJson } from "./lib/json.mjs";

const ROOT = new URL("../", import.meta.url);
const at = (p) => new URL(p, ROOT);
const readJson = async (p) => JSON.parse(await readFile(at(p), "utf8"));
const exists = (p) => access(at(p)).then(() => true, () => false);

const args = process.argv.slice(2);
const argAsOf = args.includes("--as-of") ? args[args.indexOf("--as-of") + 1] : null;
const skipProjects = args.includes("--skip-projects");
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const asOf = argAsOf ?? today();
if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error(`Bad --as-of: ${asOf}`);

const OWNER = "LoggeL";
const TS_IDS = new Set(["sharex-capture-engine", "sharex-win98", "sharex-afterimage"]);
/** Repos where a commit split is shown (co-owned or organisation repos). */
const COMMITS_BY = new Set(["theater-website", "poolparty-website"]);

function gh(args, { raw = false } = {}) {
  const out = execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return raw ? out : JSON.parse(out);
}
const dateOnly = (iso) => (iso ? iso.slice(0, 10) : undefined);

/** Commit count on the default branch via the Link header of commits?per_page=1. */
function commitCount(full) {
  const out = gh(["api", "-i", `repos/${full}/commits?per_page=1`], { raw: true });
  const link = /^link:\s*(.+)$/im.exec(out)?.[1] ?? "";
  const last = /[?&]page=(\d+)>;\s*rel="last"/.exec(link);
  if (last) return Number(last[1]);
  const body = out.slice(out.indexOf("\n\n") >= 0 ? out.indexOf("\n\n") : out.indexOf("\r\n\r\n"));
  try {
    return JSON.parse(body.trim()).length;
  } catch {
    return 0;
  }
}

/** Language bytes → percentages with one decimal (entries rounding to 0 are dropped). */
function languages(full) {
  const bytes = gh(["api", `repos/${full}/languages`]);
  const total = Object.values(bytes).reduce((s, n) => s + n, 0);
  if (!total) return null;
  const out = {};
  for (const [lang, n] of Object.entries(bytes).sort((a, b) => b[1] - a[1])) {
    const pct = Math.round((n / total) * 1000) / 10;
    if (pct > 0) out[lang] = pct;
  }
  return out;
}

function contributions(full, login) {
  const list = gh(["api", `repos/${full}/contributors?per_page=100`]);
  return list.find((c) => c.login === login)?.contributions ?? null;
}

/* ------------------------------------------------------------ repos.json */

const allow = (await readJson("scripts/repo-allowlist.json")).repos;
const list = gh([
  "repo", "list", OWNER, "--visibility", "public", "--source", "--limit", "400",
  "--json", "name,createdAt,pushedAt,primaryLanguage,isFork,isPrivate",
]);
const own = list.filter((r) => !r.isFork && !r.isPrivate);
if (own.length !== list.length) console.warn(`Dropped ${list.length - own.length} fork/private rows from the gh output.`);
own.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name));
const repos = own.map((r) => {
  const row = { c: dateOnly(r.createdAt), p: dateOnly(r.pushedAt) };
  if (r.primaryLanguage?.name) row.l = r.primaryLanguage.name;
  if (Object.prototype.hasOwnProperty.call(allow, r.name)) {
    row.n = r.name;
    if (allow[r.name]) row.id = allow[r.name];
  }
  return row;
});
for (const r of repos) if (r.p > asOf) r.p = asOf; // a push later on the snapshot day never leaks past asOf
await writeFile(at("data/repos.json"), stringifyRepos({ asOf, repos }));

const byYear = {};
for (const r of repos) byYear[r.c.slice(0, 4)] = (byYear[r.c.slice(0, 4)] ?? 0) + 1;

/* ------------------------------------------------------------ snapshot.json */

const user = gh(["api", `users/${OWNER}`]);
const snapshot = {
  asOf,
  github: {
    login: OWNER,
    createdAt: dateOnly(user.created_at),
    bio: (user.bio ?? "").trim(),
    ownPublicRepos: repos.length,
    reposByYear: byYear,
  },
  youtube: { firstUpload: "2014-11-22", firstTitle: "AE Test", firstDurationSeconds: 7 },
  sources: [
    { label: "GitHub API users/LoggeL", url: "https://api.github.com/users/LoggeL", checkedAt: asOf },
    { label: "GitHub API: eigene öffentliche Repos ohne Forks", url: "https://github.com/LoggeL?tab=repositories&type=source", checkedAt: asOf },
    { label: "YouTube „AE Test“", url: "https://www.youtube.com/watch?v=wHEcSFBkM0s", checkedAt: "2026-09-28" },
  ],
};
await writeJson(at("data/snapshot.json"), snapshot);
console.log(`repos.json: ${repos.length} own public repos (${Object.entries(byYear).map(([y, n]) => `${y}: ${n}`).join(" · ")})`);

/* ------------------------------------------------------------ projects + details */

if (!skipProjects) {
  const projects = await readJson("data/projects.json");
  const cache = new Map();
  for (const p of projects) {
    const full = p.repo?.fullName;
    if (!full) continue;
    let meta = cache.get(full);
    if (!meta) {
      const info = gh(["api", `repos/${full}`]);
      meta = {
        info,
        commits: commitCount(full),
        languages: languages(full),
      };
      cache.set(full, meta);
    }
    const { info } = meta;
    const repo = { fullName: full };
    if (info.private) repo.private = true;
    repo.stars = info.stargazers_count;
    repo.createdAt = dateOnly(info.created_at);
    repo.pushedAt = dateOnly(info.pushed_at) > asOf ? asOf : dateOnly(info.pushed_at);
    if (TS_IDS.has(p.id)) repo.createdTs = info.created_at;
    p.repo = repo;

    const file = `data/details/${p.id}.json`;
    if (!(await exists(file))) continue;
    const det = await readJson(file);
    det.commits = meta.commits;
    if (meta.languages) det.languages = meta.languages;
    if (COMMITS_BY.has(p.id)) {
      const mine = contributions(full, OWNER);
      if (mine !== null) det.commitsBy = { LoggeL: mine, total: meta.commits };
    }
    for (const rel of det.relatedRepos ?? []) {
      try {
        rel.commits = commitCount(rel.fullName);
        const ri = gh(["api", `repos/${rel.fullName}`]);
        if (ri.private) throw new Error("private");
        rel.createdAt = dateOnly(ri.created_at);
      } catch (e) {
        console.warn(`relatedRepo ${rel.fullName}: ${e.message}`);
      }
    }
    // keep key order stable: insert commits/languages after stack
    const ordered = {};
    for (const k of ["id", "story", "highlights", "stack", "languages", "commits", "commitsBy"]) if (det[k] !== undefined) ordered[k] = det[k];
    for (const k of Object.keys(det)) if (!(k in ordered)) ordered[k] = det[k];
    await writeJson(at(file), ordered);
    process.stdout.write(".");
  }
  process.stdout.write("\n");
  await writeFile(at("data/projects.json"), stringifyProjects(projects));
  console.log(`Refreshed ${cache.size} repos for ${projects.filter((p) => p.repo).length} projects.`);
}
