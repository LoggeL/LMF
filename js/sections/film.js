/**
 * Kapitel IV · Film · Rotglut — the projector gate (§2.3 Kapitel IV, §5.8)  [WP3]
 *
 * Root: <article id="kapitel-iv">. Renders into [data-mount="projector"]:
 *   gate    the film's 16:9 YouTube poster, uncropped (also for the 9:16 Portes du Soleil: its poster is
 *           16:9 and carries the ridge, a 9:16 crop of it would be sky) + facade button. Only while a
 *           9:16 film plays does the gate turn upright (below 1024 px).
 *   reel    one button per ski film (aria-pressed), year · place · duration in mono
 *   caption the film's own line from its YouTube description, as a tagline in Instrument Serif Italic
 * Switching: decode first, then a 250 ms pull-down in steps(6) (instant when calm).
 * YouTube loads only after „Film abspielen“ (youtube-nocookie iframe).
 * GL (js/gl/projector.js, WebGL1) adds weave, flicker, grain and halation when the device and the
 * motion setting allow it; otherwise a CSS grain tile (js/fx/grain.js), static when calm.
 */
import { html, icon, safeUrl, fragment } from "../lib/dom.js";
import { applyGrain } from "../fx/grain.js";
import { glOk } from "../fx/gpu.js";
import { THUMBS } from "../render/thumbs.js";

/* Same srcset/sizes as the prerendered gate in index.html, so the still is fetched once, at the size shown. */
export const GATE_SIZES = "(min-width: 1024px) min(58vw, 860px), calc(100vw - 32px)";
export function gateSrcset(image) {
  const widths = THUMBS[image] ?? [];
  if (!widths.length) return "";
  const base = image.split("/").pop().replace(/\.webp$/, "");
  return [...widths.map((w) => `assets/img/thumbs/${base}-${w}.webp ${w}w`), `${image} 1280w`].join(", ");
}
function setSource(el, image) {
  const set = gateSrcset(image);
  if (set) {
    el.sizes = GATE_SIZES;
    el.srcset = set;
  } else {
    el.removeAttribute("srcset");
    el.removeAttribute("sizes");
  }
  el.src = image;
}

const films = (data) => {
  const list = data?.films instanceof Map ? [...data.films.values()] : Array.isArray(data?.films) ? data.films : [];
  return list
    .filter((f) => f?.series === "ski" && f.youtubeId)
    .sort((a, b) => String(a.uploaded).localeCompare(String(b.uploaded)));
};

/** Reel label from sourced fields: location (+ cut from the project title), else the project title. */
function label(film, project) {
  const cut = /·\s*(.+?Cut)\s*$/.exec(project?.title ?? "")?.[1];
  if (film.location) return cut ? `${film.location} · ${cut}` : film.location;
  return project?.title ?? film.realTitle;
}

export async function mount(root, ctx) {
  const { motion, format } = ctx;
  const host = root.querySelector('[data-mount="projector"]');
  const data = await ctx.data;
  const reel = films(data);
  if (!host || !reel.length) return { destroy() {} };

  const byId = data.byId instanceof Map ? data.byId : new Map();
  const items = reel.map((f, i) => {
    const p = byId.get(f.id);
    const year = Number.isFinite(p?.year) ? p.year : format.year(f.uploaded);
    return {
      film: f,
      project: p,
      no: i + 1,
      year,
      name: label(f, p),
      image: p?.image && /^assets\/img\/[\w.-]+\.(webp|jpg|png|avif)$/.test(p.image) ? p.image : null,
      vertical: f.aspect === "9:16",
    };
  });
  let active = items.length - 1; // newest first on stage (matches the static still)
  let gl = null;
  let destroyed = false;
  const offs = [];

  const reelButton = (it, i) => {
    // Accessible name starts with the visible text in visible order (WCAG 2.5.3): „2019 Feldberg, …“
    const spoken = [`${it.year} ${it.name}`, format.durationLabel(it.film.duration), it.vertical ? "Hochformat" : ""].filter(Boolean).join(", ");
    return html`<li><button class="reel-item" type="button" data-heat data-reel="${i}" aria-pressed="${i === active}" aria-label="${spoken}">
      <span class="reel-year">${it.year}</span><span class="reel-name">${it.name}</span><span class="reel-dur">${format.duration(it.film.duration)}</span>${it.vertical ? html`<span class="reel-badge">Hochformat</span>` : ""}
    </button></li>`;
  };

  host.replaceChildren(
    fragment(html`<div class="projector-deck">
      <div class="projector-main">
        <figure class="projector-gate" data-aspect="16:9">
          <div class="projector-frame">
            <div class="projector-film">
              <div class="projector-pic">
                <img class="projector-still" alt="" width="1280" height="720" decoding="async" />
                <div class="projector-slate" hidden><span class="projector-slate-title"></span><span class="projector-slate-meta meta"></span></div>
                <div class="projector-fx" aria-hidden="true"><div class="fx-grain"></div></div>
              </div>
            </div>
            <div class="projector-player" hidden></div>
          </div>
          <figcaption class="projector-caption">
            <p class="projector-meta meta"></p>
            <div class="projector-quote-wrap"></div>
          </figcaption>
        </figure>
        <div class="projector-facade">
          <button class="button projector-play" type="button" data-heat>Film abspielen ${icon("play")}</button>
          <p class="projector-consent">Beim Abspielen lädt YouTube (Google) Inhalte und setzt ggf. Cookies.</p>
        </div>
      </div>
      <div class="projector-reel">
        <p class="projector-edge meta" aria-hidden="true"></p>
        <ol class="projector-list" role="list" aria-label="Ski-Aftermovies">${items.map(reelButton)}</ol>
      </div>
    </div>`),
  );

  const $ = (s) => host.querySelector(s);
  const gate = $(".projector-gate");
  const frame = $(".projector-frame");
  const filmEl = $(".projector-film");
  const pic = $(".projector-pic");
  const img = $(".projector-still");
  const slate = $(".projector-slate");
  const player = $(".projector-player");
  const meta = $(".projector-meta");
  const quote = $(".projector-quote-wrap");
  const edge = $(".projector-edge");
  const play = $(".projector-play");
  applyGrain(pic);

  function caption(it) {
    const f = it.film;
    // month, length, one link on (where else a film runs is not the point here)
    const parts = [
      f.uploaded ? html`<span><time datetime="${format.isoDay(f.uploaded)}">${format.dateLong(format.isoDay(f.uploaded).slice(0, 7))}</time></span>` : "",
      format.duration(f.duration) ? html`<span>${format.duration(f.duration)}</span>` : "",
      it.project ? html`<span><a href="#werk/${it.film.id}" data-project-id="${it.film.id}">Mehr zum Film</a></span>` : "",
    ];
    meta.innerHTML = String(html`${parts}`);
    if (f.quote) {
      quote.innerHTML = String(html`<blockquote class="projector-quote" cite="${safeUrl(`https://www.youtube.com/watch?v=${f.youtubeId}`)}"><p>„${f.quote}“</p></blockquote>`);
    } else if (f.paraphrase) {
      quote.innerHTML = String(html`<p class="projector-quote projector-quote--paraphrase">${f.paraphrase}</p>`);
    } else quote.replaceChildren();
    edge.textContent = `Rolle ${it.no} von ${items.length} · ${it.year}`;
  }

  function stage(it) {
    // At rest every film shows its 16:9 poster whole; the upright frame belongs to playback.
    gate.dataset.aspect = "16:9";
    if (it.image) {
      img.hidden = false;
      slate.hidden = true;
      img.alt = `Standbild aus dem Aftermovie „${it.name}“ (${it.year})`;
    } else {
      img.hidden = true;
      img.removeAttribute("src");
      img.removeAttribute("srcset");
      slate.hidden = false;
      slate.querySelector(".projector-slate-title").textContent = it.name;
      slate.querySelector(".projector-slate-meta").textContent = `${it.year} · ${format.duration(it.film.duration)}`;
    }
    play.setAttribute("aria-label", `Film abspielen: ${it.name}`);
    caption(it);
  }

  function closePlayer() {
    if (player.hidden) return;
    player.replaceChildren();
    player.hidden = true;
    gate.removeAttribute("data-playing");
    gate.dataset.aspect = "16:9";
    play.hidden = false;
    gl?.resume();
  }

  let token = 0;
  async function select(i, { animate = true } = {}) {
    if (i === active && animate) return;
    const it = items[i];
    const my = ++token;
    active = i;
    for (const b of host.querySelectorAll("[data-reel]")) b.setAttribute("aria-pressed", String(+b.dataset.reel === i));
    closePlayer();
    // decode the next still before anything moves
    let next = null;
    if (it.image) {
      next = new Image();
      setSource(next, it.image);
      try {
        await next.decode();
      } catch {
        it.image = null;
        next = null;
      }
    }
    if (my !== token || destroyed) return;
    const pull = animate && !motion.calm && filmEl.animate;
    if (pull) {
      await filmEl
        .animate([{ translate: "0 0" }, { translate: "0 -6%" }], { duration: 125, easing: "steps(3, end)" })
        .finished.catch(() => {});
      if (my !== token) return;
    }
    if (next) setSource(img, it.image);
    stage(it);
    gl?.setImage(next ?? null, false, 0.5);
    if (pull) filmEl.animate([{ translate: "0 6%" }, { translate: "0 0" }], { duration: 125, easing: "steps(3, end)" });
  }

  const onReel = (e) => {
    const b = e.target instanceof Element ? e.target.closest("[data-reel]") : null;
    if (b) select(+b.dataset.reel);
  };
  host.addEventListener("click", onReel);
  offs.push(() => host.removeEventListener("click", onReel));

  const onKey = (e) => {
    const b = e.target instanceof Element ? e.target.closest("[data-reel]") : null;
    if (!b || !["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const n = items.length;
    const i = +b.dataset.reel;
    const j = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + n) % n;
    e.preventDefault();
    host.querySelector(`[data-reel="${j}"]`)?.focus();
  };
  host.addEventListener("keydown", onKey);
  offs.push(() => host.removeEventListener("keydown", onKey));

  const onPlay = () => {
    const it = items[active];
    const id = encodeURIComponent(it.film.youtubeId);
    const frameEl = document.createElement("iframe");
    frameEl.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    frameEl.title = `${it.name} (${it.year}) auf YouTube`;
    frameEl.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frameEl.referrerPolicy = "strict-origin-when-cross-origin";
    player.replaceChildren(frameEl);
    player.hidden = false;
    gate.dataset.playing = "";
    if (it.vertical) gate.dataset.aspect = "9:16";
    play.hidden = true;
    gl?.pause();
    frameEl.focus();
  };
  play.addEventListener("click", onPlay);
  offs.push(() => play.removeEventListener("click", onPlay));

  // First paint: the newest film, no animation.
  await select(active, { animate: false });
  // Mobile reel is a horizontal strip, oldest first: bring the film on stage into view (no page scroll).
  const list = $(".projector-list");
  const cur = list?.querySelector('[aria-pressed="true"]');
  if (cur && list.scrollWidth > list.clientWidth) list.scrollLeft += cur.getBoundingClientRect().right - list.getBoundingClientRect().right;

  /* ── GL projector (P1): gated like the Esse ─────────────────────────────────────────────────── */
  async function bootGL() {
    if (gl || destroyed || motion.calm || !glOk(motion, "webgl")) return;
    try {
      const mod = await import("../gl/projector.js");
      if (destroyed || motion.calm) return;
      gl = mod.start(pic, {
        image: items[active].image ? img : null,
        vertical: false,
        focus: 0.5,
        onDead: () => {
          gl = null;
          delete frame.dataset.gl;
        },
      });
      if (gl) frame.dataset.gl = "";
      if (gl && !player.hidden) gl.pause();
    } catch {
      gl = null;
    }
  }
  const offCalm = motion.onCalmChange((calm) => {
    if (gl) gl.setCalm(calm);
    else if (!calm) bootGL();
  });
  offs.push(offCalm);
  if ("requestIdleCallback" in window) requestIdleCallback(() => bootGL(), { timeout: 2000 });
  else setTimeout(bootGL, 300);

  return {
    destroy() {
      destroyed = true;
      gl?.destroy();
      offs.splice(0).forEach((off) => off());
    },
  };
}
