#!/usr/bin/env node
/**
 * bake-logo-sdf.mjs  [WP3] — dev-only, output committed.
 *
 * Bakes assets/svg/logo.svg into a signed distance field for the Esse shader (§5.1):
 *   assets/img/logo-sdf.png   640 × 416, 8-bit greyscale, logo box 560 wide, centred.
 *
 * Encoding (must match js/gl/esse.js → SDF):
 *   v = clamp(0.5 − d / (2 · SPREAD), 0, 1) · 255      d in px of the 640-wide texture, < 0 inside
 *   → inside > 127, edge = 127.5, SPREAD = 40 px.
 *
 * How: Chromium (Playwright) rasterises the SVG paths 4× supersampled on a 2D canvas; Node runs an
 * exact Euclidean distance transform (Felzenszwalb & Huttenlocher) on that mask, downsamples, and
 * writes a minimal greyscale PNG with node:zlib. No extra dependencies.
 *
 *   node scripts/bake-logo-sdf.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { chromium } from "playwright";

const ROOT = new URL("../", import.meta.url);
export const SDF = { W: 640, H: 416, BOX_W: 560, SPREAD: 40 };
const SS = 4; // supersampling

const svg = readFileSync(new URL("assets/svg/logo.svg", ROOT), "utf8");
const viewBox = (/viewBox="([^"]+)"/.exec(svg)?.[1] ?? "0 0 2510 1500").split(/\s+/).map(Number);
const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
if (!paths.length) throw new Error("logo.svg: no <path d> found");

const W = SDF.W * SS;
const H = SDF.H * SS;
const boxW = SDF.BOX_W * SS;
const scale = boxW / viewBox[2];
const boxH = viewBox[3] * scale;
const ox = (W - boxW) / 2;
const oy = (H - boxH) / 2;

const browser = await chromium.launch();
const page = await browser.newPage();
const mask = await page.evaluate(
  ({ W, H, paths, scale, ox, oy, vx, vy }) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    g.setTransform(scale, 0, 0, scale, ox - vx * scale, oy - vy * scale);
    g.fillStyle = "#fff";
    for (const d of paths) g.fill(new Path2D(d));
    const px = g.getImageData(0, 0, W, H).data;
    const out = new Array(W * H);
    for (let i = 0; i < W * H; i++) out[i] = px[i * 4 + 3] >= 128 ? 1 : 0;
    return out;
  },
  { W, H, paths, scale, ox, oy, vx: viewBox[0], vy: viewBox[1] },
);
await browser.close();

/* ── Exact EDT (squared) ─────────────────────────────────────────────────────────────────────── */
const INF = 1e20;
function edt1d(f, n, d, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}
function edt(grid, w, h) {
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) grid[y * w + x] = d[x];
  }
  return grid;
}

const toInside = new Float64Array(W * H); // distance to the nearest inside pixel (0 on inside)
const toOutside = new Float64Array(W * H);
for (let i = 0; i < W * H; i++) {
  toInside[i] = mask[i] ? 0 : INF;
  toOutside[i] = mask[i] ? INF : 0;
}
edt(toInside, W, H);
edt(toOutside, W, H);

/* ── Downsample (block centre) and encode ─────────────────────────────────────────────────────── */
const out = new Uint8Array(SDF.W * SDF.H);
for (let y = 0; y < SDF.H; y++) {
  for (let x = 0; x < SDF.W; x++) {
    // average the signed distance over the SS×SS block (smooth, exact at the edge)
    let sum = 0;
    for (let j = 0; j < SS; j++)
      for (let i = 0; i < SS; i++) {
        const k = (y * SS + j) * W + (x * SS + i);
        const sd = mask[k] ? -(Math.sqrt(toOutside[k]) - 0.5) : Math.sqrt(toInside[k]) - 0.5;
        sum += sd;
      }
    const dPx = sum / (SS * SS) / SS; // in output pixels
    const v = Math.min(1, Math.max(0, 0.5 - dPx / (2 * SDF.SPREAD)));
    out[y * SDF.W + x] = Math.round(v * 255);
  }
}

function crc32(buf) {
  let c;
  const table = crc32.t ?? (crc32.t = Array.from({ length: 256 }, (_, n) => {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  }));
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodeGreyPng(pixels, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    // filter 2 (Up) compresses smooth fields well
    raw[y * (w + 1)] = 2;
    for (let x = 0; x < w; x++) {
      const cur = pixels[y * w + x];
      const up = y ? pixels[(y - 1) * w + x] : 0;
      raw[y * (w + 1) + 1 + x] = (cur - up) & 255;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const png = encodeGreyPng(out, SDF.W, SDF.H);
writeFileSync(new URL("assets/img/logo-sdf.png", ROOT), png);
console.log(`logo-sdf.png: ${SDF.W}×${SDF.H}, spread ${SDF.SPREAD}px, ${(png.length / 1024).toFixed(1)} KB`);
