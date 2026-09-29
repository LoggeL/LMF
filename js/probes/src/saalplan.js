/**
 * Probestück · Saalplan (Kolpingtheater Ramsen)  · Nachbau · spec OWNER UPDATE 28.09.2026
 *
 * What is documented (and replicated here):
 *   - kolpingtheater-ramsen.de/booking, live geprüft 28.09.2026 (docs/research/projects-deep.json,
 *     theater-website.liveCheck): „Romeo und Julia“ (Wintertheater), Eintritt frei,
 *     Vorstellungen 27.–29.12.2026 mit je 68 Plätzen.
 *   - Screenshot assets/img/KolpingtheaterSaalplan.webp (Schritt „Plätze“, Vorstellung
 *     Montag, 28. Dezember 2026 · 19:30 Uhr, nichts gebucht): Bühne oben, Reihen A–G,
 *     Reihe A Plätze 2–9, Reihen B–G Plätze 1–10, Gang zwischen 5 und 6 (= 68 Plätze),
 *     Legende „Frei / Deine Auswahl / Belegt“, Zähler „0 von 5 Plätzen“ und der Hinweis
 *     „Wähle eure freien Plätze. Ihr könnt auch getrennt sitzen. Wenn möglich, vermeide
 *     einzelne freie Plätze dazwischen.“
 *   - README next-theater (details.highlights): visuelle Platzwahl, Belegungsanzeige,
 *     Warnungen vor Einzelplatzlücken, QR-Code-Tickets.
 *
 * What is NOT real: nothing leaves the browser, nothing is booked, no occupancy is invented
 * (the screenshot shows an empty house). „Belegt“ only ever means seats *you* printed here.
 * The QR-looking block on the ticket is decoration from a seeded PRNG, not an encoded code.
 */

import { announcer, calmSource, nextId } from "./index.js";

export const KIND = "nachbau";

/* ── Pure data + rules (Node-importable) ───────────────────────────────────────────────────────── */

/** Rows front (at the stage) to back, seat numbers as labelled in the screenshot. */
export const LAYOUT = [
  { row: "A", seats: [2, 3, 4, 5, 6, 7, 8, 9] },
  ...["B", "C", "D", "E", "F", "G"].map((row) => ({
    row,
    seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  })),
];
/** The aisle runs between seat 5 and seat 6. */
export const AISLE_AFTER = 5;
export const MAX_PICK = 5; // „0 von 5 Plätzen“

export const SHOW = {
  title: "Romeo und Julia",
  house: "Kolpingtheater Ramsen",
  season: "Wintertheater",
  day: "Mo 28.12.2026",
  time: "19:30",
  hint: "Wähle eure freien Plätze. Ihr könnt auch getrennt sitzen. Wenn möglich, vermeide einzelne freie Plätze dazwischen.",
};

export const SEATS = LAYOUT.flatMap(({ row, seats }, ri) =>
  seats.map((n) => ({
    id: `${row}${n}`,
    row,
    n,
    ri,
    block: n <= AISLE_AFTER ? 0 : 1,
  })),
);
export const SEAT_COUNT = SEATS.length; // 68
export const CHIP = `Dieselben ${SEAT_COUNT} Plätze wie im echten Saal. Gebucht wird hier nichts.`;
const BY_ID = new Map(SEATS.map((s) => [s.id, s]));
export const seatLabel = (id) => {
  const s = BY_ID.get(id);
  return s ? `Reihe ${s.row}, Platz ${s.n}` : "";
};

/**
 * Seats that a pick would leave alone: a free seat whose neighbours inside its block (the aisle
 * and the row ends count as walls) are all taken, with at least one of them picked right now.
 * `booked` and `picked` are Sets of seat ids.
 */
export function loneGaps(booked, picked) {
  const taken = (id) => booked.has(id) || picked.has(id);
  const out = [];
  for (const { row, seats } of LAYOUT) {
    for (const block of [
      seats.filter((n) => n <= AISLE_AFTER),
      seats.filter((n) => n > AISLE_AFTER),
    ]) {
      block.forEach((n, i) => {
        const id = `${row}${n}`;
        if (taken(id) || block.length < 2) return;
        const nb = [block[i - 1], block[i + 1]]
          .filter((x) => x !== undefined)
          .map((x) => `${row}${x}`);
        if (nb.every(taken) && nb.some((x) => picked.has(x))) out.push(id);
      });
    }
  }
  return out;
}

/** Spatial keyboard move. Up/Down keep the seat number, or take the nearest one in that row. */
export function step(id, key) {
  const s = BY_ID.get(id);
  if (!s) return SEATS[0].id;
  const row = LAYOUT[s.ri].seats;
  const i = row.indexOf(s.n);
  const inRow = (j) =>
    `${s.row}${row[Math.max(0, Math.min(row.length - 1, j))]}`;
  const toRow = (ri) => {
    const r = LAYOUT[Math.max(0, Math.min(LAYOUT.length - 1, ri))];
    const n = r.seats.reduce(
      (best, x) => (Math.abs(x - s.n) < Math.abs(best - s.n) ? x : best),
      r.seats[0],
    );
    return `${r.row}${n}`;
  };
  switch (key) {
    case "ArrowLeft":
      return inRow(i - 1);
    case "ArrowRight":
      return inRow(i + 1);
    case "ArrowUp":
      return toRow(s.ri - 1);
    case "ArrowDown":
      return toRow(s.ri + 1);
    case "Home":
      return inRow(0);
    case "End":
      return inRow(row.length - 1);
    case "PageUp":
      return toRow(0);
    case "PageDown":
      return toRow(LAYOUT.length - 1);
    default:
      return id;
  }
}

/** „C 4, 5 · D 7“ — picks grouped by row, in seat order. */
export function seatList(ids) {
  const rows = new Map();
  for (const s of SEATS)
    if (ids.has(s.id)) rows.set(s.row, [...(rows.get(s.row) ?? []), s.n]);
  return [...rows].map(([row, ns]) => `${row} ${ns.join(", ")}`).join(" · ");
}

/** mulberry32, the same tiny PRNG the Bomberman toy seeds its bricks with. */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashStr = (str) =>
  [...str].reduce(
    (h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619),
    2166136261,
  );

/**
 * A 21×21 pattern in QR costume: three finder squares and the timing lines are drawn like the real
 * thing, every other module is noise from the seed. It encodes nothing (on purpose).
 */
export function decoPattern(seed, size = 21) {
  const rnd = prng(hashStr(String(seed)));
  const m = Array.from({ length: size }, () => new Array(size).fill(0));
  const reserved = Array.from({ length: size }, () =>
    new Array(size).fill(false),
  );
  const finder = (ox, oy) => {
    for (let y = -1; y <= 7; y++)
      for (let x = -1; x <= 7; x++) {
        const X = ox + x;
        const Y = oy + y;
        if (X < 0 || Y < 0 || X >= size || Y >= size) continue;
        reserved[Y][X] = true;
        const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        m[Y][X] = x >= 0 && x <= 6 && y >= 0 && y <= 6 && ring !== 2 ? 1 : 0;
      }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  for (let i = 8; i < size - 8; i++) {
    m[6][i] = m[i][6] = i % 2 === 0 ? 1 : 0;
    reserved[6][i] = reserved[i][6] = true;
  }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (!reserved[y][x]) m[y][x] = rnd() < 0.48 ? 1 : 0;
  return m;
}
const patternPath = (m) => {
  let d = "";
  m.forEach((row, y) =>
    row.forEach((on, x) => on && (d += `M${x} ${y}h1v1h-1z`)),
  );
  return d;
};

/* ── Toy (DOM) ─────────────────────────────────────────────────────────────────────────────────── */

export function mount(root, ctx = {}) {
  const motion = calmSource(ctx);
  const say = announcer(ctx);
  const ids = {
    how: nextId("ps-how"),
    map: nextId("ps-map"),
    hint: nextId("ps-hint"),
  };
  const booked = new Set();
  let picked = new Set();
  let cursor = "D5"; // the middle of the house
  let printed = 0;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };

  root.classList.add("probe", "probe-saal");
  root.tabIndex = -1;

  const col = (n) => (n <= AISLE_AFTER ? n + 1 : n + 2); // col 1: row letter, col 7: aisle
  const seatsHtml = LAYOUT.map(
    ({ row, seats }, ri) =>
      `<span class="ps-rowlab" data-rowlab="${row}" style="grid-row:${ri + 1}" aria-hidden="true">${row}</span>` +
      seats
        .map(
          (n) =>
            `<button type="button" class="ps-seat" data-seat="${row}${n}" style="grid-row:${ri + 1};grid-column:${col(n)}" aria-label="Reihe ${row}, Platz ${n}" aria-pressed="false" tabindex="-1"><span aria-hidden="true">${n}</span></button>`,
        )
        .join(""),
  ).join("");

  root.innerHTML = `
    <div class="ps-house">
      <header class="ps-hud meta">
        <span class="ps-hud-tag">Saalplan · Nachbau</span>
        <span class="ps-hud-show"><b>${SHOW.title}</b> · ${SHOW.day} · ${SHOW.time}</span>
      </header>
      <div class="ps-stage" aria-hidden="true">
        <svg class="ps-arc" viewBox="0 0 600 60" preserveAspectRatio="none" focusable="false"><path d="M8 52 Q300 -12 592 52"/></svg>
        <span class="ps-stage-label">Bühne</span>
      </div>
      <div class="ps-map" id="${ids.map}" role="group" aria-roledescription="Saalplan" aria-label="Saalplan „${SHOW.title}“, ${SEAT_COUNT} Plätze in ${LAYOUT.length} Reihen, Bühne vorne" aria-describedby="${ids.how}">
        ${seatsHtml}
        <span class="ps-aisle" style="grid-row:1 / span ${LAYOUT.length}" aria-hidden="true"></span>
      </div>
      <ul class="ps-legend meta" aria-label="Legende">
        <li><i class="ps-dot" aria-hidden="true"></i>Frei</li>
        <li><i class="ps-dot ps-dot--pick" aria-hidden="true"></i>Deine Auswahl</li>
        <li><i class="ps-dot ps-dot--taken" aria-hidden="true"></i>Belegt</li>
      </ul>
      <p class="ps-hint" id="${ids.hint}"><span class="ps-hint-q">„${SHOW.hint}“</span></p>
      <p class="ps-warn" data-ps="warn" hidden></p>
    </div>
    <div class="probe-toolbar">
      <button class="button probe-btn" type="button" data-ps="print" disabled>Ticket drucken</button>
      <button class="button button--ghost probe-btn" type="button" data-ps="clear" disabled>Auswahl leeren</button>
      <button class="button button--ghost probe-btn" type="button" data-ps="reset" hidden>Saal leeren</button>
      <p class="probe-readout meta" data-ps="readout"><span><b data-ps="count">0</b> von ${MAX_PICK} Plätzen</span><span><b data-ps="free">${SEAT_COUNT}</b> von ${SEAT_COUNT} frei</span></p>
    </div>
    <div class="ps-slot" data-ps="slot"><p class="ps-slot-empty meta" data-ps="slotnote">Hier kommt dein Ticket raus.</p></div>
    <p class="probe-howto vh" id="${ids.how}">Platz antippen oder mit Pfeiltasten wählen. Enter oder Leertaste wählt aus, Pos1 und Ende springen an den Reihenanfang und das Reihenende, Escape verlässt den Saalplan.</p>`;

  const q = (sel) => root.querySelector(sel);
  const el = {
    map: q(".ps-map"),
    seats: new Map(
      [...root.querySelectorAll(".ps-seat")].map((b) => [b.dataset.seat, b]),
    ),
    rowlabs: new Map(
      [...root.querySelectorAll(".ps-rowlab")].map((r) => [
        r.dataset.rowlab,
        r,
      ]),
    ),
    warn: q('[data-ps="warn"]'),
    print: q('[data-ps="print"]'),
    clear: q('[data-ps="clear"]'),
    reset: q('[data-ps="reset"]'),
    count: q('[data-ps="count"]'),
    free: q('[data-ps="free"]'),
    slot: q('[data-ps="slot"]'),
    house: q(".ps-house"),
  };
  el.seats.get(cursor).tabIndex = 0;

  const anim = (node, frames, opts) =>
    motion.calm || !node.animate ? null : node.animate(frames, opts);
  // a taken seat or a full hand: a short, hard „no“
  const shake = (b) => anim(b, [{ transform: "translateX(-3px)" }, { transform: "translateX(3px)" }, { transform: "none" }], { duration: 180, easing: "steps(3, end)" });

  function spotlight(id) {
    const b = el.seats.get(id);
    if (!b) return;
    const m = el.house.getBoundingClientRect();
    const r = b.getBoundingClientRect();
    if (!m.width) return;
    el.house.style.setProperty(
      "--mx",
      `${(((r.left + r.width / 2 - m.left) / m.width) * 100).toFixed(1)}%`,
    );
    el.house.style.setProperty(
      "--my",
      `${(((r.top + r.height / 2 - m.top) / m.height) * 100).toFixed(1)}%`,
    );
  }

  function render() {
    for (const [id, b] of el.seats) {
      const isPick = picked.has(id);
      const isTaken = booked.has(id);
      b.setAttribute("aria-pressed", String(isPick));
      b.classList.toggle("is-pick", isPick);
      b.classList.toggle("is-taken", isTaken);
      if (isTaken) {
        b.setAttribute("aria-disabled", "true");
        b.setAttribute("aria-label", `${seatLabel(id)}, belegt`);
      } else {
        b.removeAttribute("aria-disabled");
        b.setAttribute("aria-label", seatLabel(id));
      }
    }
    for (const [row, lab] of el.rowlabs)
      lab.classList.toggle(
        "is-hot",
        [...picked].some((id) => BY_ID.get(id).row === row),
      );
    const gaps = loneGaps(booked, picked);
    for (const [id, b] of el.seats)
      b.classList.toggle("is-lone", gaps.includes(id));
    if (gaps.length) {
      el.warn.hidden = false;
      el.warn.textContent = `${gaps.length === 1 ? `Platz ${gaps[0]} bliebe` : `Die Plätze ${gaps.join(", ")} blieben`} allein frei. Geht trotzdem, ist nur nicht so schön.`;
    } else el.warn.hidden = true;
    const free = SEAT_COUNT - booked.size - picked.size;
    el.count.textContent = String(picked.size);
    el.free.textContent = String(free);
    el.print.disabled = picked.size === 0;
    el.clear.disabled = picked.size === 0;
    el.reset.hidden = booked.size === 0;
    root.dataset.full = String(picked.size >= MAX_PICK);
    root.dataset.soldout = String(booked.size === SEAT_COUNT);
    return gaps;
  }

  function focusSeat(id, { move = true } = {}) {
    const prev = el.seats.get(cursor);
    if (prev) prev.tabIndex = -1;
    cursor = id;
    const b = el.seats.get(id);
    b.tabIndex = 0;
    if (move) b.focus({ preventScroll: false });
    spotlight(id);
  }

  function toggle(id) {
    const b = el.seats.get(id);
    if (booked.has(id)) {
      shake(b);
      say(`${seatLabel(id)} ist schon belegt.`);
      return;
    }
    if (picked.has(id)) {
      picked.delete(id);
      render(); // the CSS transition cools it down slowly
      say(`${seatLabel(id)} wieder frei. ${picked.size} von ${MAX_PICK}.`);
      return;
    }
    if (picked.size >= MAX_PICK) {
      shake(b);
      say(`Mehr als ${MAX_PICK} Plätze gehen nicht auf einmal.`);
      return;
    }
    picked.add(id);
    const gaps = render();
    // Hitze kommt schnell (strike + rebound) … Kälte langsam (the glow fades over 1.6 s).
    anim(
      b,
      [
        { transform: "scale(0.82)" },
        { transform: "scale(1.12)", offset: 0.35 },
        { transform: "none" },
      ],
      { duration: 260, easing: "cubic-bezier(.34,1.56,.64,1)" },
    );
    anim(
      b,
      [
        {
          boxShadow:
            "0 0 0 6px rgb(255 179 71 / 0.55), 0 0 26px 6px rgb(242 96 12 / 0.75)",
        },
        {
          boxShadow: "0 0 0 0 rgb(255 179 71 / 0), 0 0 0 0 rgb(242 96 12 / 0)",
        },
      ],
      {
        duration: 1600,
        easing: "cubic-bezier(.16,1,.3,1)",
      },
    );
    const tail = gaps.length
      ? ` Achtung: ${gaps.map(seatLabel).join(" und ")} ${gaps.length === 1 ? "bliebe" : "blieben"} allein frei.`
      : "";
    say(`${seatLabel(id)} gewählt. ${picked.size} von ${MAX_PICK}.${tail}`);
  }

  function ticket(seats) {
    printed++;
    const list = seatList(seats);
    const code = decoPattern(`${SHOW.title}|${SHOW.day}|${list}|${printed}`);
    const n = seats.size;
    const stub = document.createElement("article");
    stub.className = "ps-stub";
    stub.setAttribute(
      "aria-label",
      `Ticket, Nachbau: ${SHOW.title}, ${SHOW.day}, ${SHOW.time}, ${n === 1 ? "Platz" : "Plätze"} ${list}`,
    );
    stub.innerHTML = `
      <div class="ps-stub-main">
        <p class="ps-stub-house meta">${SHOW.house} · ${SHOW.season}</p>
        <p class="ps-stub-title">${SHOW.title}</p>
        <dl class="ps-stub-facts">
          <div><dt>Vorstellung</dt><dd>${SHOW.day}</dd></div>
          <div><dt>Beginn</dt><dd>${SHOW.time}</dd></div>
          <div><dt>${n === 1 ? "Platz" : `${n} Plätze`}</dt><dd>${list}</dd></div>
          <div><dt>Eintritt</dt><dd>frei</dd></div>
        </dl>
      </div>
      <div class="ps-stub-code">
        <svg class="ps-qr" viewBox="-2 -2 25 25" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><rect x="-2" y="-2" width="25" height="25" class="ps-qr-bg"/><path d="${patternPath(code)}"/></svg>
        <p class="ps-stub-note meta">Nur Deko im QR-Look.<br />Scannen bringt nix.</p>
      </div>
      <span class="ps-stamp" aria-hidden="true">Nachbau</span>`;
    el.slot.replaceChildren(stub);
    const a1 = anim(
      stub,
      [
        { transform: "translateY(-38%)", clipPath: "inset(0 0 100% 0)" },
        { transform: "none", clipPath: "inset(0 0 0 0)" },
      ],
      {
        duration: 640,
        easing: "cubic-bezier(.16,1,.3,1)",
      },
    );
    anim(
      stub.querySelector(".ps-qr path"),
      [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
      {
        duration: 420,
        delay: 260,
        easing: "steps(21, end)",
        fill: "backwards",
      },
    );
    const stamp = stub.querySelector(".ps-stamp");
    anim(
      stamp,
      [
        { opacity: 0, transform: "rotate(-14deg) scale(2.1)" },
        { opacity: 1, transform: "rotate(-8deg) scale(0.94)", offset: 0.7 },
        { opacity: 1, transform: "rotate(-8deg) scale(1)" },
      ],
      {
        duration: 360,
        delay: 700,
        easing: "cubic-bezier(.7,0,.84,0)",
        fill: "backwards",
      },
    );
    if (a1) later(() => stub.classList.add("is-cool"), 1100);
    else stub.classList.add("is-cool");
  }

  // A button never disables or hides itself under the keyboard (WCAG 2.4.3): focus moves first.
  const hadFocus = (btn) => document.activeElement === btn;

  function print() {
    if (!picked.size) return;
    const seats = new Set(picked);
    const keep = hadFocus(el.print);
    for (const id of seats) booked.add(id);
    picked = new Set();
    ticket(seats);
    if (keep) {
      const stub = el.slot.querySelector(".ps-stub");
      stub.tabIndex = -1;
      stub.focus({ preventScroll: true });
      stub.scrollIntoView?.({ block: "nearest" });
    }
    render();
    const soldOut = booked.size === SEAT_COUNT;
    say(
      `Ticket gedruckt: ${seats.size === 1 ? "Platz" : "Plätze"} ${seatList(seats)}. Nachbau, nichts gebucht.${soldOut ? " Ausverkauft. Zumindest hier." : ""}`,
    );
    if (soldOut) {
      const note = document.createElement("p");
      note.className = "ps-soldout";
      note.textContent = "Ausverkauft. Zumindest hier.";
      el.slot.append(note);
    }
  }

  function clearPicks() {
    if (!picked.size) return;
    const keep = hadFocus(el.clear);
    const last = [...picked].pop();
    picked = new Set();
    if (keep) focusSeat(last ?? cursor);
    render();
    say("Auswahl geleert.");
  }

  function resetHouse() {
    booked.clear();
    picked = new Set();
    focusSeat(cursor);
    render();
    el.slot.replaceChildren(
      Object.assign(document.createElement("p"), {
        className: "ps-slot-empty meta",
        textContent: "Hier kommt dein Ticket raus.",
      }),
    );
    say(`Saal wieder leer: ${SEAT_COUNT} Plätze frei.`);
  }

  /* ── input ── */
  const onClick = (e) => {
    const seat = e.target.closest?.(".ps-seat");
    if (seat && root.contains(seat)) {
      focusSeat(seat.dataset.seat, { move: document.activeElement !== seat });
      toggle(seat.dataset.seat);
      return;
    }
    const btn = e.target.closest?.("[data-ps]");
    if (!btn) return;
    if (btn === el.print) print();
    else if (btn === el.clear) clearPicks();
    else if (btn === el.reset) resetHouse();
  };
  const onKey = (e) => {
    const seat = e.target.closest?.(".ps-seat");
    if (e.key === "Escape") {
      if (
        root.contains(document.activeElement) &&
        document.activeElement !== root
      ) {
        e.preventDefault();
        root.focus({ preventScroll: true });
      }
      return;
    }
    if (!seat || !/^(Arrow|Home$|End$|Page)/.test(e.key)) return;
    e.preventDefault();
    const next = step(seat.dataset.seat, e.key);
    if (next !== seat.dataset.seat) focusSeat(next);
  };
  const onOver = (e) => {
    const seat = e.target.closest?.(".ps-seat");
    if (seat) spotlight(seat.dataset.seat);
  };
  const onFocusIn = (e) => {
    const seat = e.target.closest?.(".ps-seat");
    if (seat) {
      if (seat.dataset.seat !== cursor)
        focusSeat(seat.dataset.seat, { move: false });
      else spotlight(cursor);
    }
  };
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  root.addEventListener("focusin", onFocusIn);
  el.map.addEventListener("pointerover", onOver);
  const offCalm =
    motion.onCalmChange?.(() =>
      root.getAnimations?.({ subtree: true }).forEach((a) => a.finish()),
    ) ?? (() => {});

  render();
  const raf =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame(() => spotlight(cursor))
      : 0;

  return {
    pause() {
      root.dataset.paused = "true";
    },
    resume() {
      delete root.dataset.paused;
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      for (const t of timers) clearTimeout(t);
      timers.clear();
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
      root.removeEventListener("focusin", onFocusIn);
      el.map.removeEventListener("pointerover", onOver);
      offCalm();
      for (const a of root.getAnimations?.({ subtree: true }) ?? []) a.cancel();
      root.replaceChildren();
      root.classList.remove("probe", "probe-saal");
      delete root.dataset.full;
      delete root.dataset.soldout;
      delete root.dataset.paused;
    },
  };
}
