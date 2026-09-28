#!/usr/bin/env node
/**
 * Fills the prerender blocks and data-bind spans in index.html (spec §3.13, §3.14).
 *
 *   node scripts/prerender.mjs [file …]      (npm run prerender; default: index.html)
 *
 * Writes only inside `<!-- prerender:NAME -->…<!-- /prerender:NAME -->` markers and inside
 * `data-bind` elements. Re-runnable; tolerant of renderers that do not exist yet (skipped).
 * Exit code 1 only if a renderer threw.
 */
import { readFile, writeFile } from "node:fs/promises";
import { loadDataFs, ROOT } from "./lib/node-data.mjs";
import { prerenderHtml } from "./lib/prerender-core.mjs";

const files = process.argv.slice(2).length ? process.argv.slice(2) : ["index.html"];
const data = await loadDataFs();
if (data.failed.length) console.warn(`Data files not loaded: ${data.failed.join(", ")}`);

let failed = false;
for (const file of files) {
  const url = new URL(file, ROOT);
  const html = await readFile(url, "utf8");
  const res = await prerenderHtml(html, data);
  for (const b of res.blocks) {
    const mark = b.status === "rendered" ? "✓" : b.status === "skipped" ? "–" : "✗";
    console.log(`${mark} ${file} prerender:${b.name}  ${b.detail}`);
    if (b.status === "error") failed = true;
  }
  console.log(`  ${file}: ${res.binds.filled} data-bind values written${res.binds.unknown.length ? `, unknown keys: ${res.binds.unknown.join(", ")}` : ""}`);
  if (res.html !== html) {
    await writeFile(url, res.html);
    console.log(`  ${file} updated.`);
  } else console.log(`  ${file} unchanged.`);
}
process.exit(failed ? 1 : 0);
