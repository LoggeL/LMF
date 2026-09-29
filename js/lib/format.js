/**
 * Formatting (de-DE)  [LEAD]
 * Pure and Node-importable. Dates are ISO strings ("2026-09-28" or full timestamps) and are
 * formatted as calendar days without time-zone drift.
 *
 *   date("2026-09-28")            → "28.09.2026"
 *   date("2026-09-28", "dayMonth")→ "28.09."   · "month" → "09.2026" · "year" → "2026" · "monthShort" → "Sept. 2026"
 *   dateLong("2026-09-28")        → "28. September 2026"
 *   weekday("2026-09-28")         → "Montag"
 *   number(1234.5, 1)             → "1.234,5"
 *   percent(54.7)                 → "54,7 %"
 *   duration("6:28")              → "6:28"   · durationLabel("6:28") → "6 Minuten 28 Sekunden"
 *   pad(7, 3)                     → "007"    · stockLabel(17) → "Nº 017"
 *   nightLabel(3)                 → "Nacht 03"
 *   plural(1, "Quelle", "Quellen")→ "1 Quelle"
 *   year(iso)                     → 2026
 */

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const MONTHS_SHORT = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];
const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function parts(iso) {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(String(iso ?? ""));
  return m ? { y: m[1], m: m[2], d: m[3] } : null;
}

export function date(iso, precision = "day") {
  const p = parts(iso);
  if (!p) return "";
  if (precision === "year" || !p.m) return p.y;
  if (precision === "monthShort") return `${MONTHS_SHORT[+p.m - 1]} ${p.y}`;
  if (precision === "month" || !p.d) return `${p.m}.${p.y}`;
  if (precision === "dayMonth") return `${p.d}.${p.m}.`;
  return `${p.d}.${p.m}.${p.y}`;
}

export function dateLong(iso) {
  const p = parts(iso);
  if (!p) return "";
  if (!p.m) return p.y;
  if (!p.d) return `${MONTHS[+p.m - 1]} ${p.y}`;
  return `${+p.d}. ${MONTHS[+p.m - 1]} ${p.y}`;
}

export function weekday(iso) {
  const p = parts(iso);
  if (!p?.d) return "";
  return WEEKDAYS[new Date(Date.UTC(+p.y, +p.m - 1, +p.d)).getUTCDay()];
}

/** ISO date (YYYY-MM-DD) for a <time datetime>. */
export const isoDay = (iso) => String(iso ?? "").slice(0, 10);

export const year = (iso) => {
  const p = parts(iso);
  return p ? Number(p.y) : NaN;
};

const nf = new Map();
export function number(value, digits = 0) {
  if (!Number.isFinite(Number(value))) return "";
  const key = digits;
  if (!nf.has(key)) nf.set(key, new Intl.NumberFormat("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits }));
  return nf.get(key).format(Number(value));
}

/** "54,7 %" (narrow no-break space before %, as in German typesetting). */
export function percent(value, digits = 1) {
  const s = number(value, Number.isInteger(Number(value)) && digits === 1 ? 0 : digits);
  return s ? `${s} %` : "";
}

export function duration(value) {
  return /^\d+:\d\d(:\d\d)?$/.test(String(value ?? "")) ? String(value) : "";
}

/** Spoken form for accessible names: "6 Minuten 28 Sekunden". */
export function durationLabel(value) {
  const d = duration(value);
  if (!d) return "";
  const n = d.split(":").map(Number);
  const [h, m, s] = n.length === 3 ? n : [0, n[0], n[1]];
  const out = [];
  if (h) out.push(`${h} ${h === 1 ? "Stunde" : "Stunden"}`);
  if (m) out.push(`${m} ${m === 1 ? "Minute" : "Minuten"}`);
  if (s) out.push(`${s} ${s === 1 ? "Sekunde" : "Sekunden"}`);
  return out.join(" ") || "0 Sekunden";
}

export const pad = (n, width = 2) => String(n).padStart(width, "0");
export const stockLabel = (n) => (Number.isInteger(n) ? `Nº ${pad(n, 3)}` : "");
export const nightLabel = (n) => `Nacht ${pad(n, 2)}`;
export const plural = (n, one, many) => `${number(n)} ${Number(n) === 1 ? one : many}`;

/** Host without www for compact link labels: "kolpingtheater-ramsen.de". */
export function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const format = { date, dateLong, weekday, isoDay, year, number, percent, duration, durationLabel, pad, stockLabel, nightLabel, plural, host };
export default format;
