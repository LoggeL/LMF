#!/usr/bin/env node
/**
 * Packs the Probestücke into two small modules  [WP4] — spec §8 „probes ≤ 22 KB gz total“.
 *
 *   node scripts/pack-probes.mjs          writes js/probes/index.js and js/probes/werk.js
 *   node scripts/pack-probes.mjs --check  exits 1 when a committed pack is stale
 *
 * Sources stay the readable truth in js/probes/src/. The page (meister.js, the Werkbank, the
 * scripts that read PROBE_IDS) only ever loads the packs:
 *   js/probes/index.js     registry + Saalplan, Bomberman, Mixer (the three the chapters mount,
 *                          one request instead of four; gzip shares one dictionary)
 *   js/probes/werk.js      Hashsuche + Jahresregler, only for their Werkbank pages; imports the
 *                          helpers from ./index.js
 *                          and carries the Hashsuche worker as a Blob (one file less)
 * No dependencies: the comment and whitespace stripper from scripts/pack-gl.mjs (no renaming, so
 * every property the tests poke at stays), each probe module inlined as a scope whose exports are
 * live getters (Jahresregler rewrites its CHIP after loading its data).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { minify } from "./pack-gl.mjs";

const ROOT = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");
const SRC = "js/probes/src/";
export const CHAPTER = ["saalplan", "bomberman", "mixer"];
export const WERK = ["hashsuche", "jahresregler"];
export const OUT = { index: "js/probes/index.js", werk: "js/probes/werk.js" };
const WORKER_NEW = 'new Worker(new URL("./hash-worker.js", import.meta.url))';
/** §8: probes ≤ 22 KB gz, all shipped probe files together (1 KB = 1024 B). */
export const BUDGET = 22 * 1024;

const PUBLIC = ["mount", "KIND", "CHIP"];
const HELPERS = /^import\s*\{([^}]*)\}\s*from\s*"\.\/index\.js";\n/m;
const exportsOf = (src) => [...src.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([\w$]+)/gm)].map((m) => m[1]);

/** One probe module as a scope: `const __name=(()=>{…;return{get mount(){return mount},…}})();` */
function scope(name) {
  let src = read(`${SRC}${name}.js`);
  const helpers = HELPERS.exec(src);
  src = src.replace(HELPERS, "");
  if (/^import\s/m.test(src)) throw new Error(`pack-probes: ${name}.js may only import helpers from ./index.js`);
  // the page only uses a probe's mount/KIND/CHIP (the unit tests import the sources)
  const ex = exportsOf(src).filter((n) => PUBLIC.includes(n));
  src = src.replace(/^export\s+/gm, "");
  const getters = ex.map((n) => `get ${n}(){return ${n}}`).join(",");
  return { name, helpers: helpers ? helpers[1].split(",").map((s) => s.trim()).filter(Boolean) : [], code: `const __${name}=(()=>{${minify(src)}\nreturn{${getters}}})();` };
}

/** Builds the three pack sources. */
export function pack() {
  // short on purpose: the header counts against the budget too
  const head = () => "// built by scripts/pack-probes.mjs from src/\n";
  let registry = read(`${SRC}index.js`);
  registry = registry.replace(/import\("\.\/([\w-]+)\.js"\)/g, (m, name) => {
    if (CHAPTER.includes(name)) return `Promise.resolve(__${name})`;
    if (WERK.includes(name)) return `import("./werk.js").then((m) => m.${name})`;
    throw new Error(`pack-probes: unknown probe module ${name}`);
  });
  if (/^import\s/m.test(registry)) throw new Error("pack-probes: src/index.js must not import");
  const index = head() + minify(registry) + "\n" + CHAPTER.map((n) => scope(n).code).join("\n") + "\n";

  const werkScopes = WERK.map(scope);
  const need = [...new Set(werkScopes.flatMap((s) => s.helpers))];
  const worker = `const WORKER=${JSON.stringify(minify(read(`${SRC}hash-worker.js`)))};let workerUrl;const hashWorker=()=>new Worker(workerUrl??=URL.createObjectURL(new Blob([WORKER],{type:"text/javascript"})));`;
  const werkCode = werkScopes.map((s) => s.code).join("\n");
  if (!werkCode.includes(minify(WORKER_NEW))) throw new Error("pack-probes: hashsuche.js no longer starts its worker as expected");
  const werk =
    head() +
    (need.length ? `import{${need.join(",")}}from"./index.js";\n` : "") +
    worker +
    "\n" +
    werkCode.replace(minify(WORKER_NEW), "hashWorker()") +
    `\nexport{${WERK.map((n) => `__${n} as ${n}`).join(",")}};\n`;
  // indentation inside HTML template literals is the only whitespace left after minify()
  const tidy = (s) => s.replace(/\n[ \t]+/g, "\n");
  return { index: tidy(index), werk: tidy(werk) };
}

export const gz = (s) => gzipSync(s, { level: 9 }).length;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = pack();
  const cur = (p) => {
    try {
      return read(p);
    } catch {
      return "";
    }
  };
  const total = Object.values(next).reduce((n, s) => n + gz(s), 0);
  if (process.argv.includes("--check")) {
    const stale = Object.keys(OUT).filter((k) => cur(OUT[k]) !== next[k]);
    if (stale.length) {
      console.error(`${stale.map((k) => OUT[k]).join(", ")} stale: run node scripts/pack-probes.mjs`);
      process.exit(1);
    }
    console.log(`probe packs up to date (${total} B gz, budget ${BUDGET})`);
  } else {
    for (const k of Object.keys(OUT)) {
      writeFileSync(new URL(OUT[k], ROOT), next[k]);
      console.log(`${OUT[k]}: ${next[k].length} B raw, ${gz(next[k])} B gz`);
    }
    console.log(`total ${total} B gz (budget ${BUDGET})${total > BUDGET ? "  OVER BUDGET" : ""}`);
  }
}
