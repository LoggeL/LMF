/**
 * Palette for GL / SVG / canvas  [LEAD]
 * Mirrors css/tokens.css. The heat ramp is decorative only — never use it for text.
 * Pure and Node-importable (scripts/render-poster.mjs, bake scripts).
 */

/** Heat ramp, cold → white hot: kaltes Eisen, dunkle Rotglut, Kirschrot, Orange, Gelb, Weißglut. */
export const HEAT = ["#2A2522", "#5A0E05", "#B3200A", "#F2600C", "#FFB347", "#FFF4D6"];
export const HEAT_NAMES = ["kaltes Eisen", "dunkle Rotglut", "Kirschrot", "Orange", "Gelb", "Weißglut"];

/** Alloy (temper) colours per scope. Light = Tageslicht, dark = Esse, screen = always-dark blocks. */
export const ALLOY = {
  light: { web: "#6E5200", games: "#7A3796", ai: "#2A4FA8", film: "#A8261A" },
  dark: { web: "#E9C46A", games: "#D59BF0", ai: "#86AEFF", film: "#FF7D5C" },
  screen: { web: "#E9C46A", games: "#D59BF0", ai: "#86AEFF", film: "#FF7D5C" },
};

/** Temper sheen used on the cooling logo: straw → purple → blue. */
export const TEMPER = ["#E9C46A", "#D59BF0", "#86AEFF"];

/** Surface colours of the always-dark screen scope. */
export const SCREEN = { bg: "#0E0C0B", surface: "#16120F", surface2: "#211A16", ink: "#F3EEE7", muted: "#AFA59A" };

/** "#RRGGBB" → [r, g, b] in 0..1 (for GLSL uniforms). */
export function rgb01(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Flat Float32-ready array of the 6 heat stops (18 numbers) for a `uniform vec3 u_ramp[6]`. */
export const HEAT_RGB = HEAT.flatMap(rgb01);

/** Samples the heat ramp at t ∈ [0, 1] → [r, g, b] in 0..1. */
export function heatAt(t) {
  const x = Math.min(1, Math.max(0, t)) * (HEAT.length - 1);
  const i = Math.min(HEAT.length - 2, Math.floor(x));
  const f = x - i;
  const a = rgb01(HEAT[i]);
  const b = rgb01(HEAT[i + 1]);
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** CSS rgb() string for a heat sample, e.g. for SVG fills. */
export function heatCss(t, alpha = 1) {
  const [r, g, b] = heatAt(t).map((v) => Math.round(v * 255));
  return alpha < 1 ? `rgb(${r} ${g} ${b} / ${alpha})` : `rgb(${r} ${g} ${b})`;
}

/** Current alloy colours for the resolved theme (runtime only). */
export function alloyColours(scope) {
  if (scope) return ALLOY[scope];
  const dark = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark";
  return ALLOY[dark ? "dark" : "light"];
}

/** Recency heat used by the Esse embers (§5.1): days since last push → 0..1. */
export function recencyHeat(days) {
  if (!Number.isFinite(days)) return 0.12;
  return days <= 30 ? 1 : days <= 180 ? 0.55 : days <= 365 ? 0.3 : 0.12;
}
