/**
 * Das Lager + Noch warm  [WP2]  (spec §2.2, §2.4, §5.3, §5.5, §7.3)
 * Expected values are computed from the data files with the same pure functions the page uses,
 * so a data refresh keeps this green.
 */
import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { filterProjects, sortProjects } from "../js/lib/search.js";
import { warmList } from "../js/sections/warm.js";
import { parseState, stateQuery, countText } from "../js/sections/lager.js";
import { THUMBS } from "../js/render/thumbs.js";

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const PROJECTS = read("data/projects.json");
const TOTAL = PROJECTS.length;
const FILMS = new Map(read("data/films.json").map((f) => [f.id, f]));
const DETAILS = new Map(
  readdirSync(new URL("../data/details/", import.meta.url))
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const d = read(`data/details/${f}`);
      return [d.id, d];
    }),
);
const BATCH = 12;

async function ready(page, url = "/") {
  const log = [];
  page.on("console", (m) => m.type() !== "log" && log.push(`${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => log.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => log.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
  test.info().annotations.push({ type: "log", description: "" });
  page.once("close", () => {});
  globalThis.__lagerLog = log;
  await page.goto(url);
  try {
    await expect(page.locator("#lager")).toHaveAttribute("data-state", "ready", { timeout: 20000 });
  } catch (error) {
    console.log("LAGER NOT READY", log.filter((l) => !/cloudflare|WebGL|rum/.test(l)).join("\n"));
    throw error;
  }
}
const ids = (page, sel = "#projects-container .project-link") => page.locator(sel).evaluateAll((els) => els.map((e) => e.dataset.projectId));

test("URL round-trip: ?g=film&q=ski&s=neu&v=liste survives a reload", async ({ page }) => {
  const expected = sortProjects(filterProjects(PROJECTS, "film", "ski", { details: DETAILS, films: FILMS }), "neu", { films: FILMS, order: PROJECTS }).map((p) => p.id);
  expect(expected.length).toBeGreaterThan(1);
  await ready(page, "/?g=film&q=ski&s=neu&v=liste");
  for (const round of [1, 2]) {
    await expect(page.getByRole("searchbox", { name: "Projekte durchsuchen" })).toHaveValue("ski");
    await expect(page.getByRole("button", { name: "Film", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#sort")).toHaveValue("neu");
    await expect(page.locator('#lager [data-view="liste"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#projects-container table.lager-table")).toBeVisible();
    await expect(page.locator("#projects-container caption")).toHaveText("Alle Projekte als Liste");
    await expect(page.locator(".lager-table th[aria-sort]")).toHaveText(/Zuletzt dran/);
    await expect(page.locator(".lager-table th[aria-sort]")).toHaveAttribute("aria-sort", "descending");
    expect(await ids(page)).toEqual(expected);
    await expect(page.locator("#project-count")).toHaveText(`${expected.length} Projekte`);
    await expect(page.locator("#load-more")).toBeHidden();
    if (round === 1) await page.reload();
  }
  const url = new URL(page.url());
  expect(Object.fromEntries(url.searchParams)).toEqual({ g: "film", q: "ski", s: "neu", v: "liste" });
});

test("state helpers: defaults are omitted, junk falls back", () => {
  expect(parseState("?g=nope&s=zz&v=x&q=abc")).toEqual({ g: "all", q: "abc", s: "lager", v: "regal" });
  expect(stateQuery({ g: "all", q: " ", s: "lager", v: "regal" })).toBe("");
  expect(stateQuery({ g: "games", q: "kniffel", s: "neu", v: "liste" }, "?poster")).toBe("?poster=&g=games&q=kniffel&s=neu&v=liste");
});

test("sort options change the order; list headers sort with aria-sort", async ({ page }) => {
  await ready(page);
  const order = (s) => sortProjects(PROJECTS, s, { films: FILMS, order: PROJECTS }).slice(0, BATCH).map((p) => p.id);
  expect(await ids(page)).toEqual(PROJECTS.slice(0, BATCH).map((p) => p.id));
  for (const s of ["az", "alt", "neu", "lager"]) {
    await page.locator("#sort").selectOption(s);
    await expect.poll(() => ids(page)).toEqual(order(s));
    expect(new URL(page.url()).searchParams.get("s")).toBe(s === "lager" ? null : s);
  }
  await page.locator('#lager [data-view="liste"]').click();
  await expect(page.locator(".lager-table tbody tr")).toHaveCount(TOTAL);
  await expect(page.locator(".lager-table th[aria-sort]")).toHaveCount(0);
  await page.locator(".lager-table").getByRole("button", { name: /Jahr/ }).click();
  await expect(page.locator(".lager-table th[aria-sort]")).toHaveText(/Jahr/);
  await expect(page.locator(".lager-table th[aria-sort]")).toHaveAttribute("aria-sort", "ascending");
  await expect(page.locator("#sort")).toHaveValue("alt");
  expect((await ids(page)).slice(0, BATCH)).toEqual(order("alt"));
  await page.locator(".lager-table").getByRole("button", { name: /Projekt/ }).click();
  await expect(page.locator(".lager-table th[aria-sort]")).toHaveText(/Projekt/);
  expect((await ids(page)).slice(0, BATCH)).toEqual(order("az"));
  // Every row carries the project link.
  await expect(page.locator(".lager-table tbody tr .project-link")).toHaveCount(TOTAL);
});

test("„/“ focuses the search (not while typing elsewhere); Esc clears it", async ({ page }) => {
  await ready(page);
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("/");
  await expect(page.locator("#project-search")).toBeFocused();
  await page.keyboard.type("kniffel");
  await expect(page.locator("#projects-container .project-card")).toHaveCount(filterProjects(PROJECTS, "all", "kniffel", { details: DETAILS }).length);
  await expect(page.locator("#projects-container mark").first()).toHaveText(/kniffel/i);
  await page.keyboard.press("Escape");
  await expect(page.locator("#project-search")).toHaveValue("");
  await expect(page.locator("#project-count")).toHaveText(`${Math.min(BATCH, TOTAL)} von ${TOTAL} Projekten`);
  // In another text field, „/“ is just a character.
  await page.evaluate(() => {
    const input = document.createElement("input");
    input.id = "other-field";
    document.body.prepend(input);
  });
  await page.locator("#other-field").focus();
  await page.keyboard.press("/");
  await expect(page.locator("#other-field")).toBeFocused();
  await expect(page.locator("#other-field")).toHaveValue("/");
});

test("chip counts follow the query; a zero chip is aria-disabled but focusable", async ({ page }) => {
  await ready(page);
  const count = (g, q) => filterProjects(PROJECTS, g, q, { details: DETAILS }).length;
  for (const g of ["web", "games", "ai", "film"])
    await expect(page.locator(`[data-filter="${g}"] .chip-count`)).toHaveText(String(count(g, "")));
  await page.getByRole("searchbox").fill("Infected");
  await expect(page.locator('[data-filter="film"] .chip-count')).toHaveText(String(count("film", "Infected")));
  await expect(page.locator('[data-filter="games"] .chip-count')).toHaveText("0");
  await expect(page.locator('[data-filter="games"]')).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator('[data-filter="film"]')).not.toHaveAttribute("aria-disabled", /.*/);
  await page.locator('[data-filter="games"]').focus();
  await expect(page.locator('[data-filter="games"]')).toBeFocused();
  await expect(page.locator("#lager [data-filter=\"all\"]")).toHaveAccessibleName(`Alle ${count("all", "Infected")}`);
});

test("normalisation: kolping, oilberts, umlaut and ae/oe/ue folding", async ({ page }) => {
  // Pure fixture first (§3.13 normalize on both sides).
  const fixture = [{ id: "x", title: "Übersee-Brücke", category: "Test", description: "", tags: [], groups: ["web"] }];
  for (const q of ["ubersee", "uebersee", "ÜBERSEE", "brucke", "bruecke"]) expect(filterProjects(fixture, "all", q).map((p) => p.id), q).toEqual(["x"]);
  await ready(page);
  const search = page.getByRole("searchbox");
  for (const [q, id] of [
    ["kolping", "theater-website"],
    ["oilberts", "oilbert"],
    ["Oilbert’s", "oilbert"],
  ]) {
    await search.fill(q);
    await expect(page.locator(`#projects-container [data-project-id="${id}"]`)).toHaveCount(1);
  }
  // Real data with an umlaut: whatever project mentions „Tägliche“, „taegliche“ and „tagliche“ find the same set.
  const withUmlaut = filterProjects(PROJECTS, "all", "Tägliche").map((p) => p.id);
  test.skip(!withUmlaut.length, "no project mentions „Tägliche“ in this data");
  for (const q of ["taegliche", "tagliche", "TÄGLICHE"]) {
    await search.fill(q);
    await expect.poll(() => ids(page)).toEqual(withUmlaut.slice(0, BATCH));
  }
});

test("lmf:filter (Werkzeugwand / stack chips) sets the query, updates the URL and announces the count", async ({ page }) => {
  await ready(page);
  const tool = "Three.js";
  const expected = filterProjects(PROJECTS, "all", tool, { details: DETAILS }).length;
  expect(expected).toBeGreaterThan(0);
  await page.evaluate((q) => document.dispatchEvent(new CustomEvent("lmf:filter", { detail: { q } })), tool);
  await expect(page.getByRole("searchbox")).toHaveValue(tool);
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe(tool);
  await expect(page.locator("#project-count")).toHaveText(countText(Math.min(BATCH, expected), expected));
  await expect(page.locator("#project-count")).toHaveAttribute("role", "status");
  await expect(page.locator("#lager [data-filter=\"all\"]")).toHaveAttribute("aria-pressed", "true");
});

test("plates: link, h3, stamp row, glow, Rohling and the no-JS list is hidden", async ({ page }) => {
  await ready(page);
  await expect(page.locator("#lager-static")).toBeHidden();
  while (await page.locator("#load-more").isVisible()) await page.locator("#load-more").click();
  const cards = page.locator("#projects-container .project-card");
  await expect(cards).toHaveCount(TOTAL);
  for (const p of PROJECTS) {
    const card = page.locator(`#projects-container .project-card[data-id="${p.id}"]`);
    // Titles split at „ · “ (sub line) and carry soft hyphens; the text itself is unchanged.
    expect((await card.locator("a.project-link h3").textContent()).replace(/\u00AD/g, "").replace(/\s+/g, " ").trim()).toBe(p.title);
    // Named by the title (no aria-label: browse mode still reads the plate), described by its content.
    const link = card.locator("a.project-link");
    await expect(link).not.toHaveAttribute("aria-label", /.*/);
    await expect(link).toHaveAccessibleName(new RegExp(`^${p.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*\\(Werkstück öffnen\\)$`));
    const summary = p.summary || p.description;
    if (summary) await expect(link).toHaveAccessibleDescription(new RegExp(summary.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    if (p.image) {
      // Plates load a small thumbnail (srcset) when one exists, never the full-size original.
      const img = card.locator(".plate-media img");
      const widths = THUMBS[p.image] ?? [];
      const base = p.image.split("/").pop().replace(/\.webp$/, "");
      if (widths.length) {
        await expect(img).toHaveAttribute("src", `assets/img/thumbs/${base}-${widths.at(-1)}.webp`);
        await expect(img).toHaveAttribute("srcset", new RegExp(`thumbs/${base}-${widths[0]}\\.webp ${widths[0]}w`));
        await expect(img).toHaveAttribute("sizes", /.+/);
      } else await expect(img).toHaveAttribute("src", p.image);
      await expect(img).toHaveAttribute("alt", "");
    }
    // No screenshot: a Rohling, or the project's own strip (Codex widget) on a dark stage.
    else if (await card.locator(".plate-media--strip").count()) await expect(card.locator(".plate-media--strip img")).toHaveAttribute("alt", "");
    else await expect(card.locator(".rohling")).toHaveAttribute("aria-hidden", "true");
    if (p.archived) {
      await expect(card).toHaveAttribute("data-glow", "ausgemustert");
      await expect(card.locator(".plate-stamps")).toContainText("ausgemustert");
    }
  }
  // Only fields that exist, and no star counts on the shelf at all.
  await expect(page.locator("#projects-container .plate-star, #projects-container .stamp--stars")).toHaveCount(0);
});

test("Noch warm: 8 plates by last push, rail buttons scroll, end tile links to the Lager", async ({ page }) => {
  await page.goto("/");
  const rail = page.getByRole("region", { name: "Zuletzt bearbeitet" });
  await expect(rail).toHaveAttribute("tabindex", "0");
  const expected = warmList(PROJECTS).map((p) => p.id);
  await expect(page.locator("#warm .plate")).toHaveCount(Math.min(8, expected.length));
  expect(await ids(page, "#warm .project-link")).toEqual(expected);
  // the section title says „Noch warm“; each plate only shows how hot it is (no date, no stars)
  for (const stamps of await page.locator("#warm .plate .plate-stamps").allInnerTexts()) expect(stamps.trim()).toMatch(/^(glüht|warm|abgekühlt)$/i);
  await expect(page.locator("#warm")).not.toContainText(/zuletzt dran/i);
  await expect(page.locator("#warm .warm-end")).toHaveAttribute("href", "#lager");
  await rail.scrollIntoViewIfNeeded();
  const before = await rail.evaluate((el) => el.scrollLeft);
  expect(before).toBe(0);
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
  await page.getByRole("button", { name: "Zurück", exact: true }).click();
  await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBeLessThan(10);
});

test("count text: plural, singular and nothing found", () => {
  expect(countText(12, 43)).toBe("12 von 43 Projekten");
  expect(countText(43, 43, { all: true })).toBe("Alle 43 Projekte");
  expect(countText(4, 4)).toBe("4 Projekte");
  expect(countText(1, 1)).toBe("1 Projekt");
  expect(countText(0, 0)).toBe("Nichts gefunden");
});

test("no horizontal overflow from the Lager at small widths in list view", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await ready(page, "/?v=liste");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 800 });
  await ready(page, "/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("short queries match word starts only („Öl“ does not hit Kolping or Soleil)", () => {
  const fixture = [
    { id: "a", title: "Kolpingtheater", category: "", description: "Portes du Soleil", tags: [], groups: ["web"] },
    { id: "b", title: "Öl-Wechsel", category: "", description: "", tags: ["three.js"], groups: ["web"] },
    { id: "c", title: "KI-Werkstatt", category: "", description: "", tags: [], groups: ["ai"] },
  ];
  expect(filterProjects(fixture, "all", "Öl").map((p) => p.id)).toEqual(["b"]);
  expect(filterProjects(fixture, "all", "oel").map((p) => p.id)).toEqual(["b"]);
  expect(filterProjects(fixture, "all", "js").map((p) => p.id)).toEqual(["b"]);
  expect(filterProjects(fixture, "all", "ki").map((p) => p.id)).toEqual(["c"]);
  // Longer tokens still match inside words.
  expect(filterProjects(fixture, "all", "oleil").map((p) => p.id)).toEqual(["a"]);
});

test("no „Stand“ stamp over the plates; Film chip says what it counts; Liste shows one kind of fact", async ({ page }) => {
  await ready(page);
  // The Lager is a shelf, not a report: the as-of date lives once, in the Esse caption.
  await expect(page.locator("#lager .lager-stand")).toHaveCount(0);
  expect(await page.locator("#lager .lager-meta").innerText()).not.toMatch(/\bStand\b/);
  const filmIds = new Set(FILMS.keys());
  const extra = PROJECTS.filter((p) => p.groups.includes("film") && !filmIds.has(p.id));
  const chip = page.locator('#lager [data-filter="film"]');
  const note = page.locator("#lager .lager-film-note");
  await expect(note).toBeHidden();
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  if (extra.length) {
    await expect(note).toBeVisible();
    await expect(note).toContainText(`${filmIds.size} Filme`);
    for (const p of extra) await expect(note).toContainText(p.title);
    await expect(chip).toHaveAttribute("title", /Filme/);
    await expect(chip).toHaveAccessibleDescription(/Filme/);
  }
  await ready(page, "/?v=liste");
  await expect(page.locator(".lager-table thead")).toContainText("Sprache");
  const film = PROJECTS.find((p) => FILMS.get(p.id)?.duration);
  if (film) await expect(page.locator(`.lager-row[data-id="${film.id}"] .lt-stack`)).toHaveText("");
  const theater = PROJECTS.find((p) => p.id === "theater-website");
  if (theater) await expect(page.locator(`.lager-row[data-id="theater-website"] .lt-stack`)).toHaveText("TypeScript");
});

test("forced colours: filter chips use system colours, the pressed one Highlight", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", colorScheme: "dark" });
  await ready(page);
  await page.locator('#lager [data-filter="games"]').click();
  await expect(page.locator('#lager [data-filter="games"]')).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(300);
  const colours = await page.evaluate(() => {
    const probe = (v) => {
      const d = document.createElement("div");
      d.style.cssText = `color:${v}`;
      document.body.append(d);
      const c = getComputedStyle(d).color;
      d.remove();
      return c;
    };
    const pressed = getComputedStyle(document.querySelector('#lager [data-filter="games"]'));
    const other = getComputedStyle(document.querySelector('#lager [data-filter="web"]'));
    return { pressedBg: pressed.backgroundColor, highlight: probe("Highlight"), otherBorder: other.borderTopColor, buttonText: probe("ButtonText") };
  });
  expect(colours.pressedBg).toBe(colours.highlight);
  expect(colours.otherBorder).toBe(colours.buttonText);
});

test.describe("phones (390 × 844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("compact plates keep the Lager short: two columns, #lager ≤ 3,400 px", async ({ page }) => {
    await ready(page);
    await page.evaluate(() => document.fonts.ready);
    const cols = await page.locator("#projects-container").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(cols).toBe(2);
    const h = await page.locator("#lager").evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThanOrEqual(3400);
    // Nothing spills out of a compact plate.
    const spill = await page.locator("#projects-container .plate").evaluateAll((plates) =>
      plates.flatMap((p) => {
        const r = p.getBoundingClientRect();
        return [...p.querySelectorAll(".plate-top *, .plate-title, .plate-stamps li")]
          .filter((c) => c.getClientRects().length && c.getBoundingClientRect().right > r.right + 0.5)
          .map((c) => `${p.dataset.id}: ${c.className}`);
      }),
    );
    expect(spill).toEqual([]);
  });

  test("„/“ from the top lands the search field inside the viewport", async ({ page }) => {
    await ready(page);
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("/");
    await expect(page.locator("#project-search")).toBeFocused();
    await page.waitForTimeout(2000);
    const r = await page.locator("#project-search").evaluate((el) => el.getBoundingClientRect().toJSON());
    expect(r.top).toBeGreaterThanOrEqual(0);
    expect(r.bottom).toBeLessThanOrEqual(844);
  });
});

test("short viewports (200–400 % zoom): the search is not sticky", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  await ready(page);
  await expect(page.locator("#lager .search")).toHaveCSS("position", "static");
});

test("boot is silent: #project-count only turns live after its first render; no details fetched for off-screen plates", async ({ page }) => {
  const details = [];
  page.on("request", (r) => /\/data\/details\//.test(r.url()) && details.push(r.url()));
  await page.addInitScript(() => {
    window.__countLog = [];
    new MutationObserver((records) => {
      const el = document.getElementById("project-count");
      for (const r of records) {
        if (!el || !(r.target === el || el.contains(r.target))) continue;
        window.__countLog.push(r.type === "attributes" ? { attr: r.attributeName, old: r.oldValue } : { text: el.textContent });
      }
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-live"], attributeOldValue: true });
  });
  await ready(page);
  await page.waitForTimeout(1500);
  const log = await page.evaluate(() => window.__countLog);
  // The region starts muted; once it turns live (first attribute change), boot never touches it again.
  const unmute = log.findIndex((e) => e.attr === "aria-live" && e.old === "off");
  expect(unmute).toBeGreaterThan(0);
  expect(log.slice(0, unmute).some((e) => e.text)).toBe(true);
  expect(log.slice(unmute + 1).filter((e) => e.text)).toEqual([]);
  await expect(page.locator("#project-count")).not.toHaveAttribute("aria-live", /.*/);
  // Plates without a screenshot ask for their strip only once they come near the viewport
  // (other sections, e.g. the chapters, may load their own details).
  const blanks = PROJECTS.filter((p) => !p.image && p.details).map((p) => `/data/details/${p.id}.json`);
  expect(details.filter((u) => blanks.some((b) => u.endsWith(b)))).toEqual([]);
});
