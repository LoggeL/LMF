#!/usr/bin/env node
/**
 * Downloads the four self-hosted font files and their SIL OFL licences (spec §4.1).
 * Dev-only. Re-runnable: existing files are overwritten with the pinned versions.
 *   node scripts/fetch-fonts.mjs
 */
import { writeFile, mkdir, stat } from "node:fs/promises";

const DIR = new URL("../assets/fonts/", import.meta.url);
const BUDGET = 125 * 1024;

const FONTS = [
  ["InstrumentSerif-Regular.woff2", "https://cdn.jsdelivr.net/npm/@fontsource/instrument-serif@5.3.0/files/instrument-serif-latin-400-normal.woff2"],
  ["InstrumentSerif-Italic.woff2", "https://cdn.jsdelivr.net/npm/@fontsource/instrument-serif@5.3.0/files/instrument-serif-latin-400-italic.woff2"],
  ["Montserrat-var.woff2", "https://cdn.jsdelivr.net/npm/@fontsource-variable/montserrat@5.3.0/files/montserrat-latin-wght-normal.woff2"],
  ["JetBrainsMono-var.woff2", "https://cdn.jsdelivr.net/npm/@fontsource-variable/jetbrains-mono@5.3.0/files/jetbrains-mono-latin-wght-normal.woff2"],
];
const LICENCES = [
  ["OFL-InstrumentSerif.txt", "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/OFL.txt"],
  ["OFL-JetBrainsMono.txt", "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/OFL.txt"],
  ["OFL-Montserrat.txt", "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt"],
];

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

await mkdir(DIR, { recursive: true });
let total = 0;
for (const [name, url] of FONTS) {
  const buf = await get(url);
  if (buf.subarray(0, 4).toString("latin1") !== "wOF2") throw new Error(`${name}: not a woff2 file`);
  await writeFile(new URL(name, DIR), buf);
  total += buf.length;
  console.log(`${name.padEnd(32)} ${(buf.length / 1024).toFixed(1)} KB`);
}
for (const [name, url] of LICENCES) {
  const buf = await get(url);
  if (!/SIL OPEN FONT LICENSE/i.test(buf.toString("utf8"))) throw new Error(`${name}: not an OFL text`);
  await writeFile(new URL(name, DIR), buf);
  console.log(`${name.padEnd(32)} ok`);
}
console.log(`Total ${(total / 1024).toFixed(1)} KB (budget ${BUDGET / 1024} KB)`);
if (total > BUDGET) {
  console.error("Font budget exceeded.");
  process.exit(1);
}
await stat(new URL("InstrumentSerif-Regular.woff2", DIR));
