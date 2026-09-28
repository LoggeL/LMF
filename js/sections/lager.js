/**
 * Das Lager (spec §2.4, §5.3)  [WP2]. State { g, q, s, v } ↔ ?g=…&q=…&s=…&v=… (defaults omitted).
 * One innerHTML per update; quench/reheat via a View Transition (not calm).
 * currentOrder() → ids of all matches in result order (for the Werkbank's prev/next).
 */
import { html, icon, $, $$, isTyping } from "../lib/dom.js";
import { GROUPS, formatDate } from "../lib/derive.js";
import { filterProjects, sortProjects, SORTS } from "../lib/search.js";
import { plateContext, renderPlates, plateMedia } from "../render/plate.js";
import { scrollToTarget } from "../lib/scroll.js";

// The „Liste“ table is fetched only when the list view is used (before-load JS budget, §8).
let table = null;
let tableP = null;
const loadTable = () => (tableP ??= import("../render/table.js").then((m) => (table = m)));

const BATCH = 12;
const DEFAULTS = { g: "all", q: "", s: "lager", v: "regal" };
const VIEWS = ["regal", "liste"];
const VT_MAX = 24;

let order = [];
export const currentOrder = () => order.slice();

/** #project-count text: „12 von 43 Projekten“ while paging, else singular/plural/zero. */
export function countText(visible, matching, { all = false } = {}) {
  if (matching === 0) return "Nichts gefunden";
  if (visible < matching) return `${visible} von ${matching} Projekten`;
  if (matching === 1) return "1 Projekt";
  return all ? `Alle ${matching} Projekte` : `${matching} Projekte`;
}

/**
 * Projects without a screenshot whose details carry a „strip“ (the Codex widget) show that strip on
 * a dark stage instead of a Rohling. The details are fetched only once such a plate comes near the
 * viewport (not at boot); the plate swaps in place. Returns scan(): call it after a re-render.
 */
export function loadStrips(data, strips, scope) {
  const want = new Map((data?.projects ?? []).filter((p) => !p.image && p.details).map((p) => [p.id, p]));
  const asked = new Set();
  if (!want.size || !data.details?.get) return () => {};
  const fetchFor = (p) => {
    if (asked.has(p.id) || strips.has(p.id)) return;
    asked.add(p.id);
    data.details.get(p.id)?.then((d) => {
      const strip = (d?.media ?? []).find((m) => m.kind === "strip" && m.src);
      if (!strip) return;
      strips.set(p.id, strip);
      for (const el of scope.querySelectorAll(`.plate[data-id="${CSS.escape(p.id)}"] .plate-media--rohling`)) {
        el.outerHTML = String(plateMedia(p, { strips }));
      }
    }, () => asked.delete(p.id));
  };
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (records) => {
            for (const r of records) {
              if (!r.isIntersecting) continue;
              io.unobserve(r.target);
              const p = want.get(r.target.closest(".plate")?.dataset.id);
              if (p) fetchFor(p);
            }
          },
          { rootMargin: "400px" },
        )
      : null;
  const scan = () => {
    io?.disconnect();
    for (const el of scope.querySelectorAll(".plate-media--rohling")) {
      const p = want.get(el.closest(".plate")?.dataset.id);
      if (!p || asked.has(p.id) || strips.has(p.id)) continue;
      if (io) io.observe(el);
      else fetchFor(p);
    }
  };
  scan();
  return scan;
}

/** Parses the archive state from a query string. Unknown values fall back to defaults. */
export function parseState(search = "") {
  const params = new URLSearchParams(search);
  const g = params.get("g");
  const s = params.get("s");
  const v = params.get("v");
  return {
    g: GROUPS.includes(g) ? g : DEFAULTS.g,
    q: (params.get("q") ?? "").slice(0, 100),
    s: SORTS.includes(s) ? s : DEFAULTS.s,
    v: VIEWS.includes(v) ? v : DEFAULTS.v,
  };
}

/** Query string for a state (defaults omitted; other params such as ?poster are kept). */
export function stateQuery(state, search = "") {
  const params = new URLSearchParams(search);
  for (const key of Object.keys(DEFAULTS)) {
    const value = key === "q" ? state.q.trim() : state[key];
    if (value && value !== DEFAULTS[key]) params.set(key, value);
    else params.delete(key);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function mount(root, ctx) {
  const container = $("#projects-container", root);
  const count = $("#project-count", root);
  const search = $("#project-search", root);
  const sort = $("#sort", root);
  const loadMore = $("#load-more", root);
  const empty = $("#empty-state", root);
  const staticList = document.getElementById("lager-static");
  const options = $(".lager-options", root);
  const filters = $$("[data-filter]", root);
  const views = $$("[data-view]", root);
  const offs = [];
  const on = (el, type, fn, opts) => {
    el?.addEventListener(type, fn, opts);
    offs.push(() => el?.removeEventListener(type, fn, opts));
  };

  // Sort and view live behind „Mehr Optionen“ on small screens.
  if (options && matchMedia("(max-width: 1023.98px)").matches) options.open = false;

  const data = await ctx.data;
  const projects = data?.projects;

  if (!projects) {
    count.textContent = "Das Lager konnte gerade nicht geladen werden.";
    count.removeAttribute("aria-live");
    // Chips, search, sort and view have nothing to act on: switch them off instead of letting them do nothing.
    for (const c of [...filters, ...views, search, sort]) if (c) c.disabled = true;
    $(".lager-toolbar", root)?.setAttribute("data-disabled", "");
    container.innerHTML = String(
      html`<p class="lager-error">Bitte lade die Seite erneut. Alternativ findest du die Projekte <a href="https://github.com/LoggeL" target="_blank" rel="noopener noreferrer">auf GitHub ${icon("arrow-ne")}<span class="vh"> (öffnet neue Seite)</span></a>.</p>`,
    );
    loadMore.hidden = true;
    root.dataset.state = "error";
    return { destroy() {} };
  }

  const films = data.films instanceof Map ? data.films : null;
  const baseCtx = plateContext(data, { strips: new Map() });

  // Every number carries its date (§1.4 #3): the stars and glow on the plates are „Stand {asOf}“.
  const asOf = data.snapshot?.asOf;
  if (asOf && !root.querySelector(".lager-stand")) {
    count.insertAdjacentHTML(
      "afterend",
      String(html`<p class="meta lager-stand">Stand <time datetime="${asOf}">${formatDate(asOf)}</time> <span class="lager-stand-no"><span class="lager-stand-sep">· </span><span aria-hidden="true">Nº</span><span class="vh">Nummer</span> = Reihenfolge nach Jahr</span></p>`),
    );
  }
  const loaded = new Map(); // id → details (for stack names in the haystack)
  const state = { ...parseState(location.search), limit: BATCH };
  let prevIds = new Set();
  let detailsAll = null;
  let activeVt = null;

  search.value = state.q;
  sort.value = state.s;
  // Junk state (?g=zzz&s=…) fell back to the defaults above; say so in the address bar too. [WP0]
  writeUrl();

  function result() {
    const opts = { details: loaded, films };
    const matching = sortProjects(filterProjects(projects, state.g, state.q, opts), state.s, { films, order: projects });
    return { matching, opts };
  }

  function syncControls(opts) {
    for (const b of filters) {
      const g = b.dataset.filter;
      b.setAttribute("aria-pressed", String(g === state.g));
      const n = filterProjects(projects, g, state.q, opts).length;
      const c = b.querySelector(".chip-count");
      if (c && c.textContent !== String(n)) c.textContent = String(n);
      if (n === 0) b.setAttribute("aria-disabled", "true");
      else b.removeAttribute("aria-disabled");
    }
    for (const b of views) b.setAttribute("aria-pressed", String(b.dataset.view === state.v));
    if (sort.value !== state.s) sort.value = state.s;
    root.dataset.lagerView = state.v;
  }

  function writeUrl() {
    const next = location.pathname + stateQuery(state, location.search) + location.hash;
    if (next !== location.pathname + location.search + location.hash) history.replaceState(history.state, "", next);
  }

  function paint({ focusFrom = -1 } = {}) {
    const { matching, opts } = result();
    order = matching.map((p) => p.id);
    const liste = state.v === "liste";
    if (liste && !table) {
      loadTable().then(() => paint({ focusFrom }));
      return;
    }
    const visible = liste ? matching : matching.slice(0, state.limit);
    const rctx = { ...baseCtx, query: state.q, sort: state.s, eager: 3 };
    container.innerHTML = liste ? (visible.length ? table.renderTable(visible, rctx) : "") : renderPlates(visible, rctx);
    container.classList.toggle("is-liste", liste);
    const ids = new Set(visible.map((p) => p.id));
    for (const el of container.querySelectorAll(".project-card")) if (!prevIds.has(el.dataset.id)) el.classList.add("is-fresh");
    prevIds = ids;
    const text = countText(visible.length, matching.length, { all: state.g === "all" && !state.q.trim() });
    if (count.textContent !== text) {
      count.textContent = text;
      count.classList.remove("is-ticking");
      void count.offsetWidth;
      count.classList.add("is-ticking");
    }
    empty.hidden = matching.length !== 0;
    loadMore.hidden = liste || visible.length >= matching.length;
    syncControls(opts);
    filmNote();
    if (staticList) staticList.hidden = true;
    if (focusFrom >= 0) container.querySelectorAll(".project-card")[focusFrom]?.querySelector(".project-link")?.focus({ preventScroll: true });
    rescan?.();
  }
  let rescan = null;

  // The Film chip counts the Film alloy, the Abspann films.json: name the difference (tooltip + note).
  const extra = films ? projects.filter((p) => p.groups?.includes("film") && !films.has(p.id)) : [];
  const nFilm = projects.filter((p) => p.groups?.includes("film")).length;
  const names = extra.map((p) => (p.groups.includes("web") ? `die Website von ${p.title}` : p.title));
  const filmText = extra.length
    ? `Unter Film liegen ${nFilm} Werkstücke: ${nFilm - extra.length} Filme und ${names.length > 1 ? `${names.slice(0, -1).join(", ")} und ` : ""}${names.at(-1)}.`
    : "";
  const note = html`<p class="meta lager-film-note" id="lager-film-note" hidden>${filmText}</p>`;
  if (filmText) {
    $(".lager-toolbar", root)?.insertAdjacentHTML("afterend", String(note));
    // Named for keyboard and touch too (not only a tooltip); visible while the chip is on.
    const chip = filters.find((b) => b.dataset.filter === "film");
    chip?.setAttribute("aria-describedby", "lager-film-note");
    chip?.setAttribute("title", filmText);
  }
  const filmNote = () => {
    const el = $(".lager-film-note", root);
    if (el) el.hidden = state.g !== "film" || !!state.q.trim();
  };

  /** Quench/reheat: names only while the transition runs, only for plates on screen. */
  function update({ animate = true } = {}) {
    writeUrl();
    const vtOk = animate && !ctx.motion.calm && typeof document.startViewTransition === "function" && root.getBoundingClientRect().top < innerHeight;
    if (!vtOk) {
      paint();
      return;
    }
    const tag = () => {
      let n = 0;
      for (const el of container.querySelectorAll(".plate")) {
        if (n >= VT_MAX) break;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        el.style.viewTransitionName = `plate-${el.dataset.id}`;
        el.style.viewTransitionClass = "plate";
        n++;
      }
    };
    const clear = () => {
      for (const el of container.querySelectorAll(".plate")) {
        el.style.viewTransitionName = "";
        el.style.viewTransitionClass = "";
      }
      delete document.documentElement.dataset.vt;
    };
    activeVt?.skipTransition();
    document.documentElement.dataset.vt = "lager";
    tag();
    try {
      const vt = (activeVt = document.startViewTransition(() => {
        clear();
        document.documentElement.dataset.vt = "lager";
        paint();
        tag();
      }));
      // A skipped transition rejects ready/updateCallbackDone too; the final state is still painted.
      vt.ready.catch(() => {});
      vt.updateCallbackDone.catch(() => {});
      vt.finished
        .catch(() => {})
        .finally(() => {
          if (activeVt === vt) activeVt = null;
          clear();
        });
    } catch {
      clear();
      paint();
    }
  }

  /* ── Details for the haystack (stack names), fetched once the visitor starts searching ── */
  function wantDetails() {
    if (detailsAll || !data.details?.get) return detailsAll;
    const ids = projects.filter((p) => p.details).map((p) => p.id);
    detailsAll = Promise.all(
      ids.map((id) =>
        data.details.get(id).then((d) => {
          if (d) loaded.set(id, d);
        }),
      ),
    ).then(() => {
      if (state.q.trim()) paint();
    });
    return detailsAll;
  }

  /* ── Events ───────────────────────────────────────────────────────────────────────────── */
  // Paint the pressed chip first, re-render the plates after that frame (INP < 150 ms, §8).
  let pending = 0;
  const afterPaint = (fn) => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => setTimeout(fn, 0));
  };
  for (const b of filters)
    on(b, "click", () => {
      state.g = b.dataset.filter;
      state.limit = BATCH;
      for (const c of filters) c.setAttribute("aria-pressed", String(c === b));
      afterPaint(() => update());
    });

  let debounce = 0;
  on(search, "input", () => {
    clearTimeout(debounce);
    wantDetails();
    debounce = setTimeout(() => {
      state.q = search.value.slice(0, 100);
      state.limit = BATCH;
      // Typing filters without the quench (noise, and its overlay would swallow clicks).
      update({ animate: false });
    }, 120);
  });
  on(search, "focus", wantDetails);
  on(search, "keydown", (e) => {
    if (e.key === "Escape" && search.value) {
      e.preventDefault();
      e.stopPropagation();
      search.value = "";
      clearTimeout(debounce);
      state.q = "";
      state.limit = BATCH;
      update();
    }
  });
  on(document, "keydown", (e) => {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    if (isTyping(e.target) || document.querySelector("dialog[open]")) return;
    e.preventDefault();
    search.focus({ preventScroll: true });
    // Sections above may still mount while we scroll: home in until the layout settles (lib/scroll.js),
    // then make sure the field itself is on screen (a key press ends the homing early).
    const head = $(".filters", root) ?? search;
    scrollToTarget(head, { instant: ctx.motion.calm }).then(() => {
      const r = search.getBoundingClientRect();
      if (document.activeElement === search && (r.top < 0 || r.bottom > innerHeight)) search.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
  });

  // During a View Transition clicks hit <html>: skip the quench and replay the click.
  on(
    document,
    "click",
    (e) => {
      const vt = activeVt;
      if (!vt || e.target !== document.documentElement || !e.isTrusted) return;
      const { clientX: x, clientY: y } = e;
      vt.skipTransition();
      vt.finished
        .catch(() => {})
        .finally(() =>
          requestAnimationFrame(() => {
            const hit = document.elementFromPoint(x, y)?.closest("[data-filter], [data-view], #reset-filters");
            if (hit && root.contains(hit)) hit.click();
          }),
        );
    },
    true,
  );

  on(sort, "change", () => {
    state.s = SORTS.includes(sort.value) ? sort.value : "lager";
    update();
  });
  for (const b of views) {
    if (b.dataset.view === "liste") {
      on(b, "pointerenter", loadTable, { passive: true });
      on(b, "focus", loadTable);
    }
    on(b, "click", async () => {
      if (state.v === b.dataset.view) return;
      if (b.dataset.view === "liste") await loadTable();
      state.v = b.dataset.view;
      update();
    });
  }
  on(container, "click", (e) => {
    const b = e.target instanceof Element ? e.target.closest(".lt-sort") : null;
    if (!b) return;
    const s = b.dataset.sort;
    state.s = state.s === s ? "lager" : s;
    update({ animate: false });
    container.querySelector(`.lt-sort[data-sort="${s}"]`)?.focus({ preventScroll: true });
  });

  on(loadMore, "click", () => {
    const from = container.querySelectorAll(".project-card").length;
    state.limit += BATCH;
    paint({ focusFrom: from });
  });

  on($("#reset-filters", root), "click", () => {
    Object.assign(state, DEFAULTS, { limit: BATCH });
    search.value = "";
    update();
    $('[data-filter="all"]', root)?.focus();
  });

  // Details prefetch on hover/focus (§5.4).
  const prefetch = (e) => {
    const link = e.target instanceof Element ? e.target.closest(".project-link") : null;
    if (link) data.details?.prefetch?.(link.dataset.projectId);
  };
  on(container, "pointerover", prefetch, { passive: true });
  on(container, "focusin", prefetch);

  // Requests from the Werkzeugwand, Werkbank stack chips, omnibox, chapter CTAs.
  on(document, "lmf:filter", (e) => {
    const { q, g } = e.detail ?? {};
    if (typeof q === "string") state.q = q.slice(0, 100);
    state.g = GROUPS.includes(g) ? g : g === "all" || typeof q === "string" ? "all" : state.g;
    state.limit = BATCH;
    search.value = state.q;
    const details = state.q ? wantDetails() : null;
    update({ animate: false });
    details?.then(() => writeUrl());
    root.scrollIntoView({ behavior: ctx.motion.scrollBehavior, block: "start" });
  });

  // Back/forward between archive states (only the query string changes).
  on(window, "popstate", () => {
    const next = parseState(location.search);
    if (next.g === state.g && next.q === state.q && next.s === state.s && next.v === state.v) return;
    Object.assign(state, next, { limit: BATCH });
    search.value = state.q;
    paint();
  });

  if (state.q) wantDetails();
  if (state.v === "liste") await loadTable();
  paint();
  // #project-count starts muted (aria-live="off" in index.html): boot fills it silently, from now on
  // only the visitor's own actions change it (§9).
  count.removeAttribute("aria-live");
  root.dataset.state = "ready";
  rescan = loadStrips(data, baseCtx.strips, container);

  return {
    destroy() {
      offs.forEach((off) => off());
      clearTimeout(debounce);
    },
  };
}
