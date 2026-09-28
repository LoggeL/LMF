#!/usr/bin/env node
/**
 * scripts/serve.mjs — tiny static dev server (dev only, no dependencies).
 *
 * Why not `python3 -m http.server`: its listen backlog is 5, so Playwright's parallel workers
 * get ERR_CONNECTION_RESET on CSS, modules and data files. This server listens with a large
 * backlog, sends no-store headers (edits show up on reload) and answers unknown paths with
 * 404.html like GitHub Pages does.
 *
 *   node scripts/serve.mjs            → http://127.0.0.1:4173
 *   PORT=4180 node scripts/serve.mjs  → another port (playwright.config.js reads LMF_PORT)
 */
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT ?? process.env.LMF_PORT ?? 4173);
const HOST = process.env.HOST ?? "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function fileFor(pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const abs = normalize(join(ROOT, rel));
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return null;
  try {
    const st = statSync(abs);
    if (st.isDirectory()) {
      const index = join(abs, "index.html");
      return statSync(index).isFile() ? { path: index, size: statSync(index).size } : null;
    }
    return st.isFile() ? { path: abs, size: st.size } : null;
  } catch {
    return null;
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}`);
  // Directory without trailing slash → redirect, so relative URLs resolve (like GitHub Pages).
  if (!url.pathname.endsWith("/") && !extname(url.pathname)) {
    const dir = fileFor(url.pathname + "/");
    if (dir) {
      res.writeHead(301, { Location: url.pathname + "/" + url.search });
      return res.end();
    }
  }
  let file = fileFor(url.pathname);
  let status = 200;
  if (!file) {
    file = fileFor("/404.html");
    status = 404;
  }
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("404");
  }
  res.writeHead(status, {
    "Content-Type": TYPES[extname(file.path).toLowerCase()] ?? "application/octet-stream",
    "Content-Length": file.size,
    "Cache-Control": "no-store",
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(file.path).pipe(res);
});

server.keepAliveTimeout = 5000;
server.listen({ port: PORT, host: HOST, backlog: 1024 }, () => {
  console.log(`LMF dev server: http://${HOST}:${PORT}/`);
});
