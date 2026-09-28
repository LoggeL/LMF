#!/usr/bin/env node
/**
 * BeatGuessr probe data (spec §3.11, P2). Dev-only.
 *
 *   node scripts/snapshot-beatguessr.mjs
 *
 * data/probes/beatguessr.json       [{ year, context, songs: [[title, artist], …] }]  (66 years × 10)
 * data/probes/beatguessr.meta.json  sources + decade colours copied from BeatGuessr's css/style.css
 *
 * Deliberately dropped: preview_url, cover_url, spotify_url, album, Spotify ids (no Spotify CDN on LMF).
 */
import { mkdir, writeFile } from "node:fs/promises";

const SONGS = "https://loggel.github.io/BeatGuessr/data/songs.json";
const CSS = "https://loggel.github.io/BeatGuessr/css/style.css";
const out = new URL("../data/probes/", import.meta.url);
const today = new Date().toISOString().slice(0, 10);

const get = async (url, type) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return type === "json" ? res.json() : res.text();
};

const doc = await get(SONGS, "json");
const songs = Array.isArray(doc) ? doc : doc.songs;
const byYear = new Map();
for (const s of songs) {
  if (!Number.isInteger(s.year) || !s.title || !s.artist) continue;
  const entry = byYear.get(s.year) ?? { year: s.year, context: s.context ?? "", songs: [] };
  entry.songs.push([s.title, s.artist]);
  byYear.set(s.year, entry);
}
const years = [...byYear.values()].sort((a, b) => a.year - b.year);

const css = await get(CSS, "text");
const decades = {};
for (const m of css.matchAll(/--decade-(\d\d)s:\s*(#[0-9a-f]{3,8})/gi)) decades[`${m[1]}s`] = m[2];

await mkdir(out, { recursive: true });
await writeFile(
  new URL("beatguessr.json", out),
  "[\n" + years.map((y) => "  " + JSON.stringify(y)).join(",\n") + "\n]\n",
);
await writeFile(
  new URL("beatguessr.meta.json", out),
  JSON.stringify(
    {
      checkedAt: today,
      counts: { years: years.length, songs: years.reduce((n, y) => n + y.songs.length, 0) },
      decadeColours: decades,
      sources: [
        { label: "BeatGuessr data/songs.json", url: SONGS, checkedAt: today },
        { label: "BeatGuessr css/style.css (--decade-*)", url: CSS, checkedAt: today },
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log(`beatguessr: ${years.length} years, ${years.reduce((n, y) => n + y.songs.length, 0)} songs, decades ${Object.keys(decades).join(" ")}`);
