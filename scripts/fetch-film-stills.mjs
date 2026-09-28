#!/usr/bin/env node
/**
 * Film stills (spec §3.4): downloads Logge's own YouTube thumbnail for Ski 2023 and converts it
 * to a 16:9 WebP at assets/img/Skiing2023.webp (640×360, the size of the other film stills,
 * e.g. Skiing2019.webp).
 *
 *   node scripts/fetch-film-stills.mjs [--maxres-only]
 *
 * Tries maxresdefault → sddefault → hqdefault. Checked 28.09.2026 for CLalueWRmLI: maxresdefault,
 * sddefault and hq720 answer HTTP 404, hqdefault (480×360, 4:3 with black letterbox bars) exists.
 * The letterboxed variants are cropped to their 16:9 band (480×270) and scaled to 640×360.
 * `--maxres-only` restores the old strict behaviour (no image unless maxresdefault exists; the
 * project then keeps `"art": "film"`). Run scripts/import-research.mjs afterwards; it picks the
 * image up when the file exists. Conversion uses ffmpeg and cwebp from PATH; no npm dependency.
 */
import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const STILLS = [{ id: "skiing-2023", youtubeId: "CLalueWRmLI", out: "assets/img/Skiing2023.webp" }];
const strict = process.argv.includes("--maxres-only");
const variants = strict ? ["maxresdefault"] : ["maxresdefault", "sddefault", "hqdefault"];
const root = new URL("../", import.meta.url);

for (const still of STILLS) {
  let jpg = null;
  let used = null;
  for (const v of variants) {
    const res = await fetch(`https://i.ytimg.com/vi/${still.youtubeId}/${v}.jpg`);
    if (res.ok) {
      jpg = Buffer.from(await res.arrayBuffer());
      used = v;
      break;
    }
    console.log(`${still.id}: ${v}.jpg → HTTP ${res.status}`);
  }
  if (!jpg) {
    console.log(`${still.id}: no usable thumbnail. Keeping the Rohling (art: "film").`);
    continue;
  }
  const dir = await mkdtemp(join(tmpdir(), "lmf-still-"));
  try {
    const src = join(dir, "in.jpg");
    const png = join(dir, "out.png");
    await writeFile(src, jpg);
    // hqdefault/sddefault are 4:3 with the 16:9 picture letterboxed in the middle: keep that band
    const letterbox = used === "maxresdefault" ? "" : "crop=iw:iw*9/16,";
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf", `${letterbox}scale=640:360:flags=lanczos`, png]);
    execFileSync("cwebp", ["-quiet", "-q", "82", png, "-o", new URL(still.out, root).pathname]);
    console.log(`${still.id}: wrote ${still.out} from ${used}.jpg${used === "maxresdefault" ? "" : " (letterbox cropped, 480×270 scaled to 640×360)"}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
