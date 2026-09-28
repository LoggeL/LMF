/**
 * Node equivalent of js/lib/data.js → loadData(): same assemble(), files from disk.
 * All details are preloaded (prerender and validate need them synchronously).
 */
import { readFile, readdir } from "node:fs/promises";
import { assemble, DATA_FILES, detailsPath, refreshBindings } from "../../js/lib/data.js";

export const ROOT = new URL("../../", import.meta.url);

async function readJsonOrNull(path) {
  try {
    return JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
  } catch {
    return null;
  }
}

export async function loadDataFs({ preloadDetails = true } = {}) {
  const raw = {};
  for (const [key, path] of Object.entries(DATA_FILES)) raw[key] = await readJsonOrNull(path);
  const data = assemble(raw, async (id) => {
    const d = await readJsonOrNull(detailsPath(id));
    if (!d) throw new Error(`details ${id} missing`);
    return d;
  });
  if (preloadDetails && data.projects) {
    await Promise.all(data.projects.map((p) => data.details.get(p.id)));
    refreshBindings(data);
  }
  return data;
}

export async function listDetailsFiles() {
  return (await readdir(new URL("data/details/", ROOT))).filter((f) => f.endsWith(".json"));
}
