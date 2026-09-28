/**
 * data.spec.js [WP1] — no-JS content, data failure, privacy/network, budgets (spec §7.3).
 * Counts come from the data files, never typed in.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const PROJECTS = read("data/projects.json");
const SNAPSHOT = read("data/snapshot.json");
const TOTAL = PROJECTS.length;
const SELF = `127.0.0.1:${process.env.LMF_PORT ?? 4199}`; // same default as playwright.config.js
const ALLOWED_THIRD_PARTY = ["static.cloudflareinsights.com"];
const KB = 1024;

/** Blocks the analytics beacon (no network in tests) but keeps a record of it. */
async function blockBeacon(page) {
  await page.route(/cloudflareinsights\.com/, (route) => route.abort());
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("index: the Lager list is complete, contact works, every data-bind has a value", async ({ page }) => {
    await blockBeacon(page);
    await page.goto("/");
    const items = page.locator("#lager-static li");
    await expect(items).toHaveCount(TOTAL);
    await expect(page.locator("#lager-static")).toBeVisible();
    const hrefs = await page.locator("#lager-static li a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs).toHaveLength(TOTAL);
    for (const href of hrefs) expect(href, "external link per item").toMatch(/^https:\/\//);
    // every project's link appears (order = JSON order)
    expect(hrefs).toEqual(PROJECTS.map((p) => p.link));
    await expect(page.locator(".contact-mail")).toBeVisible();
    await expect(page.locator(".contact-mail")).toHaveAttribute("href", "mailto:hyper.xjo@gmail.com");
    const binds = await page.locator("[data-bind]").evaluateAll((els) => els.map((e) => [e.dataset.bind, e.textContent.trim()]));
    expect(binds.length, "index.html uses data-bind").toBeGreaterThan(0);
    for (const [key, text] of binds) expect(text, `data-bind="${key}"`).not.toBe("");
    const total = binds.find(([k]) => k === "projects.total");
    if (total) expect(total[1]).toBe(String(TOTAL));
    const repos = binds.find(([k]) => k === "repos.total");
    if (repos) expect(repos[1]).toBe(String(SNAPSHOT.github.ownPublicRepos));
  });

  test("404.html renders and links back to the workshop", async ({ page }) => {
    const res = await page.goto("/404.html");
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('a[href="/"], a[href="https://lmf.logge.top/"], a[href="./"]').first()).toBeVisible();
  });
});

test("data failure: projects.json down keeps the static list, contact and GitHub recovery", async ({ page }) => {
  await blockBeacon(page);
  await page.route("**/data/projects.json", (route) => route.fulfill({ status: 500, body: "nope" }));
  await page.goto("/");
  await expect(page.locator("#project-count")).toContainText("nicht geladen");
  await expect(page.locator("#lager-static li")).toHaveCount(TOTAL);
  await expect(page.locator("#lager-static")).toBeVisible();
  await expect(page.locator('#projects-container a[href="https://github.com/LoggeL"]')).toBeVisible();
  await expect(page.locator(".contact-mail")).toBeVisible();
});

test("lib/data.js: a failing file nulls only its own key (allSettled)", async ({ page }) => {
  await blockBeacon(page);
  await page.route("**/data/films.json", (route) => route.fulfill({ status: 404, body: "" }));
  await page.route("**/data/repos.json", (route) => route.fulfill({ status: 200, body: "{not json" }));
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { loadData } = await import("/js/lib/data.js");
    const data = await loadData({ fresh: true });
    const before = { failed: [...data.failed], theater: data.bindings["theater.commitsLogge"] ?? null, partners: data.partners ?? null };
    await data.need(); // lazy files + chapter anchors (spec §8)
    const d = await data.details.get("melodai");
    const missing = await data.details.get("does-not-exist");
    return {
      projects: data.projects?.length ?? null,
      films: data.films,
      repos: data.repos,
      failed: data.failed,
      byId: data.byId.has("melodai"),
      total: data.bindings["projects.total"],
      reposTotal: data.bindings["repos.total"] ?? null,
      theater: data.bindings["theater.commitsLogge"] ?? null,
      details: d?.id ?? null,
      detailSources: d?.sources?.length ?? 0,
      missing,
      before,
      partners: data.partners?.length ?? null,
      milestones: data.milestones?.length ?? null,
    };
  });
  // core only before need(): films + repos failed, lazy keys not tried yet (not "failed")
  expect(result.before.failed.sort()).toEqual(["films", "repos"]);
  expect(result.before.partners).toBeNull();
  expect(result.partners).toBeGreaterThan(0);
  expect(result.milestones).toBeGreaterThan(0);
  expect(result.projects).toBe(TOTAL);
  expect(result.films).toBeNull();
  expect(result.repos).toBeNull();
  expect(result.failed.sort()).toEqual(["films", "repos"]);
  expect(result.byId).toBe(true);
  expect(result.total).toBe(TOTAL);
  expect(result.reposTotal).toBeNull();
  expect(result.theater).not.toBeNull();
  expect(result.details).toBe("melodai");
  expect(result.detailSources).toBeGreaterThan(0);
  expect(result.missing).toBeNull();
});

test("data before load: only the core data files load at boot (spec §8)", async ({ page }) => {
  // Sections one viewport ahead may mount right after `load` + idle; before `load` only core data.
  const dataFiles = [];
  const beforeLoad = [];
  let loaded = false;
  page.on("request", (req) => {
    const path = new URL(req.url()).pathname;
    if (!/\.json$/.test(path)) return;
    dataFiles.push(path);
    if (!loaded) beforeLoad.push(path);
  });
  await blockBeacon(page);
  await page.goto("/", { waitUntil: "load" });
  loaded = true;
  const { CORE_KEYS, DATA_FILES } = await page.evaluate(async () => {
    const m = await import("/js/lib/data.js");
    return { CORE_KEYS: m.CORE_KEYS, DATA_FILES: m.DATA_FILES };
  });
  const core = CORE_KEYS.map((k) => `/${DATA_FILES[k]}`);
  const lazy = Object.entries(DATA_FILES).filter(([k]) => !CORE_KEYS.includes(k)).map(([, f]) => `/${f}`);
  for (const f of ["/data/projects.json", "/data/snapshot.json"]) expect(beforeLoad, `${f} loads at boot`).toContain(f);
  expect(beforeLoad.filter((f) => !core.includes(f)), "only core data before load").toEqual([]);
  // scrolling to the bottom brings the lazy files (their sections mount)
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 800) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(40);
  }
  await expect.poll(() => lazy.filter((f) => dataFiles.includes(f)).length, { timeout: 10000 }).toBe(lazy.length);
});

test("privacy: scrolling the whole page makes no third-party requests", async ({ page }) => {
  const foreign = [];
  page.on("request", (req) => {
    const host = new URL(req.url()).host;
    if (host && host !== SELF && !ALLOWED_THIRD_PARTY.some((h) => host.endsWith(h))) foreign.push(req.url());
  });
  await blockBeacon(page);
  await page.goto("/", { waitUntil: "load" });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 600) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(800);
  expect(foreign, "requests to hosts other than self + Cloudflare beacon").toEqual([]);
});

test("budgets before load: JS ≤ 45 KB gz, CSS ≤ 24 KB gz, fonts ≤ 125 KB, HTML ≤ 20 KB gz", async ({ page }) => {
  const seen = [];
  let loaded = false;
  page.on("response", (res) => {
    if (loaded) return;
    const url = new URL(res.url());
    if (url.host !== SELF || res.status() !== 200) return;
    seen.push(res);
  });
  await blockBeacon(page);
  await page.goto("/", { waitUntil: "load" });
  loaded = true;
  const bodies = [];
  for (const res of seen) {
    try {
      bodies.push({ url: new URL(res.url()).pathname, type: res.request().resourceType(), body: await res.body() });
    } catch {
      /* body unavailable */
    }
  }
  const gz = (b) => gzipSync(b, { level: 9 }).length;
  const sum = (type, fn) => bodies.filter((b) => b.type === type).reduce((s, b) => s + fn(b.body), 0);
  const js = sum("script", gz);
  const css = sum("stylesheet", gz);
  const fonts = sum("font", (b) => b.length);
  const html = gzipSync(readFileSync(new URL("../index.html", import.meta.url)), { level: 9 }).length;
  const report = `JS ${(js / KB).toFixed(1)} KB gz · CSS ${(css / KB).toFixed(1)} KB gz · fonts ${(fonts / KB).toFixed(1)} KB · HTML ${(html / KB).toFixed(1)} KB gz`;
  test.info().annotations.push({ type: "budget", description: report });
  console.log(report);
  expect.soft(js, `JS before load (${report})`).toBeLessThanOrEqual(45 * KB);
  expect.soft(css, `CSS before load (${report})`).toBeLessThanOrEqual(24 * KB); // re-baselined by the lead, spec §8
  expect.soft(fonts, `fonts (${report})`).toBeLessThanOrEqual(125 * KB);
  expect.soft(html, `index.html (${report})`).toBeLessThanOrEqual(20 * KB); // re-baselined by the lead, spec §8
});

test("CSS budgets on disk: render-blocking ≤ 70 KB / 18 KB gz, all non-lazy sheets ≤ 195 KB / 48 KB gz (spec §8)", async () => {
  // The first check above stops at `load`; the section sheets arrive right after it on every visit,
  // so they count too. Lazy = werkbank.css + probes.css only.
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const noscript = /<noscript id="nojs-sheets">([\s\S]*?)<\/noscript>/.exec(html)?.[1] ?? "";
  const hrefs = (src) => [...src.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
  const blocking = hrefs(html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/g, ""));
  const all = [...new Set([...blocking, ...hrefs(noscript)])];
  expect(all.length).toBeGreaterThanOrEqual(12);
  const size = (files, fn) => files.reduce((s, f) => s + fn(readFileSync(new URL(`../${f}`, import.meta.url))), 0);
  const gz = (b) => gzipSync(b, { level: 9 }).length;
  const report = (files) => `${(size(files, (b) => b.length) / KB).toFixed(1)} KB raw / ${(size(files, gz) / KB).toFixed(1)} KB gz`;
  test.info().annotations.push({ type: "budget", description: `render-blocking ${report(blocking)} · all non-lazy ${report(all)}` });
  expect.soft(size(blocking, (b) => b.length), `render-blocking ${report(blocking)}`).toBeLessThanOrEqual(70 * KB);
  expect.soft(size(blocking, gz), `render-blocking ${report(blocking)}`).toBeLessThanOrEqual(18 * KB);
  expect.soft(size(all, (b) => b.length), `all non-lazy ${report(all)}`).toBeLessThanOrEqual(195 * KB);
  expect.soft(size(all, gz), `all non-lazy ${report(all)}`).toBeLessThanOrEqual(48 * KB);
});

test("data budgets on disk: projects.json ≤ 40 KB, snapshot ≤ 2 KB, repos ≤ 12 KB, details ≤ 6 KB each", async () => {
  const size = (p) => readFileSync(new URL(`../${p}`, import.meta.url)).length;
  expect(size("data/projects.json")).toBeLessThanOrEqual(40 * 1000);
  expect(size("data/snapshot.json")).toBeLessThanOrEqual(2 * KB);
  expect(size("data/repos.json")).toBeLessThanOrEqual(12 * KB);
  for (const p of PROJECTS.filter((x) => x.details)) {
    const s = size(`data/details/${p.id}.json`);
    expect.soft(s, `details/${p.id}.json`).toBeLessThanOrEqual(6 * KB);
  }
});
