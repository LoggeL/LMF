#!/usr/bin/env node
/**
 * render-poster.mjs  [WP3] — dev-only, outputs committed.
 *
 * Renders the cooled Esse from our own shader (js/gl/esse-still.js → renderStill) with the real
 * data/repos.json + snapshot.asOf, so the poster shows exactly the embers the caption describes:
 *   assets/img/esse-poster.{webp,avif}        1000 × 1100 (10:11 stage, desktop)
 *   assets/img/esse-poster-wide.{webp,avif}   1280 × 800  (16:10 stage, below 1024 px)
 *   assets/img/esse-og.jpg                    1200 × 630  (og:image: H1 + the forge)
 * Re-run after every `npm run snapshot` (the embers are data).
 *
 * Needs the dev server (npm run dev → http://127.0.0.1:4173, or BASE=…), cwebp and ffmpeg with
 * libsvtav1 on PATH. WebGL2 runs on SwiftShader, so no GPU is required.
 *
 *   node scripts/render-poster.mjs
 */
import { writeFileSync, mkdtempSync, statSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const IMG = new URL("../assets/img/", import.meta.url);
const tmp = mkdtempSync(join(tmpdir(), "lmf-poster-"));

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
await page.goto(`${BASE}/404.html`);

async function still(width, height) {
  const url = await page.evaluate(
    async ({ width, height }) => {
      const [{ renderStill }, repos, snapshot] = await Promise.all([
        import("/js/gl/esse-still.js"),
        fetch("/data/repos.json").then((r) => r.json()),
        fetch("/data/snapshot.json").then((r) => r.json()),
      ]);
      return renderStill({ width, height, repos: repos.repos ?? repos, asOf: snapshot.asOf ?? repos.asOf });
    },
    { width, height },
  );
  return Buffer.from(url.split(",")[1], "base64");
}

function encode(png, name, { q = 80, crf = 22 } = {}) {
  const src = join(tmp, `${name}.png`);
  writeFileSync(src, png);
  const webp = new URL(`${name}.webp`, IMG).pathname;
  const avif = new URL(`${name}.avif`, IMG).pathname;
  execFileSync("cwebp", ["-quiet", "-q", String(q), "-m", "6", "-sharp_yuv", src, "-o", webp]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-frames:v", "1", "-c:v", "libsvtav1", "-crf", String(crf), "-preset", "4", "-pix_fmt", "yuv420p10le", "-f", "avif", avif], { stdio: "ignore", env: { ...process.env, SVT_LOG: "1" } });
  for (const f of [webp, avif]) console.log(`${f.split("/").pop()}: ${(statSync(f).size / 1024).toFixed(1)} KB`);
}

encode(await still(1000, 1100), "esse-poster");
encode(await still(1280, 800), "esse-poster-wide");

/* og:image — the H1 on the left (site copy), the forge on the right. */
const og = await page.evaluate(async () => {
  const [{ renderStill }, repos, snapshot] = await Promise.all([
    import("/js/gl/esse-still.js"),
    fetch("/data/repos.json").then((r) => r.json()),
    fetch("/data/snapshot.json").then((r) => r.json()),
  ]);
  const faces = [
    new FontFace("OG Serif", "url(/assets/fonts/InstrumentSerif-Regular.woff2)"),
    new FontFace("OG Serif", "url(/assets/fonts/InstrumentSerif-Italic.woff2)", { style: "italic" }),
    new FontFace("OG Mono", "url(/assets/fonts/JetBrainsMono-var.woff2)", { weight: "100 800" }),
  ];
  await Promise.all(faces.map((f) => f.load().then(() => document.fonts.add(f))));
  const art = new Image();
  art.src = await renderStill({ width: 640, height: 630, repos: repos.repos ?? repos, asOf: snapshot.asOf ?? repos.asOf });
  await art.decode();
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 630;
  const g = c.getContext("2d");
  g.fillStyle = "#0e0c0b";
  g.fillRect(0, 0, 1200, 630);
  g.drawImage(art, 560, 0);
  const fade = g.createLinearGradient(560, 0, 700, 0);
  fade.addColorStop(0, "#0e0c0b");
  fade.addColorStop(1, "rgba(14,12,11,0)");
  g.fillStyle = fade;
  g.fillRect(560, 0, 140, 630);
  g.fillStyle = "#afa59a";
  g.font = "500 22px 'OG Mono'";
  g.fillText("LOGGE MEDIA FORGE", 72, 150);
  g.fillStyle = "#f3eee7";
  g.font = "400 132px 'OG Serif'";
  g.fillText("Aus Neugier.", 64, 300);
  g.fillStyle = "#ff4d5e";
  g.font = "italic 400 132px 'OG Serif'";
  g.fillText("Gemacht.", 72, 420);
  return c.toDataURL("image/jpeg", 0.86);
});
writeFileSync(new URL("esse-og.jpg", IMG), Buffer.from(og.split(",")[1], "base64"));
console.log(`esse-og.jpg: ${(statSync(new URL("esse-og.jpg", IMG)).size / 1024).toFixed(1)} KB`);

await browser.close();
rmSync(tmp, { recursive: true, force: true });
