/**
 * 05 · Die Werkstatt (spec §2.7, §5.10)  [WP5]
 *
 * Static copy (about, Knöpfe, Bühne, headings) lives in index.html. This module adds:
 *  - Knopf: the pressable „I'm just pressing buttons“ stamp (aria-pressed; the cap always reads
 *    „Knopf“, its name; „Siehste.“ is a separate aria-hidden stamp + polite announcement),
 *  - Werkzeugwand: the top 18 tools counted from details.stack (fallback: tags of code
 *    projects; film projects carry genre tags, not tools, so they are not counted), each a
 *    button that dispatches `lmf:filter {q: tool}` to the Lager. Counted at build time by
 *    scripts/make-tools.mjs into js/render/tools.js, so a plain scroll fetches no details file,
 *  - Zunft: partner cards from data/partners.json with their sources (Punze), the tiny
 *    Gummibären clip plays only on hover/focus and never when calm; a logo that fails to load
 *    becomes a typographic monogram (the Rohling language of the plates),
 *  - the Ramsen line is kept only if partners.json really has partners in Ramsen.
 */
import { html, icon, safeUrl, EXT_SUFFIX } from "../lib/dom.js";
import { toolCounts, formatDate } from "../lib/derive.js";
import { partnerCategory } from "../render/credits.js";
import { TOOLS } from "../render/tools.js";

export const TOP_TOOLS = 18;

/** Projects that count for the Werkzeugwand (shared with tests): stack, or tags of non-film projects. */
export function toolProjects(projects = [], detailsById = new Map()) {
  const get = (id) => (detailsById instanceof Map ? detailsById.get(id) : detailsById?.[id]);
  return projects.filter((p) => (get(p.id)?.stack?.length ?? 0) > 0 || !p.groups?.includes("film"));
}

export function wallTools(projects, detailsById) {
  return toolCounts(toolProjects(projects, detailsById), detailsById).slice(0, TOP_TOOLS);
}

/* ── Knopf ─────────────────────────────────────────────────────────────────────────────────────── */

function mountKnopf(root, announce) {
  const knopf = root.querySelector("#knopf");
  if (!knopf) return () => {};
  const on = knopf.dataset.labelOn || "Siehste.";
  // The cap keeps reading „Knopf“ (visible label = accessible name, WCAG 2.5.3); pressing it
  // strikes a separate „Siehste.“ stamp next to it, hidden from AT, which hears the announcement.
  knopf.removeAttribute("aria-label");
  let stamp = knopf.querySelector(".knopf-said");
  if (!stamp) {
    stamp = document.createElement("span");
    stamp.className = "knopf-said";
    stamp.setAttribute("aria-hidden", "true");
    stamp.textContent = on;
    knopf.append(stamp);
  }
  let timer = 0;
  const click = () => {
    const pressed = knopf.getAttribute("aria-pressed") !== "true";
    knopf.setAttribute("aria-pressed", String(pressed));
    if (pressed) announce?.(on, { throttle: 0 });
    knopf.classList.remove("is-struck");
    void knopf.offsetWidth; // restart the stamp animation
    knopf.classList.add("is-struck");
    clearTimeout(timer);
    timer = setTimeout(() => knopf.classList.remove("is-struck"), 700);
  };
  knopf.addEventListener("click", click);
  return () => {
    clearTimeout(timer);
    knopf.removeEventListener("click", click);
  };
}

/* ── Werkzeugwand ──────────────────────────────────────────────────────────────────────────────── */

function wallHtml(tools, asOf) {
  const max = tools[0]?.count ?? 1;
  return html`<ul class="wand" role="list">${tools.map(
    (t, i) =>
      html`<li class="wand-hook" style="--i:${i};--w:${(t.count / max).toFixed(3)};--tilt:${((((i * 7) % 5) - 2) * 0.9).toFixed(1)}deg"><button class="wand-tag" type="button" data-tool="${t.tool}" data-count="${t.count}" data-heat><span class="wand-name">${t.tool}</span> <span class="wand-count">×${t.count}</span><span class="vh"> im Lager zeigen</span></button></li>`,
  )}</ul>
<p class="wand-note meta">Gezählt aus den Werkstattdaten meiner Code-Projekte, jedes Projekt zählt ein Werkzeug einmal.${asOf ? ` Stand ${formatDate(asOf)}.` : ""}</p>`;
}

/**
 * Asks the Lager to filter and moves keyboard focus to its search field. If nothing reacted
 * (the Lager is not mounted yet), the search field is filled directly so the click still does
 * what it says. Sections above the Lager may still grow while the smooth scroll runs (lazy
 * stages mount), which leaves the scroll short of its target; once the page has settled, the
 * jump is corrected instantly so focus and view end up together. Any user input cancels that.
 */
function filterLager(tool, motion) {
  const search = () => document.getElementById("project-search");
  document.dispatchEvent(new CustomEvent("lmf:filter", { detail: { q: tool } }));
  // Keyboard focus follows the jump (the Lager scrolls itself; focus must not stay ~7000 px away).
  search()?.focus({ preventScroll: true });
  setTimeout(() => {
    const field = search();
    if (field && field.value !== tool) {
      field.value = tool;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      document.getElementById("lager")?.scrollIntoView({ behavior: motion.scrollBehavior, block: "start" });
      field.focus({ preventScroll: true });
    }
  }, 60);
  settle(search);
}

function settle(search) {
  const cancelOn = ["wheel", "touchstart", "keydown", "pointerdown"];
  let last = -1;
  let calm = 0;
  let timer = 0;
  const t0 = performance.now();
  const stop = () => {
    clearTimeout(timer);
    cancelOn.forEach((t) => removeEventListener(t, stop, true));
  };
  const check = () => {
    const y = Math.round(scrollY);
    calm = y === last ? calm + 1 : 0;
    last = y;
    if (calm < 3 && performance.now() - t0 < 4000) return (timer = setTimeout(check, 120));
    stop();
    const field = search();
    const lager = document.getElementById("lager");
    if (!field || !lager || document.activeElement !== field) return;
    const r = field.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= innerHeight) return;
    lager.scrollIntoView({ behavior: "instant", block: "start" });
    const r2 = field.getBoundingClientRect();
    if (r2.top < 0 || r2.bottom > innerHeight) field.scrollIntoView({ behavior: "instant", block: "center" });
  };
  cancelOn.forEach((t) => addEventListener(t, stop, { capture: true, passive: true }));
  timer = setTimeout(check, 200);
}

/* ── Zunft ─────────────────────────────────────────────────────────────────────────────────────── */

const httpsSources = (sources = []) => sources.filter((s) => /^https:\/\//.test(s.url ?? ""));
const quellen = (n) => `${n} ${n === 1 ? "Quelle" : "Quellen"}`;
const sourceItem = (s, who = "") =>
  html`<li>${who ? html`<span class="zunft-punze-who">${who}</span> ` : ""}<a href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">${s.label} ${icon("arrow-ne")}<span class="vh">${EXT_SUFFIX}</span></a>${s.checkedAt ? html` <span class="meta">geprüft am ${formatDate(s.checkedAt)}</span>` : ""}</li>`;

function punze(sources = []) {
  const list = httpsSources(sources);
  if (!list.length) return "";
  return html`<details class="zunft-punze"><summary>${icon("punze")} <span>Gepunzt · ${quellen(list.length)}</span></summary>
<ul role="list">${list.map((s) => sourceItem(s))}</ul></details>`;
}

/** Below 640 px the cards are a compact two-column grid; their hallmarks move into one footer. */
function punzeAll(partners) {
  const rows = partners.flatMap((p) => httpsSources(p.sources).map((s) => [p.title, s]));
  if (!rows.length) return "";
  return html`<details class="zunft-punze zunft-punze--all"><summary>${icon("punze")} <span>Gepunzt · ${quellen(rows.length)}</span></summary>
<ul role="list">${rows.map(([who, s]) => sourceItem(s, who))}</ul></details>`;
}

function partnerMark(p) {
  if (p.video) {
    const base = p.video.replace(/\.(webm|mp4)$/i, "");
    return html`<span class="zunft-mark zunft-mark--clip"><video class="zunft-clip" muted loop playsinline preload="metadata" width="40" height="40" aria-hidden="true" tabindex="-1" disablepictureinpicture><source src="${base}.webm#t=0.1" type="video/webm"><source src="${base}.mp4#t=0.1" type="video/mp4"></video></span>`;
  }
  if (p.image) return html`<span class="zunft-mark" data-mono="${monogram(p.title)}"><img src="${p.image}" alt="" width="96" height="96" loading="lazy" decoding="async"></span>`;
  return html`<span class="zunft-mark zunft-mark--blank" aria-hidden="true">${monogram(p.title)}</span>`;
}

/** A mark without a logo: short initialisms stay whole („CFW“, „JP“), else two letters
 *  („Palatina Films“ → „PF“, „Xenon“ → „XE“). */
export function monogram(title = "") {
  if (/^\p{Lu}{2,3}$/u.test(title)) return title;
  const words = title.split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? title).slice(0, 2)).toUpperCase();
}

/** A logo that fails (or already failed) to load: hide the broken image, show the monogram. */
function mountLogoFallback(container) {
  const fail = (img) => {
    const mark = img.closest(".zunft-mark");
    if (!mark || mark.classList.contains("zunft-mark--blank")) return;
    mark.classList.add("zunft-mark--blank");
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = mark.dataset.mono;
  };
  const onError = (e) => e.target instanceof HTMLImageElement && fail(e.target);
  container.addEventListener("error", onError, true);
  for (const img of container.querySelectorAll(".zunft-mark img")) if (img.complete && !img.naturalWidth && img.currentSrc) fail(img);
  return () => container.removeEventListener("error", onError, true);
}

function partnersHtml(partners) {
  return html`<ul class="zunft-list" role="list">${partners.map(
    (p, i) => html`<li class="zunft-card" data-partner="${p.id}"${p.video ? html` data-clip` : ""}>
${partnerMark(p)}
<p class="zunft-no meta" aria-hidden="true">${String(i + 1).padStart(2, "0")}</p>
<h4 class="zunft-name"><a href="${safeUrl(p.link)}" target="_blank" rel="noopener noreferrer">${p.title} ${icon("arrow-ne")}<span class="vh">${EXT_SUFFIX}</span></a></h4>
<p class="zunft-cat meta">${partnerCategory(p.category)}${p.place ? html` · ${p.place}` : ""}</p>
${p.description ? html`<p class="zunft-desc">${p.description}</p>` : ""}
${punze(p.sources)}
</li>`,
  )}</ul>${punzeAll(partners)}`;
}

function mountClips(container, motion) {
  const offs = [];
  for (const card of container.querySelectorAll("[data-clip]")) {
    const video = card.querySelector("video");
    if (!video) continue;
    const play = () => {
      if (motion.calm) return;
      video.play().catch(() => {});
    };
    const stop = () => {
      if (card.matches(":hover, :focus-within")) return;
      video.pause();
      try {
        video.currentTime = 0.1;
      } catch {
        /* not loaded yet */
      }
    };
    for (const [type, fn] of [
      ["pointerenter", play],
      ["focusin", play],
      ["pointerleave", stop],
      ["focusout", () => setTimeout(stop, 0)],
    ]) {
      card.addEventListener(type, fn);
      offs.push(() => card.removeEventListener(type, fn));
    }
    offs.push(motion.onCalmChange((calm) => calm && video.pause()));
  }
  return () => offs.forEach((off) => off());
}

/* ── Mount ─────────────────────────────────────────────────────────────────────────────────────── */

export async function mount(root, ctx) {
  const offs = [mountKnopf(root, ctx.announce)];
  const data = await ctx.data;
  const asOf = data?.snapshot?.asOf ?? null;

  const partnersMount = root.querySelector('[data-mount="partners"]');
  if (partnersMount && Array.isArray(data?.partners) && data.partners.length) {
    partnersMount.innerHTML = String(partnersHtml(data.partners));
    offs.push(mountClips(partnersMount, ctx.motion), mountLogoFallback(partnersMount));
  }
  const ramsen = root.querySelector('[data-mount="ramsen"]');
  if (ramsen && Array.isArray(data?.partners)) ramsen.hidden = data.partners.filter((p) => p.place === "Ramsen").length < 2;

  const wall = root.querySelector('[data-mount="werkzeugwand"]');
  if (wall) {
    // „Gezählt, nicht geschätzt“: counted at build time (scripts/make-tools.mjs); an empty list
    // means no wall at all (omission rule §1.4), never a guess.
    const tools = TOOLS.map(([tool, count]) => ({ tool, count }));
    if (!tools.length) wall.closest(".werkzeugwand")?.setAttribute("hidden", "");
    else {
      wall.innerHTML = String(wallHtml(tools, asOf));
      const onClick = (e) => {
        const b = e.target.closest("[data-tool]");
        if (!b) return;
        b.classList.add("is-struck");
        setTimeout(() => b.classList.remove("is-struck"), 300);
        filterLager(b.dataset.tool, ctx.motion);
      };
      wall.addEventListener("click", onClick);
      offs.push(() => wall.removeEventListener("click", onClick));
    }
  }

  return { destroy: () => offs.forEach((off) => off()) };
}
