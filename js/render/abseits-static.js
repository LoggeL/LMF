/**
 * Abseits: contact-sheet strip (spec §2.8, §5.9 P0 fallback)  [WP5]
 *
 * Pure renderer: (data, opts) => string, prerendered into `<!-- prerender:abseits -->`.
 * Twelve frames sampled evenly across all night photos (first and last included), each a
 * plain link to the large JPG, with the frame's archive number and the time from its
 * file name. It is the no-JS view, the view below 640 px, and the fallback of the Nachtuhr.
 */
import { html } from "../lib/dom.js";
import { parsePhotoName, photoNames, nightOf, nights } from "../lib/derive.js";

export const FRAMES = 12;
const pad = (n) => String(n).padStart(2, "0");

/** All photos in archive order with number, date, time and night index (1-based). */
export function photoList(gallery) {
  const names = photoNames(gallery);
  const order = nights(names);
  return names
    .map((name, i) => {
      const p = parsePhotoName(name);
      if (!p) return null;
      return { name, no: i + 1, nn: pad(i + 1), date: p.date, time: p.time, hour: p.hour, minute: p.minute, night: order.indexOf(nightOf(name)) + 1 };
    })
    .filter(Boolean);
}

/** Evenly spaced sample indices, always including the first and the last photo. */
export function sample(list, count = FRAMES) {
  if (list.length <= count) return list;
  const picks = new Set();
  for (let i = 0; i < count; i++) picks.add(Math.round((i * (list.length - 1)) / (count - 1)));
  return [...picks].map((i) => list[i]);
}

export default function renderAbseitsStatic(data = {}, opts = {}) {
  const base = opts.base ?? "gallery/";
  const list = photoList(data.gallery);
  if (!list.length) return "";
  const frames = sample(list);
  return String(
    html`<ol class="contact-sheet screen" role="list" aria-label="Kontaktbogen, eine Auswahl aus dem Fotoarchiv">${frames.map(
      (f) => html`<li class="cs-frame"><a href="${base}assets/img/large/${f.name}.jpg"><img src="${base}assets/img/small/${f.name}.webp" alt="Galerieaufnahme ${f.nn}" width="400" height="500" loading="lazy" decoding="async"><span class="cs-edge" aria-hidden="true">${f.nn}A</span><span class="cs-time meta"><span class="vh">, aufgenommen um </span><time datetime="${f.date}T${f.time}">${f.time}</time></span></a></li>`,
    )}</ol>`,
  );
}
