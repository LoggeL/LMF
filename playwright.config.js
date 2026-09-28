import { defineConfig } from "@playwright/test";

// Tests never default to 4173: that is where a hand-started dev server usually runs, often
// `python3 -m http.server` (listen backlog 5), which resets parallel workers' connections and makes
// the suite fail at random. Default 4199 → Playwright starts (or reuses) scripts/serve.mjs there.
// LMF_PORT picks another port for a private run (e.g. LMF_PORT=4180 npx playwright test).
const PORT = Number(process.env.LMF_PORT ?? 4199);
const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // Two workers: with three, a CPU shared with other jobs stretched transitions past the default
  // expect timeouts and the suite failed at random (focus-after-close, hydration waits).
  workers: 2,
  use: {
    baseURL: BASE,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node scripts/serve.mjs`,
    env: { PORT: String(PORT) },
    url: BASE,
    reuseExistingServer: !process.env.CI,
  },
});
