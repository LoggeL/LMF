/**
 * Data loading (spec §6.2, §8). Owner: WP1. Full contract: README.md → „Datenschicht“.
 *
 *   const data = await loadData();   // cached promise; CORE files only
 *   await data.needFor("schichtbuch"); // or data.need("milestones", …): LAZY files into the same object
 *
 * CORE (before `load`): snapshot, projects, films, repos (plates show film lengths and repo
 * languages; the Esse needs the repos). LAZY: everything else, plus "anchors" (the chapter anchors'
 * details). A failed file only nulls its key; `failed` lists keys tried and failed.
 * No DOM here: scripts/lib/node-data.mjs reuses assemble() in Node.
 */
import { bindings as deriveBindings } from "./derive.js";

export const SITE_ROOT = new URL("../../", import.meta.url);

export const DATA_FILES = {
  snapshot: "data/snapshot.json",
  projects: "data/projects.json",
  films: "data/films.json",
  repos: "data/repos.json",
  milestones: "data/milestones.json",
  chapters: "data/chapters.json",
  universe: "data/universe.json",
  partners: "data/partners.json",
  socials: "data/socials.json",
  gallery: "gallery/assets/data/images.json",
};

export const CORE_KEYS = ["snapshot", "projects", "films", "repos"];
export const LAZY_KEYS = Object.keys(DATA_FILES).filter((k) => !CORE_KEYS.includes(k));
const EVERYTHING = [...LAZY_KEYS, "anchors"];

/** Lazy keys per below-the-fold section (main.js → needFor). Unknown sections get everything. */
export const SECTION_NEEDS = {
  meister: ["chapters", "universe", "anchors"],
  film: [],
  schichtbuch: ["milestones", "gallery"], // milestone text uses {gallery.nights}
  werkstatt: ["partners"],
  abspann: ["partners", "gallery"],
  abseits: ["gallery"],
  kontakt: ["socials"],
};

export const detailsPath = (id) => `data/details/${encodeURIComponent(id)}.json`;

const isArr = Array.isArray;
const isObj = (v) => v !== null && typeof v === "object" && !isArr(v);

/** A file that parses but has the wrong shape counts as failed. */
const SHAPE = {
  snapshot: (v) => isObj(v) && typeof v.asOf === "string",
  projects: (v) => isArr(v) && v.every((p) => isObj(p) && typeof p.id === "string" && isArr(p.groups)),
  films: isArr,
  repos: (v) => isObj(v) && isArr(v.repos),
  milestones: isArr,
  chapters: isArr,
  universe: (v) => isArr(v) && v.every((n) => isObj(n) && typeof n.url === "string"),
  partners: isArr,
  socials: isArr,
  gallery: isArr,
};
const valid = (key, v) => v !== undefined && v !== null && SHAPE[key](v);

/** Pure assembly from parsed files (browser and Node). `detailsLoader(id)` → Promise<JSON>. */
export function assemble(raw = {}, detailsLoader = null) {
  const pick = (key) => (valid(key, raw[key]) ? raw[key] : null);
  const projects = pick("projects");
  const filmsArr = pick("films");
  const reposDoc = pick("repos");
  const byId = new Map((projects ?? []).map((p) => [p.id, p]));

  const loaded = new Map();
  const pending = new Map();
  const details = {
    loaded,
    get(id) {
      if (loaded.has(id)) return Promise.resolve(loaded.get(id));
      if (pending.has(id)) return pending.get(id);
      if (!byId.get(id)?.details || !detailsLoader) return Promise.resolve(null);
      const promise = Promise.resolve()
        .then(() => detailsLoader(id))
        .then((d) => (isObj(d) && d.id === id ? d : null))
        .catch(() => null)
        .then((d) => {
          pending.delete(id);
          if (d) loaded.set(id, d);
          return d;
        });
      pending.set(id, promise);
      return promise;
    },
    prefetch(id) {
      details.get(id);
    },
  };

  const data = {
    snapshot: pick("snapshot"),
    projects,
    byId,
    films: filmsArr ? new Map(filmsArr.map((f) => [f.id, f])) : null,
    repos: reposDoc ? reposDoc.repos : null,
    reposAsOf: reposDoc ? reposDoc.asOf : null,
    details,
    detailsById: loaded,
    // only keys that were tried: a lazy key not loaded yet (undefined) has not failed
    failed: Object.keys(DATA_FILES).filter((k) => raw[k] !== undefined && pick(k) === null),
    bindings: {},
    // replaced by loadData(); in Node everything is loaded already
    need: () => Promise.resolve(data),
    needFor: () => Promise.resolve(data),
  };
  for (const k of LAZY_KEYS) data[k] = pick(k);
  data.bindings = deriveBindings(data);
  return data;
}

/** Recomputes `data.bindings` in place (e.g. after more details arrived). */
export function refreshBindings(data) {
  const next = deriveBindings(data);
  for (const k of Object.keys(data.bindings)) delete data.bindings[k];
  Object.assign(data.bindings, next);
  return data.bindings;
}

async function fetchJson(url, fetchImpl) {
  // No custom headers: must match index.html's <link rel=preload as=fetch crossorigin> for projects.json.
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

/** Fetches files in parallel; a failure resolves to null for that key (and warns). */
async function fetchKeys(keys, url, fetchImpl) {
  const settled = await Promise.allSettled(keys.map((k) => fetchJson(url(DATA_FILES[k]), fetchImpl)));
  const raw = {};
  settled.forEach((r, i) => {
    raw[keys[i]] = r.status === "fulfilled" ? r.value : null;
    if (r.status === "rejected") console.warn(`[lmf] ${keys[i]} nicht geladen:`, r.reason?.message ?? r.reason);
  });
  return raw;
}

let cached = null;

/**
 * Loads the CORE files once. Options (tests/tools): `fetch`, `base` (site root URL),
 * `fresh: true` bypasses the cache, `all: true` also awaits every lazy key and the anchors.
 */
export function loadData(options = {}) {
  if (cached && !options.fresh) return cached;
  const fetchImpl = options.fetch ?? globalThis.fetch?.bind(globalThis);
  const base = options.base ?? SITE_ROOT;
  const url = (path) => new URL(path, base).href;
  const promise = (async () => {
    const data = assemble(await fetchKeys(CORE_KEYS, url, fetchImpl), (id) => fetchJson(url(detailsPath(id)), fetchImpl));
    const jobs = new Map();
    const load = (key) => {
      if (!jobs.has(key)) {
        const job =
          key === "anchors"
            ? load("chapters").then(() => Promise.allSettled((data.chapters ?? []).map((c) => c.anchor && data.details.get(c.anchor))))
            : LAZY_KEYS.includes(key)
              ? fetchKeys([key], url, fetchImpl).then((r) => {
                  data[key] = valid(key, r[key]) ? r[key] : null;
                  if (data[key] === null) data.failed.push(key);
                })
              : Promise.resolve();
        jobs.set(key, job.then(() => refreshBindings(data)));
      }
      return jobs.get(key);
    };
    data.need = (...keys) => Promise.all((keys.length ? keys.flat() : EVERYTHING).map(load)).then(() => data);
    data.needFor = (name) => data.need(SECTION_NEEDS[name] ?? EVERYTHING);
    if (options.all) await data.need();
    return data;
  })();
  if (!options.fresh) cached = promise;
  return promise;
}

export default loadData;
