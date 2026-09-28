#!/usr/bin/env node
/**
 * Removes EXIF GPS data from the gallery originals (spec §3.14, owner decision §3.16 #2).
 *
 *   node scripts/strip-gps.mjs            dry run: lists the files that still carry GPS
 *   node scripts/strip-gps.mjs --write    strips GPS in place (run ONLY after Logge approved it)
 *
 * Pure JS, no dependencies: the GPS IFD is emptied and its values zeroed; image data,
 * orientation and the rest of the EXIF block stay untouched (same file size).
 * After a --write run, set "stripGps": "done" in docs/decisions.json so validate enforces it.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { hasGps, stripGpsInPlace } from "./lib/exif.mjs";

const DIR = new URL("../gallery/assets/img/original/", import.meta.url);
const write = process.argv.includes("--write");

const files = (await readdir(DIR)).filter((f) => /\.jpe?g$/i.test(f)).sort();
let withGps = 0;
let stripped = 0;
for (const f of files) {
  const buf = await readFile(new URL(f, DIR));
  if (!hasGps(buf)) continue;
  withGps++;
  if (!write) {
    console.log(`GPS: ${f}`);
    continue;
  }
  if (stripGpsInPlace(buf) && !hasGps(buf)) {
    await writeFile(new URL(f, DIR), buf);
    stripped++;
  } else console.error(`Could not strip ${f}`);
}
console.log(
  write
    ? `Stripped GPS from ${stripped} of ${files.length} originals.`
    : `${withGps} of ${files.length} originals carry GPS. Dry run, nothing written. Use --write after approval.`,
);
