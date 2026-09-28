/**
 * WP3 · Fire — Esse hero, heat grammar, projector (spec §5.1, §5.2, §5.8, §7.3 fire.spec.js).
 * WebGL runs on SwiftShader in headless Chromium, so the GL paths are exercised for real.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

test.use({
  launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
  // FIRE_BASE lets a run use a private dev server when the shared one is busy
  ...(process.env.FIRE_BASE ? { baseURL: process.env.FIRE_BASE } : {}),
});

// Third-party hosts (Cloudflare beacon, YouTube) are aborted: `load` must not wait on the network.
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
  if (process.env.FIRE_DEBUG) {
    page.on("requestfailed", (r) => console.log("FAILED", r.url(), r.failure()?.errorText));
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
    page.on("console", (m) => m.type() === "warning" && console.log("WARN", m.text().slice(0, 160)));
  }
});

const REPOS = JSON.parse(readFileSync(new URL("../data/repos.json", import.meta.url), "utf8"));
const SNAP = JSON.parse(readFileSync(new URL("../data/snapshot.json", import.meta.url), "utf8"));
const FILMS = JSON.parse(readFileSync(new URL("../data/films.json", import.meta.url), "utf8"));
const SKI = (Array.isArray(FILMS) ? FILMS : FILMS.films).filter((f) => f.series === "ski" && f.youtubeId);
const MINE = /\/js\/(gl|fx)\/|\/js\/sections\/(esse|film)\.js/;

/** Page errors that come from WP3 code (other packages are tested in their own specs). */
function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => {
    if (MINE.test(`${e.stack ?? ""}`) || /esse|forge|projector|WebGL/i.test(e.message)) errors.push(e.message);
  });
  return errors;
}
const glRequests = (page) => {
  const list = [];
  page.on("request", (r) => /\/js\/gl\//.test(r.url()) && list.push(r.url()));
  return list;
};
const waitFrames = (page, n = 5) => page.waitForFunction((k) => (window.__lmfEsse?.ctl?.frames ?? 0) > k, n, { timeout: 30_000 });

test.describe("Esse", () => {
  test("calm (reduced motion): no GL request, strike hidden, poster visible", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = watchErrors(page);
    const gl = glRequests(page);
    await page.goto("/");
    await page.waitForFunction(() => document.querySelector("#esse")?.hasAttribute("data-mounted"), null, { timeout: 20_000 });
    await page.waitForTimeout(800);
    expect(gl).toEqual([]);
    await expect(page.locator("#strike")).toBeHidden();
    await expect(page.locator(".esse-poster")).toBeVisible();
    await expect(page.locator(".esse-canvas")).toHaveCount(0);
    // the rendered poster (real embers) is painted into a canvas, and the caption says what it shows
    await expect(page.locator(".esse-still")).toHaveCount(1);
    await expect(page.locator(".esse-caption")).toContainText(`${REPOS.repos.length} öffentliche Repos`);
    expect(errors).toEqual([]);
  });

  test("motion toggle paused before load: no GL module either", async ({ page }) => {
    const gl = glRequests(page);
    await page.addInitScript(() => localStorage.setItem("lmf-motion", "paused"));
    await page.goto("/");
    await page.waitForFunction(() => document.querySelector("#esse")?.hasAttribute("data-mounted"), null, { timeout: 20_000 });
    await page.waitForTimeout(600);
    expect(gl).toEqual([]);
    await expect(page.locator("#strike")).toBeHidden();
  });

  test("WebGL2 unavailable → poster, no page errors", async ({ page }) => {
    const errors = watchErrors(page);
    await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        return type === "webgl2" || type === "webgl" ? null : get.call(this, type, ...rest);
      };
    });
    const glReqs = [];
    page.on("request", (r) => /\/js\/gl\//.test(r.url()) && glReqs.push(r.url()));
    await page.goto("/");
    await page.waitForFunction(() => document.querySelector("#esse")?.hasAttribute("data-mounted"), null, { timeout: 20_000 });
    await page.waitForTimeout(800);
    expect(glReqs, "no GL module is fetched without WebGL").toEqual([]);
    await expect(page.locator(".esse-canvas")).toHaveCount(0);
    await expect(page.locator(".esse-poster")).toBeVisible();
    await expect(page.locator("#strike")).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("float colour buffers missing → RGBA8 heat field renders", async ({ page }) => {
    const errors = watchErrors(page);
    await page.addInitScript(() => {
      const get = WebGL2RenderingContext.prototype.getExtension;
      WebGL2RenderingContext.prototype.getExtension = function (name) {
        return /^EXT_color_buffer_(half_)?float$/.test(name) ? null : get.call(this, name);
      };
    });
    await page.goto("/");
    await waitFrames(page);
    expect(await page.evaluate(() => window.__lmfEsse.ctl.format)).toBe("RGBA8");
    await expect(page.locator(".esse-canvas.is-live")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("live panel: embers, year scale, strike button and the three-strike stamp", async ({ page }) => {
    const errors = watchErrors(page);
    await page.addInitScript(() => {
      window.__strikes = [];
      document.addEventListener("forge:strike", (e) => window.__strikes.push(e.detail.n));
    });
    await page.goto("/");
    await waitFrames(page);
    expect(["RG16F", "RGBA8"]).toContain(await page.evaluate(() => window.__lmfEsse.ctl.format));
    // intro: three strikes, then cooled
    await page.waitForFunction(() => window.__strikes.length >= 3, null, { timeout: 30_000 });
    expect(await page.evaluate(() => window.__strikes.slice(0, 3))).toEqual([1, 2, 3]);
    // year scale = every year from the first repo to asOf
    const y0 = Math.min(...REPOS.repos.map((r) => +r.c.slice(0, 4)));
    await expect(page.locator(".esse-tick")).toHaveCount(+SNAP.asOf.slice(0, 4) - y0 + 1);
    await expect(page.locator(".esse-panel")).toHaveAttribute("data-embers", "");
    // strike button: visible, rate-limited, every third strike stamps „Gemacht.“
    const strike = page.locator("#strike");
    await expect(strike).toBeVisible();
    await expect(strike).toHaveAttribute("aria-describedby", "strike-hint");
    await page.waitForTimeout(700); // strikes are ≥ 500 ms apart (no flashes > 2/s)
    await page.evaluate(() => {
      window.__strikes = [];
      document.querySelector(".hero-stamp").classList.remove("is-stamped");
    });
    for (let i = 0; i < 3; i++) {
      await strike.click();
      await page.waitForTimeout(650);
    }
    expect(await page.evaluate(() => window.__strikes)).toEqual([1, 2, 3]);
    // the strike landed on the metal (finite coordinates → no NaN in the shader)
    const flash = await page.evaluate(() => window.__lmfEsse.ctl.forge.st.flash.slice(0, 2));
    expect(flash.every(Number.isFinite)).toBe(true);
    await expect(page.locator(".hero-stamp")).toHaveClass(/is-stamped/);
    expect(errors).toEqual([]);
  });

  test("motion toggle stops the rAF loop (0 frames over 2 s) and resumes it", async ({ page }) => {
    await page.goto("/");
    await waitFrames(page);
    await page.locator("#motion-toggle").click();
    await page.waitForTimeout(500);
    const a = await page.evaluate(() => window.__lmfEsse.ctl.frames);
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => window.__lmfEsse.ctl.frames)).toBe(a);
    await expect(page.locator("#strike")).toBeHidden();
    await expect(page.locator(".esse-canvas")).toBeVisible(); // one static frame stays
    await page.locator("#motion-toggle").click();
    await page.waitForFunction((k) => window.__lmfEsse.ctl.frames > k + 3, a, { timeout: 15_000 });
    await expect(page.locator("#strike")).toBeVisible();
  });

  test("context loss falls back to the poster and recovers on restore", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await waitFrames(page);
    await page.evaluate(() => {
      window.__lose = window.__lmfEsse.ctl.loseContext();
      window.__lose.loseContext();
    });
    await expect(page.locator(".esse-canvas")).not.toHaveClass(/is-live/);
    await expect(page.locator(".esse-panel")).not.toHaveAttribute("data-gl", "");
    await expect(page.locator(".esse-poster")).toBeVisible();
    const a = await page.evaluate(() => window.__lmfEsse.ctl.frames);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__lmfEsse.ctl.frames)).toBe(a);
    await page.evaluate(() => window.__lose.restoreContext());
    await page.waitForFunction((k) => window.__lmfEsse.ctl.frames > k + 3, a, { timeout: 15_000 });
    await expect(page.locator(".esse-canvas.is-live")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("no js/gl/ request before the load event", async ({ page }) => {
    await page.goto("/");
    await waitFrames(page, 1);
    const early = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return performance
        .getEntriesByType("resource")
        .filter((r) => /\/js\/gl\//.test(r.name) && r.startTime < nav.loadEventEnd)
        .map((r) => r.name);
    });
    expect(early).toEqual([]);
  });

  test("the LCP element is the H1", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
    const id = await page.evaluate(
      () =>
        new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const el = entries.at(-1)?.element;
            resolve(el?.closest("#hero-title")?.id ?? el?.id ?? el?.tagName ?? null);
          }).observe({ type: "largest-contentful-paint", buffered: true });
        }),
    );
    expect(id).toBe("hero-title");
  });

  test("mounting the Esse never changes the panel height (CLS budget §8)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addInitScript(() => {
      window.__h = [];
      const tick = () => {
        const p = document.querySelector(".esse-panel");
        if (p) window.__h.push(Math.round(p.getBoundingClientRect().height));
        if (window.__h.length < 400) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto("/");
    await waitFrames(page);
    const h = await page.evaluate(() => [...new Set(window.__h)]);
    expect(h).toHaveLength(1);
  });

  test("cooled and idle, the Esse drops to the ember-flicker clock (≤ 30 fps)", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__lmfEsse?.ctl?.forge?.st?.introDone, null, { timeout: 30_000 });
    await page.waitForTimeout(3500); // the last strike's heat fades (~3 s)
    const a = await page.evaluate(() => window.__lmfEsse.ctl.frames);
    await page.waitForTimeout(2000);
    const n = (await page.evaluate(() => window.__lmfEsse.ctl.frames)) - a;
    expect(n).toBeGreaterThan(5); // still flickering
    expect(n).toBeLessThanOrEqual(62);
  });

  test("the lazy Esse GL group is packed, fresh and within budget (§8: ≤ 9 KB gz)", async ({ page }) => {
    const { pack, OUT } = await import("../scripts/pack-gl.mjs");
    const shipped = readFileSync(new URL(`../${OUT}`, import.meta.url), "utf8");
    expect(shipped, "js/gl/esse.pack.js is stale: run node scripts/pack-gl.mjs").toBe(pack());
    // everything the lazy import pulls in that the page has not loaded already
    const loaded = new Set();
    page.on("response", (r) => loaded.add(new URL(r.url()).pathname));
    await page.goto("/");
    await page.waitForFunction(() => window.__lmfEsse?.ctl?.forge, null, { timeout: 30_000 });
    expect([...loaded].filter((u) => /^\/js\/gl\//.test(u))).toEqual(["/js/gl/esse.pack.js"]);
    expect(gzipSync(shipped, { level: 9 }).length).toBeLessThanOrEqual(9 * 1024);
  });
});

test.describe("Heat grammar", () => {
  test("a pressed button throws sparks, calm throws none", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => document.querySelector("#esse")?.hasAttribute("data-mounted"), null, { timeout: 20_000 });
    await page.evaluate(() => {
      const b = document.createElement("button");
      b.className = "button";
      b.id = "t-anvil";
      b.dataset.heat = "";
      b.textContent = "Amboss";
      b.style.cssText = "position:fixed;left:40px;top:120px;z-index:9";
      document.body.append(b);
    });
    const button = page.locator("#t-anvil");
    const box = await button.boundingBox();
    await page.mouse.move(box.x + 20, box.y + 10);
    await page.mouse.down();
    await expect(page.locator(".fx-sparks i").first()).toBeAttached();
    await page.mouse.up();
    await expect(page.locator(".fx-sparks i")).toHaveCount(0, { timeout: 3000 });
    // --mx/--my follow the pointer on [data-heat]
    expect(await button.evaluate((el) => el.style.getPropertyValue("--mx"))).toMatch(/%$/);
    await page.locator("#motion-toggle").click();
    await page.mouse.move(box.x + 30, box.y + 10);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);
    await expect(page.locator(".fx-sparks i")).toHaveCount(0);
  });
});

test.describe("Kapitel IV · Projektor", () => {
  const open = async (page) => {
    await page.goto("/");
    // the section sheets land after `load` and move #kapitel-iv; re-scroll until the projector mounts
    await expect
      .poll(
        async () => {
          await page.locator("#kapitel-iv").scrollIntoViewIfNeeded();
          return page.locator("#kapitel-iv [data-reel]").first().isVisible();
        },
        { timeout: 20_000, intervals: [250, 500, 1000] },
      )
      .toBe(true);
  };

  test("reel: one button per ski film, newest on stage, switching swaps still + quote", async ({ page }) => {
    const errors = watchErrors(page);
    await open(page);
    const reel = page.locator("#kapitel-iv [data-reel]");
    await expect(reel).toHaveCount(SKI.length);
    await expect(reel.last()).toHaveAttribute("aria-pressed", "true");
    // accessible names start with the visible text in visible order (WCAG 2.5.3)
    const zillertal = page.getByRole("button", { name: /^2022 Zillertal, 7 Minuten 54 Sekunden$/ });
    await zillertal.click();
    await expect(zillertal).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".projector-still")).toHaveAttribute("src", "assets/img/Skiing2022.webp");
    await expect(page.locator(".projector-quote")).toHaveText("„Hallo Welt“");
    await expect(page.locator(".projector-label")).toHaveText("Beschreibung auf YouTube");
    await expect(page.locator(".projector-play")).toHaveAttribute("aria-label", "Film abspielen (lädt YouTube): Zillertal");
    // Feldberg has no description: the caption row is omitted
    await page.getByRole("button", { name: /^2019 Feldberg/ }).click();
    await expect(page.locator(".projector-quote")).toHaveCount(0);
    // Portes du Soleil (9:16 film): at rest its 16:9 poster shows whole, the badge is in the name
    await page.getByRole("button", { name: /^2026 Portes du Soleil, .*Hochformat$/ }).click();
    await expect(page.locator(".projector-gate")).toHaveAttribute("data-aspect", "16:9");
    await expect(page.locator(".projector-still")).toHaveAttribute("src", "assets/img/Skiing2026.webp");
    // same srcset/sizes as the prerendered gate, so the still is fetched once at the size shown
    await expect(page.locator(".projector-still")).toHaveAttribute("srcset", /thumbs\/Skiing2026-640\.webp 640w/);
    const fit = await page.locator(".projector-still").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.width / r.height;
    });
    expect(Math.abs(fit - 16 / 9)).toBeLessThan(0.02); // the whole 16:9 poster, not a 9:16 column of sky
    expect(errors).toEqual([]);
  });

  test("phone: a 9:16 film turns the gate upright only while it plays", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route(/youtube/, (r) => r.fulfill({ status: 204, body: "" }));
    await open(page);
    await page.getByRole("button", { name: /^2026 Portes du Soleil/ }).click();
    const gate = page.locator(".projector-gate");
    await expect(gate).toHaveAttribute("data-aspect", "16:9");
    await page.locator(".projector-play").click();
    await expect(gate).toHaveAttribute("data-aspect", "9:16");
    const box = await page.locator(".projector-frame").boundingBox();
    expect(box.height).toBeGreaterThan(box.width);
    await page.getByRole("button", { name: /^2022 Zillertal/ }).click();
    await expect(gate).toHaveAttribute("data-aspect", "16:9");
  });

  test("dek and reel legend read naturally", async ({ page }) => {
    const errors = watchErrors(page);
    await open(page);
    const onJp = SKI.filter((f) => (f.alsoOn ?? []).some((a) => /jupeters\.de/.test(a.url ?? ""))).length;
    const dek = (await page.locator("#kapitel-iv .chapter-dek").innerText()).replace(/\s+/g, " ");
    if (onJp === SKI.length) {
      expect(dek).toContain(`Alle ${SKI.length} laufen auch auf jupeters.de`);
      expect(dek).not.toContain("davon");
    }
    await expect(page.locator("#kapitel-iv .projector-edge")).toHaveText(`Rolle ${SKI.length} von ${SKI.length} · ${SKI.map((f) => f.uploaded).sort().at(-1).slice(0, 4)}`);
    await expect(page.locator("#kapitel-iv .projector-edge")).toHaveAttribute("aria-hidden", "true");
    expect(errors).toEqual([]);
  });

  test("YouTube loads only after „Film abspielen“", async ({ page }) => {
    const yt = [];
    page.on("request", (r) => /youtube|ytimg|google/.test(r.url()) && yt.push(r.url()));
    await open(page);
    await page.getByRole("button", { name: /^2022 Zillertal/ }).click();
    await page.waitForTimeout(500);
    expect(yt).toEqual([]);
    await page.locator(".projector-play").click();
    const frame = page.locator(".projector-player iframe");
    await expect(frame).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/GVPzXOix2sk/);
    await expect(frame).toHaveAttribute("title", /Zillertal/);
    // fullscreen via allow= only (allowfullscreen next to it triggers a console warning)
    await expect(frame).toHaveAttribute("allow", /fullscreen/);
    expect(await frame.getAttribute("allowfullscreen")).toBeNull();
  });

  test("without WebGL the gate is static with the CSS grain", async ({ page }) => {
    const errors = watchErrors(page);
    await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        return /webgl/.test(type) ? null : get.call(this, type, ...rest);
      };
    });
    const glReqs = [];
    page.on("request", (r) => /\/js\/gl\//.test(r.url()) && glReqs.push(r.url()));
    await open(page);
    await page.waitForTimeout(800);
    expect(glReqs, "no GL module is fetched without WebGL").toEqual([]);
    await expect(page.locator(".projector-gl")).toHaveCount(0);
    await expect(page.locator(".projector-pic")).toHaveAttribute("data-grain", "");
    await expect(page.locator(".projector-still")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("calm: no projector GL module", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const gl = glRequests(page);
    await open(page);
    await page.waitForTimeout(1000);
    expect(gl.filter((u) => /projector/.test(u))).toEqual([]);
  });
});
