/**
 * 04 · Das Schichtbuch (spec §2.6)  [WP5]
 *
 * Static copy + counters live in index.html. This module:
 *  - makes sure the prerendered list view (years with their milestones) is there
 *    (renders it from data if the prerender block is still empty),
 *  - shows the „Zeitraffer | Liste“ switch once repos.json is loaded
 *    (Liste is the default below 1024 px and when calm), and
 *  - lazy-loads the packed Zeitraffer (js/sections/zeitraffer.pack.js, built from zeitraffer.js by
 *    scripts/pack-zr.mjs) the first time it is shown; if that request fails, the list comes back.
 * If repos.json fails, the list stays and the switch stays hidden (§2.11).
 */
import renderSchichtbuchStatic from "../render/schichtbuch-static.js";

/** Years kept open on phones: the Stand year and the two before it. */
export const OPEN_YEARS = 3;

/**
 * Phones (< 640 px): the middle years of the list sit behind one „2015–2023 zeigen“ disclosure,
 * so the log is not eight screens of scrolling. The first year (where it started: the first
 * video) and the newest three stay open, so „Erst Kamera. Dann Code.“ reads without a tap. From 640 px the disclosure is always open and
 * its summary hidden (CSS). Without JS, everything stays visible. Fragment links and find-in-page
 * open a closed <details> by themselves.
 */
function groupOlderYears(list) {
  const log = list.querySelector("[data-sb-log]");
  const blocks = log ? [...log.querySelectorAll(":scope > .sb-year")] : [];
  const last = Math.max(...blocks.map((b) => +b.dataset.year));
  const older = blocks.slice(1).filter((b) => +b.dataset.year <= last - OPEN_YEARS);
  if (!older.length || log.querySelector(".sb-older")) return () => {};
  const first = older[0].dataset.year;
  const to = older[older.length - 1].dataset.year;
  const box = document.createElement("details");
  box.className = "sb-older";
  const summary = document.createElement("summary");
  summary.className = "sb-older-summary";
  summary.textContent = first === to ? `${first} zeigen` : `${first}–${to} zeigen`;
  box.append(summary, ...older);
  blocks[0].after(box);
  const narrow = matchMedia("(max-width: 639px)");
  const sync = () => (box.open = !narrow.matches);
  sync();
  narrow.addEventListener("change", sync);
  return () => narrow.removeEventListener("change", sync);
}

export async function mount(root, ctx) {
  const data = await ctx.data;
  const list = root.querySelector('[data-mount="schichtbuch-list"]');
  const zrMount = root.querySelector('[data-mount="zeitraffer"]');
  const controls = root.querySelector("[data-zr-controls]");
  const msMount = root.querySelector('[data-mount="milestones"]');
  const buttons = controls ? [...controls.querySelectorAll("[data-zr-view]")] : [];

  // Milestones are part of the list view (per year) and the marker lane of the Zeitraffer.
  if (msMount && !msMount.children.length) msMount.hidden = true;

  if (list && !list.querySelector("[data-sb-log]") && data) {
    const markup = renderSchichtbuchStatic(data, { bindings: data.bindings });
    if (markup) list.insertAdjacentHTML("beforeend", markup);
  }

  const offOlder = list ? groupOlderYears(list) : () => {};

  if (!data?.repos?.length || !zrMount || !controls) {
    if (zrMount) zrMount.hidden = true;
    return { destroy: offOlder };
  }

  let zr = null;
  let view = null;
  let tries = 0;

  function show(next) {
    view = next;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.zrView === next)));
    root.dataset.sbView = next;
    zrMount.hidden = next !== "zeitraffer";
    if (list) list.hidden = next === "zeitraffer";
  }

  /** A dropped request for the Zeitraffer module must never leave the section empty: the list
   *  comes back, and the next press on „Zeitraffer“ tries again (a fresh URL, not the failed one). */
  async function setView(next) {
    if (next === view) return;
    show(next);
    if (next !== "zeitraffer" || zr) return;
    try {
      const { mountZeitraffer } = await import(tries++ ? `./zeitraffer.pack.js?r=${tries}` : "./zeitraffer.pack.js");
      if (!zr && view === "zeitraffer") zr = mountZeitraffer(zrMount, data, ctx);
    } catch (e) {
      console.warn("Zeitraffer konnte nicht laden, zurück zur Liste:", e);
      if (view === "zeitraffer") show("liste");
    }
  }

  const onClick = (e) => {
    const b = e.target.closest("[data-zr-view]");
    if (b) setView(b.dataset.zrView);
  };
  controls.addEventListener("click", onClick);
  controls.hidden = false;
  await setView(innerWidth < 1024 || ctx.motion.calm ? "liste" : "zeitraffer");

  return {
    destroy() {
      offOlder();
      controls.removeEventListener("click", onClick);
      zr?.destroy();
    },
  };
}
