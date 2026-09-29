/**
 * 06 · Abseits der Tabs: die Nachtuhr (spec §2.8, §5.9)  [WP5]
 *
 * A half-dial from 20:00 (left) over midnight (top) to 02:00 (right). Every one of the
 * night photos is a tick at the time in its file name, on the ring of its night
 * (17 rings, the first night innermost). The well beside the dial shows the first photo at
 * rest; hover or focus shows another with „Nacht {nn} · {dd.mm.yyyy} · {hh:mm} Uhr“ and the
 * clock hand turns to its time. Keyboard: one roving tab stop over the ticks, ←/→ (and ↑/↓) step chronologically,
 * Home/End, Enter opens the photo in the archive (gallery/#foto-{nn}).
 *
 * Only the first thumbnail loads with the section; the others load on interaction. Below 640 px, without JS, or if anything
 * fails, the prerendered 12-frame contact sheet is the view.
 */
import { html } from "../lib/dom.js";
import { photoList } from "../render/abseits-static.js";
import renderAbseitsStatic from "../render/abseits-static.js";
import { formatDate, nights, photoNames } from "../lib/derive.js";

const VB = { w: 800, h: 452 };
const C = { x: 400, y: 404 };
const R0 = 128;
const HOURS = [20, 21, 22, 23, 0, 1, 2];

/** Minutes after 20:00 (0 … 360). */
export const minutesOf = (hour, minute) => (hour >= 12 ? (hour - 20) * 60 : (hour + 4) * 60) + minute;

function polar(r, minutes) {
  const th = Math.PI - (minutes / 360) * Math.PI;
  return [C.x + r * Math.cos(th), C.y - r * Math.sin(th)];
}
const f1 = (n) => n.toFixed(1);

export function dialHtml(list, nightCount) {
  const step = Math.min(15, (VB.h - 150 - R0) / Math.max(1, nightCount - 1));
  const rOf = (night) => R0 + (night - 1) * step;
  const rMax = rOf(nightCount);
  const rings = [];
  for (let n = 1; n <= nightCount; n++) {
    const r = rOf(n);
    rings.push(html`<path class="nu-ring" data-night="${n}" d="M ${f1(C.x - r)} ${C.y} A ${f1(r)} ${f1(r)} 0 0 1 ${f1(C.x + r)} ${C.y}"></path>`);
  }
  const hours = HOURS.map((h, i) => {
    const m = i * 60;
    const [x1, y1] = polar(R0 - 14, m);
    const [x2, y2] = polar(rMax + 10, m);
    const [tx, ty] = polar(rMax + 30, m);
    return html`<line class="nu-spoke" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"></line><text class="nu-hour" x="${f1(tx)}" y="${f1(ty + 5)}" text-anchor="middle">${String(h).padStart(2, "0")}</text>`;
  });
  const ticks = list.map((p, i) => {
    const m = minutesOf(p.hour, p.minute);
    const r = rOf(p.night);
    const [ax, ay] = polar(r - 5, m);
    const [bx, by] = polar(r + 5, m);
    const [hx, hy] = polar(r - 8, m);
    const [kx, ky] = polar(r + 8, m);
    const label = `Foto ${p.nn}, Nacht ${String(p.night).padStart(2, "0")}, ${formatDate(p.date)}, ${p.time} Uhr`;
    return html`<a class="nu-tick" href="gallery/#foto-${p.nn}" data-i="${i}" data-night="${p.night}" tabindex="${i === 0 ? 0 : -1}" aria-label="${label}"><line class="nu-hit" x1="${f1(hx)}" y1="${f1(hy)}" x2="${f1(kx)}" y2="${f1(ky)}"></line><line class="nu-mark" x1="${f1(ax)}" y1="${f1(ay)}" x2="${f1(bx)}" y2="${f1(by)}"></line></a>`;
  });
  return html`<svg class="nu-svg" viewBox="0 0 ${VB.w} ${VB.h}" role="group" aria-label="Nachtuhr: jedes Foto ein Strich zu seiner Uhrzeit, von 20 bis 2 Uhr. Jeder Ring ist eine Nacht, innen die erste." aria-describedby="nu-keys">
<g aria-hidden="true">${rings}${hours}
<text class="nu-ringlabel" x="${f1(C.x - R0)}" y="${C.y + 30}" text-anchor="middle">Nacht 01</text>
<text class="nu-ringlabel" x="${f1(C.x - rMax)}" y="${C.y + 30}" text-anchor="middle">Nacht ${String(nightCount).padStart(2, "0")}</text>
<circle class="nu-pivot" cx="${C.x}" cy="${C.y}" r="3"></circle>
<g class="nu-hand" style="--turn:0deg"><line x1="${f1(C.x - R0 + 22)}" y1="${C.y}" x2="${f1(C.x - rMax - 8)}" y2="${C.y}"></line><circle cx="${f1(C.x - R0 + 22)}" cy="${C.y}" r="3.5"></circle></g>
<text class="nu-time" x="${C.x}" y="${C.y - 38}" text-anchor="middle"></text>
<text class="nu-sub" x="${C.x}" y="${C.y - 10}" text-anchor="middle"></text>
</g>
<g class="nu-ticks">${ticks}</g>
</svg>`;
}

export async function mount(root, ctx) {
  const { motion } = ctx;
  const data = await ctx.data;
  const host = root.querySelector('[data-mount="nachtuhr"]');
  if (!host || !data?.gallery) return { destroy() {} };

  if (!host.querySelector(".contact-sheet")) host.insertAdjacentHTML("beforeend", renderAbseitsStatic(data));
  const list = photoList(data.gallery);
  if (!list.length) return { destroy() {} };
  const nightCount = nights(photoNames(data.gallery)).length;

  const wrap = document.createElement("div");
  wrap.className = "nu screen";
  wrap.innerHTML = String(html`<div class="nu-dial">${dialHtml(list, nightCount)}<p class="nu-keys meta" id="nu-keys">Fahr über einen Strich oder nimm <kbd>Tab</kbd> und die Pfeiltasten · <kbd>Enter</kbd> öffnet das Foto</p></div>
<figure class="nu-well">
  <div class="nu-frame"><img class="nu-img" alt="" decoding="async" hidden><img class="nu-img" alt="" decoding="async" hidden></div>
  <figcaption class="nu-cap meta"></figcaption>
  <a class="nu-open text-link" href="gallery/">In der Galerie ansehen</a>
</figure>`);
  // The dial replaces the contact sheet (≥ 640 px). If keyboard focus is on a frame of the sheet
  // right now (Tab got there before this lazy mount), it moves to that photo's tick first, so
  // hiding the sheet never drops focus to <body> (WCAG 2.4.3).
  const sheet = host.querySelector(".contact-sheet");
  const focused = sheet?.contains(document.activeElement) ? document.activeElement.closest("a") : null;
  host.prepend(wrap);
  host.classList.add("has-clock");

  const svg = wrap.querySelector(".nu-svg");
  const ticks = [...wrap.querySelectorAll(".nu-tick")];
  const hand = wrap.querySelector(".nu-hand");
  const time = wrap.querySelector(".nu-time");
  const sub = wrap.querySelector(".nu-sub");
  const imgs = [...wrap.querySelectorAll(".nu-img")];
  const cap = wrap.querySelector(".nu-cap");
  const open = wrap.querySelector(".nu-open");
  const b = data.bindings ?? {};
  const summary = () => {
    time.textContent = `${b["gallery.hourFrom"] ?? 20}–${String(b["gallery.hourTo"] ?? 2).padStart(2, "0")}`;
    sub.textContent = `${list.length} Fotos · ${nightCount} Nächte`;
  };

  let current = -1;
  let token = 0;
  let front = 0;

  /** Shows photo i in the well (crossfade: the new print heats in fast, the old one cools
   *  slowly). At rest (first photo, no interaction yet) the dial centre keeps its summary. */
  function show(i, rest = false) {
    if (i === current || !list[i]) return;
    current = i;
    const p = list[i];
    ticks.forEach((t, k) => {
      t.classList.toggle("is-active", k === i);
      t.classList.toggle("is-night", +t.dataset.night === p.night && k !== i);
    });
    svg.querySelectorAll(".nu-ring").forEach((r) => r.classList.toggle("is-night", +r.dataset.night === p.night));
    hand.style.setProperty("--turn", `${(minutesOf(p.hour, p.minute) / 360) * 180}deg`);
    hand.classList.add("is-set");
    if (rest) summary();
    else {
      time.textContent = p.time;
      sub.textContent = formatDate(p.date);
    }
    cap.textContent = `Nacht ${String(p.night).padStart(2, "0")} · ${formatDate(p.date)} · ${p.time} Uhr`;
    open.href = `gallery/#foto-${p.nn}`;
    open.textContent = `Foto ${p.nn} groß ansehen`;
    const my = ++token;
    const next = new Image();
    next.decoding = "async";
    next.srcset = `gallery/assets/img/small/${p.name}.webp 1x, gallery/assets/img/medium/${p.name}.webp 2x`;
    next.src = `gallery/assets/img/small/${p.name}.webp`;
    const swap = () => {
      if (my !== token || !next.naturalWidth) return;
      const [old, img] = [imgs[front], imgs[(front = 1 - front)]];
      img.src = next.currentSrc || next.src;
      img.alt = `Galerieaufnahme ${p.nn}, Nacht ${String(p.night).padStart(2, "0")}, ${p.time} Uhr`;
      img.hidden = false;
      old.classList.remove("is-on");
      old.alt = "";
      img.classList.add("is-on");
    };
    (next.decode ? next.decode() : Promise.resolve()).then(swap, swap);
  }
  show(0, true);

  if (focused && sheet && getComputedStyle(sheet).display === "none") {
    const name = (focused.getAttribute("href") ?? "").split("/").pop().replace(/\.\w+$/, "");
    const i = Math.max(0, list.findIndex((p) => p.name === name));
    ticks.forEach((n, k) => n.setAttribute("tabindex", k === i ? "0" : "-1"));
    ticks[i].focus({ preventScroll: true });
    show(i);
  }

  function focusTick(i) {
    const t = ticks[i];
    if (!t) return;
    ticks.forEach((n) => n.setAttribute("tabindex", n === t ? "0" : "-1"));
    t.focus();
    show(i);
  }

  const onOver = (e) => {
    const t = e.target.closest?.(".nu-tick");
    if (t) show(+t.dataset.i);
  };
  const onFocus = (e) => {
    const t = e.target.closest?.(".nu-tick");
    if (!t) return;
    ticks.forEach((n) => n.setAttribute("tabindex", n === t ? "0" : "-1"));
    show(+t.dataset.i);
  };
  const onKey = (e) => {
    const t = e.target.closest?.(".nu-tick");
    if (!t) return;
    const i = +t.dataset.i;
    const map = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: ticks.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    focusTick(Math.max(0, Math.min(ticks.length - 1, map[e.key])));
  };
  svg.addEventListener("pointerover", onOver);
  svg.addEventListener("focusin", onFocus);
  svg.addEventListener("keydown", onKey);

  return {
    show,
    destroy() {
      svg.removeEventListener("pointerover", onOver);
      svg.removeEventListener("focusin", onFocus);
      svg.removeEventListener("keydown", onKey);
      wrap.remove();
      host.classList.remove("has-clock");
    },
  };
}
