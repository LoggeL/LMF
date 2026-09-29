/**
 * Kolpingtheater-Universum  [WP4]  (spec §5.6, data/universe.json)
 *
 *   renderUniverse(mountEl, nodes, { motion, byId }) → { destroy() }
 *
 * An inline SVG constellation: the theatre in the centre, four arcs (Web, Werkzeuge, Spiele, Film),
 * every node a real <a> (→ #werk/<id> or its sourced URL). Distance from the centre = year
 * (innen alt, außen neu). Folded by default on every width: a preview of four (one per kind) and
 * „Alle 11 zeigen“, which opens the map from 640 px and the whole grouped list below.
 */

import { html, raw, escapeHtml, safeUrl } from "../lib/dom.js";

const KINDS = [
  // angles in degrees, SVG orientation (0° = right, clockwise)
  { kind: "werkzeug", label: "Werkzeuge", one: "Werkzeug", from: -158, to: -22 },
  { kind: "spiel", label: "Spiele", one: "Spiel", from: 8, to: 62 },
  { kind: "film", label: "Film", one: "Film", from: 108, to: 148 },
  { kind: "web", label: "Web", one: "Web", from: 168, to: 204 },
];
/** „Spiele“ over one game reads wrong: a kind with one entry gets its singular label. */
const kindLabel = (k, n) => (n === 1 ? k.one : k.label);
const CX = 480;
const RING_LABEL_DEG = -90 + 8;
let uvSeq = 0;
const CY = 300;
const SX = 1.3; // horizontal stretch (wide stage)
const R_MIN = 112;
const R_MAX = 226;
const ARC_GAP = 56; // alloy arc sits this far outside its outermost node
const LINE_H = 17; // second label line
const PREVIEW = 4; // list items shown before „Alle … zeigen“

/** Long labels break after their comma: „Kristall der Träume,“ / „restauriert“. */
export function labelLines(label) {
  const text = String(label ?? "");
  const cut = text.indexOf(", ");
  return text.length > 22 && cut > 0 ? [text.slice(0, cut + 1), text.slice(cut + 2)] : [text];
}

const host = (url) => {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "")).replace(/^github\.com\//, "GitHub · ");
  } catch {
    return url;
  }
};

export function layout(nodes) {
  const years = nodes.map((n) => n.year).filter(Number.isFinite);
  const y0 = Math.min(...years);
  const y1 = Math.max(...years);
  const rOf = (y) => (Number.isFinite(y) && y1 > y0 ? R_MIN + ((y - y0) / (y1 - y0)) * (R_MAX - R_MIN) : (R_MIN + R_MAX) / 2);
  const out = [];
  for (const sector of KINDS) {
    const list = nodes.filter((n) => n.kind === sector.kind).sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.label.localeCompare(b.label, "de"));
    list.forEach((n, i) => {
      const t = list.length === 1 ? 0.5 : i / (list.length - 1);
      const deg = sector.from + (sector.to - sector.from) * t;
      const rad = (deg * Math.PI) / 180;
      const r = rOf(n.year);
      out.push({ ...n, deg, x: CX + Math.cos(rad) * r * SX, y: CY + Math.sin(rad) * r, r });
    });
  }
  return { placed: out, y0, y1, rOf };
}

function nodeHref(n) {
  return n.projectId ? `#werk/${n.projectId}` : safeUrl(n.url);
}

export function renderUniverse(mountEl, nodes, { motion, byId } = {}) {
  const valid = (nodes ?? []).filter((n) => n && n.label && n.url && KINDS.some((k) => k.kind === n.kind));
  if (!valid.length) return { destroy() {} };
  const { placed, y0, y1, rOf } = layout(valid);
  const count = valid.length;
  const maskId = `uv-knock-${++uvSeq}`;

  const rings = [];
  for (let y = y0; y <= y1; y += 2) rings.push(y);
  if (rings[rings.length - 1] !== y1) rings.push(y1);

  /** Arc across the sector's own nodes (±6°), just outside its outermost node. */
  const arcOf = (kind) => {
    const list = placed.filter((n) => n.kind === kind);
    if (!list.length) return null;
    const degs = list.map((n) => n.deg);
    return { from: Math.min(...degs) - 6, to: Math.max(...degs) + 6, r: Math.max(...list.map((n) => n.r)) + ARC_GAP };
  };
  const arcPath = (arc, r) => {
    const a0 = (arc.from * Math.PI) / 180;
    const a1 = (arc.to * Math.PI) / 180;
    const p = (a) => `${(CX + Math.cos(a) * r * SX).toFixed(1)} ${(CY + Math.sin(a) * r).toFixed(1)}`;
    return `M${p(a0)} A${(r * SX).toFixed(1)} ${r.toFixed(1)} 0 0 1 ${p(a1)}`;
  };

  const arcLabelPos = (arc, r) => {
    const mid = (((arc.from + arc.to) / 2) * Math.PI) / 180;
    return {
      x: CX + Math.cos(mid) * (r + 18) * SX,
      y: CY + Math.sin(mid) * (r + 18) + 4,
      anchor: Math.abs(Math.cos(mid)) < 0.3 ? "middle" : Math.cos(mid) > 0 ? "start" : "end",
    };
  };

  const svgNodes = placed.map((n, i) => {
    const right = Math.cos((n.deg * Math.PI) / 180) >= -0.15;
    const internal = Boolean(n.projectId && byId?.has?.(n.projectId));
    const href = internal ? `#werk/${n.projectId}` : safeUrl(n.url);
    const label = `${n.label}${n.year ? ` (${n.year})` : ""}: ${n.text}${internal ? "" : " (öffnet neue Seite)"}`;
    const attrs = internal
      ? raw(`href="${escapeHtml(href)}" data-project-ref="${escapeHtml(n.projectId)}"`)
      : raw(`href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"`);
    const lx = right ? 16 : -16;
    const lines = labelLines(n.label);
    const anchor = right ? "start" : "end";
    const tx = (n.x + lx).toFixed(1);
    return html`<g class="uv-node" data-kind="${n.kind}" data-i="${i}" style="--x:${(n.x - CX).toFixed(1)}px;--y:${(n.y - CY).toFixed(1)}px">
      <line class="uv-spoke" x1="${CX}" y1="${CY}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" />
      <a ${attrs} class="uv-link${internal ? " is-internal" : ""}" aria-label="${label}" data-i="${i}">
        <circle class="uv-hit" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="22" />
        <circle class="uv-dot" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${internal ? 8 : 6}" />
        <text class="uv-label" x="${tx}" y="${(n.y + 1).toFixed(1)}" text-anchor="${anchor}">${lines.map((t, li) => (li ? html`<tspan x="${tx}" dy="${LINE_H}">${t}</tspan>` : html`<tspan>${t}</tspan>`))}</text>
        <text class="uv-year" x="${tx}" y="${(n.y + 16 + (lines.length - 1) * LINE_H).toFixed(1)}" text-anchor="${anchor}">${n.year ?? ""}</text>
      </a>
    </g>`;
  });

  // The fold shows a preview (spec: 4 of 11), one per kind first, then by rank; „Alle 11 zeigen“ opens the rest.
  const isInternal = (n) => Boolean(n.projectId && byId?.has?.(n.projectId));
  const rank = [...placed].sort((a, b) => isInternal(b) - isInternal(a) || (b.year ?? 0) - (a.year ?? 0));
  const preview = new Set();
  for (const k of KINDS) {
    const top = rank.find((n) => n.kind === k.kind);
    if (top && preview.size < PREVIEW) preview.add(top);
  }
  for (const n of rank) if (preview.size < PREVIEW) preview.add(n);
  const hasMore = placed.length > preview.size;

  const groups = KINDS.map((k) => {
    const list = placed.filter((n) => n.kind === k.kind);
    if (!list.length) return "";
    const shown = list.some((n) => preview.has(n));
    return html`<section class="uv-group${shown ? "" : " uv-group--more"}" data-kind="${k.kind}">
      <h5 class="uv-group-title meta">${kindLabel(k, list.length)} <span class="uv-group-n">${list.length}</span></h5>
      <ul class="uv-group-list" role="list">
        ${list.map((n) => {
          const internal = Boolean(n.projectId && byId?.has?.(n.projectId));
          return html`<li class="${preview.has(n) ? "" : "uv-li--more"}">
            <a class="uv-li-link" href="${internal ? `#werk/${n.projectId}` : safeUrl(n.url)}" ${internal ? raw(`data-project-ref="${escapeHtml(n.projectId)}"`) : raw('target="_blank" rel="noopener noreferrer"')}>
              <span class="uv-li-label">${n.label}</span> <span class="uv-li-tail">${n.year ? html`<span class="uv-li-year">${n.year}</span>` : ""}${internal ? "" : html`<svg class="i" aria-hidden="true" focusable="false"><use href="#i-arrow-ne"></use></svg><span class="vh"> (öffnet neue Seite)</span>`}</span>
            </a>
            <span class="uv-li-text">${n.text}</span>
          </li>`;
        })}
      </ul>
    </section>`;
  });

  // The group role lives on the .uv-map wrapper. Chrome gives an inline <svg> a Tab stop of its
  // own unless it carries an explicit tabindex="-1" (overflow and the mask make no difference).
  mountEl.innerHTML = String(html`
    <div class="uv">
      <header class="uv-head">
        <h4 class="uv-title"><span class="uv-count">${count}</span> Sachen für eine Theatergruppe</h4>
        <p class="uv-legend meta" aria-hidden="true">${y0}–${y1}</p>
        ${hasMore ? html`<button class="uv-more" type="button" aria-expanded="false">Alle ${count} zeigen</button>` : ""}
      </header>
      <div class="uv-map" role="group" aria-label="Kolpingtheater-Universum: ${count} Sachen, nach Art sortiert, innen alt, außen neu">
        <svg class="uv-svg" viewBox="0 -24 960 568" tabindex="-1">
          <mask id="${maskId}" maskUnits="userSpaceOnUse" x="-240" y="-120" width="1440" height="840">
            <rect x="-240" y="-120" width="1440" height="840" fill="#fff" />
            <g class="uv-knock" fill="#000"></g>
          </mask>
          <g class="uv-rings uv-lines" aria-hidden="true">
            ${rings.map((y) => html`<ellipse cx="${CX}" cy="${CY}" rx="${(rOf(y) * SX).toFixed(1)}" ry="${rOf(y).toFixed(1)}" />`)}
          </g>
          <g class="uv-arcs uv-lines" aria-hidden="true">
            ${KINDS.map((k) => {
              const arc = arcOf(k.kind);
              return arc ? html`<path d="${arcPath(arc, arc.r)}" data-kind="${k.kind}" />` : "";
            })}
          </g>
          <g class="uv-ring-labels" aria-hidden="true">
            ${rings.map((y) => {
              // a little right of the top, off the vertical where spokes bunch up
              const a = (RING_LABEL_DEG * Math.PI) / 180;
              return html`<text x="${(CX + Math.cos(a) * rOf(y) * SX).toFixed(1)}" y="${(CY + Math.sin(a) * rOf(y) - 5).toFixed(1)}" text-anchor="middle">${y}</text>`;
            })}
          </g>
          <g class="uv-arc-labels" aria-hidden="true">
            ${KINDS.map((k) => {
              const arc = arcOf(k.kind);
              if (!arc) return "";
              const pos = arcLabelPos(arc, arc.r);
              return html`<text x="${pos.x.toFixed(1)}" y="${pos.y.toFixed(1)}" text-anchor="${pos.anchor}" data-kind="${k.kind}">${kindLabel(k, placed.filter((n) => n.kind === k.kind).length)}</text>`;
            })}
          </g>
          <g class="uv-nodes">${svgNodes}</g>
          <g class="uv-core" aria-hidden="true">
            <circle cx="${CX}" cy="${CY}" r="58" />
            <circle class="uv-core-glow" cx="${CX}" cy="${CY}" r="58" />
            <text x="${CX}" y="${CY - 4}" text-anchor="middle">Kolpingtheater</text>
            <text x="${CX}" y="${CY + 16}" text-anchor="middle" class="uv-core-sub">Ramsen</text>
          </g>
        </svg>
        <div class="uv-card" aria-hidden="true">
          <p class="uv-card-kind meta" data-uv="kind"></p>
          <p class="uv-card-title" data-uv="title"></p>
          <p class="uv-card-text" data-uv="text"></p>
          <p class="uv-card-link meta" data-uv="link"></p>
        </div>
      </div>
      <div class="uv-list">${groups}</div>
    </div>`);
  const root = mountEl.querySelector(".uv");
  const list = mountEl.querySelector(".uv-list");
  const more = mountEl.querySelector(".uv-more");
  // one disclosure for both views; focus stays on the button (it sits above what opens)
  const onMore = () => {
    const open = !root.classList.contains("is-open");
    root.classList.toggle("is-open", open);
    list.classList.toggle("is-open", open);
    more.setAttribute("aria-expanded", String(open));
    more.textContent = open ? "Weniger zeigen" : `Alle ${count} zeigen`;
  };
  more?.addEventListener("click", onMore);

  const svg = mountEl.querySelector(".uv-svg");
  const card = {
    root: mountEl.querySelector(".uv-card"),
    kind: mountEl.querySelector('[data-uv="kind"]'),
    title: mountEl.querySelector('[data-uv="title"]'),
    text: mountEl.querySelector('[data-uv="text"]'),
    link: mountEl.querySelector('[data-uv="link"]'),
  };
  const kindName = Object.fromEntries(KINDS.map((k) => [k.kind, kindLabel(k, placed.filter((n) => n.kind === k.kind).length)]));
  let current = -1;

  function show(i) {
    if (i === current || !placed[i]) return;
    current = i;
    const n = placed[i];
    const internal = Boolean(n.projectId && byId?.has?.(n.projectId));
    card.kind.textContent = `${kindName[n.kind]}${n.year ? ` · ${n.year}` : ""}`;
    card.title.textContent = n.label;
    card.text.textContent = n.text;
    card.link.textContent = internal ? "Werkstück öffnen →" : `${host(n.url)} ↗`;
    card.root.dataset.kind = n.kind;
    for (const g of svg.querySelectorAll(".uv-node")) g.classList.toggle("is-active", g.dataset.i === String(i));
    if (!motion?.calm) card.root.animate?.([{ opacity: 0.4, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 180, easing: "cubic-bezier(.2,0,0,1)" });
  }
  const pick = (e) => {
    const a = e.target.closest?.(".uv-link");
    if (a) show(Number(a.dataset.i));
  };
  svg.addEventListener("pointerover", pick);
  svg.addEventListener("focusin", pick);
  /* Knockout: rings, arcs and spokes pause under every label, so no line ever runs through text.
     Measured from the rendered text (after the webfonts), applied once the nodes have landed. */
  const knock = svg.querySelector(".uv-knock");
  let knockApplied = false;
  /* Arcs clear every label they sweep past: after the fonts, each arc moves just outside the
     outermost label corner inside its angle range (ellipse metric), its caption with it. */
  const arcEls = Object.fromEntries([...svg.querySelectorAll(".uv-arcs path")].map((el) => [el.dataset.kind, el]));
  const arcLabelEls = Object.fromEntries([...svg.querySelectorAll(".uv-arc-labels text")].map((el) => [el.dataset.kind, el]));
  function fitArcs() {
    const corners = [];
    for (const t of svg.querySelectorAll(".uv-label, .uv-year")) {
      let b;
      try {
        b = t.getBBox();
      } catch {
        continue;
      }
      if (!b.width) continue;
      for (const [x, y] of [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]) {
        const dx = (x - CX) / SX;
        const dy = y - CY;
        corners.push({ r: Math.hypot(dx, dy), deg: (Math.atan2(dy, dx) * 180) / Math.PI });
      }
    }
    const within = (deg, a) => [deg, deg + 360, deg - 360].some((d) => d >= a.from - 4 && d <= a.to + 4);
    for (const k of KINDS) {
      const arc = arcOf(k.kind);
      const path = arcEls[k.kind];
      if (!arc || !path) continue;
      const hits = corners.filter((c) => within(c.deg, arc));
      const clear = Math.max(0, ...hits.map((c) => c.r)) + 12;
      // never above the viewBox: the top arc and its caption would run into the heading
      const topDeg = arc.from <= -90 && arc.to >= -90 ? -90 : Math.abs(arc.from + 90) < Math.abs(arc.to + 90) ? arc.from : arc.to;
      const up = -Math.sin((topDeg * Math.PI) / 180);
      const r = Math.min(Math.max(arc.r, clear), up > 0.05 ? (CY - 10) / up : Infinity);
      // where the radius had to give, the arc ends short of the label instead of running through it
      const mid = (arc.from + arc.to) / 2;
      const fit = { ...arc };
      for (const c of hits) {
        if (c.r < r - 10) continue;
        const d = [c.deg, c.deg + 360, c.deg - 360].find((x) => x >= arc.from - 4 && x <= arc.to + 4);
        if (d > mid) fit.to = Math.min(fit.to, d - 3);
        else fit.from = Math.max(fit.from, d + 3);
      }
      if (fit.to - fit.from < 8) Object.assign(fit, arc);
      arc.from = fit.from;
      arc.to = fit.to;
      path.setAttribute("d", arcPath(arc, r));
      const label = arcLabelEls[k.kind];
      if (label) {
        const pos = arcLabelPos(arc, r);
        label.setAttribute("x", pos.x.toFixed(1));
        label.setAttribute("y", pos.y.toFixed(1));
      }
    }
  }

  function measureKnockout() {
    if (!knock) return;
    fitArcs();
    const pad = 4;
    const rects = [];
    for (const t of svg.querySelectorAll(".uv-label, .uv-year, .uv-ring-labels text, .uv-arc-labels text")) {
      let b;
      try {
        b = t.getBBox();
      } catch {
        continue;
      }
      if (!b.width) continue;
      rects.push(`<rect x="${(b.x - pad).toFixed(1)}" y="${(b.y - pad / 2).toFixed(1)}" width="${(b.width + pad * 2).toFixed(1)}" height="${(b.height + pad).toFixed(1)}" rx="3" />`);
    }
    knock.innerHTML = rects.join("");
  }
  function applyKnockout() {
    if (knockApplied || destroyed) return;
    knockApplied = true;
    measureKnockout();
    for (const el of svg.querySelectorAll(".uv-lines, .uv-spoke")) el.setAttribute("mask", `url(#${maskId})`);
  }
  let destroyed = false;
  document.fonts?.ready?.then(() => knockApplied && !destroyed && measureKnockout());
  // folded (or the list view below 640 px): measure again once the map has a size
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => knockApplied && svg.clientWidth && measureKnockout()) : null;
  ro?.observe(svg);

  const start = placed.findIndex((n) => n.projectId && byId?.has?.(n.projectId) && n.kind === "web");
  show(start >= 0 ? start : 0);

  // entrance: nodes fly out from the core once, when the map comes into view (never when calm)
  let io = null;
  if (motion?.calm || !("IntersectionObserver" in window) || !svg.animate) applyKnockout();
  else {
    io = new IntersectionObserver(
      (rec) => {
        if (!rec.some((r) => r.isIntersecting)) return;
        io.disconnect();
        io = null;
        if (motion?.calm) return applyKnockout();
        const nodes = svg.querySelectorAll(".uv-node");
        let lastAnim = null;
        nodes.forEach((g, i) => {
          const dot = g.querySelector(".uv-link");
          const x = parseFloat(g.style.getPropertyValue("--x"));
          const y = parseFloat(g.style.getPropertyValue("--y"));
          lastAnim = dot.animate([{ transform: `translate(${-x}px, ${-y}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], {
            duration: 900,
            delay: 60 + i * 55,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "backwards",
          });
          g.querySelector(".uv-spoke").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 200 + i * 55, fill: "backwards" });
        });
        if (lastAnim?.finished) lastAnim.finished.then(applyKnockout, applyKnockout);
        else applyKnockout();
      },
      { threshold: 0.25 },
    );
    io.observe(svg);
  }

  return {
    destroy() {
      destroyed = true;
      io?.disconnect();
      ro?.disconnect();
      more?.removeEventListener("click", onMore);
      svg.removeEventListener("pointerover", pick);
      svg.removeEventListener("focusin", pick);
    },
  };
}

export { nodeHref };
