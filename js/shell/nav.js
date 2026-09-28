/**
 * Header navigation  [LEAD]
 * - „Menü +“ (#menu-toggle, aria-expanded, aria-controls="navigation") opens the sheet < 1024 px
 * - Escape closes and returns focus to the toggle; outside click / link click / resize ≥ 1024 close it
 * - aria-current="location" on the nav link of the section in view
 * - the desktop readout „§ 03 Lager“ (aria-hidden) follows the section in view
 */

const DESKTOP = matchMedia("(min-width: 1024px)");

/** Readout labels per section id (numbering from §1.3). */
const READOUT = {
  esse: "00 Anheizen",
  warm: "01 Noch warm",
  meisterstuecke: "02 Meisterstücke",
  lager: "03 Lager",
  schichtbuch: "04 Schichtbuch",
  werkstatt: "05 Werkstatt",
  abseits: "06 Abseits",
  kontakt: "07 Kontakt",
};

export function initNav() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("navigation");
  if (!toggle || !nav) return;

  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
  function setOpen(open, { restoreFocus = false } = {}) {
    nav.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    if (!open && restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", () => setOpen(!isOpen()));
  nav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      event.preventDefault();
      setOpen(false, { restoreFocus: true });
    }
  });
  document.addEventListener("click", (event) => {
    if (isOpen() && event.target instanceof Element && !event.target.closest(".site-header")) setOpen(false);
  });
  // Focus leaving the header closes the sheet (keyboard users tabbing past the last link).
  document.querySelector(".site-header")?.addEventListener("focusout", (event) => {
    if (isOpen() && event.relatedTarget instanceof Element && !event.relatedTarget.closest(".site-header")) setOpen(false);
  });
  DESKTOP.addEventListener?.("change", () => setOpen(false));

  watchSections(nav);
}

function watchSections(nav) {
  const readout = document.querySelector("[data-readout]");
  const links = new Map([...nav.querySelectorAll("a[data-nav]")].map((a) => [a.dataset.nav, a]));
  const sections = Object.keys(READOUT)
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!("IntersectionObserver" in window) || !sections.length) return;

  const visible = new Map();
  let active = null;
  const update = () => {
    // The section whose top is closest above the reading line wins.
    let best = null;
    let bestTop = -Infinity;
    for (const [id, top] of visible) {
      if (top <= window.innerHeight * 0.35 && top > bestTop) {
        best = id;
        bestTop = top;
      }
    }
    if (!best && visible.size) best = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
    if (!best || best === active) return;
    active = best;
    if (readout) readout.textContent = READOUT[best];
    for (const [id, link] of links) {
      if (id === best) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
        else visible.delete(entry.target.id);
      }
      update();
    },
    { rootMargin: "-64px 0px -40% 0px", threshold: [0, 0.01, 0.25, 0.5] },
  );
  sections.forEach((s) => io.observe(s));

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking || !visible.size) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        for (const id of visible.keys()) {
          const el = document.getElementById(id);
          if (el) visible.set(id, el.getBoundingClientRect().top);
        }
        update();
      });
    },
    { passive: true },
  );
}

export default initNav;
