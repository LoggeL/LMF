/** Shared JSON writers for the data scripts (dev-only). */
import { writeFile } from "node:fs/promises";

/** projects.json format: one key per line, values inline. Keeps the file ≤ 40 KB and diffs readable. */
export function stringifyProjects(list) {
  const body = list
    .map((p) => {
      const lines = Object.entries(p).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
      return `{\n${lines.join(",\n")}\n}`;
    })
    .join(",\n");
  return `[\n${body}\n]\n`;
}

/** repos.json format: one repo per line. */
export function stringifyRepos(doc) {
  const rows = doc.repos.map((r) => `    ${JSON.stringify(r)}`).join(",\n");
  return `{\n  "asOf": ${JSON.stringify(doc.asOf)},\n  "repos": [\n${rows}\n  ]\n}\n`;
}

export const writeJson = (url, value) => writeFile(url, JSON.stringify(value, null, 2) + "\n");
