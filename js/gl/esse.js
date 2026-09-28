/**
 * Die Esse — WebGL2 hero panel (§5.1) [WP3]. Lazy: sections/esse.js imports it after load + idle, never calm.
 * start(stage, opts) → controller | null. Events: forge:strike { n: 1‥3 } (every third stamps the H1), esse:cooled.
 * The poster renderer lives in gl/esse-still.js (scripts only), so it never ships with the page.
 */
import { program, texture, framebuffer, loadImage } from "./gl.js";
import * as S from "./shaders.js";
import { layout, buildEmbers, emberBuffer, emberX, emberY, densityRow } from "../sections/esse-embers.js";
import { createSparks } from "./sparks.js";
import { HEAT, TEMPER, rgb01 } from "../lib/palette.js";

const lin = (hex) => rgb01(hex).map((v) => v ** 2.2);
const RAMP = new Float32Array(HEAT.flatMap(lin));
const TEMP = new Float32Array(TEMPER.flatMap(lin));
const SDF_URL = new URL("../../assets/img/logo-sdf.png", import.meta.url).href;
const STRIKE_AT = [0.4, 0.9, 1.4]; // intro strikes (s)
const FORGE_TO = [0.45, 0.8, 1]; // billet → logo
const COOL = 3.2; // s from the last strike to „cooled“
const IDLE_FPS = 24; // cooled, no pointer, no sparks: the coals only flicker (projector clock)
const backOut = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2; // rebound: only strikes overshoot
let sdfImage = null;

/**
 * Residual heat of the cooled logo (emissive floor, amber, lower edges): the share of repos that
 * glüht (pushed ≤ 30 days before snapshot.asOf). 10 % glowing or more = the full 0.12 floor.
 */
const restHeat = (embers) => (embers.length ? 0.12 * Math.min(1, embers.filter((e) => e.days <= 30).length / embers.length / 0.1) : 0);

/** Renderer bound to one canvas: no DOM, no loop. */
export function createForge(canvas, { repos, asOf, dpr = 1, maxSparks = 384 }) {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) return null;
  const embers = buildEmbers(repos, asOf);
  const rest = restHeat(embers);
  const sparks = createSparks(maxSparks);
  const st = { t: 0, dt: 0, intro: 0, introDone: false, forge: 0, from: 0, to: 0, last: -9, temp: 1, squash: 0, flash: [0, 0, 0], splats: [], hover: -1, freeze: 0, div: 4, fired: 0 };
  const R8 = () => ({ internal: gl.R8, format: gl.RED, type: gl.UNSIGNED_BYTE });
  let r = null;
  let W = 1, H = 1, A = 1, lay = layout(1), format = "RGBA8";

  // RG16F when a float colour buffer is renderable, else RGBA8 (heat in R, "was hot" in G)
  function heatFormat() {
    if (!(gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float"))) return "RGBA8";
    const t = texture(gl, { w: 4, h: 4, internal: gl.RG16F, format: gl.RG, type: gl.HALF_FLOAT });
    const f = framebuffer(gl, t);
    gl.deleteTexture(t);
    if (f) gl.deleteFramebuffer(f);
    return f ? "RG16F" : "RGBA8";
  }

  function heatTargets() {
    for (const x of r.heat ?? []) gl.deleteTexture(x.t), gl.deleteFramebuffer(x.f);
    r.hw = Math.max(8, Math.round(W / st.div));
    r.hh = Math.max(8, Math.round(H / st.div));
    const spec = format === "RG16F" ? { internal: gl.RG16F, format: gl.RG, type: gl.HALF_FLOAT } : { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE };
    r.heat = [0, 1].map(() => {
      const t = texture(gl, { w: r.hw, h: r.hh, ...spec });
      const f = framebuffer(gl, t);
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { t, f };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function init() {
    format = heatFormat();
    r = { heatP: program(gl, S.TRI, S.HEAT), main: program(gl, S.TRI, S.MAIN), ember: program(gl, S.EMBER_V, S.EMBER_F), spark: program(gl, S.SPARK_V, S.SPARK_F) };
    [r.vao, r.ev, r.sv, r.hv] = [0, 0, 0, 0].map(() => gl.createVertexArray());
    [r.eb, r.sb] = [gl.createBuffer(), gl.createBuffer()];
    r.dens = texture(gl, { w: 128, h: 1, ...R8(), data: densityRow(embers) });
    r.sdf = sdfImage ? texture(gl, { image: sdfImage, ...R8() }) : texture(gl, { w: 1, h: 1, ...R8(), data: new Uint8Array(1) });
    const attrib = (vao, buf, stride, bytes) => {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      if (bytes) gl.bufferData(gl.ARRAY_BUFFER, bytes, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, stride, 0);
    };
    attrib(r.ev, r.eb, 16, 0);
    attrib(r.sv, r.sb, 16, maxSparks * 32);
    attrib(r.hv, r.sb, 32, 0); // spark heads only
    gl.bindVertexArray(null);
    r.ping = 0;
    heatTargets();
    placeEmbers();
  }

  function placeEmbers() {
    if (!r || !embers.length) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, r.eb);
    gl.bufferData(gl.ARRAY_BUFFER, emberBuffer(embers, lay), gl.STATIC_DRAW);
  }

  function setSize(cssW, cssH) {
    W = Math.max(2, Math.round(cssW * dpr));
    H = Math.max(2, Math.round(cssH * dpr));
    if (canvas.width !== W || canvas.height !== H) (canvas.width = W), (canvas.height = H);
    A = W / H;
    lay = layout(A);
    if (r) heatTargets(), placeEmbers();
  }

  function setSdf(img) {
    sdfImage = img;
    if (r) gl.deleteTexture(r.sdf), (r.sdf = texture(gl, { image: img, ...R8() }));
  }

  /** Strike at panel point (x, y); false when < 500 ms after the last one (no flashes > 2/s). */
  function strike(x, y, power = 1, burst = 80) {
    const now = performance.now() / 1000; // wall clock: slow frames must not bunch strikes up
    if (now - st.last < 0.5) return false;
    st.last = now;
    const L = lay.logo;
    st.squash = Math.abs(x - L.cx) < L.hw * 1.05 && Math.abs(y - L.cy) < L.hw * 0.66 ? 0.07 * power : 0;
    st.flash = [x, y, 0.9 * power];
    st.splats.push([x / A, y, 0.055, 2.4 * power]);
    sparks.emit(x, y, burst, 0, 0.9, 1.1);
    return true;
  }

  function stepIntro(dt, onStrike, onCooled) {
    if (st.introDone) return;
    st.intro += dt;
    const L = lay.logo;
    while (st.fired < 3 && st.intro >= STRIKE_AT[st.fired]) {
      st.from = st.forge;
      st.to = FORGE_TO[st.fired];
      st.last = -9;
      strike(L.cx + (Math.random() - 0.5) * L.hw * 0.8, L.cy + L.hw * 0.3, 0.8, 60 + Math.round(Math.random() * 40));
      onStrike?.(++st.fired);
    }
    if (st.fired) st.forge = st.from + (st.to - st.from) * backOut(Math.min(1, (st.intro - STRIKE_AT[st.fired - 1]) / 0.22));
    const after = st.intro - STRIKE_AT[2];
    st.temp = after < 0 ? 1 - st.fired * 0.04 : 0.88 * Math.exp(-after / 0.8); // yellow → orange → cherry → steel
    if (after > COOL) cool(), onCooled?.();
  }

  function cool() {
    Object.assign(st, { introDone: true, fired: 3, forge: 1, temp: 0 });
  }

  function step(dt, p) {
    st.t += dt;
    st.dt = dt;
    st.squash *= 0.0005 ** dt;
    if (p?.amt > 0) st.splats.push([p.x / A, p.y, 0.05, p.amt]);
    return sparks.step(dt, lay.bedTop - 0.015);
  }

  const bind = (i, t) => (gl.activeTexture(gl.TEXTURE0 + i), gl.bindTexture(gl.TEXTURE_2D, t));
  function draw(sv = new Float32Array(0)) {
    if (!r || gl.isContextLost()) return;
    const src = r.heat[r.ping];
    const dst = r.heat[1 - r.ping];
    const L = lay.logo;
    // 1 · heat field (¼ res): blur, rise, decay pow(.35, dt), splats
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.f);
    gl.viewport(0, 0, r.hw, r.hh);
    let u = r.heatP.u;
    gl.useProgram(r.heatP.p);
    bind(0, src.t);
    gl.uniform1i(u.T, 0);
    gl.uniform2f(u.px, 1 / r.hw, 1 / r.hh);
    gl.uniform3f(u.k, 0.35 ** st.dt, 0.8 ** st.dt, format === "RGBA8" ? 1.2 / 255 : 0.0004);
    const sp = new Float32Array(16);
    st.splats.splice(0).slice(0, 4).forEach((s, i) => sp.set(s, i * 4));
    gl.uniform4fv(u.S, sp);
    gl.uniform1f(u.A, A);
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    r.ping = 1 - r.ping;
    // 2 · composite
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    u = r.main.u;
    gl.useProgram(r.main.p);
    [dst.t, r.dens, r.sdf].forEach((t, i) => bind(i, t));
    gl.uniform1i(u.H, 0);
    gl.uniform1i(u.D, 1);
    gl.uniform1i(u.L, 2);
    gl.uniform3fv(u.R, RAMP);
    gl.uniform3fv(u.P, TEMP);
    gl.uniform4f(u.G, A, lay.bedTop, lay.margin, st.t);
    gl.uniform4f(u.M, L.cx, L.cy, L.hw, sdfImage ? st.forge : 0);
    gl.uniform4f(u.K, st.squash, st.temp, st.freeze, rest);
    gl.uniform4f(u.F, ...st.flash, 0);
    st.flash[2] = 0; // the flash lasts one frame
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 3 · embers + sparks, additive
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    if (embers.length) {
      u = r.ember.u;
      gl.useProgram(r.ember.p);
      bind(0, dst.t);
      gl.uniform1i(u.H, 0);
      gl.uniform3fv(u.R, RAMP);
      gl.uniform4f(u.G, A, lay.bedTop, lay.margin, st.t);
      gl.uniform1f(u.s, Math.max(H / 570, dpr * 0.85));
      gl.uniform1f(u.hv, st.hover);
      gl.bindVertexArray(r.ev);
      gl.drawArrays(gl.POINTS, 0, embers.length);
    }
    const n = sv.length / 4;
    if (n) {
      u = r.spark.u;
      gl.useProgram(r.spark.p);
      gl.uniform3fv(u.R, RAMP);
      gl.uniform4f(u.G, A, lay.bedTop, lay.margin, st.t);
      gl.bindBuffer(gl.ARRAY_BUFFER, r.sb);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, sv);
      gl.uniform1f(u.ps, 1.6 * dpr);
      gl.bindVertexArray(r.sv);
      gl.drawArrays(gl.LINES, 0, n);
      gl.uniform1f(u.ps, 2.2 * dpr);
      gl.bindVertexArray(r.hv);
      gl.drawArrays(gl.POINTS, 0, n / 2);
    }
    gl.bindVertexArray(null);
  }

  return {
    gl, st, sparks, embers, init, setSize, setSdf, strike, stepIntro, cool, step, draw,
    get lay() { return lay; },
    get A() { return A; },
    get format() { return format; },
    // governor: 1 → ⅛ heat field + 192 sparks, 2 → frozen coal noise
    lower(level) {
      if (level === 1) (st.div = 8), (sparks.cap = 192), r && heatTargets();
      else st.freeze = 1;
    },
  };
}

/** Live panel. opts: { repos, asOf, mobile, skipIntro, onCooled, onHover, onLive, onLost, onRestored, onDead }. */
export function start(stage, opts = {}) {
  const mobile = Boolean(opts.mobile);
  const dpr = mobile ? 1 : Math.min(devicePixelRatio || 1, 1.5);
  const canvas = document.createElement("canvas");
  canvas.className = "esse-canvas";
  canvas.setAttribute("aria-hidden", "true");
  let forge;
  try {
    forge = createForge(canvas, { repos: opts.repos, asOf: opts.asOf, dpr, maxSparks: mobile ? 160 : 384 });
    if (!forge) return null;
    forge.init();
  } catch (error) {
    console.warn("[esse] WebGL2:", error);
    return null;
  }
  stage.append(canvas);
  let frames = 0, raf = 0, idle = 0, woke = false, last = 0, strikes = 0, lostTimer = 0;
  let visible = true, calm = false, lost = false, dead = false, live = false, ready = false;
  let gov = [0, 0, 0]; // sum, n, level
  const P = { x: 0, y: 0, vx: 0, amt: 0, speed: 0, pt: 0, inside: false };
  if (opts.skipIntro) forge.cool();
  const on = (t, type, fn) => t.addEventListener(type, fn);

  const fire = (n) => {
    document.dispatchEvent(new CustomEvent("forge:strike", { detail: { n } }));
    if (!mobile && !calm) canvas.animate([{ translate: "0 0" }, { translate: "-3px 2px" }, { translate: "3px -1px" }, { translate: "-1px 1px" }, { translate: "0 0" }], 120);
  };
  const cooled = () => (document.dispatchEvent(new CustomEvent("esse:cooled")), opts.onCooled?.());
  const running = () => ready && visible && !document.hidden && !calm && !lost && !dead;
  // Nothing hot is moving: intro done, no pointer, no sparks, last strike's heat has faded (~3 s).
  const quiet = () => forge.st.introDone && !P.inside && !forge.sparks.count && performance.now() / 1000 - forge.st.last > 3;

  function size() {
    const b = stage.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) return;
    forge.setSize(b.width, b.height);
    if (!running()) paintStatic();
  }
  function reveal() {
    if (live) return;
    live = true;
    canvas.classList.add("is-live");
    opts.onLive?.();
  }
  function paintStatic() {
    if (!ready || lost || dead) return;
    if (calm) forge.cool(), forge.sparks.clear();
    forge.draw(forge.step(0, null));
    reveal();
  }

  function frame(now) {
    raf = 0;
    if (!running()) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (!woke) {
      // governor (skipped for idle 24 fps frames: their gap says nothing about GPU cost)
      gov[0] += dt;
      if (++gov[1] === 30) {
        if (gov[0] / 30 > 0.022 && gov[2] < 2) forge.lower(++gov[2]);
        gov[0] = gov[1] = 0;
      }
    }
    forge.stepIntro(dt, fire, cooled);
    P.amt = 0;
    if (P.inside && P.speed > 0.05) {
      P.amt = Math.min(0.35, P.speed * 0.12); // heat ∝ speed
      const n = Math.min(20, Math.floor(P.speed * 3 * Math.random())); // ≤ 20 sparks per frame
      if (n) forge.sparks.emit(P.x, P.y, n, P.vx * 0.3, 0.5, 0.7);
      P.speed *= 0.5;
    }
    forge.draw(forge.step(dt, P));
    frames++;
    reveal();
    // Hitze kommt schnell: full rate while anything is hot, 24 fps for the cooled coals (battery).
    woke = false;
    if (quiet()) idle = setTimeout(() => ((idle = 0), (woke = true), (raf = requestAnimationFrame(frame))), 1000 / IDLE_FPS - 4);
    else raf = requestAnimationFrame(frame);
  }
  const stop = () => (raf && cancelAnimationFrame(raf), clearTimeout(idle), (raf = idle = 0));
  // wake: leaves an idle wait at once (pointer, strike), otherwise starts the loop if it is off
  const kick = () => {
    if (!running() || raf) return;
    if (!idle) last = 0;
    clearTimeout(idle);
    idle = 0;
    raf = requestAnimationFrame(frame);
  };

  const toPanel = (e) => {
    const b = canvas.getBoundingClientRect();
    return [((e.clientX - b.left) / b.width) * forge.A, 1 - (e.clientY - b.top) / b.height, b];
  };
  function hover(i) {
    if (i === forge.st.hover) return;
    forge.st.hover = i;
    opts.onHover?.(i >= 0 ? forge.embers[i] : null);
    if (!running()) paintStatic();
  }
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  on(canvas, "pointermove", (e) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const [x, y, b] = toPanel(e);
    const now = performance.now();
    const dtp = Math.max(0.008, (now - P.pt) / 1000);
    if (P.inside) (P.speed = Math.max(P.speed, Math.hypot(x - P.x, y - P.y) / dtp)), (P.vx = (x - P.x) / dtp);
    Object.assign(P, { x, y, pt: now, inside: !mobile && fine.matches });
    if (P.inside) kick();
    const L = forge.lay;
    let best = -1;
    let bd = (14 / b.height) ** 2; // 14 px pick radius
    forge.embers.forEach((em, i) => {
      const d = (emberX(em.t, L) - x) ** 2 + (emberY(em.j, L) - y) ** 2;
      if (d < bd) (bd = d), (best = i);
    });
    hover(best);
  });
  on(canvas, "pointerleave", () => ((P.inside = false), hover(-1)));
  on(canvas, "pointerdown", (e) => {
    if (e.button > 0 || calm || !ready) return;
    const [x, y] = toPanel(e);
    doStrike(x, y);
  });
  function doStrike(x, y) {
    if (!forge.strike(x, y)) return false;
    fire((strikes++ % 3) + 1);
    kick();
    return true;
  }

  const io = new IntersectionObserver(([e]) => ((visible = e.isIntersecting && e.intersectionRatio >= 0.05), visible ? kick() : stop()), { threshold: [0, 0.05, 0.2] });
  io.observe(stage);
  const ro = new ResizeObserver(size);
  ro.observe(stage);
  const onVis = () => (document.hidden ? stop() : kick());
  on(document, "visibilitychange", onVis);

  on(canvas, "webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    live = false;
    stop();
    canvas.classList.remove("is-live");
    opts.onLost?.();
    lostTimer = setTimeout(() => destroy(true), 4000);
  });
  on(canvas, "webglcontextrestored", () => {
    clearTimeout(lostTimer);
    if (dead) return;
    try {
      forge.init();
      lost = false;
      size();
      opts.onRestored?.();
      running() ? kick() : paintStatic();
    } catch {
      destroy(true);
    }
  });

  loadImage(SDF_URL)
    .then((img) => forge.setSdf(img))
    .catch(() => forge.cool()) // no logo texture: the billet stays, no intro
    .finally(() => {
      ready = true;
      size();
      running() ? kick() : paintStatic();
    });

  function destroy(fromLoss = false) {
    if (dead) return;
    dead = true;
    stop();
    io.disconnect();
    ro.disconnect();
    clearTimeout(lostTimer);
    document.removeEventListener("visibilitychange", onVis);
    canvas.remove();
    if (fromLoss) opts.onDead?.();
  }

  return {
    canvas,
    destroy,
    get frames() { return frames; },
    get format() { return forge.format; },
    /** „Einmal zuschlagen“: a strike on the metal. */
    strike() {
      const L = forge.lay.logo;
      return !calm && ready && doStrike(L.cx + (Math.random() - 0.5) * L.hw * 0.6, L.cy + L.hw * 0.25);
    },
    setCalm(c) {
      calm = Boolean(c);
      calm ? (stop(), paintStatic()) : kick();
    },
    forge,
    /** Test hook (WEBGL_lose_context). */
    loseContext: () => forge.gl.getExtension("WEBGL_lose_context"),
  };
}
