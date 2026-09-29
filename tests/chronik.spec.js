/**
 * WP5 · Schichtbuch (Zeitraffer + Liste), Werkstatt (Werkzeugwand, Zunft, Abspann),
 * Abseits (Nachtuhr) and Kontakt. Spec §2.6–§2.9, §6.4, §7.3.
 * Every expected number is computed from the data files here, never hard-coded.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { reposByYear, nights, photoNames } from "../js/lib/derive.js";
import { loadDataFs } from "../scripts/lib/node-data.mjs";
import { gzipSync } from "node:zlib";
import { wallTools } from "../js/sections/werkstatt.js";
import { TOOLS } from "../js/render/tools.js";
import { pack as packZr, OUT as ZR_PACK, BUDGET as ZR_BUDGET, CEILING as ZR_CEILING } from "../scripts/pack-zr.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const REPOS = read("data/repos.json").repos;
const SNAPSHOT = read("data/snapshot.json");
const MILESTONES = read("data/milestones.json");
const SOCIALS = read("data/socials.json");
const ALLOW = new Set(Object.keys(read("scripts/repo-allowlist.json").repos));
const IMAGES = read("gallery/assets/data/images.json");
const BY_YEAR = reposByYear(REPOS);

/**
 * Scrolls a lazy section into view and waits until main.js mounted it. The local dev server
 * (python http.server, listen backlog 5) sometimes resets connections when several suites run
 * in parallel; a failed dynamic import is not retried by the page, so the test reloads once.
 */
async function mounted(page, selector) {
  const el = page.locator(selector);
  for (let attempt = 0; ; attempt++) {
    await el.scrollIntoViewIfNeeded();
    try {
      await expect(el).toHaveAttribute("data-mounted", "", { timeout: 8000 });
      return el;
    } catch (error) {
      if (attempt >= 2) throw error;
      await page.reload();
    }
  }
}

function trackErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test.describe("Schichtbuch", () => {
  test("1440: Zeitraffer is the default; per-year counts and total match the data", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    await expect(page.locator('[data-zr-view="zeitraffer"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#schichtbuch .zr")).toBeVisible();
    await expect(page.locator("#schichtbuch .schichtbuch-list")).toBeHidden();

    const years = await page.locator(".zr-year").evaluateAll((els) => els.map((e) => [+e.dataset.year, +e.dataset.count, e.textContent.replace(/\s+/g, " ").trim()]));
    for (const [year, count, label] of years) {
      expect(count, `count ${year}`).toBe(BY_YEAR[year] ?? 0);
      // the ruler shows just the year; the heat bar carries the volume (no „· 62“)
      expect(label).toBe(`${year}`);
    }
    for (const y of Object.keys(BY_YEAR)) expect(years.some(([year]) => year === +y), `year ${y} on the ruler`).toBe(true);
    await expect(page.locator(".zr-clip[data-repo]")).toHaveCount(SNAPSHOT.github.ownPublicRepos);
    expect(REPOS.length).toBe(SNAPSHOT.github.ownPublicRepos);
    expect(errors).toEqual([]);
  });

  test("Zeitraffer opens at the Stand and its readout never passes it (1440 and 390)", async ({ page }) => {
    const asOf = SNAPSHOT.asOf ?? SNAPSHOT.github?.asOf;
    // the readout is just the year under the playhead: no „n von N Repos bis hier“ counter
    const stand = asOf.slice(0, 4);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await mounted(page, "#schichtbuch");
      if (width < 1024) await page.locator('[data-zr-view="zeitraffer"]').click();
      const scroller = page.locator(".zr-scroll");
      await expect(page.locator(".zr-readout")).toHaveText(stand);
      expect(await scroller.evaluate((s) => s.scrollWidth - s.clientWidth - s.scrollLeft)).toBeLessThanOrEqual(2);
      await scroller.evaluate((s) => (s.scrollLeft = 0));
      await expect(page.locator(".zr-readout")).not.toHaveText(stand);
      await scroller.evaluate((s) => (s.scrollLeft = s.scrollWidth));
      await expect(page.locator(".zr-readout")).toHaveText(stand);
    }
  });

  test("Zeitraffer: a hover tooltip closes with Escape while focus is elsewhere (1.4.13)", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    await page.locator(".zr-flag").last().hover();
    await expect(page.locator("#zr-tip")).toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.closest(".zr-scroll"))).toBeNull();
    await page.keyboard.press("Escape");
    await expect(page.locator("#zr-tip")).toBeHidden();
  });

  test("„Zeitraffer abspielen“ scrolls the timeline and stops on the second press", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    const scroller = page.locator(".zr-scroll");
    await scroller.evaluate((s) => (s.scrollLeft = 0));
    await page.locator(".zr-play").click();
    await expect(page.locator(".zr-play")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => scroller.evaluate((s) => s.scrollLeft)).toBeGreaterThan(50);
    await page.locator(".zr-play").click();
    await expect(page.locator(".zr-play")).toHaveAttribute("aria-pressed", "false");
    const a = await scroller.evaluate((s) => s.scrollLeft);
    await page.waitForTimeout(400);
    expect(await scroller.evaluate((s) => s.scrollLeft)).toBe(a);
  });

  test("375: the list is the default and the switch shows the Zeitraffer", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    await expect(page.locator('[data-zr-view="liste"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#schichtbuch .sb-log")).toBeVisible();
    await expect(page.locator("#schichtbuch [data-mount='zeitraffer']")).toBeHidden();
    await page.locator('[data-zr-view="zeitraffer"]').click();
    await expect(page.locator("#schichtbuch .zr")).toBeVisible();
    await expect(page.locator("#schichtbuch .sb-log")).toBeHidden();
    // The timeline scrolls inside its own region; the panel itself must fit the viewport.
    const right = await page.locator("#schichtbuch .zr").evaluate((el) => el.getBoundingClientRect().right);
    expect(right).toBeLessThanOrEqual(375);
  });

  test("reduced motion: list by default, no play button", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    await expect(page.locator('[data-zr-view="liste"]')).toHaveAttribute("aria-pressed", "true");
    await page.locator('[data-zr-view="zeitraffer"]').click();
    await expect(page.locator(".zr-play")).toBeHidden();
    await ctx.close();
  });

  test("list view: per-year blocks match reposByYear; milestones read as a story, not as citations", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    const blocks = await page.locator(".sb-year").evaluateAll((els) =>
      els.map((e) => [+e.dataset.year, +e.dataset.count, e.querySelector(".sb-year-count")?.textContent ?? "", e.querySelectorAll("table, details.sb-repos").length]),
    );
    for (const [year, count, label, ledgers] of blocks) {
      expect(count).toBe(BY_YEAR[year] ?? 0);
      // a quiet count from two up („25 Repos“), never „0 Repos“ or „1 Repo“, and no per-repo ledger
      expect(label).toBe(count >= 2 ? `${count} Repos` : "");
      expect(ledgers, `${year}: no repo table`).toBe(0);
    }
    await expect(page.locator("#schichtbuch")).not.toContainText(/Repos zeigen|öffentliches Repo\s*·|Öffentliche Repos, angelegt/);
    // the one milestone that names a first repo is a story beat, not a ledger row
    await expect(page.locator(".sb-log")).toContainText("Erstes öffentliches Repo: BetterDiscordThemes.");
    const items = page.locator(".sb-log .ms");
    await expect(items).toHaveCount(MILESTONES.length);
    // No „Quelle:“ lines; a milestone links at most its own text (a video, a playlist, a repo).
    await expect(page.locator(".sb-log")).not.toContainText("Quelle");
    await expect(page.locator(".sb-log .ms-sources, .sb-log a.ms-src")).toHaveCount(0);
    for (const hrefs of await items.evaluateAll((els) => els.map((li) => [...li.querySelectorAll("a")].map((a) => a.href)))) {
      expect(hrefs.length).toBeLessThanOrEqual(1);
      for (const h of hrefs) expect(h).toMatch(/^https:\/\/(www\.youtube\.com|youtu\.be|github\.com)\//);
    }
    // No unfilled {binding} tokens in milestone copy.
    await expect(page.locator(".sb-log")).not.toContainText("{");
  });

  test("Zeitraffer: one roving tab stop, arrows move through time and lanes", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    const stops = page.locator('.zr [data-zr-item][tabindex="0"]');
    await expect(stops).toHaveCount(1);
    await stops.first().focus();
    const x0 = await page.evaluate(() => +document.activeElement.dataset.x);
    await page.keyboard.press("ArrowRight");
    const after = await page.evaluate(() => ({ x: +document.activeElement.dataset.x, item: document.activeElement.hasAttribute("data-zr-item") }));
    expect(after.item).toBe(true);
    expect(after.x).toBeGreaterThanOrEqual(x0);
    await expect(stops).toHaveCount(1);
    await expect(page.locator("#zr-tip")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    const lane = await page.evaluate(() => document.activeElement.closest(".zr-lane")?.dataset.lane);
    expect(lane).toBe("Portfolio");
    await page.keyboard.press("End");
    const last = await page.evaluate(() => document.activeElement.dataset.x);
    const max = await page.locator('.zr-lane[data-lane="Portfolio"] [data-zr-item]').evaluateAll((els) => Math.max(...els.map((e) => +e.dataset.x)));
    expect(+last).toBeCloseTo(max, 0);
  });

  test("Zeitraffer: unnamed repos are not keyboard stops; the pack is fresh and within budget", async ({ page }) => {
    const next = packZr();
    expect(readFileSync(new URL(`../${ZR_PACK}`, import.meta.url), "utf8"), "run node scripts/pack-zr.mjs").toBe(next);
    test.info().annotations.push({ type: "budget", description: `zeitraffer.pack.js ${(gzipSync(next).length / 1024).toFixed(2)} KB gz (budget ${ZR_BUDGET / 1024})` });
    expect(gzipSync(next).length).toBeLessThanOrEqual(ZR_CEILING);
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    await expect(page.locator(".zr-clip[data-repo]:not([data-name])").first()).toBeAttached();
    await expect(page.locator(".zr-clip[data-repo]:not([data-name])[tabindex]")).toHaveCount(0);
    await expect(page.locator("span[data-zr-nav]:not(.zr-flag)")).toHaveCount(0);
    await page.locator('.zr [data-zr-item][tabindex="0"]').focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press(i % 2 ? "ArrowLeft" : "Home");
      expect(await page.evaluate(() => document.activeElement.matches("a[data-zr-nav], .zr-flag"))).toBe(true);
    }
  });

  test("A dropped request for the Zeitraffer brings the list back, and the switch retries", async ({ page }) => {
    let hits = 0;
    await page.route("**/js/sections/zeitraffer.pack.js*", (r) => (++hits === 1 ? r.abort() : r.continue()));
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    await expect(page.locator('[data-zr-view="liste"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#schichtbuch .schichtbuch-list")).toBeVisible();
    await expect(page.locator("#schichtbuch [data-mount='zeitraffer']")).toBeHidden();
    await page.locator('[data-zr-view="zeitraffer"]').click();
    await expect(page.locator("#schichtbuch .zr")).toBeVisible();
    await expect(page.locator('[data-zr-view="zeitraffer"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#schichtbuch .schichtbuch-list")).toBeHidden();
  });

  test("Zeitraffer + list never name a repo outside the allowlist", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    const names = await page.locator(".zr [data-name]").evaluateAll((els) => els.map((e) => e.dataset.name));
    expect(names.length).toBe(REPOS.filter((r) => r.n).length);
    for (const n of names) expect(ALLOW.has(n), n).toBe(true);
    const hrefs = await page.locator("#schichtbuch a[href*='github.com/LoggeL/']").evaluateAll((els) => els.map((a) => a.getAttribute("href")));
    for (const h of hrefs) {
      const repo = decodeURIComponent(h.split("github.com/LoggeL/")[1].split(/[/?#]/)[0]);
      expect(ALLOW.has(repo), repo).toBe(true);
    }
    const unnamed = REPOS.filter((r) => !r.n).length;
    await expect(page.locator(".zr-clip[data-repo]:not([data-name])")).toHaveCount(unnamed);
  });

  test("Zeitraffer: every portfolio clip is labelled and uses a small thumbnail", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    const clips = await page.locator(".zr-pclip").evaluateAll((els) => els.map((a) => ({ title: a.querySelector(".zr-pclip-title")?.getBoundingClientRect().width ?? 0, img: a.querySelectorAll("img").length, bg: a.querySelector(".zr-pclip-img") ? getComputedStyle(a.querySelector(".zr-pclip-img")).backgroundImage : "" })));
    expect(clips.length).toBeGreaterThan(0);
    for (const c of clips) {
      expect(c.title).toBeGreaterThan(20);
      // 40 × 25 chips: one 2× sprite (scripts/make-zr-sprite.mjs), never a 640 w thumbnail each.
      expect(c.img).toBe(0);
      if (c.bg) expect(c.bg).toMatch(/assets\/img\/thumbs\/zr-sprite\.webp/);
    }
    // Year-only milestones get a bracket over their year, not a line on 1 January.
    const yearOnly = MILESTONES.filter((m) => m.precision === "year").length;
    await expect(page.locator(".zr-lines [data-span]")).toHaveCount(yearOnly);
    // English quotes in milestone copy are marked up.
    await expect(page.locator('.zr-flag-text [lang="en"]')).toHaveCount(MILESTONES.filter((m) => /im getting tired of this/.test(m.text)).length);
    // Exactly one current year chip.
    await expect(page.locator('.zr-yearchip[aria-current="true"]')).toHaveCount(1);
  });

  test("390: the middle years sit behind one disclosure; the first and the newest three stay open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    const last = Number(SNAPSHOT.asOf.slice(0, 4));
    const older = page.locator("#schichtbuch .sb-older");
    await expect(older).toHaveCount(1);
    await expect(older).not.toHaveAttribute("open", "");
    await expect(older.locator("> summary")).toHaveText(`2015–${last - 3} zeigen`);
    await expect(page.locator("#jahr-2014")).toBeVisible();
    for (let y = last - 2; y <= last; y++) await expect(page.locator(`#jahr-${y}`)).toBeVisible();
    await expect(page.locator(`#jahr-${last - 3}`)).toBeHidden();
    await expect(page.locator('.sb-log .ms-text [lang="en"]')).toHaveCount(0); // the commit quote left the timeline
    await older.locator("> summary").click();
    await expect(page.locator(`#jahr-${last - 3}`)).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(older).toHaveAttribute("open", "");
    await expect(older.locator("> summary")).toBeHidden();
  });

  test("Zeitraffer markers: one per milestone; a flag links only what is worth opening", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#schichtbuch");
    const flags = page.locator(".zr-flag");
    await expect(flags).toHaveCount(MILESTONES.length);
    for (const [tag, h, label] of await flags.evaluateAll((els) => els.map((a) => [a.tagName, a.getAttribute("href"), a.getAttribute("aria-label")]))) {
      if (tag === "A") expect(h).toMatch(/^https:\/\/(www\.youtube\.com|youtu\.be|github\.com)\//);
      else expect(h).toBeNull();
      expect(label).not.toMatch(/Quelle|belegt/);
    }
  });
});

test.describe("Werkstatt", () => {
  test("Werkzeugwand counts equal the reference computation and a click filters the Lager", async ({ page }) => {
    const data = await loadDataFs();
    const reference = wallTools(data.projects, data.detailsById);
    await page.goto("/");
    await mounted(page, "#werkstatt");
    const tags = page.locator(".wand-tag");
    await expect(tags).toHaveCount(reference.length);
    const shown = await tags.evaluateAll((els) => els.map((b) => [b.dataset.tool, +b.dataset.count]));
    expect(shown).toEqual(reference.map((t) => [t.tool, t.count]));
    const ts = reference.find((t) => t.tool === "TypeScript");
    expect(ts).toBeTruthy();
    await expect(page.locator('.wand-tag[data-tool="TypeScript"] .wand-count')).toHaveText(`×${ts.count}`);
    await expect(page.locator('.wand-tag[data-tool="TypeScript"]')).toHaveAccessibleName(/TypeScript ×\d+ im Lager zeigen/);

    await page.locator('.wand-tag[data-tool="Three.js"]').click();
    await expect(page.locator("#project-search")).toHaveValue("Three.js");
    // Keyboard focus follows the jump into the Lager.
    await page.locator('.wand-tag[data-tool="JavaScript"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#project-search")).toHaveValue("JavaScript");
    await expect(page.locator("#project-search")).toBeFocused();
    // Once the page has settled, the focused field is on screen (focus and view end up together).
    await expect
      .poll(async () => page.locator("#project-search").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight;
      }), { timeout: 8000 })
      .toBe(true);
  });

  test("Werkzeugwand: counted at build time, a plain scroll fetches no details file", async ({ page }) => {
    const data = await loadDataFs();
    const reference = wallTools(data.projects, data.detailsById);
    // js/render/tools.js is fresh (re-run node scripts/make-tools.mjs after npm run import).
    expect(TOOLS).toEqual(reference.map((t) => [t.tool, t.count]));
    const details = [];
    page.on("request", (r) => /\/data\/details\//.test(r.url()) && details.push(r.url()));
    await page.goto("/");
    await mounted(page, "#werkstatt");
    await expect(page.locator(".wand-tag")).toHaveCount(reference.length);
    await page.locator("#kontakt").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    // Other sections may load the few details they show (the Meisterstück chapters); the wall
    // itself no longer walks all of them.
    const all = data.projects.filter((p) => p.details).length;
    expect(new Set(details).size, details.join("\n")).toBeLessThan(all / 4);
  });

  test("Knopf toggles „Siehste.“", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#werkstatt");
    const knopf = page.locator("#knopf");
    await knopf.click();
    await expect(knopf).toHaveAttribute("aria-pressed", "true");
    // „Siehste.“ is a separate stamp; the visible cap and the accessible name stay „Knopf“ (2.5.3).
    await expect(knopf.locator(".knopf-said")).toBeVisible();
    await expect(knopf.locator(".knopf-said")).toHaveText("Siehste.");
    await expect(knopf.locator(".knopf-cap")).toHaveText("Knopf");
    await expect(knopf).toHaveAccessibleName("Knopf");
    await knopf.click();
    await expect(knopf).toHaveAttribute("aria-pressed", "false");
    await expect(knopf.locator(".knopf-said")).toBeHidden();
    await expect(knopf).toHaveAccessibleName("Knopf");
  });

  test("Zunft renders every partner as a card, no sources list; the clip only plays on hover", async ({ page }) => {
    const partners = read("data/partners.json");
    await page.goto("/");
    await mounted(page, "#werkstatt");
    await expect(page.locator(".zunft-card")).toHaveCount(partners.length);
    // The sources stay in partners.json; the page shows the partners, not a hallmark per card.
    await expect(page.locator(".zunft details, .zunft-punze")).toHaveCount(0);
    await expect(page.locator(".zunft")).not.toContainText(/Gepunzt|Quelle/);
    // Xenon: one plain line about the bot (no disclaimer) and a link to its repo, not xenon.bot.
    const xenon = page.locator('.zunft-card[data-partner="xenon"]');
    if (await xenon.count()) {
      await expect(xenon).toContainText("aus der Xenon-Doku");
      await expect(xenon).not.toContainText(/Kein offizieller|offiziellen|Mein eigenes Projekt/);
      await expect(xenon.locator(".zunft-name a")).toHaveAttribute("href", "https://github.com/LoggeL/xenon-support-bot");
    }
    const clip = page.locator(".zunft-clip");
    if (await clip.count()) {
      expect(await clip.evaluate((v) => v.paused)).toBe(true);
      const box = await clip.boundingBox();
      expect(box.width).toBeLessThanOrEqual(40);
    }
  });

  test("Zunft: a logo that fails to load becomes a monogram", async ({ page }) => {
    const partners = read("data/partners.json").filter((p) => p.image && !p.video);
    const victim = partners[0];
    test.skip(!victim, "no partner with a logo");
    await page.route(`**/${victim.image}`, (r) => r.abort());
    await page.goto("/");
    await mounted(page, "#werkstatt");
    const mark = page.locator(`.zunft-card[data-partner="${victim.id}"] .zunft-mark`);
    await mark.scrollIntoViewIfNeeded();
    await expect(mark).toHaveClass(/zunft-mark--blank/);
    await expect(mark.locator("img")).toHaveCount(0);
    await expect(mark).toHaveText(/^\p{Lu}{2,3}$/u);
  });

  test("Abspann has all generated blocks", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#abspann");
    for (const block of ["titel", "code", "auch-als", "drehorte", "sprachen", "material"]) {
      await expect(page.locator(`#abspann .credit[data-block="${block}"]`)).toHaveCount(1);
    }
    // The partners are the Zunft right above; the credits do not repeat them.
    await expect(page.locator('#abspann .credit[data-block="partner"]')).toHaveCount(0);
    // Material is the portfolio inventory (Projekte, Filme, Fotos), not a repo count
    await expect(page.locator('#abspann .credit[data-block="material"]')).not.toContainText("Repos");
    // Sprachen: the top five names, no counts, no caption
    await expect(page.locator('#abspann .credit[data-block="sprachen"] dd')).toHaveCount(5);
    await expect(page.locator('#abspann .credit[data-block="sprachen"]')).not.toContainText(/\d|Hauptsprache/);
    // below the Zunft: no Ramsen footnote; above it: no second „Bühne“ block
    await expect(page.locator(".zunft-ramsen, #werkstatt .buehne")).toHaveCount(0);
  });

  test("Abspann rolls in a fixed window; „Alles zeigen“ opens it; calm stands still", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await mounted(page, "#abspann");
    const win = page.locator("#abspann .credits-window");
    const box = await win.boundingBox();
    expect(box.height).toBeLessThanOrEqual(640.5);
    await expect(page.locator("#abspann")).toHaveClass(/is-rolling/);
    const more = page.locator("#abspann .abspann-more");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#abspann")).not.toHaveClass(/is-rolling/);
    expect((await win.boundingBox()).height).toBeGreaterThan(box.height);
    await more.click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("#abspann")).not.toHaveClass(/is-rolling/);
    expect(await page.locator("#abspann .credits-reel").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  });
});

test.describe("Abseits + Kontakt", () => {
  test("Nachtuhr: one tick per photo, keyboard steps through the nights", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#abseits");
    const ticks = page.locator(".nu-tick");
    await expect(ticks).toHaveCount(IMAGES.length);
    // At rest the well already shows a real photo (the first one), never an empty frame.
    await expect(page.locator(".nu-img.is-on")).toHaveCount(1);
    await expect(page.locator(".nu-img.is-on")).toHaveAttribute("src", /small\/IMG_20200924_233029\.webp$/);
    await expect(page.locator(".nu-cap")).toHaveText("Nacht 01 · 24.09.2020 · 23:30 Uhr");
    await expect(page.locator('.nu-tick[tabindex="0"]')).toHaveCount(1);
    await page.locator('.nu-tick[tabindex="0"]').focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('.nu-tick[tabindex="0"]')).toHaveAttribute("data-i", "1");
    await expect(page.locator(".nu-cap")).toHaveText(/^Nacht \d\d · \d\d\.\d\d\.\d{4} · \d\d:\d\d Uhr$/);
    await expect(page.locator(".nu-img.is-on")).toHaveCount(1);
    await expect(page.locator(".nu-img.is-on")).toHaveAttribute("src", /small\/IMG_20200924_233152\.webp$/);
    await page.keyboard.press("End");
    await expect(page.locator('.nu-tick[tabindex="0"]')).toHaveAttribute("data-i", String(IMAGES.length - 1));
    const rings = await page.locator(".nu-ring").count();
    expect(rings).toBe(nights(photoNames(IMAGES)).length);
  });

  test("Tab into the contact sheet before the Nachtuhr mounts: focus moves to the same photo's tick", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.locator("#abseits").evaluate(() => {});
    // Focus the first frame of the prerendered sheet without scrolling, then bring the section in.
    await page.locator(".contact-sheet a").first().focus({ preventScroll: true }).catch(() => {});
    await page.evaluate(() => document.querySelector(".contact-sheet a").focus({ preventScroll: true }));
    await mounted(page, "#abseits");
    await expect(page.locator(".nu-tick").first()).toBeFocused();
    await expect(page.locator('.nu-tick[tabindex="0"]')).toHaveAttribute("data-i", "0");
    await ctx.close();
  });

  test("below 640 px the contact sheet is the view", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    await mounted(page, "#abseits");
    await expect(page.locator(".nu")).toBeHidden();
    await expect(page.locator(".contact-sheet .cs-frame")).toHaveCount(12);
    await expect(page.locator(".contact-sheet a").first()).toHaveAttribute("href", /gallery\/assets\/img\/large\/IMG_\d{8}_\d{6}\.jpg$/);
  });

  test("Kontakt links come from socials.json plus GitHub", async ({ page }) => {
    await page.goto("/");
    await mounted(page, "#kontakt");
    for (const s of SOCIALS.filter((s) => s.link.startsWith("https://"))) {
      await expect(page.locator(`#kontakt .contact-links a[href="${s.link}"]`)).toHaveCount(1);
    }
    await expect(page.locator(`#kontakt .contact-links a[href="https://github.com/${SNAPSHOT.github.login}"]`)).toHaveCount(1);
    await expect(page.locator(".contact-mail")).toHaveAttribute("href", "mailto:hyper.xjo@gmail.com");
    // no lonely GitHub stat beside the address: the links are enough
    await expect(page.locator("#kontakt .kontakt-warm")).toHaveCount(0);
  });

  test("Kontakt keeps GitHub when snapshot.json fails", async ({ page }) => {
    await page.route("**/data/snapshot.json", (r) => r.fulfill({ status: 503, body: "" }));
    await page.goto("/");
    await mounted(page, "#kontakt");
    await expect(page.locator('#kontakt .contact-links a[href="https://github.com/LoggeL"]')).toHaveCount(1);
    for (const s of SOCIALS.filter((s) => s.link.startsWith("https://"))) {
      await expect(page.locator(`#kontakt .contact-links a[href="${s.link}"]`)).toHaveCount(1);
    }
  });
});
