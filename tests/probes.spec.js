// tests/probes.spec.js — WP4: Meisterstücke + Probestücke (spec §7.3)
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { makeState, placeBomb, resolveTick, idx, FLOOR, SOLID, FUSE_MS } from "../js/probes/src/bomberman.js";
import { LAYOUT, SEATS, SEAT_COUNT, AISLE_AFTER, MAX_PICK, SHOW, CHIP as SAAL_CHIP, loneGaps, step, seatList, decoPattern } from "../js/probes/src/saalplan.js";
import { buildScore, SONG } from "../js/probes/src/mixer.js";
import { PROBE_IDS } from "../js/probes/src/index.js";
import { PROBE_IDS as PACKED_IDS } from "../js/probes/index.js";
import { pack, gz, OUT, BUDGET } from "../scripts/pack-probes.mjs";

/* ── Pure rules ────────────────────────────────────────────────────────────────────────────────── */

function openRow() {
  const s = makeState(7);
  for (let x = 1; x < 14; x++) s.grid[idx(x, 1)] = FLOOR; // row 1 has no pillars
  return s;
}

test.describe("resolveTick (pure)", () => {
  test("three bombs in a row chain within one tick", () => {
    let s = openRow();
    s = placeBomb(s, idx(3, 1), 0, { fuse: 0 });
    s = placeBomb(s, idx(5, 1), 0, { fuse: 10_000 });
    s = placeBomb(s, idx(7, 1), 0, { fuse: 10_000 });
    const before = s.bombs.size;
    const r = resolveTick(s, 0);
    expect(r.chain).toBe(3);
    expect(r.total).toBe(3);
    expect(r.state.bombs.size).toBe(0);
    expect(r.detonated.map((d) => d.by)).toEqual([null, idx(3, 1), idx(5, 1)]);
    expect(s.bombs.size).toBe(before); // input not mutated
  });

  test("a bomb out of range stays; a pillar blocks the blast", () => {
    let s = openRow();
    s = placeBomb(s, idx(3, 1), 0, { fuse: 0 });
    s = placeBomb(s, idx(6, 1), 0, { fuse: 10_000 }); // 3 cells away, range 2
    let r = resolveTick(s, 0);
    expect(r.chain).toBe(1);
    expect(r.state.bombs.has(idx(6, 1))).toBe(true);

    let t = makeState(7);
    t.grid[idx(3, 1)] = FLOOR;
    t.grid[idx(3, 3)] = FLOOR;
    expect(t.grid[idx(3, 2)]).not.toBe(SOLID); // (3,2) is odd/even → no pillar
    t.grid[idx(3, 2)] = SOLID;
    t = placeBomb(t, idx(3, 1), 0, { fuse: 0 });
    t = placeBomb(t, idx(3, 3), 0, { fuse: 10_000 });
    r = resolveTick(t, 0);
    expect(r.chain).toBe(1);
  });

  test("nothing happens before the fuse", () => {
    let s = openRow();
    s = placeBomb(s, idx(3, 1), 0);
    expect(resolveTick(s, FUSE_MS - 1).total).toBe(0);
    expect(resolveTick(s, FUSE_MS).total).toBe(1);
  });
});

test.describe("Saalplan rules", () => {
  const details = JSON.parse(readFileSync(new URL("../data/details/theater-website.json", import.meta.url), "utf8"));
  const fact = (key) => details.facts.find((f) => f.key === key)?.value;

  test("the layout is the documented house: A 2–9, B–G 1–10, aisle after 5, 68 seats", () => {
    expect(LAYOUT.map((r) => r.row).join("")).toBe("ABCDEFG");
    expect(LAYOUT[0].seats).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    for (const r of LAYOUT.slice(1)) expect(r.seats).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(AISLE_AFTER).toBe(5);
    expect(SEAT_COUNT).toBe(68);
    expect(String(SEAT_COUNT)).toBe(fact("seats"));
    expect(SHOW.title).toBe(fact("play"));
    expect(new Set(SEATS.map((s) => s.id)).size).toBe(SEAT_COUNT);
    expect(MAX_PICK).toBe(5);
    expect(SAAL_CHIP).toContain("Nachbau");
    expect(SAAL_CHIP).toContain(`${SEAT_COUNT} Plätzen`);
  });

  test("lone-gap warning: a free seat walled in by a pick, the aisle counts as a wall", () => {
    const none = new Set();
    expect(loneGaps(none, new Set(["C2"]))).toEqual(["C1"]);
    expect(loneGaps(none, new Set(["C3", "C5"]))).toEqual(["C4"]);
    expect(loneGaps(none, new Set(["C3"]))).toEqual([]);
    expect(loneGaps(none, new Set(["C4"]))).toEqual(["C5"]); // the aisle is a wall
    expect(loneGaps(new Set(["C4"]), new Set(["C6", "C2"]))).toEqual(["C1", "C3"]);
    // a gap that only booked seats make is not the current pick's fault
    expect(loneGaps(new Set(["D1", "D3"]), none)).toEqual([]);
    // row A starts at seat 2: A2 is its edge
    expect(loneGaps(none, new Set(["A3"]))).toEqual(["A2"]);
  });

  test("keyboard steps stay in the house and find the nearest seat across rows", () => {
    expect(step("B1", "ArrowUp")).toBe("A2");
    expect(step("B10", "ArrowUp")).toBe("A9");
    expect(step("A5", "ArrowUp")).toBe("A5");
    expect(step("C5", "ArrowRight")).toBe("C6");
    expect(step("C10", "ArrowRight")).toBe("C10");
    expect(step("G4", "ArrowDown")).toBe("G4");
    expect(step("E7", "Home")).toBe("E1");
    expect(step("A4", "End")).toBe("A9");
    expect(seatList(new Set(["D7", "C5", "C4"]))).toBe("C 4, 5 · D 7");
  });

  test("the ticket code is QR-shaped decoration: finder squares, seeded noise", () => {
    const m = decoPattern("a");
    expect(m).toHaveLength(21);
    expect(m[0].slice(0, 7)).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(m[3].slice(0, 7)).toEqual([1, 0, 1, 1, 1, 0, 1]);
    expect(decoPattern("a")).toEqual(m);
    expect(decoPattern("b")).not.toEqual(m);
  });
});

test("mixer lyrics are lines of this site's copy, one word per beat", async () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const line of SONG) {
    const plain = line.text.replace(/\s+/g, " ");
    const hit = plain === "Aus Neugier. Gemacht." ? /Aus Neugier\.\s+Gemacht\./.test(html) : html.includes(plain);
    expect(hit, plain).toBe(true);
    expect(line.words.join(" ")).toBe(plain);
  }
  const score = buildScore();
  expect(score.words.every((w, i, all) => i === 0 || w.line !== all[i - 1].line || w.start === all[i - 1].start + 1)).toBe(true);
});

test("the probe packs are fresh and within budget (§8: probes ≤ 22 KB gz total)", () => {
  const packs = pack();
  let total = 0;
  for (const [key, path] of Object.entries(OUT)) {
    const shipped = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    expect(shipped, `${path} is stale: run node scripts/pack-probes.mjs`).toBe(packs[key]);
    total += gz(shipped);
  }
  expect(total, "gzip -9 of js/probes/index.js + werk.js").toBeLessThanOrEqual(BUDGET);
  expect(PACKED_IDS).toEqual(PROBE_IDS);
});

test("registry exports every probe id", () => {
  expect(PROBE_IDS).toEqual(["bomberman-chain", "melodai-mixer", "theater-saalplan", "transcripator-pow", "beatguessr-years"]);
});

/* ── In the page ───────────────────────────────────────────────────────────────────────────────── */

/**
 * The shared python dev server occasionally resets connections under parallel load (seen as
 * net::ERR_CONNECTION_RESET on main.js). Reload until the Meisterstücke module is mounted.
 */
async function home(page, id = "meisterstuecke", ready = "[data-mounted]") {
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.goto("/");
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    try {
      await page.locator(`#meisterstuecke${ready}`).waitFor({ state: "attached", timeout: 6000 });
      return;
    } catch {
      /* retry */
    }
  }
  throw new Error("Meisterstücke did not mount");
}

async function toChapter(page, id) {
  await home(page, id);
  await page.locator(`#${id} .probe-stage.is-live`).waitFor();
  await page.locator(`#${id} .probe-stage`).scrollIntoViewIfNeeded();
}

test.describe("Probestücke in den Kapiteln", () => {
  test("Bomberman: keyboard play, chain readout, Tab and Esc leave the field", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await toChapter(page, "kapitel-ii");
    const screen = page.locator("#kapitel-ii .pb-screen");
    await expect(screen).toHaveAttribute("role", "application");
    await expect(screen).toHaveAttribute("aria-label", "Bomberman-Nachbau, 15 mal 13 Felder");
    await screen.focus();
    // cursor starts at H7 (7,6); (7,5) and (9,5) are in the clear middle strip
    const where = page.locator('#kapitel-ii [data-pb="where"]');
    await page.keyboard.press("ArrowUp");
    await expect(where).toHaveText("H6, frei"); // every step names the cell and what is on it
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect(page.locator('#kapitel-ii [data-pb="count"]')).toHaveText("2");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(where).toHaveText("H6, Bombe");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await expect(where).toHaveText("I7, Säule");
    await page.keyboard.press("z");
    const readout = page.locator('#kapitel-ii [data-pb="readout"]');
    await expect(readout).toContainText(/Kette: \d+/);
    await expect(page.locator('#kapitel-ii [data-pb="chain"]')).toHaveText("2");
    await expect(page.locator('#kapitel-ii [data-pb="best"]')).toHaveText("2");

    await screen.focus();
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.activeElement?.classList.contains("probe-live"))).toBe(true);

    await screen.focus();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest(".pb-screen"))).toBeNull();
    // the chip explains what this is
    await expect(page.locator("#kapitel-ii .probe-chip-row")).toContainText("im selben Tick");
    expect(errors).toEqual([]);
  });

  test("Mixer: silent until „Ton an“, two named faders, Gesang 0 → „Jetzt du.“", async ({ page }) => {
    await page.addInitScript(() => {
      window.__acCount = 0;
      for (const key of ["AudioContext", "webkitAudioContext"]) {
        const Orig = window[key];
        if (!Orig) continue;
        window[key] = new Proxy(Orig, {
          construct(target, args) {
            window.__acCount++;
            return new target(...args);
          },
        });
      }
    });
    await toChapter(page, "kapitel-iii");
    await page.waitForTimeout(1200); // the silent attract run may play meanwhile
    expect(await page.evaluate(() => window.__acCount)).toBe(0);

    const stage = page.locator("#kapitel-iii .probe-stage");
    const voc = stage.getByRole("slider", { name: "Gesang" });
    const ins = stage.getByRole("slider", { name: "Instrumental" });
    await expect(voc).toBeVisible();
    await expect(ins).toBeVisible();
    await expect(voc).toHaveAttribute("aria-valuetext", /Prozent$/);
    // the transport button says what it does next; no duplicate live region per fader
    await expect(stage.locator('[role="status"], output')).toHaveCount(0);
    const play = stage.locator('[data-pm="play"]');
    const playing = await page.locator("#kapitel-iii .probe-mixer").evaluate((r) => r.__probe.playing);
    if (playing) await play.click(); // stop the silent attract run first
    await expect(play).toHaveText("Abspielen");
    await play.click();
    await expect(play).toHaveText("Pause");
    await expect(play).not.toHaveAttribute("aria-pressed", /.*/);
    await play.click();
    await expect(play).toHaveText("Abspielen");
    await play.click();
    expect(await page.evaluate(() => window.__acCount)).toBe(0);

    await voc.fill("0");
    await expect(voc).toHaveAttribute("aria-valuetext", "0 Prozent");
    await expect(stage.getByText("Jetzt du.")).toBeVisible();

    const sound = stage.getByRole("button", { name: "Ton an" });
    await expect(sound).toHaveAttribute("aria-pressed", "false");
    await sound.click();
    await expect(sound).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => window.__acCount)).toBe(1);
    const mixer = page.locator("#kapitel-iii .probe-mixer");
    await expect.poll(() => mixer.evaluate((r) => r.__probe.audio?.state)).toBe("running");
    // stopping lets the audio thread sleep; playing wakes it again
    await play.click();
    await expect(play).toHaveText("Abspielen");
    await expect.poll(() => mixer.evaluate((r) => r.__probe.audio?.state)).toBe("suspended");
    await play.click();
    await expect.poll(() => mixer.evaluate((r) => r.__probe.audio?.state)).toBe("running");
    // scrolling the toy out of view stops it (and suspends the audio)
    await page.locator("#kontakt").scrollIntoViewIfNeeded();
    await expect.poll(() => mixer.evaluate((r) => r.__probe?.audio?.state ?? "closed")).not.toBe("running");
  });

  test("Saalplan: 68 seats, arrows + Enter pick, lone-gap warning, ticket stub, Esc/Tab leave", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.addInitScript(() => {
      window.__net = [];
      const f = window.fetch;
      window.__armNet = () => (window.fetch = (...a) => (window.__net.push(String(a[0])), f(...a)));
    });
    await toChapter(page, "kapitel-i");
    await page.evaluate(() => window.__armNet());
    const stage = page.locator("#kapitel-i .probe-stage");
    const map = stage.getByRole("group", { name: /^Saalplan/ });
    await expect(map.getByRole("button")).toHaveCount(68);
    await expect(map).toHaveAttribute("aria-label", /68 Plätze in 7 Reihen/);
    // exactly one seat is in the tab order (roving tabindex)
    await expect(map.locator('button[tabindex="0"]')).toHaveCount(1);
    await expect(stage.locator(".ps-legend")).toContainText("Frei");
    await expect(stage.locator(".ps-legend")).toContainText("Deine Auswahl");
    await expect(stage.locator(".ps-legend")).toContainText("Belegt");

    const d5 = map.getByRole("button", { name: "Reihe D, Platz 5", exact: true });
    await d5.focus();
    await page.keyboard.press("Enter"); // D5
    await expect(d5).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(map.getByRole("button", { name: "Reihe D, Platz 3", exact: true })).toBeFocused();
    await page.keyboard.press("Space"); // D3 → D4 would stay alone
    await expect(stage.locator(".ps-warn")).toBeVisible();
    await expect(stage.locator(".ps-warn")).toContainText("D4");
    await expect(stage.locator('[data-ps="count"]')).toHaveText("2");
    await expect(page.locator("#announcer-polite")).toContainText(/Reihe D, Platz 3 gewählt/);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter"); // D4 closes the gap
    await expect(stage.locator(".ps-warn")).toBeHidden();
    await page.keyboard.press("ArrowUp"); // C4
    await expect(map.getByRole("button", { name: "Reihe C, Platz 4", exact: true })).toBeFocused();

    await stage.getByRole("button", { name: "Ticket drucken" }).click();
    const stub = stage.locator(".ps-stub");
    await expect(stub).toBeVisible();
    await expect(stub).toContainText("Romeo und Julia");
    await expect(stub).toContainText("D 3, 4, 5");
    await expect(stub).toContainText("Nachbau");
    await expect(stub).toContainText("Nur Deko im QR-Look");
    await expect(stub.locator(".ps-qr")).toHaveAttribute("aria-hidden", "true");
    await expect(map.getByRole("button", { name: "Reihe D, Platz 4, belegt" })).toHaveAttribute("aria-disabled", "true");
    await expect(stage.locator('[data-ps="free"]')).toHaveText("65");

    // five is the most per booking, like „0 von 5 Plätzen“ in the original
    for (const n of [1, 2, 3, 4, 5, 6]) await map.getByRole("button", { name: `Reihe G, Platz ${n}`, exact: true }).click();
    await expect(stage.locator('[data-ps="count"]')).toHaveText("5");
    await expect(map.getByRole("button", { name: "Reihe G, Platz 6", exact: true })).toHaveAttribute("aria-pressed", "false");

    await map.getByRole("button", { name: "Reihe G, Platz 1", exact: true }).focus();
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.activeElement?.classList.contains("probe-live"))).toBe(true);
    await map.getByRole("button", { name: "Reihe G, Platz 1", exact: true }).focus();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest(".ps-map"))).toBeNull();
    await expect(page.locator("#kapitel-i .probe-chip-row")).toContainText("Nachbau");
    await expect(page.locator("#kapitel-i .probe-chip-row")).toContainText("68 Plätzen");
    expect(await page.evaluate(() => window.__net)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("Universum: folded to four, the map opens on request; every node is a working link", async ({ page }) => {
    const nodes = JSON.parse(readFileSync(new URL("../data/universe.json", import.meta.url), "utf8"));
    await page.setViewportSize({ width: 1440, height: 900 });
    await home(page, "kapitel-i");
    const map = page.locator("#kapitel-i .uv-map");
    const more = page.locator("#kapitel-i .uv-more");
    await expect(page.locator("#kapitel-i .uv-title")).toContainText(`${nodes.length} Sachen für eine Theatergruppe`);
    await expect(map).toBeHidden();
    await expect(page.locator("#kapitel-i .uv-list .uv-li-link:visible")).toHaveCount(4);
    await expect(more).toHaveText(`Alle ${nodes.length} zeigen`);
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(more).toBeFocused();
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute("role", "group");
    await expect(page.locator("#kapitel-i .uv-list")).toBeHidden();
    const svgLinks = page.locator("#kapitel-i .uv-svg a");
    await expect(svgLinks).toHaveCount(nodes.length);
    const hrefs = await svgLinks.evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    for (const n of nodes) expect(hrefs).toContain(n.projectId ? `#werk/${n.projectId}` : n.url);
    // a group of one reads singular („Spiel“, not „Spiele“)
    const counts = nodes.reduce((m, n) => ((m[n.kind] = (m[n.kind] ?? 0) + 1), m), {});
    if (counts.spiel === 1) await expect(page.locator('#kapitel-i .uv-arc-labels text[data-kind="spiel"]')).toHaveText("Spiel");
    // the svg itself is no tab stop: from the button, Tab lands on the first node
    await more.focus();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.classList.contains("uv-link"))).toBe(true);
    await page.setViewportSize({ width: 390, height: 900 });
    await expect(page.locator("#kapitel-i .uv-list")).toBeVisible();
    await expect(map).toBeHidden();
    await expect(page.locator("#kapitel-i .uv-list a")).toHaveCount(nodes.length);
  });

  test("Kapitel: Werkstattdaten carry source marks and a Punze", async ({ page }) => {
    await home(page);
    for (const id of ["kapitel-i", "kapitel-ii", "kapitel-iii"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      const sheet = page.locator(`#${id} .specsheet.is-bound`);
      await sheet.waitFor();
      const rows = sheet.locator(".spec-list > div");
      const n = await rows.count();
      for (let i = 0; i < n; i++) {
        const dt = (await rows.nth(i).locator("dt").textContent()).trim();
        if (dt === "Stand") continue;
        await expect(rows.nth(i).locator("sup a"), dt).toHaveCount(1);
      }
      const btn = page.locator(`#${id} .punze-slot .punze-button`);
      await expect(btn).toContainText(/Gepunzt · \d+ Quellen?/);
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const btn = page.locator("#kapitel-iii .punze-slot .punze-button");
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      const pop = page.locator("#kapitel-iii .punze-pop");
      await expect(pop).toContainText("Woher ich das weiß");
      await expect(pop).toContainText("Wenn was nicht stimmt, sag Bescheid.");
      await expect(page.locator("#kapitel-iii .punze-list li").first()).toContainText("geprüft am");
      // centred in the viewport like the Werkbank Punze, never pinned to the top-left corner
      const box = await pop.boundingBox();
      const vw = page.viewportSize().width;
      expect(Math.abs(box.x + box.width / 2 - vw / 2), `centred at ${width}`).toBeLessThan(2);
      expect(box.y).toBeGreaterThan(8);
      await page.keyboard.press("Escape");
      await expect(pop).toBeHidden();
    }
    // a source mark names its source and opens the Punze on its entry
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("#kapitel-ii details.specsheet > summary").click();
    const mark = page.locator("#kapitel-ii .src-mark a").first();
    await expect(mark).toHaveAttribute("aria-label", /^Quelle \d+: \S/);
    const n = Number(await mark.getAttribute("data-src")) + 1;
    await mark.click();
    await expect(page.locator("#kapitel-ii .punze-pop")).toBeVisible();
    await expect(page.locator(`#msrc-bomberman-web-${n}`)).toBeFocused();
    await page.keyboard.press("Escape");
  });

  test("Zwischenstück: 81 seconds computed from the repo timestamps", async ({ page }) => {
    const projects = JSON.parse(readFileSync(new URL("../data/projects.json", import.meta.url), "utf8"));
    const ts = ["sharex-capture-engine", "sharex-win98", "sharex-afterimage"].map((id) => Date.parse(projects.find((p) => p.id === id).repo.createdTs));
    const seconds = Math.round((Math.max(...ts) - Math.min(...ts)) / 1000);
    await home(page, "dreiwelten");
    await expect(page.locator("#dreiwelten .dreiwelten-stamp")).toHaveCount(3);
    await expect(page.locator("#dreiwelten .dreiwelten-ruler-scale")).toContainText(`${seconds} Sekunden`);
  });
});

/* ── Isolated harness: Hashsuche + destroy hygiene ─────────────────────────────────────────────── */

async function harness(page, { zeros } = {}) {
  await page.addInitScript(() => {
    const live = { intervals: new Set(), workers: new Set(), audio: new Set(), raf: 0 };
    window.__live = live;
    const si = window.setInterval.bind(window);
    const ci = window.clearInterval.bind(window);
    window.setInterval = (...a) => {
      const id = si(...a);
      live.intervals.add(id);
      return id;
    };
    window.clearInterval = (id) => {
      live.intervals.delete(id);
      ci(id);
    };
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (fn) => raf((t) => {
      live.raf++;
      fn(t);
    });
    const W = window.Worker;
    window.Worker = class extends W {
      constructor(...a) {
        super(...a);
        live.workers.add(this);
      }
      terminate() {
        live.workers.delete(this);
        super.terminate();
      }
    };
    const AC = window.AudioContext;
    if (AC) {
      window.AudioContext = class extends AC {
        constructor(...a) {
          super(...a);
          live.audio.add(this);
        }
        close() {
          live.audio.delete(this);
          return super.close();
        }
      };
    }
  });
  await page.goto("/assets/fonts/OFL-Montserrat.txt");
  await page.setContent(`<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body>
    <div id="stage" class="probe-stage" ${zeros ? `data-zeros="${zeros}"` : ""} style="width:720px"></div></body></html>`);
}

test.describe("Harness", () => {
  test("Hashsuche finds a real 00… hash and the page can recompute it", async ({ page }) => {
    await harness(page, { zeros: 2 });
    await page.evaluate(async () => {
      const { mountProbe } = await import("/js/probes/index.js");
      window.__h = await mountProbe(document.getElementById("stage"), "transcripator-pow", { chip: true });
    });
    await expect(page.locator(".probe-chip-row")).toContainText("Dein Browser rechnet gerade wirklich");
    await page.getByRole("button", { name: "Rechnen lassen" }).click();
    const result = page.locator(".ph-result[data-hash]");
    await expect(result).toBeVisible({ timeout: 15_000 });
    await expect(result).toContainText(/Gefunden nach [\d.]+ Versuchen in [\d,]+ Sekunden: 00/);
    const { hash, check } = await result.evaluate(async (el) => {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(el.dataset.challenge + el.dataset.nonce));
      return { hash: el.dataset.hash, check: [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("") };
    });
    expect(hash.startsWith("00")).toBe(true);
    expect(check).toBe(hash);
  });

  for (const id of ["bomberman-chain", "melodai-mixer", "theater-saalplan", "transcripator-pow"]) {
    test(`destroy() of ${id} leaves no timers, workers, audio or frames`, async ({ page }) => {
      await harness(page, { zeros: 6 });
      await page.evaluate(async (pid) => {
        const { mountProbe } = await import("/js/probes/index.js");
        window.__h = await mountProbe(document.getElementById("stage"), pid, {});
      }, id);
      // put each toy to work
      if (id === "bomberman-chain") {
        await page.locator(".pb-screen").focus();
        await page.keyboard.press("Space");
        await page.keyboard.press("ArrowUp");
        await page.keyboard.press("Space");
      } else if (id === "melodai-mixer") {
        await page.getByRole("button", { name: "Ton an" }).click();
        await page.waitForTimeout(300);
        expect(await page.evaluate(() => window.__live.audio.size)).toBe(1);
        expect(await page.evaluate(() => window.__live.intervals.size)).toBeGreaterThan(0);
      } else if (id === "transcripator-pow") {
        await page.getByRole("button", { name: "Rechnen lassen" }).click();
        await page.waitForTimeout(200);
        expect(await page.evaluate(() => window.__live.workers.size)).toBe(1);
      } else {
        await page.getByRole("button", { name: "Reihe D, Platz 5", exact: true }).click();
        await page.getByRole("button", { name: "Reihe D, Platz 6", exact: true }).click();
        await page.getByRole("button", { name: "Ticket drucken" }).click();
        await expect(page.locator(".ps-stub")).toBeVisible();
      }
      await page.waitForTimeout(200);
      const ok = await page.evaluate(() => window.__h.destroy());
      expect(ok).toBe(true);
      await page.waitForTimeout(150);
      const before = await page.evaluate(() => window.__live.raf);
      await page.waitForTimeout(400);
      const after = await page.evaluate(() => ({ ...window.__live, intervals: window.__live.intervals.size, workers: window.__live.workers.size, audio: window.__live.audio.size }));
      expect(after.intervals).toBe(0);
      expect(after.workers).toBe(0);
      expect(after.audio).toBe(0);
      expect(after.raf - before).toBe(0);
      // the static fallback comes back
      await expect(page.locator("#stage")).not.toHaveClass(/is-live/);
    });
  }
});

/* ── Fix round 2: focus, Escape, reserved sizes, phone folds ──────────────────────────────────── */

test.describe("Fokus und Maße", () => {
  test("Saalplan: „Ticket drucken“ and „Auswahl leeren“ never drop focus to <body>", async ({ page }) => {
    await harness(page);
    await page.evaluate(async () => {
      const { mountProbe } = await import("/js/probes/index.js");
      window.__h = await mountProbe(document.getElementById("stage"), "theater-saalplan", {});
    });
    const seat = (n) => page.getByRole("button", { name: `Reihe D, Platz ${n}`, exact: true });
    await seat(5).click();
    const print = page.getByRole("button", { name: "Ticket drucken" });
    await print.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".ps-stub")).toBeFocused();
    await seat(7).click();
    const clear = page.getByRole("button", { name: "Auswahl leeren" });
    await clear.focus();
    await page.keyboard.press("Enter");
    await expect(seat(7)).toBeFocused();
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  });

  test("Hashsuche: focus hops to „Abbrechen“ and back instead of dropping", async ({ page }) => {
    await harness(page, { zeros: 2 });
    await page.evaluate(async () => {
      const { mountProbe } = await import("/js/probes/index.js");
      window.__h = await mountProbe(document.getElementById("stage"), "transcripator-pow", {});
    });
    await page.getByRole("button", { name: "Rechnen lassen" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-ph="result"][data-hash]')).toBeVisible({ timeout: 15_000 });
    // busy → „Abbrechen“ held focus; done → back on „Noch mal“ (the same go button)
    await expect(page.locator('[data-ph="go"]')).toBeFocused();
  });

  test("Werkbank: Escape leaves the mixer, the next Escape closes the dialog", async ({ page }) => {
    await page.goto("/#werk/melodai");
    await page.locator("#werkbank[open]").waitFor();
    const play = page.locator('#werkbank [data-pm="play"]');
    await play.scrollIntoViewIfNeeded();
    await play.waitFor();
    await play.focus();
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.activeElement?.classList.contains("probe-mixer"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.locator("#werkbank")).not.toHaveAttribute("open", "");
  });

  for (const width of [390, 1440]) {
    test(`stages and the universe keep their size when the section mounts (${width} px)`, async ({ browser }) => {
      const measure = async (block) => {
        const ctx = await browser.newContext({ viewport: { width, height: 900 } });
        await ctx.route(/^https?:\/\/(?!127\.0\.0\.1[:/]|localhost[:/])/, (r) => r.abort());
        await ctx.route(block ? /sections\/(meister|film)\.js/ : /sections\/film\.js/, (r) => r.abort());
        const page = await ctx.newPage();
        await page.goto("/#kapitel-i");
        if (!block) await page.locator("#meisterstuecke[data-mounted]").waitFor({ state: "attached" });
        await page.waitForFunction(() => [...document.styleSheets].some((s) => /meister\.css/.test(s.href ?? "")));
        await page.waitForTimeout(block ? 800 : 1500);
        const h = await page.evaluate(() => ["#kapitel-i", "#kapitel-ii", "#dreiwelten", "#kapitel-iii"].map((s) => document.querySelector(s).getBoundingClientRect().height));
        await ctx.close();
        return h;
      };
      const before = await measure(true);
      const after = await measure(false);
      before.forEach((b, i) => expect(Math.abs(after[i] - b), `section ${i}: ${b} → ${after[i]}`).toBeLessThan(48));
    });
  }

  test("Werkstattdaten folded, universe preview of four, story behind „Weiterlesen“", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await home(page, "kapitel-i");
    const sheet = page.locator("#kapitel-i details.specsheet");
    await expect(sheet).not.toHaveAttribute("open", "");
    await expect(sheet.locator("summary")).toContainText(/Werkstattdaten · Stand \d\d\.\d\d\.\d{4}/);
    await expect(sheet.locator(".spec-list")).toBeHidden();
    await sheet.locator("summary").click();
    await expect(sheet.locator(".spec-list")).toBeVisible();

    const list = page.locator("#kapitel-i .uv-list");
    await expect(list.locator(".uv-li-link:visible")).toHaveCount(4);
    const more = page.locator("#kapitel-i .uv-more");
    await expect(more).toHaveText(/^Alle \d+ zeigen$/);
    await more.click();
    await expect(more).toHaveText("Weniger zeigen");
    await expect(more).toHaveAttribute("aria-expanded", "true");
    const total = JSON.parse(readFileSync(new URL("../data/universe.json", import.meta.url), "utf8")).length;
    await expect(list.locator(".uv-li-link:visible")).toHaveCount(total);

    const story = page.locator("#kapitel-i .chapter-story > p");
    await expect(story.nth(2)).toBeHidden();
    await page.locator("#kapitel-i .story-more").click();
    await expect(story.nth(2)).toBeVisible();

    // wide screens fold the same way: one click, never a forced-open table
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(sheet).toHaveAttribute("open", "");
    await sheet.locator("summary").click();
    await expect(sheet.locator(".spec-list")).toBeHidden();
    await expect(page.locator("#kapitel-i .story-more")).toBeVisible();
    await expect(page.locator("#kapitel-ii .chapter-story .rivets")).toBeHidden();
    // Kapitel III: the pipeline stands under the mixer on wide screens, behind „Weiterlesen“ below 1024 px
    await expect(page.locator("#kapitel-iii .pipeline")).toBeVisible();
    await expect(page.locator("#kapitel-iii .story-more")).toBeHidden();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("#kapitel-iii .pipeline")).toBeHidden();
    await page.locator("#kapitel-iii .story-more").click();
    await expect(page.locator("#kapitel-iii .pipeline")).toBeVisible();
  });

  test("Kapitel I: one „Stand“, no repeated booking box; the facts follow the story", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await home(page, "kapitel-i");
    await expect(page.locator("#kapitel-i")).not.toContainText("Gebucht wird gerade");
    await expect(page.locator("#kapitel-i .spec-list dt", { hasText: /^Stand$/ })).toHaveCount(0);
    // reading order = tab order: story, then the facts, then the universe (never below and back up)
    const order = await page.evaluate(() => {
      const ch = document.querySelector("#kapitel-i");
      const pos = (sel) => [...ch.querySelectorAll("*")].indexOf(ch.querySelector(sel));
      return [pos(".chapter-story"), pos(".chapter-facts"), pos(".universe")];
    });
    expect(order[0]).toBeLessThan(order[1]);
    expect(order[1]).toBeLessThan(order[2]);
  });

  test("Kapitel III: the pipeline heats 05–06 while the mixer plays", async ({ page }) => {
    await toChapter(page, "kapitel-iii");
    const hot = page.locator("#kapitel-iii .pipeline > li.is-hot");
    const play = page.locator('#kapitel-iii [data-pm="play"]');
    await page.waitForTimeout(300);
    // the one-time silent attract run may already be playing
    if ((await play.textContent()).includes("Abspielen")) await play.click();
    await expect(play).toContainText("Pause");
    await expect(hot).toHaveCount(2);
    await expect(hot.first()).toContainText("Zeilen bauen");
    await page.locator('#kapitel-iii [data-pm="play"]').click();
    await expect(hot).toHaveCount(0);
  });
});
