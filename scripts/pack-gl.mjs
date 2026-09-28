#!/usr/bin/env node
/**
 * Packs the Esse GL group into one small module  [WP3] — spec §8 „esse GL ≤ 9 KB gz“.
 *
 *   node scripts/pack-gl.mjs          writes js/gl/esse.pack.js
 *   node scripts/pack-gl.mjs --check  exits 1 when the committed pack is stale
 *
 * Sources stay the readable truth: js/gl/esse.js, shaders.js, gl.js, sparks.js. The page only ever
 * loads the pack (js/sections/esse.js → import("../gl/esse.pack.js")). No dependencies: a tiny
 * tokenizer strips comments and whitespace (no renaming, so every property the tests poke at stays),
 * and the three helper modules are inlined as scopes. tests/fire.spec.js fails when the pack is stale
 * or over budget, so an edit to a source without re-packing never ships silently.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");
export const OUT = "js/gl/esse.pack.js";
const ENTRY = "js/gl/esse.js";
const DEPS = { "./gl.js": "js/gl/gl.js", "./shaders.js": "js/gl/shaders.js", "./sparks.js": "js/gl/sparks.js" };

const WORD = /[\w$]/;
const REGEX_AFTER = new Set([..."(,=:[!&|?{};+-*%<>~^"]);
const REGEX_KW = new Set(["return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "yield", "await"]);

/** Strips comments and whitespace. Keeps a newline wherever the source had one (no ASI surprises). */
export function minify(src) {
  let out = "";
  let i = 0;
  let last = ""; // last significant token (for regex detection)
  const emit = (tok, gapHadNewline, hadGap) => {
    const a = out.at(-1) ?? "";
    const b = tok[0];
    if (gapHadNewline && out) out += "\n";
    else if (hadGap && ((WORD.test(a) && WORD.test(b)) || ("+-".includes(a) && a === b) || (a === "/" && "/*".includes(b)))) out += " ";
    out += tok;
    last = tok;
  };
  const scanTemplate = () => {
    // i at the opening backtick; returns the literal with ${…} expressions minified
    let s = "`";
    i++;
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") (s += src.slice(i, i + 2)), (i += 2);
      else if (c === "`") return (i++, s + "`");
      else if (c === "$" && src[i + 1] === "{") {
        i += 2;
        let depth = 1;
        const start = i;
        // find the matching brace, skipping strings and nested templates
        while (i < src.length && depth) {
          const d = src[i];
          if (d === "{") depth++;
          else if (d === "}") depth--;
          else if (d === '"' || d === "'") {
            const q = d;
            for (i++; i < src.length && src[i] !== q; i++) if (src[i] === "\\") i++;
          } else if (d === "`") {
            scanTemplate();
            continue;
          }
          i++;
        }
        s += "${" + minify(src.slice(start, i - 1)) + "}";
      } else (s += c), i++;
    }
    throw new Error("unterminated template");
  };
  while (i < src.length) {
    let gap = false;
    let nl = false;
    for (;;) {
      const c = src[i];
      if (c === undefined) break;
      if (/\s/.test(c)) {
        gap = true;
        if (c === "\n") nl = true;
        i++;
      } else if (c === "/" && src[i + 1] === "/") {
        gap = true;
        while (i < src.length && src[i] !== "\n") i++;
      } else if (c === "/" && src[i + 1] === "*") {
        const end = src.indexOf("*/", i + 2);
        if (end < 0) throw new Error("unterminated comment");
        if (src.slice(i, end).includes("\n")) nl = true;
        gap = true;
        i = end + 2;
      } else break;
    }
    if (i >= src.length) break;
    const c = src[i];
    let tok;
    if (c === '"' || c === "'") {
      let j = i + 1;
      for (; j < src.length && src[j] !== c; j++) if (src[j] === "\\") j++;
      tok = src.slice(i, j + 1);
      i = j + 1;
    } else if (c === "`") tok = scanTemplate();
    else if (c === "/" && (!last || REGEX_AFTER.has(last.at(-1)) || REGEX_KW.has(last))) {
      let j = i + 1;
      let cls = false;
      for (; j < src.length; j++) {
        const d = src[j];
        if (d === "\\") j++;
        else if (d === "[") cls = true;
        else if (d === "]") cls = false;
        else if (d === "/" && !cls) break;
      }
      j++;
      while (WORD.test(src[j] ?? "")) j++;
      tok = src.slice(i, j);
      i = j;
    } else if (WORD.test(c) || (c === "." && /\d/.test(src[i + 1] ?? ""))) {
      let j = i + 1;
      while (j < src.length && (WORD.test(src[j]) || (src[j] === "." && /^\d/.test(src.slice(i, j)) && !src.slice(i, j).includes(".")))) j++;
      tok = src.slice(i, j);
      i = j;
    } else {
      tok = c;
      i++;
    }
    // a newline is only needed where ASI could matter: between two word/closing tokens
    const a = out.at(-1) ?? "";
    const keepNl = nl && !"{([,;:=?&|+*<>!".includes(a) && !"})],;.:=?&|+*<>".includes(tok[0]);
    emit(tok, keepNl, gap);
  }
  return out;
}

const exportsOf = (src) => [...src.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([\w$]+)/gm)].map((m) => m[1]);

/** Builds the pack source (string). */
export function pack() {
  let entry = read(ENTRY);
  const scopes = [];
  entry = entry.replace(/^import\s+(\*\s+as\s+([\w$]+)|\{([^}]*)\})\s+from\s+"(\.\/[\w.-]+)";\n/gm, (_, __, ns, names, from) => {
    const file = DEPS[from];
    if (!file) throw new Error(`pack-gl: unknown local import ${from}`);
    let dep = read(file);
    if (/^import\s/m.test(dep)) throw new Error(`pack-gl: ${file} must not import`);
    const ex = exportsOf(dep);
    dep = dep.replace(/^export\s+/gm, "");
    const id = `__${from.replace(/\W/g, "")}`;
    if (!scopes.some((s) => s.id === id)) scopes.push({ id, code: `const ${id}=(()=>{${minify(dep)}\nreturn{${ex.join(",")}}})();` });
    return ns ? `const ${ns} = ${id};\n` : `const {${names}} = ${id};\n`;
  });
  const external = [];
  entry = entry.replace(/^import\s+[^;]+from\s+"\.\.\/[^"]+";\n/gm, (m) => (external.push(m.trim()), ""));
  const head = `// Generated by scripts/pack-gl.mjs from js/gl/esse.js, shaders.js, gl.js, sparks.js. Do not edit; edit the sources and re-run it.\n`;
  return head + external.map(minify).join("\n") + "\n" + scopes.map((s) => s.code).join("\n") + "\n" + minify(entry) + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = pack();
  const cur = (() => {
    try {
      return read(OUT);
    } catch {
      return "";
    }
  })();
  const gz = gzipSync(next, { level: 9 }).length;
  if (process.argv.includes("--check")) {
    if (cur !== next) {
      console.error(`${OUT} is stale: run node scripts/pack-gl.mjs`);
      process.exit(1);
    }
    console.log(`${OUT} up to date (${next.length} B raw, ${gz} B gz)`);
  } else {
    writeFileSync(new URL(OUT, ROOT), next);
    console.log(`${OUT}: ${next.length} B raw, ${gz} B gz (budget 9216)`);
  }
}
