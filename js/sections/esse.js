/**
 * Anheizen · #esse (hero)  [WP3]  — §2.1, §5.1
 *
 * Mounted by main.js on idle (after `load`). Everything here is progressive:
 *   no JS          → CSS poster from index.html/base.css (decoration only, caption hidden)
 *   JS, calm/no GL → year axis + Glut caption + the rendered poster painted into a 2D canvas
 *                    (a canvas, not an <img>, so the H1 stays the LCP element)
 *   JS, GL         → js/gl/esse.js (served packed as esse.pack.js): repo embers, forged logo, sparks, strikes
 * Also boots the page-wide heat grammar (fx/heat.js, fx/anvil.js) — both are tiny and idle-safe.
 */
import { yearTicks, layout, emberX } from "./esse-embers.js";
import { glOk } from "../fx/gpu.js";

const debugMode = () => navigator.webdriver === true || /[?&]lmf-debug\b/.test(location.search);

const POSTERS = { tall: "assets/img/esse-poster.webp", wide: "assets/img/esse-poster-wide.webp" };
const GLOW_WORD = (days) => (days <= 30 ? "glüht" : days <= 180 ? "warm" : "abgekühlt");

export async function mount(root, ctx) {
  const { motion, format, storage } = ctx;
  const panel = root.querySelector(".esse-panel");
  const stage = root.querySelector(".esse-stage");
  const strikeBtn = root.querySelector("#strike");
  const stamp = root.querySelector(".hero-stamp");
  const line = document.querySelector(".gluehlinie");
  if (!panel || !stage) return { destroy() {} };

  const offs = [];
  const on = (t, type, fn, o) => (t.addEventListener(type, fn, o), offs.push(() => t.removeEventListener(type, fn, o)));
  let ctl = null;
  let still = null;
  let destroyed = false;
  let fx = [];

  /* ── Heat grammar, page-wide ──────────────────────────────────────────────────────────────── */
  Promise.all([import("../fx/heat.js"), import("../fx/anvil.js")])
    .then((mods) => {
      if (!destroyed) fx = mods.map((m) => m.init());
    })
    .catch(() => {});

  /* ── Forge → headline + Glühlinie ─────────────────────────────────────────────────────────── */
  on(document, "forge:strike", (e) => {
    if (!stamp) return;
    stamp.classList.add("is-hot");
    setTimeout(() => stamp.classList.remove("is-hot"), 120);
    if (e.detail?.n === 3) {
      stamp.classList.remove("is-stamped");
      void stamp.offsetWidth;
      stamp.classList.add("is-stamped");
    }
    if (line && !motion.calm && line.animate) {
      try {
        line.animate([{ "--flare": 1 }, { "--flare": 0 }], { duration: 1600, easing: "cubic-bezier(.16,1,.3,1)" });
      } catch {
        /* registered-property animation unsupported: the line just stays */
      }
    }
  });

  /* ── Data: axis, caption, hover readout ───────────────────────────────────────────────────── */
  const data = await ctx.data;
  if (destroyed) return api();
  const repos = Array.isArray(data?.repos) ? data.repos : null;
  const asOf = data?.snapshot?.asOf ?? null;
  const hasEmbers = Boolean(repos?.length && asOf);

  let readout = null;
  if (hasEmbers) {
    panel.dataset.embers = "";
    renderAxis(repos, asOf);
    readout = document.createElement("p");
    readout.className = "esse-readout meta";
    readout.setAttribute("aria-hidden", "true");
    readout.hidden = true;
    stage.after(readout);
  }

  function renderAxis(list, iso) {
    // The axis row is prerendered empty in index.html (its 30 px are reserved, so mounting never
    // changes the panel height, CLS budget §8). Only create one if the markup lacks it.
    let axis = panel.querySelector(".esse-axis");
    const ticks = yearTicks(list, iso);
    if (!ticks.length) return;
    if (!axis) {
      axis = document.createElement("div");
      axis.className = "esse-axis";
      axis.setAttribute("aria-hidden", "true");
      stage.after(axis);
    }
    axis.replaceChildren();
    const place = () => {
      const r = stage.getBoundingClientRect();
      const lay = layout(r.width / Math.max(1, r.height));
      axis.style.setProperty("--m", `${((lay.margin / lay.A) * 100).toFixed(3)}%`);
      for (const [i, el] of [...axis.children].entries()) {
        el.style.setProperty("--x", `${((emberX(ticks[i].t, lay) / lay.A) * 100).toFixed(3)}%`);
      }
    };
    ticks.forEach((tick, i) => {
      const span = document.createElement("span");
      span.className = "esse-tick";
      if ((ticks.length - 1 - i) % 2) span.dataset.minor = ""; // „now“ always labelled
      span.textContent = String(tick.year);
      axis.append(span);
    });
    place();
    const ro = new ResizeObserver(place);
    ro.observe(stage);
    offs.push(() => ro.disconnect());
  }

  function showEmber(e) {
    if (!readout) return;
    if (!e) {
      readout.hidden = true;
      return;
    }
    const r = e.repo;
    const parts = [r.n || "öffentliches Repo"];
    if (r.l) parts.push(r.l);
    parts.push(`Repo angelegt ${format.date(r.c, "month")}`);
    if (r.p) parts.push(`letzter Push ${format.date(r.p)}`);
    parts.push(GLOW_WORD(e.days));
    readout.textContent = parts.join(" · ");
    readout.hidden = false;
  }

  /* ── Poster still (calm, no WebGL2, lost context) ─────────────────────────────────────────── */
  async function paintStill() {
    if (still || destroyed) return;
    const r = stage.getBoundingClientRect();
    const wide = r.width / Math.max(1, r.height) > 1.2;
    const base = wide ? POSTERS.wide : POSTERS.tall;
    let img = null;
    for (const src of [base.replace(/\.webp$/, ".avif"), base]) {
      const probe = new Image();
      probe.decoding = "async";
      probe.src = src;
      try {
        await probe.decode();
        img = probe;
        break;
      } catch {
        /* AVIF unsupported or file missing: try the next one */
      }
    }
    if (!img) return; // poster not rendered yet: the CSS poster stays
    if (destroyed || ctl?.canvas?.isConnected) return;
    still = document.createElement("canvas");
    still.className = "esse-still";
    still.setAttribute("aria-hidden", "true");
    const draw = () => {
      const b = stage.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      still.width = Math.max(1, Math.round(b.width * dpr));
      still.height = Math.max(1, Math.round(b.height * dpr));
      const s = Math.max(still.width / img.naturalWidth, still.height / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      const g = still.getContext("2d");
      g.drawImage(img, (still.width - w) / 2, still.height - h, w, h);
    };
    draw();
    stage.append(still);
    const ro = new ResizeObserver(draw);
    ro.observe(stage);
    offs.push(() => ro.disconnect());
  }

  /* ── WebGL2 forge ─────────────────────────────────────────────────────────────────────────── */
  const mobile = matchMedia("(max-width: 1023.98px), (pointer: coarse)").matches;

  function syncStrike() {
    const live = Boolean(ctl) && !motion.calm;
    if (strikeBtn) strikeBtn.hidden = !live;
    if (live) panel.dataset.strike = "";
    else delete panel.dataset.strike;
  }

  async function boot() {
    if (ctl || destroyed || motion.calm || !glOk(motion, "webgl2")) return false;
    let mod;
    try {
      mod = await import("../gl/esse.pack.js"); // packed by scripts/pack-gl.mjs from gl/esse.js (§8 budget)
    } catch {
      return false;
    }
    if (destroyed || motion.calm) return false;
    ctl = mod.start(stage, {
      repos: hasEmbers ? repos : null,
      asOf,
      mobile,
      skipIntro: storage.session.get("lmf-forged") === "1",
      onHover: showEmber,
      onCooled: () => storage.session.set("lmf-forged", "1"),
      onLive: () => {
        panel.dataset.gl = "";
        still?.remove();
        still = null;
      },
      onLost: () => {
        delete panel.dataset.gl;
        paintStill();
        syncStrike();
      },
      onRestored: () => syncStrike(),
      onDead: () => {
        ctl = null;
        delete panel.dataset.gl;
        showEmber(null);
        syncStrike();
        paintStill();
      },
    });
    syncStrike();
    return Boolean(ctl);
  }

  if (strikeBtn) on(strikeBtn, "click", () => ctl?.strike());

  const offCalm = motion.onCalmChange((calm) => {
    ctl?.setCalm(calm);
    syncStrike();
    if (!calm && !ctl) boot().then((ok) => ok || paintStill());
  });
  offs.push(offCalm);

  const ok = await boot();
  if (!ok) paintStill();
  syncStrike();

  if (debugMode()) window.__lmfEsse = { get ctl() { return ctl; } };

  function api() {
    return {
      destroy() {
        destroyed = true;
        ctl?.destroy();
        ctl = null;
        still?.remove();
        fx.forEach((f) => f?.destroy?.());
        offs.splice(0).forEach((off) => off());
      },
    };
  }
  return api();
}
