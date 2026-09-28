/**
 * Projektor (§5.8, P1)  [WP3] — WebGL1, one full-screen triangle over the current still.
 * uFrame = integer projector clock at 24 fps (the loop draws only when it ticks), uWeave = ~0.5 px
 * low-frequency gate weave, uFlicker .97–1.03, grain in overlay, 5-tap halation tinted #FF4A1C,
 * vignette. Pauses < 10 % visible, when the tab is hidden and when calm (then one static frame).
 * Lost context → canvas removed, the CSS grain fallback takes over.
 */
import { program, texture } from "./gl.js";

/** Test/debug mode (Playwright or ?lmf-debug): counts frames on window.__lmfProjectorFrames. */
const debugMode = () => navigator.webdriver === true || /[?&]lmf-debug\b/.test(location.search);

const GATE = 0.97;
const VS = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FS = `precision mediump float;varying vec2 v;uniform sampler2D T;uniform vec2 uS,uW,uO;uniform float uFrame,uFlicker;uniform vec3 uGrade;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 u=(v-.5)*uS+uO+uW;u.y=1.-u.y;
vec3 c=texture2D(T,u).rgb,b=vec3(0.);float r=.004;
b+=max(texture2D(T,u+vec2(r,0.)).rgb-.72,0.);b+=max(texture2D(T,u-vec2(r,0.)).rgb-.72,0.);
b+=max(texture2D(T,u+vec2(0.,r)).rgb-.72,0.);b+=max(texture2D(T,u-vec2(0.,r)).rgb-.72,0.);b+=max(c-.72,0.);
c+=b*.28*vec3(1.,.29,.11);c=mix(c,c*uGrade*1.35,.1)*uFlicker;
float g=h(floor(gl_FragCoord.xy)+uFrame*17.)-.5;c+=g*.075*(1.-abs(c-.5)*1.2);
vec2 q=v-.5;c*=1.-dot(q,q)*.9;gl_FragColor=vec4(c,1.);}`;

export function start(frame, { image = null, vertical = false, focus = 0.5, onDead } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "projector-gl";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) return null;
  let prog, buf, tex;
  let img = image;
  let vert = vertical;
  let fx = focus;
  let raf = 0;
  let last = -1;
  let visible = true;
  let paused = false;
  let dead = false;
  let calm = false;
  const debug = debugMode();

  function init() {
    prog = program(gl, VS, FS);
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    tex = null;
    upload();
  }
  function upload() {
    if (tex) gl.deleteTexture(tex);
    tex = img ? texture(gl, { image: img, internal: gl.RGB, format: gl.RGB, type: gl.UNSIGNED_BYTE }) : null;
  }
  try {
    init();
  } catch {
    return null;
  }
  frame.append(canvas);

  function size() {
    const r = frame.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(2, Math.round(r.width * dpr));
    canvas.height = Math.max(2, Math.round(r.height * dpr));
  }

  function draw(t) {
    if (!tex || gl.isContextLost()) {
      canvas.classList.remove("is-live");
      return;
    }
    const f = Math.floor(t * 24);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(prog.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const loc = gl.getAttribLocation(prog.p, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(prog.u.T, 0);
    // object-fit: cover
    const ca = canvas.width / canvas.height;
    const ia = img.naturalWidth / img.naturalHeight || 16 / 9;
    // × GATE: the gate crops 1.5 % off every edge (hides thumbnail edge rows, same as the CSS still)
    const sx = (ca > ia ? 1 : ca / ia) * GATE;
    const sy = (ca > ia ? ia / ca : 1) * GATE;
    gl.uniform2f(prog.u.uS, sx, sy);
    // crop centre (object-position): the focus, clamped so the window stays inside the still
    gl.uniform2f(prog.u.uO, Math.min(1 - sx / 2, Math.max(sx / 2, fx)), 0.5);
    const still = calm || paused;
    const wx = still ? 0 : (Math.sin(t * 1.3) * 0.6 + Math.sin(t * 3.1 + 1) * 0.4) * (0.5 / canvas.width);
    const wy = still ? 0 : Math.sin(t * 0.9 + 2) * (0.5 / canvas.height);
    gl.uniform2f(prog.u.uW, wx, wy);
    gl.uniform1f(prog.u.uFrame, f % 997);
    gl.uniform1f(prog.u.uFlicker, still ? 1 : 0.97 + 0.06 * (Math.abs(Math.sin(f * 12.9898) * 43758.5453) % 1));
    gl.uniform3f(prog.u.uGrade, 1, 0.49, 0.36);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.classList.add("is-live");
    if (debug) window.__lmfProjectorFrames = (window.__lmfProjectorFrames ?? 0) + 1;
  }

  const running = () => !dead && !paused && !calm && visible && !document.hidden && Boolean(tex);
  function loop(now) {
    raf = 0;
    if (!running()) return;
    const t = now / 1000;
    const f = Math.floor(t * 24);
    if (f !== last) {
      last = f;
      draw(t);
    }
    raf = requestAnimationFrame(loop);
  }
  const kick = () => {
    if (!raf && running()) raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const io = new IntersectionObserver(
    ([r]) => {
      visible = r.isIntersecting && r.intersectionRatio >= 0.1;
      visible ? kick() : stop();
    },
    { threshold: [0, 0.1, 0.5] },
  );
  io.observe(frame);
  const ro = new ResizeObserver(() => {
    size();
    if (!running()) draw(performance.now() / 1000);
  });
  ro.observe(frame);
  const onVis = () => (document.hidden ? stop() : kick());
  document.addEventListener("visibilitychange", onVis);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    destroy();
    onDead?.();
  });

  size();
  draw(performance.now() / 1000);
  kick();

  function destroy() {
    if (dead) return;
    dead = true;
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    canvas.remove();
  }

  return {
    setImage(next, v, focus = 0.5) {
      img = next;
      vert = v;
      fx = focus;
      if (dead) return;
      upload();
      size();
      draw(performance.now() / 1000);
      void vert;
    },
    pause() {
      paused = true;
      stop();
      canvas.classList.remove("is-live");
    },
    resume() {
      paused = false;
      draw(performance.now() / 1000);
      kick();
    },
    setCalm(c) {
      calm = Boolean(c);
      if (calm) {
        stop();
        draw(performance.now() / 1000);
      } else kick();
    },
    destroy,
  };
}
