/**
 * Werkbank: the deep dive at #werk/<id> (spec §2.5, §5.4)  [WP2]
 *
 * Native <dialog id="werkbank">, opened by the router (js/lib/router.js). Blocks render only if
 * their data exists: title, summary and image at once, the details JSON fills the rest.
 * Focus: #close-modal on open (contract), Tab wrap, Esc → router.close() → back to the trigger,
 * the matching plate, or the #lager heading after a direct load (scrolled into view once the
 * layout above it has settled). ←/→ = voriges/nächstes Werkstück in the order of the list it
 * was opened from. The page loads js/werkbank/werkbank.pack.js: this file, body.js and facade.js in
 * one module (scripts/pack-werkbank.mjs, §8 „werkbank ≤ 9 KB gz“). Edit the sources, re-pack.
 */
import { html, $, $$, icon, extLink, safeUrl, isTyping } from "../lib/dom.js";
import { alloyOf, glowOf, glowLabel, stockNumbers, stockLabel, GROUP_LABEL, canonicalTool } from "../lib/derive.js";
import { scrollToTarget } from "../lib/scroll.js";
import { toast } from "../lib/announce.js";
import { currentOrder } from "../sections/lager.js";
import { warmList } from "../sections/warm.js";
import * as B from "./body.js";
import * as F from "./facade.js";

/** Lazy import that survives one dropped request: a failed specifier stays cached in the module
 *  map, so the second try asks under a fresh URL. */
export async function importFresh(url) {
  try {
    return await import(url);
  } catch {
    return import(`${url}?r=${Date.now().toString(36)}`);
  }
}

const CSS_HREF = "css/werkbank.css";

/** Primary CTA label (§2.13): linkLabel wins. */
export function ctaLabel(p, film) {
  if (p.linkLabel) return p.linkLabel;
  if (film?.series === "drehbuch") return "Drehbuch lesen";
  if (film || /youtu\.?be/.test(p.link ?? "")) return "Film ansehen";
  if (/^https:\/\/github\.com\//.test(p.link ?? "")) return "Repo ansehen";
  return "Ausprobieren";
}

/** Loads werkbank.css once (main.js also injects it on first idle). Resolves when usable. */
function ensureCss() {
  const existing = document.querySelector(`link[href="${CSS_HREF}"]`);
  if (existing?.sheet) return Promise.resolve();
  const link = existing ?? Object.assign(document.createElement("link"), { rel: "stylesheet", href: CSS_HREF });
  if (!existing) document.head.append(link);
  return new Promise((resolve) => {
    const done = () => resolve();
    link.addEventListener("load", done, { once: true });
    link.addEventListener("error", done, { once: true });
    setTimeout(done, 600);
  });
}

/**
 * projects.json failed: #werk/<id> is unavailable, not unknown (§2.11). The Lager keeps its failure
 * copy; the link lands on the project's row in the prerendered list (or the Lager) without a toast
 * that would claim the project does not exist.
 */
function unavailable(id, why = "Das Lager konnte gerade nicht geladen werden.") {
  const list = document.getElementById("lager-static");
  if (list) list.hidden = false;
  const row = list?.querySelector(`[data-werk="${CSS.escape(id)}"]`) ?? null;
  const target = row ?? document.getElementById("lager");
  const link = row?.querySelector("a") ?? document.getElementById("lager-title");
  if (link && !row && !link.hasAttribute("tabindex")) link.setAttribute("tabindex", "-1");
  const focus = () => link?.focus({ preventScroll: true });
  // The failure copy sits at the Lager head, off screen when we land on the row: repeat it.
  if (row) toast(`${why} Hier ist der direkte Link zu „${link.textContent.trim()}“.`);
  focus();
  // Late layout work (sections mounting above) can drop focus to <body>: set it again once settled.
  scrollToTarget(target, { instant: true }).then(() => document.activeElement === document.body && focus());
}

export async function mount(dialog, ctx) {
  const data = await ctx.data;
  if (!Array.isArray(data?.projects)) {
    ctx.router.degrade(unavailable);
    return { destroy() {} };
  }
  const projects = data.projects;
  const byId = data?.byId ?? new Map(projects.map((p) => [p.id, p]));
  const films = data?.films instanceof Map ? data.films : new Map();
  const stock = stockNumbers(projects);
  const asOf = data?.snapshot?.asOf ?? null;
  const baseTitle = document.title;

  const el = {
    meta: $('[data-wb="meta"]', dialog),
    hero: $('[data-wb="hero"]', dialog),
    kicker: $('[data-wb="kicker"]', dialog),
    title: $("#modal-title", dialog),
    dek: $('[data-wb="dek"]', dialog),
    link: $("#modal-link", dialog),
    repo: $('[data-wb="repo"]', dialog),
    body: $('[data-wb="body"]', dialog),
    prev: $('[data-wb="prev"]', dialog),
    next: $('[data-wb="next"]', dialog),
    back: $('[data-wb="back"]', dialog),
    close: $("#close-modal", dialog),
    scroll: $(".wb-scroll", dialog),
  };

  // Icon buttons on desktop (label visually hidden, tooltip names the neighbour); compact labels in
  // the mobile bottom bar. The accessible names stay „Voriges/Nächstes Werkstück“ everywhere.
  el.prev.innerHTML = String(html`${icon("arrow-left")}<span class="wb-nav-label">Voriges<span class="wb-nav-extra"> Werkstück</span></span>`);
  el.next.innerHTML = String(html`<span class="wb-nav-label">Nächstes<span class="wb-nav-extra"> Werkstück</span></span>${icon("arrow-right")}`);
  // „Schließen“ already returns to the Lager; a second close action only crowded the bar.
  el.back?.remove();
  // The hero is a dark stage in both themes (Screen tokens).
  el.hero.classList.add("screen");
  const mobileMeta = document.createElement("p");
  mobileMeta.className = "wb-meta-m meta";
  el.kicker.before(mobileMeta);

  let current = null;
  let token = 0;
  let order = projects.map((p) => p.id);
  let probe = null;
  let probeIO = null;
  let afterClose = null;
  let openedFrom = null;
  let keyboard = false; // last input was a key (full focus ring on „Schließen“) or a pointer/deep link
  const onModality = (e) => (keyboard = e.type === "keydown");
  document.addEventListener("keydown", onModality, true);
  document.addEventListener("pointerdown", onModality, true);

  const onFacadeClick = (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-yt]") : null;
    if (button && dialog.contains(button)) F.playFacade(button);
  };
  dialog.addEventListener("click", onFacadeClick);
  const offFacade = () => dialog.removeEventListener("click", onFacadeClick);

  /* ── Order for prev/next ─────────────────────────────────────────────────────────────── */
  function orderFor(from, id) {
    let ids = null;
    if (from?.closest?.("#lager")) ids = currentOrder();
    else if (from?.closest?.("#warm")) ids = warmList(projects).map((p) => p.id);
    else if (from?.closest?.("#meisterstuecke")) ids = chapterOrder();
    if (!ids?.includes(id)) ids = projects.map((p) => p.id);
    return ids;
  }
  function chapterOrder() {
    const out = [];
    for (const c of data?.chapters ?? []) {
      if (c.anchor) out.push(c.anchor);
      if (c.series) for (const p of projects) if (films.get(p.id)?.series === c.series) out.push(p.id);
    }
    for (const a of $$("#meisterstuecke [data-project-id]")) out.push(a.dataset.projectId);
    return [...new Set(out)].filter((id) => byId.has(id));
  }
  const neighbour = (dir) => {
    const i = order.indexOf(current);
    if (i < 0 || order.length < 2) return null;
    return order[(i + dir + order.length) % order.length];
  };

  function renderHead(p, film) {
    const alloy = alloyOf(p) ?? "web";
    const glow = glowOf(p, asOf);
    const metaText = [stockLabel(stock.get(p.id)), GROUP_LABEL[alloy], glow ? glowLabel(glow) : ""].filter(Boolean).join(" · ");
    dialog.dataset.alloy = alloy;
    dialog.dataset.glow = glow ?? "none";
    dialog.style.setProperty("--alloy", `var(--alloy-${alloy})`);
    // „Nº“ is shown, „Nummer“ is read (U+00BA sounds like „N Ordinal“ in German TTS).
    const metaHtml = String(html`${metaText.startsWith("Nº") ? html`<span aria-hidden="true">Nº</span><span class="vh">Nummer</span>${metaText.slice(2)}` : metaText}`);
    el.meta.innerHTML = metaHtml;
    mobileMeta.innerHTML = metaHtml;
    el.kicker.textContent = p.category;
    el.title.textContent = p.title;
    el.dek.textContent = p.summary || p.description;
    el.link.href = safeUrl(p.link);
    el.link.innerHTML = String(html`${ctaLabel(p, film)} ${icon("arrow-ne")}<span class="vh"> (öffnet neue Seite)</span>`);
    const showRepo = p.source && p.source !== p.link && !p.repo?.private;
    el.repo.hidden = !showRepo;
    if (showRepo) {
      el.repo.href = safeUrl(p.source);
      el.repo.innerHTML = String(html`Repo ansehen ${icon("arrow-ne")}<span class="vh"> (öffnet neue Seite)</span>`);
    }
    const prevP = byId.get(neighbour(-1));
    const nextP = byId.get(neighbour(1));
    el.prev.dataset.tip = prevP ? `Voriges: ${prevP.title}` : "";
    el.next.dataset.tip = nextP ? `Nächstes: ${nextP.title}` : "";
    el.prev.disabled = !prevP || prevP.id === p.id;
    el.next.disabled = !nextP || nextP.id === p.id;
  }

  function fill(p, film, d) {
    el.hero.innerHTML = String(B.renderHero(p, film, d, F));
    el.body.innerHTML = String(B.renderBody(p, film, d, { byId, stock, next: byId.get(neighbour(1)), asOf }));
    // no fact strip → the year joins the kicker („Daten · 2020“), unless the title or dek says it
    const year = String(p.yearLabel ?? p.year ?? "");
    const said = !year || el.body.querySelector(".wb-facts") || `${p.title} ${el.dek.textContent}`.includes(year.slice(0, 4));
    el.kicker.textContent = said ? p.category : `${p.category} · ${year}`;
    // the inline player is the way to watch; a second „Film ansehen“ button would only repeat it
    el.link.hidden = Boolean(el.hero.querySelector("[data-facade]"));
    capPoster();
    armProbe(p);
  }

  /** Film posters are mostly 640 px YouTube stills: the landscape facade never grows past them. */
  function capPoster() {
    const img = $(".wb-film--landscape .wb-film-poster > img", el.hero);
    if (!img) return;
    const cap = () => img.naturalWidth && img.closest(".wb-film")?.style.setProperty("--poster-w", `${img.naturalWidth}px`);
    if (img.complete) cap();
    else img.addEventListener("load", cap, { once: true });
  }

  /* ── Probestück (WP4 registry, loaded lazily when the stage is near) ─────────────────── */
  function destroyProbe() {
    probeIO?.disconnect();
    probeIO = null;
    try {
      probe?.destroy?.();
    } catch (error) {
      console.warn(error);
    }
    probe = null;
  }
  function armProbe(p) {
    destroyProbe();
    const stage = $(".wb-probe-stage", el.body);
    if (!stage || !p.probe) return;
    const ctrl = new AbortController();
    const start = async () => {
      probeIO?.disconnect();
      probeIO = null;
      let mod = null;
      try {
        mod = await importFresh("../probes/index.js");
      } catch {
        /* registry missing → jammed copy below */
      }
      if (ctrl.signal.aborted || !stage.isConnected) return;
      if (mod && Array.isArray(mod.PROBE_IDS) && !mod.PROBE_IDS.includes(p.probe)) {
        stage.closest(".wb-probe")?.remove(); // no such Probestück (yet): omit the block
        return;
      }
      try {
        if (!mod) throw new Error("probes/index.js");
        const handle = await mod.mountProbe(stage, p.probe, {
          motion: ctx.motion,
          calm: ctx.motion.calm,
          announce: ctx.announce,
          storage: ctx.storage,
          signal: ctrl.signal,
          chip: true,
          originalUrl: p.link,
        });
        if (ctrl.signal.aborted || !stage.isConnected) {
          handle?.destroy?.();
          return;
        }
        probe = { destroy: () => (ctrl.abort(), handle?.destroy?.()) };
      } catch {
        if (!stage.isConnected || stage.querySelector(".probe-jammed, .wb-probe-fail")) return;
        stage.classList.add("is-failed");
        stage.insertAdjacentHTML(
          "beforeend",
          String(html`<p class="wb-probe-fail">Das Probestück klemmt gerade. Das Original geht aber: ${extLink(p.link, ctaLabel(p, films.get(p.id)))}</p>`),
        );
      }
    };
    probe = { destroy: () => ctrl.abort() };
    if ("IntersectionObserver" in window) {
      probeIO = new IntersectionObserver((records) => records.some((r) => r.isIntersecting) && start(), { root: el.scroll, rootMargin: "100% 0px" });
      probeIO.observe(stage);
    } else start();
  }

  /* ── Open / close ────────────────────────────────────────────────────────────────────── */
  async function open(id, { from = null, direct = false } = {}) {
    const p = byId.get(id);
    if (!p) return;
    const film = films.get(id) ?? null;
    const wasOpen = dialog.open;
    const my = ++token;
    if (!wasOpen) {
      // Back, then Forward reopens without a trigger: the plate in the Lager stands in for it.
      if (!from && !direct) from = document.querySelector(`#projects-container .project-link[data-project-id="${CSS.escape(id)}"]`);
      openedFrom = from;
      order = orderFor(from, id);
    }
    current = id;
    document.title = `${p.title} · Werkstück · Logge Media Forge`;
    const detailsP = p.details && data?.details?.get ? data.details.get(id) : Promise.resolve(null);
    await ensureCss();
    if (my !== token) return;
    // Use details right away if they are already cached (hover prefetch), else render in two steps.
    const quick = await Promise.race([detailsP, new Promise((r) => setTimeout(() => r(undefined), wasOpen ? 60 : 30))]);
    if (my !== token) return;

    const swap = () => {
      destroyProbe();
      renderHead(p, film);
      fill(p, film, quick ?? null);
      if (!dialog.open) {
        dialog.showModal();
        document.documentElement.classList.add("wb-open");
      }
      el.scroll.scrollTop = 0;
      // Focus goes to „Schließen“ (contract), but opened by pointer or a deep link it wears a quiet
      // ring; the full keyboard ring returns with the first key press.
      if (!wasOpen) el.close.toggleAttribute("data-quiet", !keyboard);
      el.close.focus({ preventScroll: true });
    };

    const media = !wasOpen ? from?.querySelector?.(".plate-media") : null;
    if (media && !ctx.motion.calm && typeof document.startViewTransition === "function") {
      const root = document.documentElement;
      media.style.viewTransitionName = "werk-hero";
      root.dataset.vt = "werk";
      try {
        const vt = document.startViewTransition(() => {
          media.style.viewTransitionName = "";
          swap();
          const hero = $(".wb-hero-media", el.hero);
          if (hero) hero.style.viewTransitionName = "werk-hero";
        });
        vt.finished
          .catch(() => {})
          .finally(() => {
            const hero = $(".wb-hero-media", el.hero);
            if (hero) hero.style.viewTransitionName = "";
            media.style.viewTransitionName = "";
            delete root.dataset.vt;
          });
        await vt.updateCallbackDone.catch(() => {});
      } catch {
        media.style.viewTransitionName = "";
        delete root.dataset.vt;
        swap();
      }
    } else if (wasOpen && !ctx.motion.calm) {
      el.scroll.classList.remove("is-swapping");
      void el.scroll.offsetWidth;
      el.scroll.classList.add("is-swapping");
      swap();
    } else swap();

    if (quick === undefined) {
      const d = await detailsP;
      if (my !== token || current !== id) return;
      const y = el.scroll.scrollTop;
      const hadFocus = dialog.contains(document.activeElement) ? document.activeElement : null;
      fill(p, film, d);
      el.scroll.scrollTop = y;
      if (hadFocus && !hadFocus.isConnected) el.close.focus({ preventScroll: true });
    }
  }

  function restoreFocus(from, lastId) {
    const lager = document.getElementById("lager");
    const plateFor = (id) => (id ? document.querySelector(`#projects-container .project-link[data-project-id="${CSS.escape(id)}"]`) : null);
    const fromId = from?.dataset?.projectId;
    let target = null;
    if (lastId && fromId && lastId !== fromId && from?.closest?.("#lager")) target = plateFor(lastId);
    if (!target && from?.isConnected) target = from;
    if (!target && fromId) target = plateFor(fromId);
    if (!target) {
      // Direct load: the chapters above the Lager may still be mounting, so a plain scrollIntoView
      // lands in Kapitel IV. scrollToTarget keeps homing in until the layout has settled.
      target = document.getElementById("lager-title");
      if (target && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target?.focus({ preventScroll: true });
      if (lager) scrollToTarget(lager, { instant: true });
      return;
    }
    target.focus({ preventScroll: target === from });
  }

  function close({ from = null } = {}) {
    const lastId = current;
    from ??= openedFrom;
    openedFrom = null;
    token++;
    current = null;
    destroyProbe();
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove("wb-open");
    document.title = baseTitle;
    // Stop any playing film and free the iframes.
    el.hero.textContent = "";
    el.body.textContent = "";
    const job = afterClose;
    afterClose = null;
    requestAnimationFrame(() => {
      if (job) job();
      else restoreFocus(from, lastId);
    });
  }

  /* ── Events ──────────────────────────────────────────────────────────────────────────── */
  const go = (dir) => {
    const id = neighbour(dir);
    if (id && id !== current) ctx.router.replace(id);
  };
  const onCancel = (e) => {
    e.preventDefault();
    ctx.router.close();
  };
  const onKey = (e) => {
    el.close.removeAttribute("data-quiet");
    if (e.key === "Tab") {
      const items = $$('a[href], button:not([disabled]), input, select, textarea, iframe, summary, [tabindex]:not([tabindex="-1"])', dialog).filter(
        (n) => !n.closest("[hidden]") && !n.closest("[popover]:not(:popover-open)") && n.getClientRects().length,
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.altKey && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      const t = e.target;
      if (isTyping(t) || t.closest?.(".probe-stage, .wb-media-strip, [popover], iframe, input[type=range]")) return;
      e.preventDefault();
      go(e.key === "ArrowLeft" ? -1 : 1);
    }
  };
  const onClick = (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    if (t.closest("#close-modal")) return ctx.router.close();
    if (t.closest('[data-wb="prev"]')) return go(-1);
    if (t.closest('[data-wb="next"]') || t.closest("[data-wb-go]")) return go(1);
    const tool = t.closest("[data-tool]");
    if (tool) {
      const q = canonicalTool(tool.dataset.tool) || tool.dataset.tool;
      afterClose = () => {
        document.dispatchEvent(new CustomEvent("lmf:filter", { detail: { q, g: "all" } }));
        document.getElementById("project-search")?.focus({ preventScroll: true });
      };
      return ctx.router.close();
    }
    // Related Werkstück inside the Werkbank: switch in place (no history spam).
    const rel = t.closest(".wb-related-link");
    if (rel) {
      e.preventDefault();
      const id = rel.dataset.projectId;
      if (!order.includes(id)) order = projects.map((p) => p.id);
      ctx.router.replace(id);
    }
  };
  // Click on the backdrop (outside the dialog box) closes, like Esc.
  const onPointer = (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) ctx.router.close();
    }
  };
  // Warm the stylesheet as soon as someone reaches for a Werkstück.
  const intent = (e) => {
    if (e.target instanceof Element && e.target.closest('a[href^="#werk/"]')) {
      ensureCss();
      document.removeEventListener("pointerover", intent);
      document.removeEventListener("focusin", intent);
    }
  };

  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("keydown", onKey);
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("pointerdown", onPointer);
  document.addEventListener("pointerover", intent, { passive: true });
  document.addEventListener("focusin", intent);

  ctx.router.start({ open, close, has: (id) => byId.has(id) });

  return {
    destroy() {
      destroyProbe();
      offFacade();
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("keydown", onKey);
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("pointerover", intent);
      document.removeEventListener("focusin", intent);
      document.removeEventListener("keydown", onModality, true);
      document.removeEventListener("pointerdown", onModality, true);
    },
  };
}
