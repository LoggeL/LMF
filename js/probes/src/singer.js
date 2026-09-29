/**
 * Probestück · Zwei Regler (MelodAI) · die Sängerin  [WP4]  · Nachbau
 *
 * A tiny Vocaloid-style singing synth, so the „Gesang“ stem sings the German lyrics instead of
 * humming them. Real Vocaloid is proprietary and sample-based; this is none of that: no samples,
 * no network, no dependencies, only Web Audio nodes.
 *
 *   syllables()  German word → syllables → phonemes (small rule G2P, symbols below)
 *   plan()       one note per syllable on a ¼-beat grid; the first syllable of every word sits on
 *                the word's beat, so the karaoke sweep in mixer.js stays in sync
 *   timeline()   phonemes in seconds: consonant onsets *before* the beat, so vowels land on it
 *   singer()     glottal PeriodicWave + aspiration noise → 4 moving formant bandpasses summed in
 *                alternating sign (+ fixed nasal and air bands, and a voice bar: the pulse through a
 *                lowpass that tracks f0, so open vowels keep their fundamental) → EQ → compressor →
 *                dry + generated-impulse reverb → out.
 *                Pitch: portamento with overshoot, a scoop after rests, a fall at line ends,
 *                vibrato that blooms on long notes, slow jitter.
 *
 * Symbols: vowels a e E i I o O u U y Y 2 9 @ (schwa) 6 (-er); diphthongs aI aU OY;
 * consonants p t k b d g f v s z S (sch) C (ich) x (ach) h m n N (ng) l R j.
 *
 * mixer.js imports this lazily after „Ton an“: no bytes and no audio before the opt-in.
 * Node-importable: nothing touches `window` at import time.
 */

/* ── G2P (pure) ────────────────────────────────────────────────────────────────────────────────── */

const isV = (c) => "aeiouäöüy".includes(c);
const VV = ["ei", "ai", "au", "eu", "äu", "ie", "aa", "ee", "oo"];
const CC = ["tsch", "sch", "ch", "ck", "ng", "ph", "pf", "qu", "rh", "th", "tz", "dt"];
const ONSET2 = ["pr", "br", "tr", "dr", "kr", "gr", "fr", "pl", "bl", "kl", "gl", "fl", "schl", "schm", "schn", "schr", "schw"];
const PREFIX = ["be", "ge", "er", "ver", "zer", "ent", "emp"];
const DIPH = { ei: "aI", ai: "aI", au: "aU", eu: "OY", äu: "OY" };
const SHORT = { a: "a", e: "E", i: "I", o: "O", u: "U", ä: "E", ö: "9", ü: "Y", y: "Y" };
const LONG = { a: "a", e: "e", i: "i", o: "o", u: "u", ä: "E", ö: "2", ü: "y", y: "y" };
const MAP = { sch: "S", tsch: "tS", ck: "k", ng: "N", ph: "f", pf: "pf", qu: "kv", rh: "R", th: "t", tz: "ts", z: "ts", ß: "s", c: "k", v: "f", w: "v", x: "ks", r: "R", y: "j", dt: "t" };
const DEVOICE = { b: "p", d: "t", g: "k" };

/** Letters → grapheme units ({s, v: vowel?, long?}), keeping the original spelling in `o`. */
function units(word) {
  const w = word.toLowerCase();
  const out = [];
  for (let i = 0; i < w.length; ) {
    const c = w[i];
    if (!/[a-zäöüß]/.test(c)) {
      i++;
      continue;
    }
    let s = c;
    let v = isV(c);
    let long = false;
    if (v) {
      if (VV.includes(w.slice(i, i + 2))) s = w.slice(i, i + 2);
      if (w[i + s.length] === "h" && !isV(w[i + s.length + 1] ?? "")) (s += "h"), (long = true);
    } else s = CC.find((u) => w.startsWith(u, i)) ?? c;
    out.push({ s, v, long, o: word.slice(i, i + s.length) });
    i += s.length;
  }
  return out;
}

/**
 * One German word → [{ text, ph: [..phonemes], stress }]. Consonants between two vowels: one (or
 * a valid pair like „pr“) opens the next syllable, the rest close the previous one.
 */
export function syllables(word) {
  const u = units(word);
  const nuc = u.map((x, i) => (x.v ? i : -1)).filter((i) => i >= 0);
  if (!nuc.length) return [{ text: word.replace(/[^\p{L}]/gu, ""), ph: [], stress: true }];
  const cuts = [0];
  for (let k = 1; k < nuc.length; k++) {
    const a = nuc[k - 1] + 1;
    const b = nuc[k];
    const n = b - a;
    const pair = n >= 2 && ONSET2.includes(u[b - 2].s + u[b - 1].s);
    // „ng“ never opens a syllable (sin-gen → sing-en)
    let c = u[b - 1].s === "ng" ? b : n <= 1 ? a : b - (pair ? 2 : 1);
    // after ver-/zer-/ent-, s + t/p opens the stem: ver-ste-hen (not after be-/ge-/er-: bes-te, ges-tern)
    for (let i = Math.max(a, 3); k < 2 && i < b; i++) if (u[i].s === "s" && /^[pt]$/.test(u[i + 1].s) && PREFIX.includes(u.slice(0, i).map((x) => x.s).join(""))) c = i;
    cuts.push(c);
  }
  cuts.push(u.length);
  const parts = cuts.slice(0, -1).map((c, k) => u.slice(c, cuts[k + 1]));
  const lower = parts.map((p) => p.map((x) => x.s).join(""));
  let stress = 0;
  // be-/ge-/er-… are unstressed prefixes, but not in ge-hen, se-hen (a silent h, see below)
  const silentH = (k) => k && /^he/.test(lower[k]) && parts[k - 1].at(-1).v;
  if (parts.length > 1 && PREFIX.includes(lower[0]) && !silentH(1)) stress = 1;
  if (parts.length > 2 && lower[0] === "pro") stress = 1;
  return parts.map((p, k) => {
    const ph = [];
    const vi = p.findIndex((x) => x.v);
    p.forEach((x, j) => {
      const prev = j ? p[j - 1] : k ? parts[k - 1].at(-1) : null;
      // er-/ver-/zer-/ent- keep their E: [fEɐ], unlike the -er ending
      if (x.v) return ph.push(...vowel(x, p.slice(j + 1), k === stress, !k && stress));
      const coda = j > vi;
      let s = x.s;
      if (coda && s === "r") return ph.at(-1) === "6" || ph.push("6");
      if (s === "h" && (coda || silentH(k))) return;
      // ch after a, o, u, au is [x] (ach), also across a syllable cut (Spra-che)
      if (s === "ch" && (coda || k)) return ph.push(/^(a|o|u|au)/.test((coda ? p[vi] : parts[k - 1].findLast((y) => y.v)).s) ? "x" : "C");
      // final -ig is [ɪç] (König)
      if (coda && s === "g" && p[vi].s === "i" && !parts[k + 1] && !p[j + 1]) return ph.push("C");
      if (coda && DEVOICE[s]) return ph.push(DEVOICE[s]);
      if (!coda && j === 0 && s === "s" && /^[pt]$/.test(p[1]?.s ?? "")) return ph.push("S");
      if (!coda && s === "s" && p[j + 1]?.v && (!prev || prev.v)) return ph.push("z");
      if (s === "ch") return ph.push("C");
      ph.push(...(MAP[s] ?? s));
    });
    // „-er“: the r went into 6 already; keep one of a doubled consonant per syllable
    return { text: p.map((x) => x.o).join(""), ph: ph.filter((c, i) => c !== ph[i - 1]), stress: k === stress };
  });
}

function vowel(x, rest, stressed, pre) {
  const s = x.s.replace("h", "");
  if (DIPH[s]) return [DIPH[s]];
  if (s === "ie") return ["i"];
  const long = x.long || s.length === 2 || !rest.length || rest[0].s === "ß"; // ß follows long vowels
  if (s === "e" && !stressed && !x.long) return [pre && rest.length ? "E" : rest[0]?.s === "r" ? "6" : "@"];
  return [(long ? LONG : SHORT)[s[0]]];
}

/* ── Timing (pure) ─────────────────────────────────────────────────────────────────────────────── */

export const GRID = 0.25; // beats

/**
 * Score (buildScore() in mixer.js: words + lead, same order) → syllable notes in beats.
 * Words shorter than two beats split their beat on the ¼ grid (the stressed syllable takes the
 * rest); held words give each leading syllable ½ beat and the last one the hold. Pickups before
 * the stress sing the previous word's note, syllables after it stay on the word's note.
 */
export function plan(score) {
  const out = [];
  score.words.forEach((w, wi) => {
    const syl = syllables(w.text);
    const n = syl.length;
    const midi = score.lead[wi].midi;
    const prevMidi = wi && score.words[wi - 1].line === w.line ? score.lead[wi - 1].midi : midi - 2;
    const lineEnd = !score.words[wi + 1] || score.words[wi + 1].line !== w.line;
    let durs;
    if (w.dur > 1) durs = syl.map((_, k) => (k < n - 1 ? 0.5 : w.dur - 0.5 * (n - 1)));
    else {
      const base = Math.max(GRID, Math.floor(w.dur / n / GRID) * GRID);
      durs = syl.map(() => base);
      const st = Math.max(0, syl.findIndex((s) => s.stress));
      durs[st] += w.dur - base * n;
    }
    const st = syl.findIndex((s) => s.stress);
    let t = w.start;
    syl.forEach((s, k) => {
      out.push({ word: wi, text: s.text, ph: s.ph, stress: s.stress, start: t, dur: durs[k], midi: k < st ? prevMidi : midi, lineEnd: lineEnd && k === n - 1 });
      t += durs[k];
    });
  });
  return out;
}

const CD = { p: 0.07, t: 0.07, k: 0.075, b: 0.05, d: 0.045, g: 0.05, f: 0.08, v: 0.055, s: 0.09, z: 0.07, S: 0.1, C: 0.08, x: 0.08, h: 0.06, m: 0.07, n: 0.065, N: 0.07, l: 0.06, R: 0.05, j: 0.05 };
const isVowel = (p) => !(p in CD);
const BREATH = 0.1; // s of silence (at least) before the next line's breath

/**
 * Syllable notes → phoneme events in seconds within the loop, sorted:
 *   { t, d, p, F (formant target), m (midi), on (pitch onset), prev (previous midi or null), stress, fall,
 *     bare (a word that opens on its vowel), room (s before the beat a glide may start: the previous
 *     vowel keeps its first 60 % at its own pitch) }
 * plus { t, p: "_" } rests. Onset consonants end exactly on the vowel's beat.
 */
export function timeline(notes, beat, loop) {
  const ev = [];
  const split = (ph) => {
    const v = ph.findIndex(isVowel);
    return v < 0 ? [ph, [], []] : [ph.slice(0, v), ph.slice(v, ph.findLastIndex(isVowel) + 1), ph.slice(ph.findLastIndex(isVowel) + 1)];
  };
  const parts = notes.map((n) => split(n.ph));
  const sum = (a) => a.reduce((s, p) => s + CD[p], 0);
  // no geminates in German: wis|sen sings one s, as the next onset
  parts.forEach((p, i) => parts[i + 1] && !notes[i].lineEnd && p[2].at(-1) === parts[i + 1][0][0] && p[2].pop());
  // where the breath before line-first note j starts
  const inhale = (j) => notes[j].start * beat - Math.min(0.2, sum(parts[j][0])) - 0.22;
  let pv = null; // the previous note's vowel [start, length]
  notes.forEach((n, i) => {
    const [on, nuc, co] = parts[i];
    const V = n.start * beat;
    const next = notes[i + 1];
    const prev = notes[i - 1];
    const after = prev && !prev.lineEnd;
    const joined = next && !n.lineEnd;
    // squeeze consonants so a vowel keeps at least ~55 % of its span
    let kOn = 1;
    if (after) {
      const span = V - prev.start * beat;
      const cons = sum(parts[i - 1][2]) + sum(on);
      if (cons > 0.45 * span) kOn = (0.45 * span) / cons;
    } else kOn = Math.min(1, 0.2 / (sum(on) || 1));
    let kCo = 1;
    // a line ends before the next line's breath (for the last line: the one after the loop wrap)
    let end = n.lineEnd ? Math.min((n.start + n.dur) * beat - BREATH, (next ? inhale(i + 1) : inhale(0) + loop) - 0.02) : (n.start + n.dur) * beat;
    if (joined) {
      const span = next.start * beat - V;
      const nOn = parts[i + 1][0];
      const cons = sum(co) + sum(nOn);
      const k = cons > 0.45 * span ? (0.45 * span) / cons : 1;
      kCo = k;
      end = next.start * beat - sum(nOn) * k;
      // the next word opens on its vowel: the glottal break (play()) takes the last 50 ms, so the coda
      // finishes before it („wissen | ob“, not „wisse | ob“)
      if (!nOn.length && next.word !== n.word) end -= 0.05;
    }
    const vowelF = nuc[0] ?? "@";
    let t = V - sum(on) * kOn;
    if (!after) ev.push({ t: t - 0.22, d: 0.18, p: "breath", F: vowelF });
    for (const p of on) {
      const d = CD[p] * kOn;
      ev.push({ t, d, p, F: voiced(p) ? p : vowelF, m: n.midi });
      t += d;
    }
    const codaT = end - sum(co) * kCo;
    const vd = Math.max(0.04, codaT - V);
    // a second vowel („-ier“ → i + 6) is a short off-glide at the end
    const g = nuc.length > 1 ? Math.min(0.12, (vd * 0.35) / (nuc.length - 1)) : 0;
    nuc.forEach((p, j) => {
      const at = j ? V + vd - (nuc.length - j) * g : V;
      const d = j ? g : vd - g * (nuc.length - 1);
      ev.push({ t: at, d, p, F: p, m: n.midi, on: !j, prev: after ? prev.midi : null, stress: n.stress, fall: n.lineEnd && j === nuc.length - 1, bare: !j && !on.length && (!after || prev.word !== n.word), room: after && pv ? V - pv[0] - 0.6 * pv[1] : 1 });
    });
    pv = nuc.length ? [V, vd] : null;
    t = V + vd;
    for (const p of co) {
      const d = CD[p] * kCo;
      ev.push({ t, d, p, F: voiced(p) ? p : nuc.at(-1) ?? vowelF, m: n.midi });
      t += d;
    }
    if (!joined) ev.push({ t: end, d: 0, p: "_" });
  });
  for (const e of ev) e.t = ((e.t % loop) + loop) % loop;
  return ev.sort((a, b) => a.t - b.t);
}
const voiced = (p) => p in FT;

/* ── Voice (Web Audio) ─────────────────────────────────────────────────────────────────────────── */

// formants F1–F4 (Hz), a bright, young voice
const FT = {
  a: [850, 1400, 2900, 3900], e: [430, 2400, 3000, 3900], E: [620, 2050, 2900, 3900], i: [310, 2750, 3300, 4200], I: [420, 2250, 2950, 4000],
  o: [460, 850, 2800, 3700], O: [600, 950, 2750, 3700], u: [340, 800, 2600, 3600], U: [430, 1000, 2600, 3600], y: [320, 1900, 2600, 3700],
  Y: [430, 1650, 2550, 3700], 2: [440, 1550, 2600, 3700], 9: [560, 1500, 2600, 3700], "@": [520, 1600, 2750, 3800], 6: [750, 1300, 2750, 3800],
  m: [280, 1100, 2500, 3500], n: [280, 1650, 2600, 3500], N: [280, 2100, 2700, 3500], l: [380, 1250, 2800, 3800], R: [520, 1300, 2300, 3600],
  j: [300, 2550, 3200, 4100], v: [320, 1400, 2500, 3600], z: [320, 1700, 2600, 3700], b: [300, 900, 2400, 3500], d: [320, 1700, 2600, 3600], g: [300, 2000, 2500, 3600],
};
FT.aI = FT.a;
FT.aU = FT.a;
FT.OY = FT.O;
const GLIDE = { aI: "I", aU: "U", OY: "I" }; // eu glides to a bright [ɪ], else „Neu“ sounds like „No“
const BW = [80, 100, 150, 220];
// parallel formants alternate in sign (as in Klatt's parallel synth): between two resonances their
// phases are opposite, so same-sign outputs would cancel into deep, hollow notches.
// A1–A4 per sound: front vowels lift F2/F3 (else a high /i/ is all fundamental and reads as /u/),
// back vowels drop F3/F4 (else /o/ carries an /e/'s top)
const AMP = [1, -0.95, 0.7, -0.45];
const AK = { e: [1, -1.1, 0.7, -1] };
for (const k of "iyj") AK[k] = [1, -2, 1, -1.1];
for (const k of "IY") AK[k] = [1, -3, 1.4, -1];
// back vowels: F1 and F2 sit close, and below F1 the two bands are nearly in phase, so a full-weight
// negative F2 (and the nasal band) would cancel the fundamental and lift the heard F1 (/o/ → /ɔ/)
const BACK = ["o", "O", "u", "U", "OY"];
for (const k of BACK) AK[k] = [1, -0.5, 0.2, -0.1];
const amp = (key) => AK[key] ?? AMP;
// fixed bands [Hz, Q, gain]: nasal murmur (below F1, so negative; off for back vowels), air (above F4)
const FIX = [[270, 3, -0.3], [5200, 2, 0.12]];
const fixA = (key, k) => (k || !BACK.includes(key) ? FIX[k][2] : 0);
// voice bar: the pulse through a lowpass at 1.2·f0, keeps H1 under open vowels (not under close
// ones, whose F1 sits below the fundamental: there it would drown F2)
const vbar = (key, f0) => (FT[key][0] < f0 ? 0.12 : 0.4);
// voicing level per phoneme (vowels 1)
const VG = { m: 0.25, n: 0.25, N: 0.25, l: 0.5, R: 0.6, j: 0.7, v: 0.4, z: 0.4, b: 0.2, d: 0.2, g: 0.2, "@": 0.75, 6: 0.8 };
// noise band [Hz, Q, level]: fricatives hold it, plosives burst it (well under the vowel). Voiced ones
// get far less noise and more voice (VG): voicing, not noise, tells „wollte“ from „follte“
const NZ = { s: [7000, 2.2, 0.5], z: [6500, 2, 0.2], S: [3000, 1.6, 0.55], C: [4300, 3, 0.4], x: [1700, 2.5, 0.35], f: [6000, 0.7, 0.25], v: [5000, 0.8, 0.09], p: [900, 1, 0.2], t: [4500, 1.3, 0.15], k: [2200, 2, 0.16], b: [900, 1, 0.065], d: [4000, 1.3, 0.075], g: [2200, 2, 0.08] };
const PLOSIVE = "ptkbdg";
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
// formant bandwidths widen with pitch (as in a high voice), else a formant between two harmonics goes dark
const bw = (k, f0) => BW[k] * (1 + f0 / 800);
// vowel targets at this pitch: F1 never below the fundamental (sopranos tune F1 up to f0), except in
// the close front vowels, where a lifted F1 would boost H1 over F2 and darken /i/ into /ü/
const fmt = (key, f0) => FT[key].map((f, k) => (k || !isVowel(key) || "iIyYe".includes(key) ? f : Math.max(f, 1.05 * f0)));
/**
 * How loud the pulse comes out of the whole bank for this sound at this pitch: per harmonic the
 * complex sum of every band (signs matter), then the power sum. High voices put F1 between
 * harmonics; dividing by this keeps „a“ as loud as „i“.
 */
export function loudness(key, f0) {
  let s = 0;
  for (let h = 1; h * f0 < 8000; h++) {
    let re = 0;
    let im = 0;
    // analog 2-pole band: a·jb/(x + jb) (bandpass) or a/(x + jb) (lowpass), x = 1 − r², b = r/q
    const add = (a, F, q, lp) => {
      const r = (h * f0) / F;
      const x = 1 - r * r;
      const b = r / q;
      const d = x * x + b * b;
      re += (a * (lp ? x : b * b)) / d;
      im += (a * (lp ? -b : b * x)) / d;
    };
    fmt(key, f0).forEach((F, k) => add(amp(key)[k], F, F / bw(k, f0)));
    FIX.forEach(([F, q], k) => add(fixA(key, k), F, q));
    add(vbar(key, f0), 1.2 * f0, 1, 1);
    s += h ** -2.2 * (re * re + im * im);
  }
  return Math.sqrt(s);
}
const evenOut = (key, f0) => Math.min(isVowel(key) ? 2 : 1, Math.max(0.5, 0.5 / loudness(key, f0)));

const cache = new WeakMap();
/** White noise, jitter walk and a reverb impulse, made once per AudioContext. */
function buffers(ac) {
  let b = cache.get(ac);
  if (b) return b;
  const sr = ac.sampleRate;
  const noise = ac.createBuffer(1, sr, sr);
  noise.getChannelData(0).forEach((_, i, a) => (a[i] = Math.random() * 2 - 1));
  const jit = ac.createBuffer(1, sr * 3, sr);
  let v = 0;
  let to = 0;
  jit.getChannelData(0).forEach((_, i, a) => {
    if (i % Math.round(sr * 0.07) === 0) to = Math.random() * 2 - 1;
    a[i] = v += (to - v) * 0.0008;
  });
  const len = Math.round(sr * 1.6);
  const ir = ac.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) ir.getChannelData(c).forEach((_, i, a) => (a[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3 * (i < sr * 0.012 ? 0 : 1)));
  // glottal pulse: Rosenberg-like, harmonics falling ~1/n^1.1, a touch brighter up top
  const n = 64;
  const im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = k ** -1.1 * (1 + 0.25 * Math.sin(k * 0.9));
  const wave = ac.createPeriodicWave(new Float32Array(n), im);
  cache.set(ac, (b = { noise, jit, ir, wave }));
  return b;
}

/**
 * The voice. `singer(ac, out, score, beat)` → { beat(b, at), stop(t), alive }.
 * beat(b, at) schedules every event that starts inside loop beat b (at = its audio time); call it
 * once per beat from a look-ahead scheduler, in order. stop(t) fades out and stops all sources.
 */
export function singer(ac, out, score, beat) {
  const loop = score.beats * beat;
  const ev = timeline(plan(score), beat, loop);
  // bucketed PRE s early: play() writes automation up to ~0.2 s before an event (portamento, scoop,
  // voice onset), so each beat schedules the events from PRE after it to PRE after the next one
  const PRE = 0.25;
  const N = score.beats;
  const byBeat = Array.from({ length: N }, () => []);
  for (const e of ev) {
    const b = (Math.floor((e.t - PRE) / beat + 1e-9) + N) % N;
    byBeat[b].push([e, (((e.t - b * beat) % loop) + loop) % loop]); // [event, s after its bucket's beat]
  }

  const B = buffers(ac);
  const gain = (v, to) => {
    const g = ac.createGain();
    g.gain.value = v;
    if (to) g.connect(to);
    return g;
  };
  const filt = (type, f, q, g) => {
    const x = ac.createBiquadFilter();
    x.type = type;
    x.frequency.value = f;
    x.Q.value = q;
    if (g !== undefined) x.gain.value = g;
    return x;
  };
  let alive = 0;
  let stopped = false;
  const sources = [];
  const src = (n) => {
    alive++;
    n.onended = () => --alive || all.forEach((x) => x.disconnect());
    sources.push(n);
    n.start();
    return n;
  };

  // out chain: formants → highpass → presence → compressor → dry + reverb
  const level = gain(1.9, out);
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 3;
  comp.attack.value = 0.005;
  comp.release.value = 0.15;
  comp.connect(level);
  const conv = ac.createConvolver();
  conv.buffer = B.ir;
  const wet = gain(0.22, level);
  comp.connect(conv).connect(wet);
  const hp = filt("highpass", 110, 0.7);
  const pres = filt("peaking", 3200, 0.8, 4);
  hp.connect(pres).connect(comp);

  const mix = gain(1, hp);
  const body = gain(1); // voice + breath → formant bank
  const A = [];
  const F = BW.map((bw, k) => {
    const f = filt("bandpass", FT["@"][k], FT["@"][k] / bw);
    body.connect(f).connect((A[k] = gain(AMP[k], mix)));
    return f;
  });
  const FG = FIX.map(([f, q, a]) => body.connect(filt("bandpass", f, q)).connect(gain(a, mix)));

  const osc = ac.createOscillator();
  osc.setPeriodicWave(B.wave);
  osc.frequency.value = hz(score.lead[0].midi);
  const vg = gain(0, body);
  osc.connect(vg);
  const vb = filt("lowpass", 1.2 * osc.frequency.value, 0); // Q in dB for lowpass: 0 dB
  const vbg = gain(0.4, mix);
  vg.connect(vb).connect(vbg);
  const lfo = ac.createOscillator();
  lfo.frequency.value = 5.6;
  const vib = gain(0, osc.detune);
  lfo.connect(vib);
  const jit = ac.createBufferSource();
  jit.buffer = B.jit;
  jit.loop = true;
  jit.connect(gain(9, osc.detune));
  const noise = ac.createBufferSource();
  noise.buffer = B.noise;
  noise.loop = true;
  const asp = gain(0, body);
  const nbp = filt("bandpass", 6000, 2);
  const ng = gain(0, hp);
  noise.connect(asp);
  noise.connect(nbp).connect(ng);
  const all = [level, comp, conv, wet, hp, pres, mix, body, ...F, ...A, ...FG, osc, vg, vb, vbg, lfo, vib, jit, noise, asp, nbp, ng];
  [osc, lfo, jit, noise].forEach(src);

  // automation never points before now (negative times throw; late events just start at once)
  const T0 = (t) => Math.max(t, ac.currentTime);
  const aim = (p, v, t, tc) => p.setTargetAtTime(v, T0(t), tc);
  const set = (p, v, t) => p.setValueAtTime(v, T0(t));
  let f0 = hz(score.lead[0].midi); // the note being sung (consonants borrow it)
  const form = (key, t, tc) =>
    FT[key] &&
    fmt(key, f0).forEach((f, k) => {
      aim(F[k].frequency, f, t, tc);
      aim(F[k].Q, f / bw(k, f0), t, tc);
      aim(A[k].gain, amp(key)[k], t, tc);
      k || aim(vbg.gain, vbar(key, f0), t, tc);
      k < 2 && aim(FG[k].gain, fixA(key, k), t, tc);
    });

  function play(e, T) {
    const p = e.p;
    const fr = osc.frequency;
    if (p === "_") {
      aim(vg.gain, 0, T, 0.03);
      aim(asp.gain, 0, T, 0.03);
      aim(ng.gain, 0, T, 0.01);
      aim(vib.gain, 0, T, 0.05);
      return;
    }
    if (e.m) f0 = hz(e.m);
    // vowels: the resonances move ~20 ms ahead, so the voice is on its vowel by the beat; after a
    // glottal break they are in place before the voice comes back (else „ist“ swells in 60 ms late)
    form(e.F, isVowel(p) ? T - (e.bare ? 0.05 : 0.02) : T, isVowel(p) ? (e.bare ? 0.01 : 0.02) : 0.012);
    if (p === "breath") {
      aim(asp.gain, 0.1, T, 0.04);
      aim(asp.gain, 0, T + e.d, 0.03);
      return;
    }
    if (isVowel(p)) {
      const lv = (VG[p] ?? 1) * (e.stress ? 1 : 0.85);
      // the voice comes in a touch early, so it is heard on the beat; a word that opens on its vowel
      // gets the German glottal onset (Feuer | ist): a short break, then a firmer attack
      if (e.bare) aim(vg.gain, 0, T - 0.05, 0.008);
      aim(vg.gain, lv * evenOut(p, f0), T - (e.bare ? 0.014 : 0.006), e.bare ? 0.009 : 0.012);
      aim(asp.gain, 0.03, T, e.d < 0.2 ? 0.008 : 0.02); // a short vowel cuts a plosive's puff at once
      aim(ng.gain, 0, T, 0.008);
      const g = GLIDE[p];
      if (g) {
        const at = T + Math.max(e.d * 0.45, e.d - 0.22);
        form(g, at, 0.045);
        aim(vg.gain, lv * evenOut(g, f0), at, 0.045);
      }
      const f = f0;
      if (e.fall) aim(fr, f * 0.89, T + e.d - 0.1, 0.05);
      if (!e.on) return;
      if (e.prev === null) {
        // scoop into the first note of a phrase
        set(fr, f * 0.94, T - 0.06);
        aim(fr, f, T - 0.04, 0.035);
      } else if (Math.abs(e.m - e.prev) >= 2) {
        // portamento: 10–90 % over ~40 ms + 8 ms per semitone, aimed 0.25 + 0.1·Δ semitones past the
        // note, so it overshoots by ~30–40 cents just after the beat, then settles. It never starts
        // before `room` (the previous vowel's first 60 %); a short vowel gets a quicker glide instead.
        const D = e.m - e.prev;
        const g = Math.min(0.04 + 0.008 * Math.abs(D), Math.max(0.025, e.room) / 1.7);
        aim(fr, f * 2 ** ((D * 0.1 + Math.sign(D) * 0.25) / 12), T - 1.7 * g, 0.7 * g);
        aim(fr, f, T, 0.05);
      } else aim(fr, f, T - 0.05, 0.03);
      aim(vb.frequency, 1.2 * f, T - 0.06, 0.03);
      aim(vib.gain, 0, T - 0.05, 0.04);
      if (e.d > 0.45) aim(vib.gain, 32, T + Math.min(0.35, e.d * 0.4), 0.18);
      return;
    }
    const n = NZ[p];
    if (PLOSIVE.includes(p)) {
      // closure (near silence, a faint voice bar for b d g), burst, then a puff that dies away
      const vp = "bdg".includes(p);
      const rel = T + e.d * 0.6;
      aim(vg.gain, vp ? 0.05 : 0, T, 0.008);
      aim(asp.gain, 0, T, 0.006);
      set(nbp.frequency, n[0], rel - 0.002);
      set(nbp.Q, n[1], rel - 0.002);
      set(ng.gain, 0, rel);
      ng.gain.linearRampToValueAtTime(n[2], T0(rel) + 0.004);
      aim(ng.gain, 0, rel + 0.006, 0.012);
      aim(asp.gain, vp ? 0.08 : 0.2, rel + 0.004, 0.006);
      aim(asp.gain, 0, Math.min(rel + (vp ? 0.012 : 0.03), T + e.d - 0.002), 0.02); // the puff ends with the consonant
      // b d g: German short-lag stops, the voice comes back with the vowel
      return;
    }
    aim(vg.gain, p in VG ? VG[p] * evenOut(p, f0) : 0, T, 0.007);
    aim(asp.gain, p === "h" ? 0.45 : 0, T, 0.01);
    if (n) {
      set(nbp.frequency, n[0], T);
      set(nbp.Q, n[1], T);
      aim(ng.gain, n[2], T, 0.015);
      aim(ng.gain, 0, T + e.d - 0.02, 0.012);
    } else aim(ng.gain, 0, T, 0.01);
  }

  let last = NaN; // the beat scheduled last
  const run = (b, at, from) => {
    for (const [e, off] of byBeat[((b % N) + N) % N]) if (at + off >= from) play(e, at + off);
  };
  return {
    beat(b, at) {
      // a fresh start (or a jump): the beat before holds the first note's onset consonants; sing
      // whatever of it still lies ahead
      if (b !== last + 1) run(b - 1, at - beat, ac.currentTime + 0.005);
      last = b;
      run(b, at, -Infinity);
    },
    stop(t = ac.currentTime) {
      if (stopped) return;
      stopped = true;
      level.gain.cancelScheduledValues(t);
      level.gain.setValueAtTime(level.gain.value, t);
      level.gain.linearRampToValueAtTime(0, t + 0.04);
      for (const s of sources) s.stop(t + 0.06);
      // and let go of the graph on the wall clock too: a context suspended right after this never
      // reaches the stop time, so onended alone would keep ~30 nodes and the reverb alive
      setTimeout(() => all.forEach((x) => x.disconnect()), Math.max(0, t - ac.currentTime) * 1000 + 100);
    },
    get alive() {
      return alive;
    },
  };
}
