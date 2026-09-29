/**
 * Probestück · Kettenreaktion (Bomberman)  [WP4]  · Nachbau · spec §5.7a
 *
 * Source for the mechanics: README of LoggeL/bomberman-web (commit 5436b40):
 *   „Six 15×13 arenas“ · „Chain‑reaction explosions — a blast that touches another bomb
 *   detonates it instantly, resolved within the same tick.“ · fixed 60 Hz simulation tick.
 * Everything else here (field layout, fuse, range, palette) is a simplified replica for this page.
 *
 * The rules live in pure functions (makeGrid, resolveTick, placeBomb) that import nothing and
 * never touch the DOM, so Node and the tests can run them directly.
 */

import { announcer, calmSource, nextId } from "./index.js";

export const KIND = "nachbau";
export const CHIP = "Kleineres Feld, echte Regel: Kettenreaktionen im selben Tick.";

/* ── Rules (pure) ──────────────────────────────────────────────────────────────────────────────── */

export const COLS = 15;
export const ROWS = 13;
export const FLOOR = 0;
export const SOLID = 1;
export const BRICK = 2;
export const FUSE_MS = 1400;
export const FLAME_MS = 380;
export const RANGE = 2;
export const MAX_BOMBS = 12;
export const TICK_MS = 1000 / 60;

export const idx = (x, y) => y * COLS + x;
export const xy = (cell) => [cell % COLS, Math.floor(cell / COLS)];
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Small seeded PRNG (mulberry32). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Border ring + pillars on every even/even cell, seeded bricks (~48 %), a clear strip in the middle. */
export function makeGrid(seed = 195, density = 0.48) {
  const rand = mulberry32(seed);
  const grid = new Uint8Array(COLS * ROWS);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const i = idx(x, y);
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 || (x % 2 === 0 && y % 2 === 0)) grid[i] = SOLID;
      else if (Math.abs(x - 7) <= 2 && Math.abs(y - 6) <= 1) grid[i] = FLOOR;
      else grid[i] = rand() < density ? BRICK : FLOOR;
    }
  }
  return grid;
}

export function makeState(seed) {
  return { grid: makeGrid(seed), bombs: new Map(), flames: new Map() };
}

/** Returns a new state with a bomb on `cell`, or null if the cell cannot take one. */
export function placeBomb(state, cell, now, { fuse = FUSE_MS, range = RANGE } = {}) {
  if (cell < 0 || cell >= COLS * ROWS) return null;
  if (state.grid[cell] !== FLOOR || state.bombs.has(cell) || state.bombs.size >= MAX_BOMBS) return null;
  const bombs = new Map(state.bombs);
  bombs.set(cell, { fuseAt: now + fuse, range });
  return { ...state, bombs };
}

/**
 * One fixed simulation tick. Pure: the input state is not mutated.
 * Every bomb whose fuse is due explodes; a blast that reaches another bomb detonates it in the
 * SAME tick (queue drained before returning). Bricks stop a blast and break once per tick.
 *
 * → { state, detonated: [{cell, by}], broken: cell[], burned: cell[], groups: cell[][], chain, total }
 *   chain = size of the largest linked group (what „Kette“ means on the readout)
 */
export function resolveTick(state, now) {
  const grid = state.grid.slice();
  const bombs = new Map(state.bombs);
  const flames = new Map();
  for (const [cell, until] of state.flames) if (until > now) flames.set(cell, until);

  const queue = [];
  for (const [cell, b] of bombs) if (b.fuseAt <= now) queue.push({ cell, by: null });
  const detonated = [];
  const broken = [];
  const burned = new Set();
  const parent = new Map(); // union-find over bombs that touched each other this tick
  const find = (c) => {
    while (parent.get(c) !== c) c = parent.get(c);
    return c;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };

  while (queue.length) {
    const { cell, by } = queue.shift();
    const bomb = bombs.get(cell);
    if (!bomb) continue; // already went off earlier in this tick
    bombs.delete(cell);
    parent.set(cell, cell);
    if (by !== null) union(by, cell);
    detonated.push({ cell, by });
    flames.set(cell, now + FLAME_MS);
    burned.add(cell);
    const [bx, by0] = xy(cell);
    for (const [dx, dy] of DIRS) {
      for (let k = 1; k <= bomb.range; k++) {
        const x = bx + dx * k;
        const y = by0 + dy * k;
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) break;
        const c = idx(x, y);
        if (grid[c] === SOLID) break;
        if (grid[c] === BRICK) {
          grid[c] = FLOOR;
          broken.push(c);
          flames.set(c, now + FLAME_MS);
          burned.add(c);
          break;
        }
        if (broken.includes(c)) break; // a brick that broke earlier this tick still stops the blast
        flames.set(c, now + FLAME_MS);
        burned.add(c);
        if (bombs.has(c)) queue.push({ cell: c, by: cell });
        else if (parent.has(c)) union(cell, c); // blast touched a bomb that already went off
      }
    }
  }

  const groupsMap = new Map();
  for (const { cell } of detonated) {
    const r = find(cell);
    if (!groupsMap.has(r)) groupsMap.set(r, []);
    groupsMap.get(r).push(cell);
  }
  const groups = [...groupsMap.values()];
  const chain = groups.reduce((m, g) => Math.max(m, g.length), 0);
  return { state: { grid, bombs, flames }, detonated, broken, burned: [...burned], groups, chain, total: detonated.length };
}

/** Spoken cell name: columns A–O, rows 1–13 („C4“). */
export const cellName = (cell) => {
  const [x, y] = xy(cell);
  return String.fromCharCode(65 + x) + (y + 1);
};

/** What sits on a cell, for the screen reader: „H7, frei“, „H8, Mauer“, „C3, Säule“, „E5, Bombe“. */
export function describeCell(state, cell) {
  const what = state.flames?.has(cell) ? "Feuer" : state.bombs?.has(cell) ? "Bombe" : state.grid[cell] === SOLID ? "Säule" : state.grid[cell] === BRICK ? "Mauer" : "frei";
  return `${cellName(cell)}, ${what}`;
}

/* ── Toy (DOM) ─────────────────────────────────────────────────────────────────────────────────── */

const BEST_KEY = "lmf-bomb-best";
const FALLBACK = {
  bg: "#0d0b1a",
  floor: "#110e22",
  grid: "rgb(52 245 255 / 0.07)",
  pillar: "#1d1740",
  pillarHi: "rgb(52 245 255 / 0.28)",
  brick: "#3b1d5e",
  brickHi: "#d59bf0",
  mortar: "#1a1030",
  ink: "#f3eee7",
  magenta: "#ff3ea5",
  cyan: "#34f5ff",
  hot: "#ffb347",
  bomb: "#17122c",
};

export function mount(root, ctx = {}) {
  const motion = calmSource(ctx);
  const say = announcer(ctx);
  const store = ctx.storage?.local;
  const howId = nextId("pb-how");

  root.classList.add("probe", "probe-bomb");
  root.tabIndex = -1;
  root.innerHTML = `
    <div class="pb-screen" tabindex="0" role="application" aria-roledescription="Spielfeld"
         aria-label="Bomberman-Nachbau, 15 mal 13 Felder" aria-describedby="${howId}">
      <canvas class="pb-canvas" aria-hidden="true"></canvas>
      <p class="vh" data-pb="where" aria-live="polite" aria-atomic="true"></p>
      <p class="pb-hud" aria-hidden="true"><span class="pb-hud-tag">Neon-Nachbau</span><span class="pb-hud-tick">Tick <b data-pb="tick">0</b></span></p>
    </div>
    <div class="probe-toolbar">
      <button class="button button--ghost probe-btn" type="button" data-pb="new">Neues Feld</button>
      <button class="button probe-btn" type="button" data-pb="fire">Alles zünden</button>
      <p class="probe-readout meta" data-pb="readout" aria-live="off">
        <span>Kette: <b data-pb="chain">0</b></span>
        <span>Rekord: <b data-pb="best">0</b></span>
        <span>Bomben: <b data-pb="count">0</b>/${MAX_BOMBS}</span>
      </p>
    </div>
    <p class="probe-howto vh" id="${howId}">Feld antippen oder mit Pfeiltasten wählen. Leertaste legt eine Bombe, Z zündet alles, R baut ein neues Feld, Escape verlässt das Spielfeld.</p>`;

  const screen = root.querySelector(".pb-screen");
  const canvas = root.querySelector("canvas");
  const g = canvas.getContext("2d");
  const $ = (k) => root.querySelector(`[data-pb="${k}"]`);
  const out = { chain: $("chain"), best: $("best"), count: $("count"), tick: $("tick"), where: $("where") };

  // Toy colours come from probes.css; if that sheet failed to load, the same colours are built in,
  // so a gradient never gets an empty stop and the field never turns black.
  const css = getComputedStyle(root);
  const P = {};
  for (const [k, v] of Object.entries(FALLBACK)) P[k] = css.getPropertyValue(`--pb-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`).trim() || v;
  P.mono = css.getPropertyValue("--font-mono").trim() || "monospace";

  let seed = 195;
  let state = makeState(seed);
  let sim = 0; // simulation clock (ms); frozen while paused
  let ticks = 0;
  let cursor = idx(7, 6);
  let showCursor = false;
  let best = Number(store?.get(BEST_KEY, 0)) || 0;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let paused = false;
  let destroyed = false;
  let attract = null; // { resetAt }
  let touched = false; // any user input cancels the attract mode for good
  const fx = { particles: [], links: [], rings: [], stamp: null, shake: 0 };
  let size = { w: 0, h: 0, c: 0, ox: 0, oy: 0, dpr: 1 };

  out.best.textContent = best;

  /* sizing */
  function resize() {
    const w = screen.clientWidth;
    if (!w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const c = Math.max(12, Math.min(42, Math.floor(w / COLS)));
    const h = c * ROWS;
    canvas.style.width = `${c * COLS}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(c * COLS * dpr);
    canvas.height = Math.round(h * dpr);
    size = { w: c * COLS, h, c, dpr };
    draw();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(screen);

  /* loop */
  const busy = () => state.bombs.size || state.flames.size || fx.particles.length || fx.links.length || fx.rings.length || fx.stamp || fx.shake > 0 || attract;
  function kick() {
    if (raf || paused || destroyed) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function frame(t) {
    raf = 0;
    const dt = Math.min(100, t - last);
    last = t;
    acc += dt;
    while (acc >= TICK_MS) {
      acc -= TICK_MS;
      sim += TICK_MS;
      ticks++;
      step();
    }
    stepFx(dt);
    draw();
    if (busy() && !paused && !destroyed) raf = requestAnimationFrame(frame);
    else acc = 0;
  }

  function step() {
    if (!state.bombs.size && !state.flames.size) {
      if (attract && sim >= attract.resetAt) endAttract();
      return;
    }
    const r = resolveTick(state, sim);
    state = r.state;
    if (r.total) onBlast(r);
    if (attract && sim >= attract.resetAt && !state.bombs.size) endAttract();
  }

  function onBlast(r) {
    out.tick.textContent = ticks;
    out.chain.textContent = r.chain;
    out.count.textContent = state.bombs.size;
    const calm = motion.calm;
    for (const { cell, by } of r.detonated) {
      if (by !== null) fx.links.push({ a: by, b: cell, t: 0 });
      fx.rings.push({ cell, t: 0 });
    }
    if (!calm) {
      for (const cell of r.broken) spawnDebris(cell);
      fx.shake = Math.min(9, 2 + r.chain * 1.5);
    }
    if (r.chain >= 2) fx.stamp = { text: `KETTE ×${r.chain}`, t: 0 };
    if (attract) {
      attract.resetAt = sim + 1200;
      return;
    }
    if (r.chain > best) {
      best = r.chain;
      out.best.textContent = best;
      store?.set(BEST_KEY, best);
    }
    const walls = r.broken.length === 1 ? "1 Mauer" : `${r.broken.length} Mauern`;
    say(r.chain >= 2 ? `Kettenreaktion: ${r.chain} Bomben, ${walls} weg.` : `Eine Bombe, ${walls} weg.`);
  }

  function spawnDebris(cell) {
    const [x, y] = xy(cell);
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 1.5 + Math.random() * 3.5;
      fx.particles.push({ x: x + 0.5, y: y + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, life: 1, s: 0.08 + Math.random() * 0.12 });
    }
  }

  function stepFx(dt) {
    const s = dt / 1000;
    for (const p of fx.particles) {
      p.vy += 14 * s;
      p.x += p.vx * s;
      p.y += p.vy * s;
      p.life -= s * 1.6;
    }
    fx.particles = fx.particles.filter((p) => p.life > 0);
    for (const l of fx.links) l.t += dt;
    fx.links = fx.links.filter((l) => l.t < 900);
    for (const r of fx.rings) r.t += dt;
    fx.rings = fx.rings.filter((r) => r.t < 420);
    if (fx.stamp) {
      fx.stamp.t += dt;
      if (fx.stamp.t > 1100) fx.stamp = null;
    }
    fx.shake = Math.max(0, fx.shake - dt * 0.05);
  }

  /* drawing */
  function draw() {
    const { c, dpr } = size;
    if (!c) return;
    const calm = motion.calm;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = P.bg;
    g.fillRect(0, 0, size.w, size.h);
    if (fx.shake > 0 && !calm) g.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = state.grid[idx(x, y)];
        const px = x * c;
        const py = y * c;
        if (t === SOLID) drawPillar(px, py, c);
        else if (t === BRICK) drawBrick(px, py, c, x, y);
        else {
          g.fillStyle = (x + y) % 2 ? P.floor : P.bg;
          g.fillRect(px, py, c, c);
          g.strokeStyle = P.grid;
          g.lineWidth = 1;
          g.strokeRect(px + 0.5, py + 0.5, c - 1, c - 1);
        }
      }
    }

    // flames (additive)
    g.save();
    g.globalCompositeOperation = calm ? "source-over" : "lighter";
    for (const [cell, until] of state.flames) {
      const life = calm ? 1 : Math.max(0, (until - sim) / FLAME_MS);
      drawFlame(cell, life, calm);
    }
    // chain links: which bomb set off which
    for (const l of fx.links) {
      const k = Math.min(1, l.t / 120);
      const fade = 1 - Math.max(0, (l.t - 200) / 700);
      const [ax, ay] = xy(l.a);
      const [bx, by] = xy(l.b);
      g.strokeStyle = P.cyan;
      g.globalAlpha = Math.max(0, fade);
      g.lineWidth = Math.max(2, c * 0.12);
      g.lineCap = "round";
      g.beginPath();
      g.moveTo((ax + 0.5) * c, (ay + 0.5) * c);
      g.lineTo((ax + 0.5 + (bx - ax) * k) * c, (ay + 0.5 + (by - ay) * k) * c);
      g.stroke();
    }
    g.globalAlpha = 1;
    if (!calm) {
      for (const r of fx.rings) {
        const [x, y] = xy(r.cell);
        const k = r.t / 420;
        g.strokeStyle = P.hot;
        g.globalAlpha = 1 - k;
        g.lineWidth = 2;
        g.beginPath();
        g.arc((x + 0.5) * c, (y + 0.5) * c, c * (0.3 + k * 1.1), 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    g.restore();

    for (const [cell, b] of state.bombs) drawBomb(cell, b, calm);

    // debris
    g.fillStyle = P.brickHi;
    for (const p of fx.particles) {
      g.globalAlpha = Math.max(0, p.life);
      g.fillRect(p.x * c, p.y * c, p.s * c, p.s * c);
    }
    g.globalAlpha = 1;

    if (showCursor) drawCursor(calm);
    if (fx.stamp) drawStamp(calm);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  function drawPillar(px, py, c) {
    g.fillStyle = P.pillar;
    g.fillRect(px, py, c, c);
    g.strokeStyle = P.pillarHi;
    g.lineWidth = Math.max(1, c * 0.06);
    g.beginPath();
    g.moveTo(px + 2, py + c - 3);
    g.lineTo(px + 2, py + 2);
    g.lineTo(px + c - 3, py + 2);
    g.stroke();
    g.fillStyle = P.bg;
    g.globalAlpha = 0.45;
    g.fillRect(px + c * 0.3, py + c * 0.3, c * 0.4, c * 0.4);
    g.globalAlpha = 1;
  }

  function drawBrick(px, py, c, x, y) {
    g.fillStyle = P.brick;
    g.fillRect(px, py, c, c);
    g.strokeStyle = P.mortar;
    g.lineWidth = Math.max(1, c * 0.05);
    g.beginPath();
    const h = c / 3;
    for (let r = 1; r < 3; r++) {
      g.moveTo(px, py + r * h);
      g.lineTo(px + c, py + r * h);
    }
    for (let r = 0; r < 3; r++) {
      const off = (r + x + y) % 2 ? c / 2 : c / 4;
      g.moveTo(px + off, py + r * h);
      g.lineTo(px + off, py + (r + 1) * h);
      if (off < c / 2) {
        g.moveTo(px + off + c / 2, py + r * h);
        g.lineTo(px + off + c / 2, py + (r + 1) * h);
      }
    }
    g.stroke();
    g.fillStyle = P.brickHi;
    g.globalAlpha = 0.35;
    g.fillRect(px + 1, py + 1, c - 2, Math.max(1, c * 0.06));
    g.globalAlpha = 1;
  }

  function drawFlame(cell, life, calm) {
    const { c } = size;
    const [x, y] = xy(cell);
    const cx = (x + 0.5) * c;
    const cy = (y + 0.5) * c;
    if (calm) {
      g.fillStyle = P.magenta;
      g.fillRect(x * c + c * 0.12, y * c + c * 0.12, c * 0.76, c * 0.76);
      g.fillStyle = P.ink;
      g.fillRect(cx - c * 0.12, cy - c * 0.12, c * 0.24, c * 0.24);
      return;
    }
    const r = c * (0.55 + 0.25 * life);
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, P.ink);
    grad.addColorStop(0.35, P.hot);
    grad.addColorStop(0.7, P.magenta);
    grad.addColorStop(1, "transparent");
    g.globalAlpha = Math.min(1, life * 1.4);
    g.fillStyle = grad;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
    g.globalAlpha = 1;
  }

  function drawBomb(cell, b, calm) {
    const { c } = size;
    const [x, y] = xy(cell);
    const cx = (x + 0.5) * c;
    const cy = (y + 0.54) * c;
    const left = Math.max(0, b.fuseAt - sim);
    const k = 1 - left / FUSE_MS; // 0 → 1 while burning down
    const pulse = calm ? 1 : 1 + 0.07 * Math.sin(sim / (160 - 110 * k)) * (0.4 + k);
    const r = c * 0.32 * pulse;
    // glow
    if (!calm) {
      const glow = g.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.9);
      glow.addColorStop(0, P.magenta);
      glow.addColorStop(1, "transparent");
      g.globalAlpha = 0.25 + 0.35 * k;
      g.fillStyle = glow;
      g.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
      g.globalAlpha = 1;
    }
    g.fillStyle = P.bomb;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = P.cyan;
    g.lineWidth = Math.max(1.5, c * 0.07);
    g.stroke();
    // highlight
    g.strokeStyle = P.ink;
    g.globalAlpha = 0.7;
    g.lineWidth = Math.max(1, c * 0.05);
    g.beginPath();
    g.arc(cx, cy, r * 0.62, Math.PI * 1.1, Math.PI * 1.45);
    g.stroke();
    g.globalAlpha = 1;
    // fuse ring: remaining time
    g.strokeStyle = P.magenta;
    g.lineWidth = Math.max(2, c * 0.08);
    g.beginPath();
    g.arc(cx, cy, r + c * 0.1, -Math.PI / 2, -Math.PI / 2 + (1 - k) * Math.PI * 2);
    g.stroke();
    if (calm) {
      g.fillStyle = P.ink;
      g.font = `600 ${Math.max(9, Math.round(c * 0.3))}px ${P.mono}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText((left / 1000).toFixed(1).replace(".", ","), cx, cy + 1);
    } else {
      // spark on the fuse
      const sx = cx + r * 0.7;
      const sy = cy - r * 0.95;
      g.fillStyle = Math.random() < 0.5 ? P.hot : P.ink;
      g.beginPath();
      g.arc(sx, sy, c * (0.05 + Math.random() * 0.05), 0, Math.PI * 2);
      g.fill();
    }
  }

  function drawCursor(calm) {
    const { c } = size;
    const [x, y] = xy(cursor);
    const px = x * c;
    const py = y * c;
    const inset = calm ? 2 : 2 + Math.sin(performance.now() / 180) * 1.5;
    const l = c * 0.3;
    g.strokeStyle = P.cyan;
    g.lineWidth = 2;
    g.beginPath();
    const a = px + inset;
    const b = py + inset;
    const e = px + c - inset;
    const f = py + c - inset;
    g.moveTo(a, b + l); g.lineTo(a, b); g.lineTo(a + l, b);
    g.moveTo(e - l, b); g.lineTo(e, b); g.lineTo(e, b + l);
    g.moveTo(e, f - l); g.lineTo(e, f); g.lineTo(e - l, f);
    g.moveTo(a + l, f); g.lineTo(a, f); g.lineTo(a, f - l);
    g.stroke();
  }

  function drawStamp(calm) {
    const { t, text } = fx.stamp;
    const k = Math.min(1, t / 260);
    const s = calm ? 1 : 1 + 0.35 * (1 - easeOutBack(k)) ;
    const alpha = t > 700 ? Math.max(0, 1 - (t - 700) / 400) : 1;
    const fs = Math.round(size.c * 1.35);
    g.save();
    g.globalAlpha = alpha;
    g.translate(size.w / 2, size.h / 2);
    g.scale(s, s);
    g.rotate(-0.05);
    g.font = `800 ${fs}px ${P.mono}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = Math.max(3, fs * 0.12);
    g.strokeStyle = P.bg;
    g.strokeText(text, 0, 0);
    g.fillStyle = P.ink;
    g.fillText(text, 0, 0);
    g.fillStyle = P.magenta;
    g.fillRect(-fs * 3, fs * 0.62, fs * 6 * k, Math.max(2, fs * 0.08));
    g.restore();
  }
  const easeOutBack = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);

  /* actions */
  function place(cell, { silent = false } = {}) {
    const next = placeBomb(state, cell, sim);
    if (!next) {
      if (!silent) {
        const why = state.bombs.size >= MAX_BOMBS ? `Mehr als ${MAX_BOMBS} Bomben gehen nicht.` : "Da passt keine Bombe hin.";
        say(why);
        nudge();
      }
      return false;
    }
    state = next;
    out.count.textContent = state.bombs.size;
    if (!silent) say(`Bombe auf Feld ${cellName(cell)}.`);
    kick();
    return true;
  }
  function igniteAll() {
    if (!state.bombs.size) {
      say("Keine Bombe auf dem Feld.");
      return;
    }
    const bombs = new Map();
    for (const [cell, b] of state.bombs) bombs.set(cell, { ...b, fuseAt: sim });
    state = { ...state, bombs };
    kick();
  }
  function newField({ silent = false } = {}) {
    seed = (seed * 16807) % 2147483647;
    state = makeState(seed);
    fx.particles = [];
    fx.links = [];
    fx.rings = [];
    fx.stamp = null;
    out.count.textContent = 0;
    out.chain.textContent = 0;
    if (!silent) say("Neues Feld.");
    draw();
  }
  function nudge() {
    if (motion.calm) return;
    screen.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }], { duration: 180, easing: "ease-out" });
  }
  function userInput() {
    touched = true;
    paused = false; // the motion toggle pauses what runs on its own; a deliberate press plays on
    if (attract) endAttract(true);
  }

  /* attract mode: once, ≥ 60 % visible, not calm, before any input */
  function startAttract() {
    if (touched || motion.calm || paused || destroyed) return;
    const saved = state;
    attract = { resetAt: Infinity, saved };
    state = { grid: saved.grid.slice(), bombs: new Map(), flames: new Map() };
    const row = [idx(5, 5), idx(7, 5), idx(9, 5)];
    for (const c of row) state.grid[c] = FLOOR;
    state = placeBomb(state, row[0], sim, { fuse: 900 }) ?? state;
    state = placeBomb(state, row[1], sim, { fuse: FUSE_MS * 3 }) ?? state;
    state = placeBomb(state, row[2], sim, { fuse: FUSE_MS * 3 }) ?? state;
    out.count.textContent = state.bombs.size;
    kick();
  }
  function endAttract(immediate = false) {
    if (!attract) return;
    const { saved } = attract;
    attract = null;
    state = saved;
    out.count.textContent = state.bombs.size;
    out.chain.textContent = 0;
    if (immediate) {
      fx.links = [];
      fx.rings = [];
      fx.particles = [];
      fx.stamp = null;
    }
    draw();
  }
  let io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (records) => {
        if (records.some((r) => r.intersectionRatio >= 0.6)) {
          io.disconnect();
          io = null;
          startAttract();
        }
      },
      { threshold: [0.6] },
    );
    io.observe(screen);
  }

  /* input */
  const cellAt = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * COLS);
    const y = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
    return x >= 0 && y >= 0 && x < COLS && y < ROWS ? idx(x, y) : -1;
  };
  function onPointerDown(e) {
    const cell = cellAt(e);
    if (cell < 0) return;
    userInput();
    e.preventDefault();
    screen.focus({ preventScroll: true });
    cursor = cell;
    place(cell);
    draw();
  }
  function onPointerMove(e) {
    if (e.pointerType !== "mouse") return;
    const cell = cellAt(e);
    if (cell < 0 || cell === cursor) return;
    cursor = cell;
    showCursor = true;
    if (!raf) draw();
  }
  function onPointerLeave() {
    if (document.activeElement !== screen) {
      showCursor = false;
      if (!raf) draw();
    }
  }
  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const [x, y] = xy(cursor);
    const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (move) {
      e.preventDefault();
      userInput();
      const nx = Math.min(COLS - 1, Math.max(0, x + move[0]));
      const ny = Math.min(ROWS - 1, Math.max(0, y + move[1]));
      cursor = idx(nx, ny);
      showCursor = true;
      // own live region, immediate: each step names the cell and what is on it (a11y, §9)
      out.where.textContent = describeCell(state, cursor);
      if (!raf) draw();
      return;
    }
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === " " || key === "Enter") {
      e.preventDefault();
      userInput();
      place(cursor);
    } else if (key === "z") {
      e.preventDefault();
      userInput();
      igniteAll();
    } else if (key === "r") {
      e.preventDefault();
      userInput();
      newField();
    } else if (key === "Escape") {
      e.preventDefault();
      root.focus({ preventScroll: true });
    }
  }
  const onFocus = () => {
    showCursor = true;
    if (!raf) draw();
  };
  const onBlur = () => {
    showCursor = false;
    if (!raf) draw();
  };
  const onNew = () => {
    userInput();
    newField();
  };
  const onFire = () => {
    userInput();
    igniteAll();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  screen.addEventListener("keydown", onKey);
  screen.addEventListener("focus", onFocus);
  screen.addEventListener("blur", onBlur);
  $("new").addEventListener("click", onNew);
  $("fire").addEventListener("click", onFire);
  const offCalm = motion.onCalmChange?.(() => draw()) ?? (() => {});

  resize();



  return {
    pause() {
      paused = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (attract) endAttract(true);
    },
    resume() {
      paused = false;
      if (busy()) kick();
      else draw();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io?.disconnect();
      offCalm();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      screen.removeEventListener("keydown", onKey);
      root.replaceChildren();
    },
  };
}
