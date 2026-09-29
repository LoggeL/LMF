/**
 * Werkbank deep dive  [WP2]  (spec §2.5, §2.11, §5.4, §7.3)
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, existsSync } from "node:fs";
import { filterProjects } from "../js/lib/search.js";

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const PROJECTS = read("data/projects.json");
const FILMS = read("data/films.json");
const detailsOf = (id) => (existsSync(new URL(`../data/details/${id}.json`, import.meta.url)) ? read(`data/details/${id}.json`) : null);
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const UNKNOWN = /Dieses Projekt gibt[’']s hier nicht \(mehr\)\./;
const has = (id) => PROJECTS.some((p) => p.id === id);

async function ready(page, url = "/") {
  await page.goto(url);
  await expect(page.locator("#lager")).toHaveAttribute("data-state", "ready", { timeout: 20000 });
}
const dialog = (page) => page.locator("#werkbank");
/** Direct deep link: the dialog opens once data is in (slow shared dev servers need patience). */
async function direct(page, id) {
  await page.goto(`/#werk/${id}`);
  await expect(dialog(page)).toBeVisible({ timeout: 20000 });
}

test("direct deep link opens after data; ←/→ switch via replace; Back still closes", async ({ page }) => {
  test.skip(!has("infected"), "infected not in data");
  await direct(page, "infected");
  await expect(page.locator("#modal-title")).toHaveText("Infected");
  await expect(page.locator("#close-modal")).toBeFocused();
  await expect(page).toHaveTitle("Infected · Werkstück · Logge Media Forge");

  await ready(page, "/");
  const lengthBefore = await page.evaluate(() => history.length);
  const first = page.locator("#projects-container .project-link").first();
  const firstId = await first.getAttribute("data-project-id");
  await first.click();
  await expect(page).toHaveURL(new RegExp(`#werk/${firstId}$`));
  const lengthOpen = await page.evaluate(() => history.length);
  expect(lengthOpen).toBe(lengthBefore + 1);
  await page.keyboard.press("ArrowRight");
  await expect(page).not.toHaveURL(new RegExp(`#werk/${firstId}$`));
  const second = new URL(page.url()).hash.replace("#werk/", "");
  // Opened from the Lager → Lager order.
  const order = await page.locator("#projects-container .project-link").evaluateAll((els) => els.map((e) => e.dataset.projectId));
  expect(second).toBe(order[1]);
  await expect(page.locator("#modal-title")).toHaveText(PROJECTS.find((p) => p.id === second).title);
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(new RegExp(`#werk/${firstId}$`));
  await page.getByRole("button", { name: "Nächstes Werkstück", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#werk/${second}$`));
  expect(await page.evaluate(() => history.length)).toBe(lengthOpen);
  await page.goBack();
  await expect(dialog(page)).toBeHidden();
  expect(new URL(page.url()).hash).not.toMatch(/^#werk\//);
  await expect(page).toHaveTitle("Logge Media Forge · Aus Neugier. Gemacht.");
  // Focus returns to the plate of the Werkstück that was open last.
  // The close transition has to finish first; a busy CPU (parallel workers) stretches it.
  await expect(page.locator(`#projects-container .project-link[data-project-id="${second}"]`)).toBeFocused({ timeout: 10000 });
});

test("unknown id is announced, the dialog stays closed, the URL goes to #lager", async ({ page }) => {
  await page.goto("/#werk/nope");
  await expect(page.locator("#project-count")).toHaveText(UNKNOWN);
  await expect(page.locator("#toast")).toHaveText(UNKNOWN);
  await expect(page.locator("#toast")).toHaveAttribute("role", "status");
  await expect(dialog(page)).toBeHidden();
  await expect(page).toHaveURL(/#lager$/);
  // … and the Lager is really on screen once the chapters above it have mounted.
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("lager").getBoundingClientRect().top)), { timeout: 8000 }).toBeLessThanOrEqual(100);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => document.getElementById("lager").getBoundingClientRect().top)).toBeLessThanOrEqual(100);
});

for (const [w, h] of [
  [1440, 900],
  [390, 844],
])
  test(`closing a deep-linked Werkbank lands on the Lager heading, on screen (${w} px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await direct(page, "melodai");
    // Opened by a deep link: focus is on „Schließen“, with the quiet ring until a key is pressed.
    await expect(page.locator("#close-modal")).toBeFocused();
    await expect(page.locator("#close-modal")).toHaveAttribute("data-quiet", "");
    await page.waitForTimeout(800);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator("#lager-title")).toBeFocused();
    await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("lager").getBoundingClientRect().top)), { timeout: 8000 }).toBeLessThanOrEqual(100);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => document.getElementById("lager").getBoundingClientRect().top)).toBeLessThanOrEqual(100);
  });

test("projects.json down: #werk/<id> keeps the failure copy and lands on the static row", async ({ page }) => {
  await page.route(/data\/projects\.json/, (route) => route.fulfill({ status: 503, body: "" }));
  await page.goto("/#werk/melodai");
  await expect(page.locator("#project-count")).toHaveText("Das Lager konnte gerade nicht geladen werden.");
  await expect(page).toHaveURL(/#lager$/);
  await expect(page.locator("#lager-static")).toBeVisible();
  await expect(page.locator('#lager-static [data-werk="melodai"] a')).toBeFocused({ timeout: 8000 });
  await expect(page.locator("#toast")).not.toHaveText(UNKNOWN);
  await expect(dialog(page)).toBeHidden();
  // The toolbar has nothing to filter: it is switched off.
  await expect(page.locator('#lager [data-filter="games"]')).toBeDisabled();
  await expect(page.locator("#project-search")).toBeDisabled();
  // No orphan „ · “ at the start of the meta line.
  const lines = (await page.locator("#lager-static li").first().innerText()).split("\n").map((l) => l.trim()).filter(Boolean);
  expect(lines.length).toBeGreaterThan(1);
  for (const l of lines) expect(l).not.toMatch(/^·/);
});

test("hero images always carry alt text; Selantis skips the drop cap; short stories go full width", async ({ page }) => {
  await direct(page, "melodai");
  await expect(page.locator("#werkbank .wb-hero-img")).toHaveAttribute("alt", /.+/);
  test.skip(!has("selantis") || !has("skiing-2026"), "projects missing");
  await page.evaluate(() => (location.hash = "werk/selantis"));
  await expect(page.locator("#werkbank .wb-story")).toHaveClass(/wb-story--nocap/);
  await expect(page.locator("#werkbank .wb-hero-img")).toHaveAttribute("alt", /.+/);
  await page.evaluate(() => (location.hash = "werk/skiing-2026"));
  await expect(page.locator("#modal-title")).toHaveText(PROJECTS.find((p) => p.id === "skiing-2026").title);
  // Short story without tools beside it: one column, no empty aside.
  await expect(page.locator("#werkbank .wb-cols")).toHaveClass(/wb-cols--(short|solo)/);
  await page.evaluate(() => (location.hash = "werk/melodai"));
  // the tools say what it is built with; no language percentages beside them
  await expect(page.locator("#werkbank .wb-aside .wb-tools")).toBeVisible();
  await expect(page.locator("#werkbank .wb-langs")).toHaveCount(0);
  await expect(page.locator("#werkbank .wb-aside")).not.toContainText("%");
});

test("focus trap, Esc restores the plate, title restored", async ({ page }) => {
  await ready(page);
  const plate = page.locator("#projects-container .project-link").nth(2);
  await plate.click();
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator("#close-modal")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("#werkbank")))).toBe(true);
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest("#werkbank")))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(plate).toBeFocused();
});

test("film facade: zero YouTube/Google requests before the click, then an iframe with a title", async ({ page }) => {
  const film = FILMS.find((f) => /^[\w-]{11}$/.test(f.youtubeId ?? "") && has(f.id));
  const requests = [];
  page.on("request", (r) => {
    if (/youtube|ytimg|google/.test(r.url())) requests.push(r.url());
  });
  await direct(page, film.id);
  const play = page.getByRole("button", { name: /^Film abspielen/ });
  await expect(play).toBeVisible();
  // one consent line, said once; the inline player is the way to watch, so no second „Film ansehen“
  await expect(dialog(page)).toContainText("Beim Abspielen lädt YouTube (Google) Inhalte und setzt ggf. Cookies.");
  await expect(dialog(page).getByRole("link", { name: /Auf YouTube öffnen/ })).toHaveCount(0);
  await expect(page.locator("#modal-link")).toBeHidden();
  await page.waitForTimeout(800);
  expect(requests).toEqual([]);
  await page.route(/youtube-nocookie\.com/, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" }));
  await play.click();
  const frame = dialog(page).locator("iframe.wb-film-iframe");
  await expect(frame).toHaveAttribute("src", new RegExp(`^https://www\\.youtube-nocookie\\.com/embed/${film.youtubeId}\\?autoplay=1&rel=0$`));
  await expect(frame).toHaveAttribute("title", /auf YouTube$/);
  // Focus is inside the player now (Esc belongs to YouTube there); closing removes the player.
  await page.locator("#close-modal").click();
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator("iframe.wb-film-iframe")).toHaveCount(0);
});

test("every Werkstück renders as a project page: fact strip, https CTA, no citations, no errors", async ({ page }) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  for (const p of PROJECTS) {
    await page.evaluate((id) => (location.hash = `werk/${id}`), p.id);
    await expect(page.locator("#modal-title")).toHaveText(p.title);
    await expect(page.locator("#modal-link")).toHaveAttribute("href", /^https:\/\//);
    const d = detailsOf(p.id);
    // The data keeps its sources; the page shows a compact fact strip instead of footnotes, and no
    // strip at all when it would only repeat the year.
    const cells = page.locator("#werkbank .wb-facts .wb-fact");
    if (d?.sources?.length && (await cells.count())) await expect(cells.first(), p.id).toBeVisible();
    if ((await cells.count()) === 1) await expect(cells.first(), p.id).not.toHaveClass(/wb-fact--jahr/);
    // Portfolio, not report: no hallmark, no ¹²³ marks (a probe's maths exponent, sup[data-ph], is fine), no source lists, no „Stand“ stamps.
    await expect(page.locator("#werkbank sup:not([data-ph]), #werkbank .punze-button, #werkbank [popover], #werkbank .wb-sources, #werkbank .wb-spec")).toHaveCount(0);
    const text = await dialog(page).innerText();
    expect(text, p.id).not.toMatch(/Gepunzt|Punze|Quelle|geprüft am|Woher ich das weiß|Repo angelegt|\bStand\b|Werkstattdaten|davon von mir|Gebucht wird|Videobeschreibung|Laut Commit|öffentliche Repos|Informationsangebot|Commits|Randnotiz|Aus dem Archiv|Läuft auch bei|Sprachen|\d+,\d\s?%/);
    // stars only when they say something; „Zuletzt dran“ only for a piece that has cooled off
    const sterne = page.locator("#werkbank .wb-fact--sterne dd");
    if (await sterne.count()) expect(Number(await sterne.textContent()), p.id).toBeGreaterThanOrEqual(25);
    if (await page.locator("#werkbank .wb-fact--zuletzt").count()) await expect(page.locator("#werkbank")).toHaveAttribute("data-glow", /abgekuehlt|ausgemustert/);
    // one row of at most four cells
    expect(await page.locator("#werkbank .wb-facts .wb-fact").count(), p.id).toBeLessThanOrEqual(4);
    // Private repos never show their name.
    if (p.repo?.private) expect(text).not.toContain(p.repo.fullName);
  }
  expect(errors).toEqual([]);
});

test("LoggeRythm links only its repo; Marathon shows no goals, times or dates", async ({ page }) => {
  test.skip(!has("loggerythm") || !has("marathon-trainer"), "projects missing");
  await direct(page, "loggerythm");
  await expect(page.locator("#werkbank .wb-story")).toBeVisible();
  await expect(page.locator("#modal-link")).toHaveAttribute("href", /^https:\/\/github\.com\/LoggeL\/LoggeRythm/);
  await expect(page.locator("#modal-link")).toContainText("Repo ansehen");
  await expect(page.locator('#werkbank [data-wb="repo"]')).toBeHidden();
  await expect(page.locator("#werkbank .wb-note")).toContainText("privates Demo-Projekt");
  await page.evaluate(() => (location.hash = "werk/marathon-trainer"));
  await expect(page.locator("#modal-title")).toHaveText("Marathon Trainer");
  await expect(page.locator("#werkbank .wb-story")).toBeVisible();
  const text = await dialog(page).innerText();
  expect(text).not.toMatch(/2:59|3:05|Pace|JGA|Urlaub|Festival|25\.10\./);
  expect(text).not.toContain("LoggeL/marathon-trainer");
});

test("fact strip: a few numbers at a glance, then the next Werkstück as a card", async ({ page }) => {
  await direct(page, "melodai");
  const facts = page.locator("#werkbank .wb-facts");
  await expect(facts).toHaveAttribute("aria-label", "Eckdaten");
  // the project's own numbers first; no commit count, and no „Zuletzt dran“ while it still glows
  await expect(facts.locator("dt")).toHaveText(["Jahr", "Pipeline"]);
  await expect(facts.locator(".wb-fact--jahr dd")).toHaveText(String(PROJECTS.find((p) => p.id === "melodai").year));
  const next = page.locator("#werkbank .wb-next-card");
  await expect(next).toContainText("Nächstes Werkstück");
  const title = (await next.locator(".wb-next-title").textContent()).trim();
  await next.click();
  await expect(page.locator("#modal-title")).toHaveText(title);
  await expect(dialog(page)).toBeVisible();
});

test("stack chip closes the Werkbank and searches the Lager for the tool", async ({ page }) => {
  await ready(page);
  await page.locator('#meisterstuecke [data-project-id="melodai"]').first().click();
  await expect(dialog(page)).toBeVisible();
  const chip = page.getByRole("button", { name: "Flask im Lager zeigen" });
  await chip.click();
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByRole("searchbox", { name: "Projekte durchsuchen" })).toHaveValue("Flask");
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("Flask");
  await expect(page.locator('#projects-container [data-project-id="melodai"]')).toHaveCount(1);
});

test("Codex strip sits on its own stage; no language percentages", async ({ page }) => {
  test.skip(!has("codex-quota-widget"), "codex-quota-widget not in data");
  await direct(page, "codex-quota-widget");
  const strip = page.locator("#werkbank .wb-hero-media--strip img");
  await expect(strip).toBeVisible();
  await expect.poll(() => strip.evaluate((img) => img.naturalWidth)).toBe(945);
  await expect(page.locator("#werkbank .wb-lang-list, #werkbank .wb-lang-bar")).toHaveCount(0);
});

for (const theme of ["light", "dark"])
  test(`axe is clean with a film Werkbank and a code Werkbank (${theme})`, async ({ page }) => {
    const film = FILMS.find((f) => /^[\w-]{11}$/.test(f.youtubeId ?? "") && has(f.id));
    await page.emulateMedia({ colorScheme: theme });
    for (const id of [film.id, "melodai"].filter(has)) {
      await direct(page, id);
      await expect(page.locator("#werkbank .wb-cols")).toBeVisible();
      // Switching pieces fades the new one in: measure contrast once it has landed.
      await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.animationName === "wb-swap").map((a) => a.finished.catch(() => {}))));
      const { violations } = await new AxeBuilder({ page }).include("#werkbank").withTags(AXE_TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), id).toEqual([]);
    }
  });

test("mobile: full-screen sheet with a bottom bar and no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await direct(page, "melodai");
  const box = await dialog(page).boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(389);
  const bar = await page.locator("#werkbank .wb-bar").boundingBox();
  expect(bar.y + bar.height).toBeGreaterThan(800);
  for (const name of [/Voriges/, /Schließen/, /Nächstes/]) {
    const b = await page.locator("#werkbank .wb-bar").getByRole("button", { name }).boundingBox();
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(await page.evaluate(() => document.querySelector("#werkbank .wb-scroll").scrollWidth <= innerWidth)).toBeTruthy();
});

test("320 px: the Werkbank reflows (no clipped column, all three bar buttons reachable)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const id of ["theater-website", "melodai", "skiing-2026", "corona-board"].filter(has)) {
    await direct(page, id);
    const m = await page.evaluate(() => {
      const d = document.querySelector("#werkbank");
      const t = document.querySelector("#modal-title").getBoundingClientRect();
      const btns = [...d.querySelectorAll(".wb-bar button")].filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect());
      return { sw: d.scrollWidth, cw: d.clientWidth, scroll: d.querySelector(".wb-scroll").scrollWidth, titleRight: t.right, btnRight: Math.max(...btns.map((b) => b.right)), n: btns.length };
    });
    expect(m.sw, id).toBeLessThanOrEqual(m.cw);
    expect(m.scroll, id).toBeLessThanOrEqual(320);
    expect(m.titleRight, id).toBeLessThanOrEqual(320);
    expect(m.btnRight, id).toBeLessThanOrEqual(320);
    expect(m.n, id).toBe(3);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
  }
});

test("no extra banner/contentinfo landmarks inside the dialog; the play icon sits inside its disc", async ({ page }) => {
  const film = PROJECTS.find((p) => FILMS.some((f) => f.id === p.id && /^[\w-]{11}$/.test(f.youtubeId ?? "")));
  test.skip(!film, "no single-video film");
  await direct(page, film.id);
  expect(await page.locator("#werkbank header, #werkbank footer, #werkbank [role=banner], #werkbank [role=contentinfo]").count()).toBe(0);
  const disc = await page.locator("#werkbank .wb-film-disc").boundingBox();
  const i = await page.locator("#werkbank .wb-film-disc .i").boundingBox();
  expect(i.x).toBeGreaterThanOrEqual(disc.x);
  expect(i.y).toBeGreaterThanOrEqual(disc.y);
  expect(i.x + i.width).toBeLessThanOrEqual(disc.x + disc.width + 0.5);
  expect(i.y + i.height).toBeLessThanOrEqual(disc.y + disc.height + 0.5);
});

test("search helper still exported from js/projects.js (compat)", async () => {
  const compat = await import("../js/projects.js");
  expect(compat.filterProjects(PROJECTS, "all", "  BOMBERMAN  ")[0]?.id).toBe(filterProjects(PROJECTS, "all", "bomberman")[0]?.id);
  expect(compat.escapeHtml('<a href="x">')).toBe("&lt;a href=&quot;x&quot;&gt;");
  expect(compat.safeUrl("javascript:alert(1)")).toBe("#");
});

test("390 px: no fact runs past the page (film roles wrap, links stay glued)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const ids = ["skiing-2023", "skiing-2024-fun", "skiing-2024-epic", "selantis", "melodai", "theater-website"].filter(has);
  for (const id of ids) {
    await direct(page, id);
    await expect(page.locator("#werkbank .wb-cols")).toBeVisible();
    // a film with a player and only a year has no strip (the badge shows the length)
    if (!(await page.locator("#werkbank .wb-facts").count())) continue;
    const over = await page.locator("#werkbank .wb-facts").evaluate((dl) => {
      const right = dl.getBoundingClientRect().right;
      return [...dl.querySelectorAll("dd, dd *")]
        .filter((el) => el.getClientRects().length && !el.closest(".vh") && el.getBoundingClientRect().right > right + 0.5)
        .map((el) => `${el.tagName}.${el.className}: +${Math.round(el.getBoundingClientRect().right - right)}`);
    });
    expect(over, id).toEqual([]);
  }
});

test("the ↗ never wraps alone (film parts)", async ({ page }) => {
  test.skip(!has("selantis"), "selantis not in data");
  await page.setViewportSize({ width: 390, height: 844 });
  await direct(page, "selantis");
  const arrows = page.locator("#werkbank .spec-parts .ext-i");
  expect(await arrows.count()).toBeGreaterThan(0);
  const lonely = await arrows.evaluateAll((list) =>
    list
      .filter((m) => {
        const range = document.createRange();
        range.selectNodeContents(m.closest(".nw") ?? m.parentElement);
        const mr = m.getBoundingClientRect();
        return ![...range.getClientRects()].some((r) => r.width > 0 && Math.abs(r.top - mr.top) < 6 && r.left < mr.left - 2);
      })
      .map((m) => m.closest("li")?.textContent.trim()),
  );
  expect(lonely).toEqual([]);
});

test("Back, then Forward reopens the Werkstück; Esc still returns focus to its plate", async ({ page }) => {
  await ready(page);
  const plate = page.locator("#projects-container .project-link").first();
  await plate.click();
  await expect(dialog(page)).toBeVisible();
  await page.goBack();
  await expect(dialog(page)).toBeHidden();
  await expect(plate).toBeFocused();
  await page.goForward();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  // Not the Lager heading (the trigger was lost on the Forward reopen), and the plate is on screen.
  await expect(plate).toBeFocused();
  await expect(plate).toBeInViewport();
});

test("the Werkbank ships as one packed module, fresh and within budget (§8: ≤ 9 KB gz)", async ({ page }) => {
  const { pack, OUT, BUDGET } = await import("../scripts/pack-werkbank.mjs");
  const { gzipSync } = await import("node:zlib");
  const shipped = readFileSync(new URL(`../${OUT}`, import.meta.url), "utf8");
  expect(shipped, "js/werkbank/werkbank.pack.js is stale: run node scripts/pack-werkbank.mjs").toBe(pack());
  expect(gzipSync(shipped, { level: 9 }).length).toBeLessThanOrEqual(BUDGET);
  const loaded = new Set();
  page.on("request", (r) => loaded.add(new URL(r.url()).pathname));
  await direct(page, "skiing-2023");
  await expect(page.locator("#werkbank .wb-film-play")).toBeVisible();
  expect([...loaded].filter((u) => /^\/js\/werkbank\/(werkbank|body|languages|facade)/.test(u))).toEqual(["/js/werkbank/werkbank.pack.js"]);
});

test("hero stills use the thumbnails on phones and are never upscaled", async ({ page }) => {
  test.skip(!has("kniffel") || !has("skiing-2019"), "projects missing");
  await page.setViewportSize({ width: 390, height: 844 });
  await direct(page, "kniffel");
  const img = page.locator("#werkbank .wb-hero-img");
  await expect(img).toHaveAttribute("srcset", /thumbs\/Kniffel-640\.webp 640w/);
  await expect.poll(() => img.evaluate((el) => el.currentSrc)).toMatch(/thumbs\/Kniffel-(640|960)\.webp$/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await direct(page, "skiing-2019");
  const frame = page.locator("#werkbank .wb-film-frame");
  await expect.poll(() => frame.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(
    await page.locator("#werkbank .wb-film-poster img").evaluate((el) => el.naturalWidth + 1),
  );
});
