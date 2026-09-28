/**
 * Repo embers — pure data for the Esse coal bed (§5.1)  [WP3]
 * Lives outside js/gl/ so the calm path (axis + caption, no GL) never requests a GL file.
 * Node-importable (scripts/render-poster.mjs uses the same numbers as the browser).
 *
 * One ember per public repo (data/repos.json → repos[] = { c: createdAt, p: pushedAt, l, n?, id? }):
 *   x     = createdAt, linear in time from 1 January of the first repo year (left) to snapshot.asOf (right)
 *   y     = seeded jitter inside the bed (golden-ratio sequence + hash, stable across reloads)
 *   heat  = recency(pushedAt vs asOf) — never Date.now()
 */
import { recencyHeat } from "../lib/palette.js";

const DAY = 864e5;
const day = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/**
 * Panel layout in "panel units": y ∈ [0,1] bottom → top, x ∈ [0, A] with A = width / height.
 * Shared by the shader, the ember buffer, the DOM year axis and the poster renderer.
 */
export function layout(A) {
  const wide = A > 1.2;
  const bedTop = wide ? 0.42 : 0.37;
  const margin = 0.05 * A;
  const sky = 1 - bedTop;
  const hw = Math.min(0.28 * A, sky * 0.29 * 1.6733);
  return { A, bedTop, margin, logo: { cx: A * 0.5, cy: bedTop + sky * 0.5, hw }, band: [0.07, bedTop - 0.07] };
}

/** Embers sorted old → new. Empty array when repos or asOf are missing (bed stays decoration). */
export function buildEmbers(repos, asOf) {
  if (!Array.isArray(repos) || !repos.length || typeof asOf !== "string") return [];
  const valid = repos.filter((r) => typeof r?.c === "string" && r.c.length >= 10);
  if (!valid.length) return [];
  const t1 = day(asOf);
  const y0 = Math.min(...valid.map((r) => +r.c.slice(0, 4)));
  const t0 = Date.UTC(y0, 0, 1);
  return valid
    .map((r, i) => {
      const pushed = typeof r.p === "string" && r.p.length >= 10 ? r.p : r.c;
      const days = Math.max(0, Math.round((t1 - day(pushed)) / DAY));
      const s = hash(`${r.c}|${r.p}|${i}`);
      return {
        repo: r,
        t: Math.min(1, Math.max(0, (day(r.c) - t0) / (t1 - t0))),
        j: (i * 0.6180339887 + s * 0.35) % 1,
        heat: recencyHeat(days),
        days,
        seed: s,
      };
    })
    .sort((a, b) => a.t - b.t);
}

/** Year ticks (1 January of every year from the first repo year to asOf) as t ∈ [0,1]. */
export function yearTicks(repos, asOf) {
  if (!Array.isArray(repos) || !repos.length || typeof asOf !== "string") return [];
  const y0 = Math.min(...repos.filter((r) => typeof r?.c === "string").map((r) => +r.c.slice(0, 4)));
  if (!Number.isFinite(y0)) return [];
  const t0 = Date.UTC(y0, 0, 1);
  const t1 = day(asOf);
  const out = [];
  for (let y = y0; y <= +asOf.slice(0, 4); y++) out.push({ year: y, t: (Date.UTC(y, 0, 1) - t0) / (t1 - t0) });
  return out;
}

/** Ember x in panel units. */
export const emberX = (t, lay) => lay.margin + t * (lay.A - 2 * lay.margin);
export const emberY = (j, lay) => lay.band[0] + j * (lay.band[1] - lay.band[0]);

/** Float32 [x, y, heat, seed] × n for gl.POINTS. */
export function emberBuffer(embers, lay) {
  const a = new Float32Array(embers.length * 4);
  embers.forEach((e, i) => a.set([emberX(e.t, lay), emberY(e.j, lay), e.heat, e.seed], i * 4));
  return a;
}

/**
 * Bed heat along x (n samples, 0–255): a kernel density of the embers weighted by their heat.
 * This is why the right edge of the bed glows brighter: that is where the recent repos are.
 * Without embers the bed is flat, low decoration.
 */
export function densityRow(embers, n = 128) {
  const row = new Float32Array(n);
  for (const e of embers) {
    for (let i = 0; i < n; i++) {
      const d = (i / (n - 1) - e.t) / 0.045;
      row[i] += (0.25 + e.heat) * Math.exp(-d * d);
    }
  }
  const max = Math.max(1e-6, ...row);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.round(255 * (embers.length ? 0.14 + 0.86 * Math.sqrt(row[i] / max) : 0.3));
  return out;
}
