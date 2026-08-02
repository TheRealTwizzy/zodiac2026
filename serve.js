#!/usr/bin/env node
/* Minimal static server — no dependencies, node's built-ins only.
 *
 *   node serve.js            -> http://localhost:8080
 *   node serve.js 3000       -> http://localhost:3000
 *
 * Works the same from PowerShell, cmd or a POSIX shell — node's path handling
 * normalises separators, and nothing here shells out.
 *
 * You don't strictly need this: opening index.html straight off disk
 * works too. It's here because a couple of browser behaviours (pushState
 * section history, localStorage) are restricted on file:// in some browsers,
 * and serving over http gets you the real thing.
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 8080;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".ico":  "image/x-icon",
  ".md":   "text/markdown; charset=utf-8"
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }

  if (pathname === "/") pathname = "/index.html";

  // Resolve inside ROOT only. path.relative rather than startsWith: a plain
  // prefix test also accepts a sibling like "<root>-evil", and on Windows it
  // would compare mixed separators and drive-letter casing.
  const abs = path.resolve(ROOT, "." + pathname);
  const rel = path.relative(ROOT, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.stat(abs, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
         .end("Not found: " + pathname);
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(abs).toLowerCase()] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": "no-cache"
    });
    fs.createReadStream(abs).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log("Cosmic Atlas -> http://localhost:" + PORT + "/");
  console.log("Serving " + ROOT);
  console.log("Ctrl-C to stop.");
});
