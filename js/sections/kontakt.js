/**
 * 07 · Kontakt (spec §2.9)  [WP5]
 *
 * - Links from data/socials.json (Discord, Telegram) + GitHub (snapshot.github.login).
 *   The static list in index.html stays if the data is missing.
 * - „Adresse kopieren“ next to the mail (only where the Clipboard API exists).
 * - Die Glut: a bed of coals at the bottom (static SVG, the Esse's Voronoi cells, matte). Its
 *   hot spots breathe only while the section is on screen and not calm (calm-gated CSS; this
 *   module pauses it off-screen), and flare up when the mail address is hovered or focused:
 *   heat in fast, cooling slowly.
 * - On wide screens the empty column names the newest public repo („Zuletzt angelegt“, repos.json).
 */
import { html, icon, safeUrl, EXT_SUFFIX } from "../lib/dom.js";
import { formatDate } from "../lib/derive.js";

const LABELS = { "discord-contact": "Discord", "telegram-contact": "Telegram" };
const W = 1440;
const H = 220;
const CHAR = [23, 17, 15]; // matte charcoal, a touch lighter than the screen background

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const hex = (c) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Clips a convex polygon to the half-plane closer to a than to b (one Voronoi step). */
function clip(poly, a, b) {
  const [nx, ny] = [b[0] - a[0], b[1] - a[1]];
  const k = (nx * (a[0] + b[0])) / 2 + (ny * (a[1] + b[1])) / 2;
  const side = (p) => k - (nx * p[0] + ny * p[1]);
  const out = [];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    const sp = side(p);
    const sq = side(q);
    if (sp >= 0) out.push(p);
    if (sp >= 0 !== sq >= 0) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  });
  return out;
}

/** The bed of coals: the Esse's Voronoi cells as a static SVG. Matte charcoal cells with glowing
 *  cracks between them, rows getting smaller towards the back, two or three hot spots where the
 *  cells themselves turn to dark Rotglut. No highlights, no gloss. Deterministic (seeded). */
export function coalsHtml() {
  const rnd = seeded(20200827);
  const seeds = [];
  for (let y = H + 18, h = 56; y > 36; y -= h * 0.8, h = Math.max(24, h * 0.8)) {
    const off = rnd() * h;
    for (let x = -off; x < W + h; x += h * (1 + rnd() * 0.5)) seeds.push([x + (rnd() - 0.5) * h * 0.5, y + (rnd() - 0.5) * h * 0.35]);
  }
  const spots = [0.2 + rnd() * 0.08, 0.55 + rnd() * 0.1, 0.84 + rnd() * 0.06].map((f, i) => ({ x: f * W, y: H - 10, r: [300, 380, 240][i], hot: [0.7, 1, 0.55][i] }));
  const ramp = ["#5A0E05", "#B3200A", "#F2600C"].map(toRgb);
  const box = [
    [-60, -60],
    [W + 60, -60],
    [W + 60, H + 60],
    [-60, H + 60],
  ];
  const cells = seeds.map((c) => {
    let poly = box;
    for (const o of seeds) if (o !== c && Math.abs(o[0] - c[0]) < 160 && Math.abs(o[1] - c[1]) < 160) poly = clip(poly, c, o);
    // Inset every corner ~2.4 px towards the seed: that gap is the glowing crack.
    const pts = poly.map(([x, y]) => {
      const d = Math.hypot(x - c[0], y - c[1]) || 1;
      const f = Math.max(0.5, 1 - 2.4 / d);
      return `${Math.round(c[0] + (x - c[0]) * f)},${Math.round(c[1] + (y - c[1]) * f)}`;
    });
    const heat = Math.min(1, spots.reduce((sum, s) => sum + s.hot * Math.exp(-((c[0] - s.x) ** 2 + (c[1] - s.y) ** 2 * 4) / (s.r * s.r * 0.35)), 0));
    const t = heat * (0.75 + rnd() * 0.25);
    const base = mix(CHAR, [31, 24, 21], rnd());
    const fill = t < 0.25 ? mix(base, ramp[0], t * 2) : t < 0.7 ? mix(mix(base, ramp[0], 0.5), ramp[1], (t - 0.25) / 0.45) : mix(ramp[1], ramp[2], (t - 0.7) / 0.3 * 0.6);
    return `<polygon points="${pts.join(" ")}" fill="${hex(fill)}"/>`;
  });
  const glow = spots
    .map((s, i) => `<ellipse cx="${s.x.toFixed(0)}" cy="${s.y}" rx="${s.r}" ry="${(s.r * 0.42).toFixed(0)}" fill="url(#coal-hot)" opacity="${s.hot}"/>`)
    .join("");
  return `<svg class="coal-bed" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" focusable="false"><defs><radialGradient id="coal-hot"><stop offset="0" stop-color="#FFB347"/><stop offset=".35" stop-color="#F2600C"/><stop offset="1" stop-color="#F2600C" stop-opacity="0"/></radialGradient><linearGradient id="coal-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="coal-mask"><rect width="${W}" height="${H}" fill="url(#coal-fade)"/></mask></defs><g mask="url(#coal-mask)"><rect width="${W}" height="${H}" fill="#3A0A04"/><g class="coal-glow">${glow}</g><g class="coal-cells">${cells.join("")}</g></g></svg>`;
}

/** „Zuletzt angelegt“: the newest public repo from repos.json (one line, not a second „Noch warm“).
 *  Repos without an allowlisted name are never named; then the line counts instead. */
export function latestRepo(data) {
  return latestOf(data)?.last ?? null;
}

function latestOf(data) {
  const asOf = data?.snapshot?.asOf ?? data?.reposAsOf;
  const repos = (data?.repos ?? []).filter((r) => typeof r.c === "string" && (!asOf || r.c <= asOf));
  if (!repos.length || !asOf) return null;
  return { asOf, total: repos.length, last: repos.reduce((a, b) => (b.c > a.c ? b : a)) };
}

function latestAside(data) {
  const l = latestOf(data);
  if (!l) return "";
  const { asOf, total, last: r } = l;
  const login = data.snapshot?.github?.login || "LoggeL";
  const when = html`<time datetime="${r.c}">${formatDate(r.c)}</time>`;
  const line = r.n
    ? html`<a class="kontakt-warm-name" href="https://github.com/${login}/${encodeURIComponent(r.n)}" target="_blank" rel="noopener noreferrer">${r.n}<span class="vh">${EXT_SUFFIX}</span></a> <span class="kontakt-warm-date meta">am ${when}</span>`
    : html`<span class="kontakt-warm-name">${total} öffentliche Repos,</span> <span class="kontakt-warm-date meta">das letzte am ${when}</span>`;
  return String(
    html`<aside class="kontakt-warm" aria-labelledby="kontakt-warm-title"><p class="kontakt-warm-title meta" id="kontakt-warm-title">Zuletzt angelegt</p><p class="kontakt-warm-line">${line}</p><p class="kontakt-warm-src meta">Stand ${formatDate(asOf)} · Quelle: GitHub API</p></aside>`,
  );
}

export async function mount(root, ctx) {
  const offs = [];
  const data = await ctx.data;

  const list = root.querySelector('[data-mount="socials"]');
  const socials = Array.isArray(data?.socials) ? data.socials.filter((s) => /^https:\/\//.test(s.link ?? "")) : [];
  // GitHub stays even without snapshot.json: it is the recovery path for data failures (§2.11).
  const login = data?.snapshot?.github?.login || list?.querySelector('a[href^="https://github.com/"]')?.pathname.slice(1) || "LoggeL";
  if (list && socials.length) {
    const items = socials.map((s) => ({ label: LABELS[s.id] ?? s.title.split(" - ")[0], href: s.link }));
    items.push({ label: "GitHub", href: `https://github.com/${login}` });
    list.innerHTML = String(
      html`${items.map((it) => html`<li><a href="${safeUrl(it.href)}" target="_blank" rel="noopener noreferrer">${it.label} ${icon("arrow-ne")}<span class="vh">${EXT_SUFFIX}</span></a></li>`)}`,
    );
  }

  const mail = root.querySelector(".contact-mail");
  if (mail && navigator.clipboard?.writeText && !root.querySelector(".contact-copy")) {
    const address = mail.getAttribute("href").replace(/^mailto:/, "");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "contact-copy chip";
    btn.textContent = "Adresse kopieren";
    mail.after(btn);
    let t = 0;
    const onCopy = async () => {
      try {
        await navigator.clipboard.writeText(address);
        btn.textContent = "Kopiert.";
        ctx.announce?.("Mailadresse kopiert.", { throttle: 0 });
      } catch {
        btn.textContent = "Ging nicht. Einfach markieren.";
      }
      clearTimeout(t);
      t = setTimeout(() => (btn.textContent = "Adresse kopieren"), 2400);
    };
    btn.addEventListener("click", onCopy);
    offs.push(() => {
      clearTimeout(t);
      btn.removeEventListener("click", onCopy);
      btn.remove();
    });
  }

  const inner = root.querySelector(".kontakt-inner");
  if (inner && !inner.querySelector(".kontakt-warm")) {
    const aside = latestAside(data);
    if (aside) {
      inner.insertAdjacentHTML("beforeend", aside);
      offs.push(() => inner.querySelector(".kontakt-warm")?.remove());
    }
  }

  const coals = root.querySelector('[data-mount="coals"]');
  if (coals && !coals.children.length) coals.innerHTML = coalsHtml();
  if (coals && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      coals.classList.toggle("is-live", entries.some((e) => e.isIntersecting));
    });
    io.observe(coals);
    offs.push(() => io.disconnect());
  }

  return { destroy: () => offs.forEach((off) => off()) };
}
