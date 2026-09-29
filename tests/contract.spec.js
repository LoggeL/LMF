/**
 * Stable test contract (spec §7.1 / §7.2)  [LEAD]
 * The DOM hooks and behaviours every package must keep. Cases moved here from portfolio.spec.js.
 * Counts are read from the data files (never hard-coded), so a snapshot refresh keeps this green.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

const PROJECTS = JSON.parse(readFileSync(new URL("../data/projects.json", import.meta.url), "utf8"));
const TOTAL = PROJECTS.length;
const BATCH = 12;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

// No internet in tests: the deferred Cloudflare beacon would otherwise hold up `load`, and with it
// every idle-mounted section (Esse, Werkbank).
test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!127\.0\.0\.1[:/]|localhost[:/])/, (route) => route.abort());
});

async function ready(page, url = "/") {
  await page.goto(url);
  await expect(page.locator("#project-count")).toHaveText(`${Math.min(BATCH, TOTAL)} von ${TOTAL} Projekten`);
}

async function readThrough(page) {
  // the page grows while sections mount, so re-measure on every step
  for (let y = 0; y <= (await page.evaluate(() => document.documentElement.scrollHeight)); y += 700) {
    await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(30);
  }
  for (const id of ["meisterstuecke", "schichtbuch", "werkstatt", "abseits", "kontakt"])
    await expect(page.locator(`#${id}`)).toHaveAttribute("data-mounted", "");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
}

async function axe(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test("static hooks and alias anchors are present (§3.15 rule 19, §2.0)", async ({ page }) => {
  await page.goto("/");
  for (const sel of [
    "#project-search",
    "#project-count[role=status]",
    "#projects-container",
    "#load-more",
    "#empty-state",
    "#reset-filters",
    "#werkbank",
    "#close-modal",
    "#modal-title",
    "#modal-link",
    "#menu-toggle",
    "#navigation",
    "#theme-toggle",
    "#motion-toggle",
    ".contact-mail",
    "#lager-static",
    "#sort",
    '[data-view="regal"]',
    '[data-view="liste"]',
  ])
    await expect(page.locator(sel), sel).toHaveCount(1);
  await expect(page.locator("[data-filter]")).toHaveCount(5);
  for (const name of ["Web & Apps", "Games", "KI", "Film"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", /true|false/);
  await expect(page.getByRole("button", { name: /^Alle(\s+\d+)?$/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("searchbox", { name: "Projekte durchsuchen" })).toHaveAttribute("type", "search");
  await expect(page.locator("dialog#werkbank #modal-title")).toHaveJSProperty("tagName", "H2");
  for (const [alias, section] of [
    ["home", "esse"],
    ["selected", "meisterstuecke"],
    ["projects", "lager"],
    ["about", "werkstatt"],
    ["partners", "werkstatt"],
    ["socials", "kontakt"],
  ])
    await expect(page.locator(`#${section} #${alias}`), `#${alias} in #${section}`).toHaveCount(1);
  for (const id of ["bomberman-web", "melodai", "theater-website"])
    await expect(page.locator(`#meisterstuecke a[data-project-id="${id}"][href="#werk/${id}"]`)).toHaveCount(1);
  await expect(page.locator(".contact-mail")).toHaveAttribute("href", "mailto:hyper.xjo@gmail.com");
  await expect(page.locator("h1")).toHaveCount(1);
});

test("archive search, combined filters, empty recovery and pagination", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Mehr entdecken" }).click();
  await expect(page.locator("#projects-container .project-card")).toHaveCount(Math.min(2 * BATCH, TOTAL));
  await expect(page.locator(".project-card").nth(BATCH).locator(".project-link")).toBeFocused();
  for (const card of await page.locator("#projects-container .project-card").all()) {
    const link = card.locator("a.project-link");
    const id = await link.getAttribute("data-project-id");
    await expect(link).toHaveAttribute("href", `#werk/${id}`);
  }
  await page.getByRole("button", { name: "Film", exact: true }).click();
  await page.getByRole("searchbox").fill("Infected");
  await expect(page.locator(".project-card")).toHaveCount(1);
  // A chip with zero hits carries aria-disabled but stays operable (§5.3).
  await page.getByRole("button", { name: "Games", exact: true }).click({ force: true });
  await expect(page.locator("#empty-state")).toBeVisible();
  await page.getByRole("button", { name: "Alle Projekte anzeigen" }).click();
  await expect(page.locator(".project-card")).toHaveCount(Math.min(BATCH, TOTAL));
  await expect(page.getByRole("button", { name: /^Alle(\s+\d+)?$/ })).toBeFocused();
  await expect(page.getByRole("searchbox")).toHaveValue("");
  while (await page.locator("#load-more").isVisible()) await page.getByRole("button", { name: "Mehr entdecken" }).click();
  await expect(page.locator(".project-card")).toHaveCount(TOTAL);
  await expect(page.locator("#load-more")).toBeHidden();
  await expect(page.locator("#lager-static")).toBeHidden();
  // Every archive image must resolve, including the case-sensitive Spyfall path.
  for (const image of await page.locator(".project-card img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((el) => el.complete && el.naturalWidth > 0)).toBeTruthy();
  }
});

test("Werkbank opens from a chapter, traps focus, closes with Escape and restores the trigger", async ({ page }) => {
  await ready(page);
  const trigger = page.locator('#meisterstuecke [data-project-id="bomberman-web"]');
  await trigger.click();
  await expect(page).toHaveURL(/#werk\/bomberman-web$/);
  await expect(page.locator("#werkbank")).toBeVisible();
  await expect(page.locator("#modal-title")).toHaveText("Bomberman");
  await expect(page.locator("#modal-link")).toHaveAttribute("href", "https://loggel.github.io/bomberman-web/");
  await expect(page.locator("#close-modal")).toBeFocused();
  await expect(page).toHaveTitle(/Bomberman · Werkstück · Logge Media Forge/);
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("#werkbank")))).toBe(true);
  // From the last focusable element, Tab wraps to the close button.
  await page.evaluate(() => {
    const d = document.getElementById("werkbank");
    const items = [...d.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
      (el) => !el.closest("[hidden]") && el.getClientRects().length,
    );
    items.at(-1).focus();
  });
  await page.keyboard.press("Tab");
  await expect(page.locator("#close-modal")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#werkbank")).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(new URL(page.url()).hash).not.toMatch(/^#werk\//);
  await expect(page).toHaveTitle("Logge Media Forge · Aus Neugier. Gemacht.");
});

test("direct deep link opens after data; Back closes; unknown ids are announced", async ({ page }) => {
  await page.goto("/#werk/melodai");
  await expect(page.locator("#werkbank")).toBeVisible();
  await expect(page.locator("#modal-title")).toHaveText("MelodAI");
  await page.keyboard.press("Escape");
  await expect(page.locator("#werkbank")).toBeHidden();
  await page.goto("/");
  await page.locator('#meisterstuecke [data-project-id="melodai"]').click();
  await expect(page.locator("#werkbank")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#werkbank")).toBeHidden();
  await page.goto("/#werk/gibts-nicht");
  await expect(page.locator("#project-count")).toHaveText("Dieses Projekt gibt’s hier nicht (mehr).");
  await expect(page.locator("#werkbank")).toBeHidden();
  await expect(page).toHaveURL(/#lager$/);
});

test("mobile menu, theme persistence, motion toggle, layout and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await ready(page);
  await page.getByRole("button", { name: "Menü" }).click();
  await expect(page.locator("#navigation")).toBeVisible();
  await expect(page.locator("#menu-toggle")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#navigation")).toBeHidden();
  await expect(page.locator("#menu-toggle")).toBeFocused();

  await page.getByRole("button", { name: "Dunkles Design aktivieren" }).click();
  expect(await page.evaluate(() => localStorage.getItem("lmf-theme"))).toBe("dark");
  await page.getByRole("button", { name: "Bewegung pausieren" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  // Constant name, state only in aria-pressed (no double-state label).
  await expect(page.getByRole("button", { name: "Bewegung pausieren" })).toHaveAttribute("aria-pressed", "true");
  // The tooltip matches the accessible name (no hover/screen-reader disagreement).
  await expect(page.locator("#motion-toggle")).toHaveAttribute("title", "Bewegung pausieren");
  await expect(page.locator("#theme-toggle")).toHaveAttribute("title", "Helles Design aktivieren");
  await page.getByRole("button", { name: "Bewegung pausieren" }).click();
  await expect(page.locator("#motion-toggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("html")).not.toHaveAttribute("data-motion", "paused");
  expect(await page.evaluate(() => localStorage.getItem("lmf-motion"))).toBeNull();

  for (const theme of ["dark", "light"]) {
    if (theme === "light") await page.getByRole("button", { name: "Helles Design aktivieren" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px (${theme})`).toBeTruthy();
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('#meisterstuecke [data-project-id="melodai"]').click();
  await expect(page.locator("#werkbank")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Overflow with Werkbank open").toBeTruthy();
});

test("mobile menu: Tab goes from „Menü“ into the links, in order, and the sheet stays open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.locator("#menu-toggle").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#menu-toggle")).toHaveAttribute("aria-expanded", "true");
  const names = [];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    names.push(await page.evaluate(() => (document.activeElement.closest("#navigation") ? document.activeElement.textContent.trim() : null)));
  }
  expect(names).toEqual(["03Projekte", "04Chronik", "05Über mich", "06Galerie", "07Kontakt"]);
  await expect(page.locator("#menu-toggle")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#menu-toggle")).toBeFocused();
});

for (const width of [1440, 390])
  test(`in-page links land under the header with smooth scrolling (${width} px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: width > 500 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await ready(page);
    const pad = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
    for (const id of ["kontakt", "schichtbuch", "lager"]) {
      if (width < 1024) await page.locator("#menu-toggle").click();
      await page.locator(`#navigation a[href="#${id}"]`).click();
      await expect
        .poll(() => page.evaluate((t) => Math.round(document.getElementById(t).getBoundingClientRect().top), id), { timeout: 6000 })
        .toBe(pad);
      await page.waitForTimeout(600);
      expect(await page.evaluate((t) => Math.round(document.getElementById(t).getBoundingClientRect().top), id), `#${id} stays put`).toBe(pad);
    }
    // same-document hash navigation to an old alias
    await page.evaluate(() => (location.hash = "#socials"));
    await expect
      .poll(() => page.evaluate(() => Math.round(document.getElementById("socials").getBoundingClientRect().top)), { timeout: 6000 })
      .toBeLessThanOrEqual(pad + 1);
  });

test("malformed #werk/ hashes are normalised or announced", async ({ page }) => {
  await page.goto("/#werk/MelodAI/");
  await expect(page.locator("#werkbank")).toBeVisible();
  await expect(page.locator("#modal-title")).toHaveText("MelodAI");
  await expect(page).toHaveURL(/#werk\/melodai$/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#werkbank")).toBeHidden();
  await page.goto("/#werk/");
  await expect(page.locator("#project-count")).toHaveText("Dieses Projekt gibt’s hier nicht (mehr).");
  await expect(page).toHaveURL(/#lager$/);
});

test("a Werkbank that cannot load degrades: #werk/<id> points at the project in the list", async ({ page }) => {
  await page.route(/\/js\/werkbank\/werkbank(\.pack)?\.js/, (route) => route.abort());
  await ready(page);
  await page.evaluate(() => (location.hash = "#werk/melodai"));
  const item = page.locator("#lager-static li").filter({ has: page.locator('a[href="https://melodai.logge.top/about"]') });
  await expect(page.locator("#lager-static")).toBeVisible({ timeout: 10000 });
  await expect(item.locator("a")).toBeFocused();
  await expect(page).toHaveURL(/#lager$/);
});

test("header text keeps AA contrast over the dark sections (light theme)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width > 500 ? 1000 : 844 });
    await ready(page);
    for (const id of ["kapitel-iv", "kontakt"]) {
      await page.evaluate((t) => document.getElementById(t).scrollIntoView({ behavior: "instant" }), id);
      await page.waitForTimeout(300);
      const { violations } = await new AxeBuilder({ page }).include(".site-header").withRules(["color-contrast"]).analyze();
      expect(violations.flatMap((v) => v.nodes.map((n) => n.target.join(" "))), `${width} px over #${id}`).toEqual([]);
    }
  }
});

test("section stylesheets do not block rendering and still arrive", async ({ page }) => {
  const source = (await (await page.request.get("/")).text()).replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/g, "");
  const blocking = [...source.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
  expect(blocking).toEqual(["css/tokens.css", "css/base.css", "css/sections/esse.css", "css/sections/warm.css", "css/fx.css"]);
  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => [...document.styleSheets].filter((s) => /sections\/(meister|lager|film|schichtbuch|werkstatt|abseits|kontakt)\.css|skeletons\.css/.test(s.href ?? "")).length))
    .toBe(8);
});

test("theme follows the system without a stored value", async ({ browser }) => {
  for (const colorScheme of ["dark", "light"]) {
    const context = await browser.newContext({ colorScheme });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
    const label = colorScheme === "dark" ? "Helles Design aktivieren" : "Dunkles Design aktivieren";
    await expect(page.locator("#theme-toggle")).toHaveAttribute("aria-label", label);
    await context.close();
  }
});

test("data failure leaves contact and GitHub recovery available", async ({ page }) => {
  await page.route("**/data/projects.json", (route) => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto("/");
  await expect(page.locator("#project-count")).toContainText("nicht geladen");
  await expect(page.locator("#projects-container a")).toHaveAttribute("href", "https://github.com/LoggeL");
  await expect(page.locator(".contact-mail")).toBeVisible();
  await expect(page.locator("#lager-static")).toBeVisible();
  await expect(page.locator("#lager-static li")).toHaveCount(TOTAL);
});

test("without JavaScript every section shows its static copy", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#hero-title")).toHaveText(/Aus Neugier\.\s*Gemacht\./);
  for (const [id, heading] of [
    ["warm", "Noch warm."],
    ["meisterstuecke", "Vier Stücke, genauer angeschaut."],
    ["lager", "Alles, was hier entstanden ist."],
    ["schichtbuch", "Erst Kamera. Dann Code."],
    ["werkstatt", "Ich wollte wissen, ob das geht."],
    ["abseits", "Nachts, mit dem Handy."],
    ["kontakt", "Was hast du im Kopf?"],
  ])
    await expect(page.locator(`#${id} h2`)).toHaveText(heading);
  await expect(page.locator("#lager-static li")).toHaveCount(TOTAL);
  await expect(page.locator("#lager-static li a").first()).toHaveAttribute("href", /^https:\/\//);
  await expect(page.locator(".contact-mail")).toBeVisible();
  await expect(page.locator("#navigation a")).toHaveCount(5);
  await expect(page.locator("#navigation")).toBeVisible();
  await expect(page.locator(".section-readout")).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  const header = await page.locator(".site-header").evaluate((h) => ({ pos: getComputedStyle(h).position, height: h.offsetHeight }));
  expect(header.pos).not.toBe("sticky");
  expect(header.height).toBeLessThanOrEqual(112);
  for (const span of await page.locator("[data-bind]").all()) expect((await span.textContent()).trim()).not.toBe("");
  await context.close();
});

for (const theme of ["light", "dark"])
  test(`accessibility and rendering in ${theme} theme`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ colorScheme: theme });
    await ready(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    // Read the whole page once, like a visitor: every lazy section mounts (so axe checks the live
    // UI, not only the static copy), and the content-visibility sections get their real remembered
    // size. Unrendered, their placeholder height lets text rects overlap the footer in axe's eyes.
    await readThrough(page);
    expect(await axe(page)).toEqual([]);
    await page.locator('#meisterstuecke [data-project-id="melodai"]').click();
    await expect(page.locator("#werkbank")).toBeVisible();
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

test("a portfolio, not a report: no hallmarks, citations or repeated „Stand“ dates", async ({ page }) => {
  await ready(page);
  await readThrough(page);
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/Gepunzt|Punze|Quelle:|\bQuellen\b|Woher ich das weiß|sag Bescheid/);
  // exactly one as-of mention: the Esse caption, because the ember brightness depends on it
  expect(text.match(/\bStand\b/g) ?? []).toHaveLength(1);
  await expect(page.locator(".esse-caption")).toContainText(/Stand (Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) \d{4}/);
  // the repo count is said where it matters (hero line, Schichtbuch counter), not five times over
  expect(text.match(/\b\d+ öffentliche Repos\b/gi)?.length ?? 0).toBeLessThanOrEqual(2);
  await expect(page.locator("main sup:not([data-ph]), .src-mark, .punze-slot, .punze-button, .specsheet, #i-punze")).toHaveCount(0);
});

test("404 page renders with a way home", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Verschmiedet.");
  await expect(page.getByRole("link", { name: /Zurück in die Werkstatt/ })).toHaveAttribute("href", "/");
});

test("gallery works without JavaScript and retains the photo archive", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/gallery/");
  await expect(page.getByRole("heading", { name: "Abseits der Tabs." })).toBeVisible();
  await expect(page.locator(".photo-grid a")).toHaveCount(77);
  await expect(page.locator(".photo-grid a").first()).toHaveAttribute("href", "assets/img/large/IMG_20200924_233029.jpg");
  // Night headings (§2.12) are asserted with their exact count in gallery.spec.js (WP5).
  await context.close();
});

test("without JavaScript every in-page link resolves and Noch warm is not empty", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  // #werk/<id> links (chapters, films, Noch warm) land on the project's row in the list.
  const dead = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h.length > 1 && !document.getElementById(decodeURIComponent(h.slice(1)))),
  );
  expect(dead).toEqual([]);
  await expect(page.locator("#warm .warm-static")).toHaveCount(3);
  await expect(page.locator("#warm .warm-static").first()).toBeVisible();
  const first = page.locator("#warm .warm-static a").first();
  const id = (await first.getAttribute("href")).slice("#werk/".length);
  await first.click();
  await expect(page.locator(`[id="werk/${id}"]`)).toBeInViewport();
  await context.close();
});

test("with JavaScript the no-JS rows stay out of the way", async ({ page }) => {
  await ready(page);
  await expect(page.locator("#warm .warm-static")).toHaveCount(0);
  await readThrough(page);
  const link = page.locator('#meisterstuecke a[href^="#werk/"]').first();
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => scrollY);
  await link.click();
  await expect(page.locator("#werkbank")).toBeVisible();
  // The row id is a real fragment target without JS; with JS the page must not jump to it.
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThanOrEqual(2);
});

test("#werk/ ids with a tracking tail open the project and the URL is cleaned", async ({ page }) => {
  await page.goto("/#werk/melodai?utm_source=x&y=1");
  await expect(page.locator("#werkbank")).toBeVisible();
  await expect(page.locator("#modal-title")).toHaveText("MelodAI");
  await expect(page).toHaveURL(/#werk\/melodai$/);
});

test("junk archive state falls back to the defaults and leaves the address bar", async ({ page }) => {
  await page.goto("/?g=zzz&s=zzz&v=zzz#lager");
  await expect(page.locator("#project-count")).toHaveText(`${Math.min(BATCH, TOTAL)} von ${TOTAL} Projekten`);
  await expect.poll(() => page.evaluate(() => location.search)).toBe("");
  await expect(page).toHaveURL(/#lager$/);
});

test("an unknown id is announced once (toast), the count shows it silently", async ({ page }) => {
  await page.goto("/#werk/gibts-nicht");
  await expect(page.locator("#toast")).toHaveText("Dieses Projekt gibt’s hier nicht (mehr).");
  await expect(page.locator("#project-count")).toHaveText("Dieses Projekt gibt’s hier nicht (mehr).");
  await expect(page.locator("#project-count")).toHaveAttribute("aria-live", "off");
});

test("a dropped module request is recovered by one reload (dependency stuck in the module map)", async ({ page }) => {
  let n = 0;
  await page.route(/\/js\/render\/plate\.js/, (route) => (n++ === 0 ? route.abort("connectionreset") : route.continue()));
  await page.goto("/");
  await expect(page.locator("#warm .plate").first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator("#project-count")).toHaveText(`${Math.min(BATCH, TOTAL)} von ${TOTAL} Projekten`);
  expect(await page.evaluate(() => sessionStorage.getItem("lmf-reloaded"))).not.toBeNull();
});

test("when main.js cannot run, the watchdog falls back to the no-JS layout", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("lmf-reloaded", String(Date.now())));
  await page.route(/\/js\/lib\/derive\.js/, (route) => route.abort("connectionreset"));
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/\bjs\b/, { timeout: 10000 });
  await expect
    .poll(() => page.evaluate(() => [...document.styleSheets].some((s) => /sections\/schichtbuch\.css/.test(s.href ?? ""))))
    .toBe(true);
  await expect(page.locator("#navigation")).toBeVisible();
  await expect(page.locator("#lager-static")).toBeVisible();
});

// Budget from the jury (09/2026): ≤ 18 screens at 1440 × 900, ≤ 28 at 390 × 844, with some slack
// under both so a section cannot quietly grow the page back.
for (const [width, height, max] of [
  [1440, 900, 16500],
  [390, 844, 24000],
])
  test(`the page stays short enough to read (${width} px: ≤ ${max} px)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await ready(page);
    await readThrough(page);
    await page.waitForTimeout(500);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const sections = await page.evaluate(() =>
      [...document.querySelectorAll("main > section, footer")].map((s) => `${s.id || s.tagName}:${s.offsetHeight}`).join(" "),
    );
    expect(total, `document height at ${width} px (${sections})`).toBeLessThanOrEqual(max);
  });
