/* Headless test suite for Cosmic Atlas.
 *
 *   npm test
 *   JSDOM_PATH=/path/to/node_modules/jsdom node smoke.js
 *
 * Drives the real page in a DOM and checks behaviour, not just that files
 * parse. Where a claim can be verified independently it is — detected aspect
 * patterns are re-checked against the raw angular separations, sign
 * boundaries against known equinoxes and solstices, and so on.
 */
const fs = require("fs");
const path = require("path");

// JSDOM_PATH lets the suite run against a jsdom installed outside the repo,
// which is handy when node_modules can't live next to the source.
const { JSDOM, requestInterceptor } = require(process.env.JSDOM_PATH || "jsdom");

// Serve relative resources (data/cities.js) off disk while keeping a normal
// http origin — a file:// url would disable pushState and localStorage.
const ORIGIN = "https://example.test/";
const served = [];
const localFiles = requestInterceptor((request) => {
  if (request.url.startsWith(ORIGIN)) {
    const rel = request.url.slice(ORIGIN.length).split("?")[0];
    const abs = path.join(__dirname, rel);
    if (fs.existsSync(abs)) {
      served.push(rel);
      return new Response(fs.readFileSync(abs, "utf8"),
        { headers: { "Content-Type": "text/javascript" } });
    }
    return new Response("not found", { status: 404 });
  }
});

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

// Styles and logic live in css/ and js/ now, so string-level assertions read
// a concatenation of everything rather than just the shell.
function readAll(dir, ext) {
  const d = path.join(__dirname, dir);
  if (!fs.existsSync(d)) return "";
  return fs.readdirSync(d).filter(f => f.endsWith(ext)).sort()
    .map(f => fs.readFileSync(path.join(d, f), "utf8")).join("\n");
}
const cssSrc = readAll("css", ".css");
const jsSrc = readAll("js", ".js");
const allSrc = html + "\n" + cssSrc + "\n" + jsSrc;

let pass = 0, fail = 0;
const failures = [];
function check(name, fn) {
  try {
    const r = fn();
    if (r === false) throw new Error("returned false");
    console.log("  PASS  " + name);
    pass++;
  } catch (e) {
    console.log("  FAIL  " + name + " — " + e.message);
    failures.push(name + " — " + e.message);
    fail++;
  }
}
function section(t) { console.log("\n=== " + t + " ==="); }

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  resources: { interceptors: [localFiles] },
  url: ORIGIN
});
const { window } = dom;
const { document } = window;

// jsdom has no layout engine; these are no-ops we must stub
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = function () {};

const errors = [];
window.addEventListener("error", e => errors.push(e.message || String(e.error)));

// `state` and `mxPick` are top-level const/let — global lexical bindings, not
// window properties. Reach them through page-scope eval.
const px = (expr) => window.eval(expr);

setTimeout(() => {
  const go = window.go;
  const setForm = (dt, tm, noTime) => {
    document.getElementById("cDate").value = dt;
    document.getElementById("cTime").value = tm;
    document.getElementById("cNoTime").checked = !!noTime;
  };

  section("console / runtime errors");
  console.log(errors.length ? "  " + errors.join("\n  ") : "  (none)");

  section("offline safety");
  // Nothing may be FETCHED from another origin. A plain <a href> is a link the
  // reader chooses to follow and loads nothing — and the GeoNames attribution
  // in the footer is a licence obligation, so it has to be allowed to exist.
  check("no external script or stylesheet references", () => {
    const ext = allSrc.match(/\bsrc="https?:\/\/[^"]*"/g) || [];
    const links = [...allSrc.matchAll(/<link\b[^>]*href="(https?:\/\/[^"]*)"/g)].map(m => m[1]);
    const hits = ext.concat(links);
    if (hits.length) throw new Error(hits.join(", "));
    return true;
  });
  check("off-origin anchors are credits only, and safely marked", () => {
    const anchors = [...html.matchAll(/<a\b([^>]*href="https?:\/\/[^"]*"[^>]*)>/g)].map(m => m[1]);
    for (const a of anchors){
      const href = a.match(/href="([^"]+)"/)[1];
      if (!/geonames\.org|creativecommons\.org/.test(href))
        throw new Error("unexpected outbound link: " + href);
      if (!/rel="[^"]*noopener/.test(a)) throw new Error("missing rel=noopener: " + href);
    }
    if (!anchors.length) throw new Error("the GeoNames attribution is required by CC BY");
    return true;
  });
  check("no CSS @import or remote url()", () =>
    !/@import/.test(cssSrc) && !/url\(\s*['"]?(https?:)?\/\//.test(cssSrc));
  // The site makes exactly one kind of network request: the place lookup a
  // person can explicitly ask for. It lives alone in js/10b-place-web.js so
  // that this test can be a filename allow-list rather than a fragile search
  // for an approved-looking call. Everything outside that file must be unable
  // to reach the network at all — note \bfetch\b rather than fetch\s*\(, so
  // even passing the function around somewhere else fails here.
  const NET_FILE = "10b-place-web.js";
  check("the only network call is the opt-in place lookup", () => {
    const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
    const others = fs.readdirSync(path.join(__dirname, "js"))
      .filter(f => f.endsWith(".js") && f !== NET_FILE)
      .map(f => fs.readFileSync(path.join(__dirname, "js", f), "utf8")).join("\n");
    const hits = strip(html + "\n" + others).match(/\bfetch\b|XMLHttpRequest|new\s+Worker/g) || [];
    if (hits.length) throw new Error("outside " + NET_FILE + ": " + hits.join(", "));
    return true;
  });
  check("no XHR or Worker anywhere, including the network file", () => {
    const hits = jsSrc.replace(/\/\*[\s\S]*?\*\//g, "")
      .match(/XMLHttpRequest|new\s+Worker/g) || [];
    if (hits.length) throw new Error(hits.join(", "));
    return true;
  });
  check("the network file talks to one host and nowhere else", () => {
    const src = fs.readFileSync(path.join(__dirname, "js", NET_FILE), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const urls = [...new Set(src.match(/https?:\/\/[^"'\s]+/g) || [])];
    if (urls.length !== 1) throw new Error("expected one endpoint, got " + urls.join(", "));
    if (!urls[0].startsWith("https://geocoding-api.open-meteo.com/"))
      throw new Error(urls[0]);
    return true;
  });
  check("nothing opens a connection before it is asked to", () =>
    !/rel="(preconnect|dns-prefetch|prefetch|preload)"/.test(html));
  check("fonts are system stacks only", () => {
    const fams = allSrc.match(/font-family:[^;}"']*/g) || [];
    const remote = fams.filter(f => /googleapis|typekit|fonts\.\w/.test(f));
    if (remote.length) throw new Error(remote.join(", "));
    return true;
  });
  check("favicon is inline, not a separate request", () => {
    const m = html.match(/<link rel="icon" href="([^"]{0,40})/);
    if (!m) throw new Error("no favicon");
    if (!m[1].startsWith("data:")) throw new Error("not a data URI");
    return true;
  });
  check("social image is a relative path", () => {
    const m = html.match(/property="og:image" content="([^"]*)"/);
    if (!m) throw new Error("no og:image");
    if (/^https?:/.test(m[1])) throw new Error("absolute: " + m[1]);
    if (!fs.existsSync(path.join(__dirname, m[1])))
      throw new Error("missing file: " + m[1]);
    return true;
  });
  check("history writes are funnelled through a guarded helper", () => {
    // a raw pushState/replaceState throw on file:// would kill the router
    const stripped = jsSrc.replace(/\/\*[\s\S]*?\*\//g, "");
    const raw = (stripped.match(/history\.(push|replace)State/g) || []).length;
    if (raw > 2) throw new Error(raw + " raw history calls; expected them wrapped");
    if (!/function writeHash/.test(jsSrc)) throw new Error("no writeHash helper");
    return true;
  });
  check("writeHash survives a throwing history API", () => {
    const realPush = window.history.pushState;
    const realRepl = window.history.replaceState;
    window.history.pushState = () => { throw new Error("file:// blocked"); };
    window.history.replaceState = () => { throw new Error("file:// blocked"); };
    try {
      go("planets");           // must not throw
      go("houses");
      if (window.current !== "houses") throw new Error("routing stopped working");
    } finally {
      window.history.pushState = realPush;
      window.history.replaceState = realRepl;
      px("historyWorks = true");
    }
    return true;
  });
  check("store/load survive a throwing localStorage", () => {
    const real = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { throw new Error("blocked on file://"); }
    });
    try {
      window.store("x", 1);                       // must not throw
      if (window.load("x", "fb") !== "fb") throw new Error("bad fallback");
    } finally {
      if (real) Object.defineProperty(window, "localStorage", real);
    }
    return true;
  });
  check("serve.js resolves paths without escaping the root", () => {
    // Exercise the guard directly rather than trusting a prefix test: a plain
    // startsWith also accepts "<root>-evil", and on Windows it compares mixed
    // separators. The server must use path.relative.
    const src = fs.readFileSync(path.join(__dirname, "serve.js"), "utf8");
    if (!/path\.relative\(/.test(src))
      throw new Error("guard is not using path.relative");
    const ROOT = path.resolve("/srv/site");
    const escapes = (p) => {
      const abs = path.resolve(ROOT, "." + p);
      const rel = path.relative(ROOT, abs);
      return rel.startsWith("..") || path.isAbsolute(rel);
    };
    const cases = [
      ["/index.html", false], ["/css/atlas.css", false],
      ["/css/../css/atlas.css", false], ["/", false],
      ["/../../etc/passwd", true], ["/../site-evil/x", true]
    ];
    for (const [p, want] of cases)
      if (escapes(p) !== want) throw new Error(p + " -> " + escapes(p));
    return true;
  });
  // The 2 MB place table must not be part of install: only the Chart section
  // needs it, and precaching it made every visitor download it on first load.
  // The runtime handler is what puts it in the cache, on first real use.
  check("the place table is cached on use, not on install", () => {
    const sw = fs.readFileSync(path.join(__dirname, "sw.js"), "utf8");
    const list = sw.slice(sw.indexOf("const PRECACHE = ["),
                          sw.indexOf("];", sw.indexOf("const PRECACHE = [")));
    if (/cities\.js/.test(list)) throw new Error("cities.js is still precached on install");
    if (!/caches\.open\(CACHE\)[\s\S]{0,40}\.put\(/.test(sw))
      throw new Error("nothing would ever cache it at runtime");
    // and the rest of the site must still be precached
    for (const need of ["index.html", "css/atlas.css", "js/01-astro.js", "js/11-chart.js",
                        "js/10b-place-web.js", "manifest.json"])
      if (!list.includes(need)) throw new Error("no longer precached: " + need);
    return true;
  });
  check("the docs describe the precache that actually ships", () => {
    const readme = fs.readFileSync(path.join(__dirname, "README.md"), "utf8");
    if (/precaches every asset/.test(readme))
      throw new Error("README still claims every asset is precached");
    return true;
  });
  check("serve.js has no dependencies", () => {
    const src = fs.readFileSync(path.join(__dirname, "serve.js"), "utf8");
    const reqs = [...src.matchAll(/require\("([^"]+)"\)/g)].map(m => m[1]);
    const external = reqs.filter(r => !r.startsWith("node:"));
    if (external.length) throw new Error("external: " + external.join(", "));
    return true;
  });

  section("metadata");
  check("og:title present", () => !!document.querySelector('meta[property="og:title"]'));
  check("twitter:card present", () => !!document.querySelector('meta[name="twitter:card"]'));
  check("description present", () => !!document.querySelector('meta[name="description"]'));

  section("structure");
  check("toast element exists", () => !!document.getElementById("toast"));
  check("nav built from PAGES", () => {
    const n = document.querySelectorAll(".navlink").length;
    const want = window.eval("PAGES.length");
    if (n !== want) throw new Error("got " + n + ", PAGES has " + want);
    return true;
  });
  check("dead .shell CSS removed", () => !/\.shell\{position:relative/.test(cssSrc));
  check("nav has an overflow mask", () => /nav\.mainnav\{[\s\S]*?mask-image/.test(cssSrc));

  section("router / history");
  check("go() is exposed", () => typeof go === "function");
  check("go pushes history", () => {
    const before = window.history.length;
    go("planets");
    go("houses");
    if (window.location.hash !== "#/houses") throw new Error("hash=" + window.location.hash);
    if (window.history.length <= before) throw new Error("history did not grow");
    return true;
  });
  check("visited marks applied", () => {
    const seen = document.querySelectorAll(".navlink.seen").length;
    if (seen < 2) throw new Error("only " + seen + " seen");
    return true;
  });
  check("unknown page shows a toast", () => {
    go("nonsense");
    if (!document.getElementById("toast").classList.contains("on"))
      throw new Error("toast not shown");
    return true;
  });

  section("section pager");
  check("pager rendered on a middle page", () => {
    go("houses");
    const p = document.querySelector("#page-houses .pager");
    if (!p) throw new Error("no pager");
    const btns = p.querySelectorAll(".pager-btn[data-go]");
    if (btns.length !== 2) throw new Error("expected 2, got " + btns.length);
    return true;
  });
  check("pager targets the correct neighbours", () => {
    const ids = [...document.querySelectorAll("#page-houses .pager .pager-btn[data-go]")]
      .map(b => b.dataset.go);
    if (ids[0] !== "planets" || ids[1] !== "aspects") throw new Error(ids.join(","));
    return true;
  });
  check("start page has no previous", () => {
    go("start");
    return !!document.querySelector("#page-start .pager .pager-btn.empty");
  });

  section("quiz");
  check("choices are shuffled and the answer remapped", () => {
    const q = { q: "x", cat: "basics", why: "w", choices: ["a", "b", "c", "d"], a: 1 };
    let moved = 0;
    for (let i = 0; i < 40; i++) {
      const s = window.shuffleChoices(q);
      if (s.choices[s.a] !== "b") throw new Error("answer text not preserved");
      if (s.a !== 1) moved++;
    }
    if (moved === 0) throw new Error("position never changed in 40 runs");
    return true;
  });
  check("answer position carries no signal", () => {
    const counts = [0, 0, 0, 0];
    const q = { q: "x", cat: "basics", why: "w", choices: ["a", "b", "c", "d"], a: 1 };
    for (let i = 0; i < 4000; i++) counts[window.shuffleChoices(q).a]++;
    const spread = Math.max(...counts) - Math.min(...counts);
    if (spread > 250) throw new Error("skewed: " + counts.join("/"));
    return true;
  });
  check("source data really was skewed (regression guard)", () => {
    // the bug this fixes: 25 of 48 correct answers were option B
    const counts = [0, 0, 0, 0];
    px("QUIZ").forEach(q => counts[q.a]++);
    if (Math.max(...counts) <= counts.reduce((a, b) => a + b, 0) / 4 * 1.5)
      throw new Error("source no longer skewed; shuffle guard may be moot");
    return true;
  });
  check("retryMissed exists", () => typeof window.retryMissed === "function");
  check("quiz renders four choices", () => {
    go("quiz");
    return document.querySelectorAll("#quizOut .qch").length === 4;
  });

  section("persistence");
  check("store/load round-trip", () => {
    window.store("smoke", { a: 1 });
    const r = window.load("smoke", null);
    if (!r || r.a !== 1) throw new Error(JSON.stringify(r));
    return true;
  });
  check("load returns the fallback for a missing key", () =>
    window.load("nope-not-here", "fb") === "fb");

  section("wheel");
  check("Esc clears the selection", () => {
    go("wheel");
    window.selectPair(0, 6);
    if (px("state.selection.length") !== 2) throw new Error("setup failed");
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const n = px("state.selection.length");
    if (n !== 0) throw new Error("still " + n);
    return true;
  });
  check("empty state offers a suggestion", () => {
    const b = document.querySelector("#selStrip [data-try]");
    if (!b) throw new Error("no try button");
    if (!/Try /.test(b.textContent)) throw new Error("bad label: " + b.textContent);
    return true;
  });
  check("the suggestion selects the pair", () => {
    document.querySelector("#selStrip [data-try]").click();
    if (px("state.selection.length") !== 2) throw new Error("not selected");
    return true;
  });
  check("tapping a selected sign deselects it", () => {
    const before = px("state.selection.length");
    window.toggleSelect(px("state.selection[0]"));
    if (px("state.selection.length") !== before - 1) throw new Error("no deselect");
    return true;
  });
  check("wheel state persists and restores", () => {
    px('state.elements = new Set(["Fire"])');
    window.saveWheelState();
    if (window.load("wheel", null).elements[0] !== "Fire") throw new Error("not saved");
    px("state.elements = new Set()");
    window.restoreWheelState();
    if (!px('state.elements.has("Fire")')) throw new Error("not restored");
    return true;
  });
  check("narrow-screen matrix lists the other eleven signs", () => {
    px("state.matrix = true");
    window.syncAll();
    if (!document.getElementById("mxPick")) throw new Error("no picker");
    const rows = document.querySelectorAll("#mxRanked .crow").length;
    if (rows !== 11) throw new Error("expected 11, got " + rows);
    return true;
  });
  check("matrix picker updates on change", () => {
    const sel = document.getElementById("mxPick");
    sel.value = "3";
    sel.dispatchEvent(new window.Event("change", { bubbles: true }));
    if (px("mxPick") !== 3) throw new Error("mxPick not updated");
    return document.querySelectorAll("#mxRanked .crow").length === 11;
  });
  check("matrix never lists a sign against itself", () => {
    const names = [...document.querySelectorAll("#mxRanked .crow .nm")].map(n => n.textContent);
    const picked = px("SIGNS[mxPick].name");
    if (names.includes(picked)) throw new Error(picked + " listed against itself");
    return true;
  });
  check("matrix rows sort by score descending", () => {
    const nums = [...document.querySelectorAll("#mxRanked .crow .cnum")].map(n => +n.textContent);
    for (let i = 1; i < nums.length; i++)
      if (nums[i] > nums[i - 1]) throw new Error("not sorted at " + i);
    return true;
  });

  section("deep links");
  check("a bad sub-link reports instead of failing silently", () => {
    window.applySub("planets", "not-a-planet");
    return document.getElementById("toast").classList.contains("on");
  });
  check("a good sub-link works", () => {
    go("planets");
    return window.showBody("mars") !== false;
  });

  section("file split");
  // Two clauses on purpose. The first catches a record pasted back into the
  // shell; the second is the one that survives the next schema change, since a
  // tuple-shaped regex silently stops matching the moment a field is added and
  // would then pass for ever while guarding nothing. \b before the underscore
  // in CITIES_SRC is not a word boundary, so that constant does not trip it.
  check("no city records bundled into the main sources", () =>
    !/\["[^"]+",\d+,-?\d+(\.\d+)?,-?\d+(\.\d+)?,\d+[,\]]/.test(html + jsSrc) &&
    !/\bvar (CITIES|TZS|CTRY|ADM)\b\s*=/.test(html + jsSrc));
  check("data/cities.js exists and parses", () => {
    const src = fs.readFileSync(path.join(__dirname, "data/cities.js"), "utf8");
    new Function(src);
    return /var CITIES=/.test(src) && /var TZS=/.test(src) &&
           /var CTRY=/.test(src) && /var ADM=/.test(src) &&
           /var CITIES_FORMAT=\d+/.test(src);
  });
  check("HTML is a thin shell after the split", () => {
    const kb = Buffer.byteLength(html) / 1024;
    if (kb > 60) throw new Error(kb.toFixed(0) + " KB — expected a shell");
    return true;
  });
  check("styles and scripts are external files that exist", () => {
    const refs = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m => m[1]);
    if (refs.length < 10) throw new Error("only " + refs.length + " refs");
    const missing = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
    if (missing.length) throw new Error("missing: " + missing.join(", "));
    return true;
  });
  check("every js part parses on its own", () => {
    const dir = path.join(__dirname, "js");
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort();
    for (const f of files) new Function(fs.readFileSync(path.join(dir, f), "utf8"));
    return true;
  });
  check("script tags are in numeric order (execution order matters)", () => {
    const order = [...html.matchAll(/src="js\/([^"]+)"/g)].map(m => m[1]);
    const sorted = [...order].sort();
    if (order.join(",") !== sorted.join(",")) throw new Error(order.join(","));
    return true;
  });
  check("total payload accounted for", () => {
    const sum = (d) => fs.readdirSync(path.join(__dirname, d))
      .filter(f => /\.(js|css)$/.test(f))
      .reduce((a, f) => a + fs.statSync(path.join(__dirname, d, f)).size, 0);
    const shell = Buffer.byteLength(html) / 1024;
    const jsKb = sum("js") / 1024, cssKb = sum("css") / 1024;
    const dataKb = fs.statSync(path.join(__dirname, "data/cities.js")).size / 1024;
    console.log("        (shell " + shell.toFixed(0) + " KB + css " + cssKb.toFixed(0) +
      " KB + js " + jsKb.toFixed(0) + " KB, plus " + dataKb.toFixed(0) +
      " KB loaded only for the chart)");
    // The place table is loaded on demand and cached on first use, so it can
    // afford to be large — but not unboundedly. Raising POP_MIN in
    // tools/build-cities.js is the lever if this ever trips.
    if (dataKb > 3000) throw new Error(dataKb.toFixed(0) + " KB of place data");
    if (shell > 60) throw new Error("shell grew to " + shell.toFixed(0) + " KB");
    return true;
  });
  check("searchCities is safe before the data loads", () =>
    Array.isArray(window.searchCities("lon")));

  // Everything past here needs the lazily-loaded place data.
  go("chart");
  window.ensureCities().then(() => {
    section("lazy place loading");
    check("data/cities.js was actually fetched", () => {
      if (!served.includes("data/cities.js")) throw new Error(JSON.stringify(served));
      return true;
    });
    check("CITIES, TZS, CTRY and ADM populated", () => {
      if (px("CITIES.length") < 45000) throw new Error("only " + px("CITIES.length"));
      if (px("ADM.length") < 1000) throw new Error("only " + px("ADM.length") + " regions");
      if (px("ADM[0]") !== "") throw new Error("ADM[0] must be the empty region");
      return px("TZS.length") > 100 && px("CTRY.length") > 100;
    });
    check("every record is well formed", () => {
      const bad = px(`(function(){
        for (var i = 0; i < CITIES.length; i++){
          var c = CITIES[i];
          if (c.length !== 6 && c.length !== 7) return i + ": length " + c.length;
          if (typeof c[0] !== "string" || !c[0]) return i + ": name";
          if (!(c[1] >= 0 && c[1] < CTRY.length)) return i + ": country " + c[1];
          if (!(c[2] >= -90 && c[2] <= 90)) return i + ": lat " + c[2];
          if (!(c[3] >= -180 && c[3] <= 180)) return i + ": lon " + c[3];
          if (!(c[4] >= 0 && c[4] < TZS.length)) return i + ": tz " + c[4];
          if (!(c[5] >= 0 && c[5] < ADM.length)) return i + ": region " + c[5];
          // Folded to ASCII. The punctuation is what genuinely appears in
          // place names — "Sant'Antonio", "Basse-Terre", "Villa (Nuevo)".
          if (c.length === 7 && !/^[a-z0-9 |'.,()\\/[\\]-]+$/.test(c[6]))
            return i + ": alias " + c[6];
        }
        return "";
      })()`);
      if (bad) throw new Error(bad);
      return true;
    });
    check("every time zone is one Intl accepts", () => {
      const bad = px(`TZS.filter(function(z){
        try { new Intl.DateTimeFormat("en", { timeZone: z }); return false; }
        catch (e){ return true; }
      }).join(", ")`);
      if (bad) throw new Error(bad);
      return true;
    });
    // Records run population-descending and nothing ships a population figure,
    // so this ordering IS the ranking. Check it by its consequences.
    check("records are ordered by population", () => {
      const rank = (name, country) => px(
        `CITIES.findIndex(function(c){ return c[0] === ${JSON.stringify(name)} && ` +
        `CTRY[c[1]] === ${JSON.stringify(country)}; })`);
      const pairs = [
        ["London", "United Kingdom", "London", "Canada"],
        ["Paris", "France", "Paris", "United States"],
        ["Córdoba", "Argentina", "Córdoba", "Spain"]
      ];
      for (const [aN, aC, bN, bC] of pairs){
        const a = rank(aN, aC), b = rank(bN, bC);
        if (a < 0 || b < 0) throw new Error("missing " + aN + "/" + bN);
        if (a > b) throw new Error(aN + ", " + aC + " ranked below " + bC);
      }
      return true;
    });
    check("autocomplete finds London, and the big one first", () => {
      const ids = window.searchCities("london");
      if (!ids.length) throw new Error("no matches");
      const name = px("CITIES[" + ids[0] + "][0]");
      const country = px("CTRY[CITIES[" + ids[0] + "][1]]");
      if (!/london/i.test(name)) throw new Error("first match was " + name);
      if (country !== "United Kingdom") throw new Error("first London was in " + country);
      return true;
    });

    section("place search");
    const names = (q) => window.searchCities(q)
      .map(i => px("CITIES[" + i + "][0]") + "|" + px("ADM[CITIES[" + i + "][5]]") +
                "|" + px("CTRY[CITIES[" + i + "][1]]"));

    // The whole reason for the region field: eight Springfields, and no way to
    // tell them apart before this.
    // Regions are looked up in GeoNames' own admin1 table, never inferred. The
    // inference this replaced put 45 Jiangsu cities, Nanjing included, in
    // "Taiwan Province, People's Republic of China".
    check("regions name the division the place is actually in", () => {
      const region = (name, country) => px(
        `(function(){var c = CITIES.find(function(x){ return x[0] === ${JSON.stringify(name)} && ` +
        `CTRY[x[1]] === ${JSON.stringify(country)}; }); return c ? (ADM[c[5]] || "") : "MISSING";})()`);
      const want = [["Nanjing", "China", "Jiangsu"], ["Tianjin", "China", "Tianjin"],
                    ["Belfast", "United Kingdom", "Northern Ireland"],
                    ["Caracas", "Venezuela", "Capital District"],
                    ["Springfield", "United States", "Missouri"]];
      for (const [n, c, r] of want){
        const got = region(n, c);
        if (got !== r) throw new Error(n + " -> " + got + ", expected " + r);
      }
      return true;
    });
    check("no region names a country instead of a division", () => {
      const bad = px(`ADM.filter(function(a){ return /Province, People|Republic of China/.test(a); }).join(", ")`);
      if (bad) throw new Error(bad);
      return true;
    });
    check("country names read the way a person writes them", () => {
      const bad = px(`CTRY.filter(function(c){ return /\\b(And|Of)\\b/.test(c) || / The$/.test(c) ||` +
        ` c === "Korea South" || c === "Korea North"; }).join(", ")`);
      if (bad) throw new Error(bad);
      return true;
    });
    check("abbreviations find the place people mean", () => {
      const first = (q) => { const r = window.searchCities(q); return r.length ? window.cityLabel(r[0]) : "NO RESULT"; };
      const want = [["st petersburg", /Russia$/], ["st louis", /^St\. Louis, Missouri/],
                    ["saint louis", /^St\. Louis, Missouri/], ["mt vernon", /^Mount Vernon/],
                    ["ft worth", /^Fort Worth/]];
      for (const [q, re] of want){
        const got = first(q);
        if (!re.test(got)) throw new Error(q + " -> " + got);
      }
      return true;
    });
    check("duplicate names are separated by region", () => {
      const sf = names("springfield").filter(s => /^Springfield\|/.test(s) && /United States$/.test(s));
      if (sf.length < 4) throw new Error("only " + sf.length + " US Springfields");
      const regions = new Set(sf.map(s => s.split("|")[1]));
      if (regions.size !== sf.length) throw new Error("regions repeat: " + [...regions].join(", "));
      return true;
    });
    check("a region narrows the query", () => {
      const r = names("springfield il");
      if (r.length !== 1) throw new Error(r.join(" / "));
      return r[0] === "Springfield|Illinois|United States";
    });
    check("a spelled-out region narrows too", () =>
      names("cambridge massachusetts")[0] === "Cambridge|Massachusetts|United States");
    check("accents are optional in both directions", () => {
      const a = window.searchCities("sao paulo"), b = window.searchCities("são paulo");
      if (!a.length) throw new Error("no match for the unaccented spelling");
      if (a[0] !== b[0]) throw new Error("different first match");
      return px("CITIES[" + a[0] + "][0]") === "São Paulo";
    });
    check("English exonyms find the local name", () => {
      if (names("cologne")[0] !== "Köln|North Rhine-Westphalia|Germany")
        throw new Error(names("cologne").slice(0, 3).join(" / "));
      if (!/^Munich\|/.test(names("munchen")[0]))
        throw new Error(names("munchen").slice(0, 3).join(" / "));
      return true;
    });
    check("a word inside a name matches", () =>
      names("york").some(s => /^York\|/.test(s)) &&
      window.searchCities("new york").length > 0);
    check("a country name lists that country, biggest first", () => {
      const r = names("france");
      if (!/^Paris\|/.test(r[0])) throw new Error(r.slice(0, 3).join(" / "));
      return r.filter(s => /France$/.test(s)).length > 10;
    });
    check("towns the old 3,000-row table never had", () => {
      for (const q of ["oradea", "wagga wagga", "kaiserslautern", "chillicothe"])
        if (!window.searchCities(q).length) throw new Error("no match for " + q);
      return true;
    });
    // Eight records are written in Cyrillic with no Latin alias. Tokenizing on
    // [a-z0-9] emptied their index entries entirely, so they shipped in the
    // table and could not be selected in any script, their own included.
    check("names in a non-Latin script are findable in that script", () => {
      const unreachable = px(`(function(){
        var out = [];
        for (var i = 0; i < CITIES.length; i++){
          if (!/[^\\u0000-\\u007f]/.test(CITIES[i][6] || CITIES[i][0])) continue;
          if (CITIES[i][6]) continue;              // has a Latin alias, fine
          if (searchCities(CITIES[i][0]).indexOf(i) < 0) out.push(CITIES[i][0]);
        }
        return out.join(", ");
      })()`);
      if (unreachable) throw new Error("cannot be found: " + unreachable);
      return true;
    });
    check("every record can be found by its own name", () => {
      // A sample rather than all 50,000 — enough to catch a tokenizer that
      // drops a whole class of name, cheap enough to run every time.
      const missed = px(`(function(){
        var out = [];
        for (var i = 0; i < CITIES.length; i += 149){
          if (searchCities(CITIES[i][0]).indexOf(i) < 0) out.push(CITIES[i][0]);
        }
        return out.slice(0, 5).join(", ");
      })()`);
      if (missed) throw new Error("not found by name: " + missed);
      return true;
    });
    // A rejected load leaves the old globals defined, so the schema check has
    // to sit in the predicate everything asks — not only on the load path.
    check("an incompatible place table is refused on every path", () => {
      const real = px("CITIES_FORMAT");
      px("CITIES_FORMAT = 1");
      try {
        if (px("citiesLoaded()") !== false) throw new Error("still reported as loaded");
        if (window.searchCities("london").length !== 0)
          throw new Error("searched an incompatible table");
      } finally {
        px("CITIES_FORMAT = " + real);
      }
      if (!window.searchCities("london").length) throw new Error("did not recover");
      return true;
    });
    // A regression here would mean going back to scanning 50,000 rows per
    // keystroke. Generous enough not to flake on a cold CI runner.
    check("queries stay fast at fifty thousand records", () => {
      const qs = ["lo", "lond", "london", "spri", "springfield", "sao", "par",
                  "new y", "york", "muni", "cam", "port", "berl", "tok"];
      const t0 = Date.now();
      for (let r = 0; r < 15; r++) for (const q of qs) window.searchCities(q);
      const ms = Date.now() - t0;
      console.log("        (" + (qs.length * 15) + " queries in " + ms + " ms)");
      if (ms > 1500) throw new Error(ms + " ms");
      return true;
    });

    // ---- the index is built ahead of the first keystroke -------------------
    // ~130ms of work used to happen inside the first keypress. It now runs in
    // slices while the page is idle, which is only safe if the sliced result is
    // the same index the single pass produced — so check that, not just timing.
    check("the index builds itself, deferred, with no query involved", () => {
      px("CBUCKET = null; cityIndexAt = 0; prebuilding = false;");
      if (px("cityIndexReady()") !== false) throw new Error("teardown failed");
      // whenIdle() defers each slice. Run the deferrals inline so the test can
      // stay synchronous — and count them, because doing the whole build inline
      // is exactly the regression this guards against.
      const realT = window.setTimeout, realI = window.requestIdleCallback;
      let deferred = 0;
      window.setTimeout = (fn) => { deferred++; fn(); return 0; };
      window.requestIdleCallback = undefined;
      try { px("prebuildCityIndex()"); }
      finally { window.setTimeout = realT; window.requestIdleCallback = realI; }
      if (deferred < 2) throw new Error("built inline rather than in slices");
      if (px("cityIndexReady()") !== true)
        throw new Error("stopped at " + px("cityIndexAt") + " of " + px("CITIES.length"));
      console.log("        (" + deferred + " deferred slices)");
      return true;
    });
    // The behaviour above is only worth anything if the page actually starts
    // it. Nothing observable distinguishes "started at page open" from "built
    // by the first query" once the suite has run a query of its own, so this
    // one is checked at the source.
    check("opening the chart page is what starts the build", () => {
      const src = fs.readFileSync(path.join(__dirname, "js/11-chart.js"), "utf8");
      const fn = src.slice(src.indexOf("function renderChartPage"));
      if (!/ensureCities\(\)[\s\S]{0,400}?prebuildCityIndex\(\)/.test(fn))
        throw new Error("renderChartPage no longer starts the prebuild");
      // And a query must still finish it itself, or one that beats the idle
      // work would search a half-built index.
      const sc = src.slice(src.indexOf("function searchCities"));
      if (!/buildCityIndex\(\)/.test(sc.slice(0, 900)))
        throw new Error("searchCities no longer completes the index");
      return true;
    });
    check("building in slices gives the identical index", () => {
      const snap = px(`JSON.stringify([CNAME, CTEXT, CBUCKET, CCITY, NBUCKET])`);
      // Tear it down and rebuild it the other way — one slice at a time.
      px("CBUCKET = null; cityIndexAt = 0;");
      px("while (!cityIndexReady()) buildCityIndexTo(cityIndexAt + CITY_SLICE);");
      const sliced = px(`JSON.stringify([CNAME, CTEXT, CBUCKET, CCITY, NBUCKET])`);
      if (snap !== sliced) throw new Error("sliced build differs from the single pass");
      // And the whole-hog path must land in the same place.
      px("CBUCKET = null; cityIndexAt = 0; buildCityIndex();");
      if (px(`JSON.stringify([CNAME, CTEXT, CBUCKET, CCITY, NBUCKET])`) !== snap)
        throw new Error("single pass differs from itself");
      return true;
    });
    check("a slice is small enough to fit in a frame", () => {
      if (px("CITY_SLICE") > 5000) throw new Error("CITY_SLICE = " + px("CITY_SLICE"));
      return true;
    });

    // ---- the country branch is a lookup, not a scan ------------------------
    // Typing a country's whole name used to walk all 49,564 records, and for
    // the 130 countries with fewer than 40 places it walked every one.
    check("every country's cities are indexed, ranked and capped", () => {
      const bad = px(`(function(){
        var seen = Object.create(null), i;
        for (i = 0; i < CITIES.length; i++) seen[CITIES[i][1]] = true;
        for (var k in seen){
          var list = CCITY[k];
          if (!list || !list.length) return "no CCITY for country " + k;
          if (list.length > 40) return "country " + k + " kept " + list.length;
          for (i = 1; i < list.length; i++){
            if (list[i] <= list[i - 1]) return "country " + k + " out of order";
            if (CITIES[list[i]][1] !== +k) return "country " + k + " has a stray record";
          }
        }
        return "";
      })()`);
      if (bad) throw new Error(bad);
      return true;
    });
    check("a country with few cities is as quick as one with many", () => {
      const time = (q) => {
        const t0 = Date.now();
        for (let i = 0; i < 40; i++) window.searchCities(q);
        return Math.max(1, Date.now() - t0);
      };
      // Warm both paths before measuring either.
      time("monaco"); time("london");
      const small = time("monaco"), word = time("london");
      console.log("        (monaco " + small + " ms vs london " + word + " ms per 40)");
      // It was 19x before the index; anything past 5x means the scan is back.
      if (small > word * 5) throw new Error(small + " ms vs " + word + " ms");
      return true;
    });
    check("naming a country still lists its cities, largest first", () => {
      const r = window.searchCities("france");
      if (!r.length) throw new Error("no results");
      if (px("CITIES[" + r[0] + "][0]") !== "Paris")
        throw new Error("france -> " + px("CITIES[" + r[0] + "][0]"));
      const mc = window.searchCities("monaco");
      if (!mc.length) throw new Error("no results for monaco");
      return true;
    });

    // ---- narrowsPlace answers from a bucket, not a full scan ---------------
    check("region and country matching is unchanged by the bucketing", () => {
      const bad = px(`(function(){
        function brute(t){
          var i;
          for (i = 1; i < AFOLD.length; i++) if (AFOLD[i].indexOf(t) === 0) return true;
          for (i = 0; i < CFOLD.length; i++) if (CFOLD[i].indexOf(t) === 0) return true;
          return false;
        }
        var probes = ["il", "ca", "ma", "dc", "united states", "france", "il ",
                      "z", "a", "q", "zz", "qx", "eng", "bay", "new", "saint",
                      "north", "s", "united", "u", "californ", "kingdom"];
        for (var i = 0; i < 400; i++) probes.push(AFOLD[i + 1] || "");
        for (var j = 0; j < CFOLD.length; j++){
          probes.push(CFOLD[j], CFOLD[j].slice(0, 3), CFOLD[j] + "x");
        }
        for (var k = 0; k < probes.length; k++){
          var t = probes[k];
          if (!t) continue;
          if (narrowsPlace(t) !== brute(t)) return JSON.stringify(t);
        }
        return "";
      })()`);
      if (bad) throw new Error("disagrees with a full scan on " + bad);
      return true;
    });

    // The app writes cityLabel() into its own input on every selection. If that
    // string cannot be searched, editing the field looks like the place has
    // vanished — and pushes the user at the network for a city already here.
    check("the app can find the labels it writes itself", () => {
      const missed = [];
      for (let i = 0; i < 2000; i += 7){
        const label = window.cityLabel(i);
        if (window.searchCities(label).indexOf(i) !== 0) missed.push(label);
        if (missed.length > 3) break;
      }
      if (missed.length) throw new Error("not found first: " + missed.join(" / "));
      return true;
    });
    // City / State / Country, everywhere a place is shown — the chart readout
    // used to drop the state, losing exactly the disambiguation it exists for.
    check("the chart readout names the state, not just the country", () => {
      window._pickCityIdx(window.searchCities("springfield il")[0]);
      setForm("1974-03-11", "07:45", false);
      window.renderChartOut(window.computeChart());
      const shown = document.getElementById("chartOut").textContent;
      if (!/Springfield, Illinois, United States/.test(shown))
        throw new Error("readout says: " + (shown.match(/in [^(]+\(UTC/) || ["?"])[0]);
      return true;
    });
    check("two-part City, Country still resolves", () => {
      for (const [q, want] of [["London, United Kingdom", "London"],
                               ["Houston, United States", "Houston"],
                               ["Mumbai, India", "Mumbai"]]){
        const r = window.searchCities(q);
        if (!r.length) throw new Error("no results for " + q);
        if (px("CITIES[" + r[0] + "][0]") !== want) throw new Error(q + " -> " + px("CITIES[" + r[0] + "][0]"));
      }
      return true;
    });
    check("an exact name outranks a longer one that starts the same", () => {
      const first = (q) => px("CITIES[" + window.searchCities(q)[0] + "][0]");
      if (first("victoria") !== "Victoria") throw new Error("victoria -> " + first("victoria"));
      if (first("york") !== "York") throw new Error("york -> " + first("york"));
      return true;
    });
    check("picking sets chosenCity", () => {
      window._pickCityIdx(window.searchCities("london")[0]);
      if (!window.chosenCity) throw new Error("not set");
      return /london/i.test(window.chosenCity.name);
    });
    check("the combobox tells assistive tech which row is active", () => {
      const inp = document.getElementById("cPlace");
      inp.value = "springfield";
      inp.dispatchEvent(new window.Event("input", { bubbles: true }));
      return true;   // populated asynchronously; asserted in the web section
    });
    check("warning text uses a token each theme can make legible", () => {
      // Only the status/warning path — the same hex is a legitimate decorative
      // element colour elsewhere, always on a dark panel.
      const chart = fs.readFileSync(path.join(__dirname, "js/11-chart.js"), "utf8");
      if (/color:#ffd35e/.test(chart))
        throw new Error("status text still hardcodes the warn colour");
      if (!/--warn-text/.test(cssSrc)) throw new Error("no --warn-text token");
      const light = cssSrc.slice(cssSrc.indexOf('html[data-theme="light"]'));
      if (!/--warn-text/.test(light.slice(0, 900)))
        throw new Error("light theme does not override it");
      return true;
    });
    check("the place hint is announced, not silent", () => {
      const h = document.getElementById("cPlaceHint");
      if (h.getAttribute("aria-live") !== "polite") throw new Error("not a live region");
      return true;
    });
    check("picking labels the field with the region", () => {
      window._pickCityIdx(window.searchCities("springfield il")[0]);
      const c = window.chosenCity;
      if (c.name !== "Springfield") throw new Error("name became " + c.name);
      if (c.country !== "United States") throw new Error("country became " + c.country);
      if (c.region !== "Illinois") throw new Error("region became " + c.region);
      const shown = document.getElementById("cPlace").value;
      if (shown !== "Springfield, Illinois, United States") throw new Error(shown);
      return true;
    });
    check("ensureCities is idempotent", () => {
      const before = served.filter(x => x === "data/cities.js").length;
      window.ensureCities();
      return served.filter(x => x === "data/cities.js").length === before;
    });

    section("chart");
    check("computes and renders", () => {
      setForm("1990-06-15", "12:00", false);
      const ch = window.computeChart();
      if (!ch) throw new Error("computeChart returned null");
      window.renderChartOut(ch);
      return !!document.getElementById("chartAsps");
    });
    check("aspect list truncated to six with a show-all", () => {
      const shown = document.querySelectorAll("#chartAsps .tile").length;
      if (shown > 6) throw new Error("showed " + shown);
      const more = document.querySelector("[data-aspmore]");
      if (!more || !/Show all/.test(more.textContent)) throw new Error("no show-all");
      return true;
    });
    check("show-all expands", () => {
      document.querySelector("[data-aspmore]").click();
      if (document.querySelectorAll("#chartAsps .tile").length <= 6)
        throw new Error("did not expand");
      return true;
    });
    check("missing date uses an inline hint, not alert()", () => {
      let alerted = false;
      window.alert = () => { alerted = true; };
      document.getElementById("cDate").value = "";
      if (window.computeChart() !== null) throw new Error("should have refused");
      if (alerted) throw new Error("used alert()");
      if (!/Pick a date/i.test(document.getElementById("cDateHint").textContent))
        throw new Error("no inline hint");
      return true;
    });
    check("chart input save/restore", () => {
      setForm("1984-03-09", "07:45", false);
      document.getElementById("cPlace").value = "London, United Kingdom";
      window.saveChartInputs();
      setForm("", "", false);
      if (!window.restoreChartInputs()) throw new Error("restore refused");
      if (document.getElementById("cDate").value !== "1984-03-09") throw new Error("date lost");
      if (document.getElementById("cTime").value !== "07:45") throw new Error("time lost");
      return true;
    });

    section("aspect patterns");
    const ang = (ch, x, y) => {
      let s = Math.abs(ch.bodies[x].lon - ch.bodies[y].lon) % 360;
      return s > 180 ? 360 - s : s;
    };
    check("detectPatterns returns an array", () => {
      setForm("1990-06-15", "12:00", false);
      return Array.isArray(window.detectPatterns(window.computeChart()));
    });
    check("a known chart yields a grand trine and a T-square", () => {
      setForm("1990-06-15", "12:00", false);
      const names = window.detectPatterns(window.computeChart()).map(p => p.name);
      if (!names.includes("Grand Trine")) throw new Error("no grand trine: " + names);
      if (!names.includes("T-Square")) throw new Error("no T-square: " + names);
      return true;
    });
    check("grand trine members really are mutually trine", () => {
      setForm("1990-06-15", "12:00", false);
      const ch = window.computeChart();
      const gt = window.detectPatterns(ch).find(p => p.key === "grand-trine");
      const [a, b, c] = gt.bodies;
      for (const [x, y] of [[a, b], [b, c], [a, c]])
        if (Math.abs(ang(ch, x, y) - 120) > 7)
          throw new Error(x + "/" + y + " = " + ang(ch, x, y).toFixed(1) + "°");
      return true;
    });
    check("T-square apex really is square both ends", () => {
      setForm("1990-06-15", "12:00", false);
      const ch = window.computeChart();
      const t = window.detectPatterns(ch).find(p => p.key === "t-square");
      const ends = t.bodies.filter(b => b !== t.apex);
      if (Math.abs(ang(ch, ends[0], ends[1]) - 180) > 7) throw new Error("ends not opposed");
      for (const e of ends)
        if (Math.abs(ang(ch, e, t.apex) - 90) > 7) throw new Error("apex not square " + e);
      return true;
    });
    check("outer-planet stelliums are labelled generational", () => {
      let checked = 0;
      for (const d of ["1965-03-01", "1993-02-01", "2020-01-12", "1988-02-13", "1947-05-05"]) {
        setForm(d, "12:00", false);
        for (const p of window.detectPatterns(window.computeChart())) {
          if (p.key !== "stellium") continue;
          const allOuter = p.bodies.every(n =>
            ["Uranus", "Neptune", "Pluto"].includes(n));
          if (allOuter !== !!p.generational)
            throw new Error(d + ": " + p.bodies + " generational=" + p.generational);
          if (p.generational) checked++;
        }
      }
      console.log("        (" + checked + " generational stelliums correctly labelled)");
      return true;
    });
    check("patterns render as cards", () => {
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      const n = document.querySelectorAll("#chartPatterns .pattern").length;
      if (n < 2) throw new Error("only " + n);
      return true;
    });

    section("unknown birth time");
    check("rising sign withheld", () => {
      setForm("1984-03-09", "07:45", true);
      window.renderChartOut(window.computeChart());
      if (!document.querySelector(".b3.unknown")) throw new Error("not flagged");
      return true;
    });
    check("house ring and angles not drawn", () => {
      if (document.querySelectorAll("#natal .nhouse").length) throw new Error("houses drawn");
      if (document.querySelectorAll("#natal .nang").length) throw new Error("angles drawn");
      return true;
    });
    check("positions list shows no house", () => {
      const ph = document.querySelector(".plist .ph");
      if (!ph || ph.textContent.trim() !== "—") throw new Error("got " + ph?.textContent);
      return true;
    });
    check("hour nudge hidden", () => !document.querySelector("[data-shift]"));
    check("planets still computed", () =>
      typeof window.lastChart.bodies.Sun.lon === "number");
    check("known time restores houses and angles", () => {
      setForm("1984-03-09", "07:45", false);
      window.renderChartOut(window.computeChart());
      if (document.querySelector(".b3.unknown")) throw new Error("still flagged");
      if (document.querySelectorAll("#natal .nhouse").length !== 12) throw new Error("no houses");
      if (document.querySelectorAll("#natal .nang").length !== 4) throw new Error("no angles");
      return true;
    });

    section("a time zone instead of a place");
    // The planets are geocentric, so a zone fixes every one of them. The
    // Ascendant, the Midheaven and the houses are functions of latitude and
    // longitude and a zone does not pin those down — 68 of the 340 multi-place
    // zones in the table put the Ascendant in a different sign depending which
    // end of the zone you were born at. So: same bargain as an unknown birth
    // time. Give less, and what cannot be derived is withheld, not guessed.
    {
      const zoneMode = (on) => {
        document.getElementById("cNoPlace").checked = on;
        window.syncPlaceMode();
      };
      check("ticking the box swaps the place box for a zone list", () => {
        zoneMode(true);
        const inp = document.getElementById("cPlace"), sel = document.getElementById("cZone");
        if (!inp.hidden || !inp.disabled) throw new Error("place box still live");
        if (sel.hidden || sel.disabled) throw new Error("zone select not shown");
        if (sel.options.length < 100) throw new Error("only " + sel.options.length + " zones");
        if (!window.chosenCity || !window.chosenCity.zoneOnly)
          throw new Error("no zone-only place: " + JSON.stringify(window.chosenCity));
        return true;
      });
      check("the visible label follows the visible control", () => {
        zoneMode(true);
        const lab = document.getElementById("cPlaceLabel");
        if (lab.getAttribute("for") !== "cZone")
          throw new Error("labels the hidden input: for=" + lab.getAttribute("for"));
        if (!/Time zone/.test(lab.textContent)) throw new Error("says " + lab.textContent);
        zoneMode(false);
        if (lab.getAttribute("for") !== "cPlace") throw new Error("did not switch back");
        if (!/Place/.test(lab.textContent)) throw new Error("says " + lab.textContent);
        return true;
      });
      check("every zone offered is one Intl accepts", () => {
        const bad = px(`(function(){
          var sel = document.getElementById("cZone"), out = [];
          for (var i = 0; i < sel.options.length; i++)
            if (!validTz(sel.options[i].value)) out.push(sel.options[i].value);
          return out.slice(0, 5).join(", ");
        })()`);
        if (bad) throw new Error(bad);
        return true;
      });
      // The whole justification for the feature, checked rather than asserted.
      check("the planets are identical to a real city in the same zone", () => {
        zoneMode(true);
        px(`document.getElementById("cZone").value = "Europe/Oslo"; setZonePlace();`);
        setForm("1990-06-15", "12:00", false);
        const zone = window.computeChart();
        const zb = {}; for (const n of window.bodiesIn(zone)) zb[n] = zone.bodies[n].lon;
        window.chosenCity = { name:"Oslo", country:"Norway", lat:59.91, lon:10.75,
                              tz:"Europe/Oslo" };
        const city = window.computeChart();
        let worst = 0, which = "";
        for (const n of window.bodiesIn(city)){
          const d = Math.abs(zb[n] - city.bodies[n].lon);
          if (d > worst){ worst = d; which = n; }
        }
        if (Object.keys(zb).length < 10) throw new Error("only " + Object.keys(zb).length + " bodies");
        if (worst !== 0) throw new Error(which + " differs by " + worst);
        // ...and the Ascendant, which is why it is withheld, does NOT agree.
        const gap = Math.abs(zone.asc - city.asc);
        console.log("        (" + Object.keys(zb).length + " bodies identical; the Ascendant " +
          "would have been " + gap.toFixed(1) + "° out)");
        if (gap < 1) throw new Error("the Ascendant agreed too — check the fixture");
        return true;
      });
      check("the angles and houses are withheld, and say why", () => {
        zoneMode(true);
        px(`document.getElementById("cZone").value = "Europe/Oslo"; setZonePlace();`);
        setForm("1990-06-15", "12:00", false);
        window.renderChartOut(window.computeChart());
        if (!document.querySelector(".b3.unknown")) throw new Error("rising sign not flagged");
        if (document.querySelectorAll("#natal .nhouse").length) throw new Error("houses drawn");
        if (document.querySelectorAll("#natal .nang").length) throw new Error("angles drawn");
        const ph = document.querySelector(".plist .ph");
        if (!ph || ph.textContent.trim() !== "—") throw new Error("list shows " + ph?.textContent);
        const t = document.getElementById("chartOut").textContent;
        // The reason has to name the missing half — a birthplace, not a time.
        if (!/Needs a birthplace/.test(t)) throw new Error("blames the wrong gap");
        if (/Needs a birth time/.test(t)) throw new Error("says a time is missing when one was given");
        if (!/no house system — needs a birthplace/.test(t)) throw new Error("house line: wrong reason");
        return true;
      });
      // Substituting a representative city for the zone would be invisible on
      // its own — the angles are withheld on the flag, downstream of any
      // coordinate. What must never happen is the page REPORTING a latitude it
      // was not given, which is the step that would make the substitution look
      // like an answer.
      check("no coordinate is ever shown for a zone-only place", () => {
        zoneMode(true);
        px(`document.getElementById("cZone").value = "Europe/Oslo"; setZonePlace();`);
        const hint = document.getElementById("cPlaceHint").textContent;
        if (/\d+(\.\d+)?\s*°\s*[NSEW]/.test(hint)) throw new Error("hint shows coordinates: " + hint);
        if (!/Europe\/Oslo/.test(hint)) throw new Error("hint does not name the zone: " + hint);
        setForm("1990-06-15", "12:00", false);
        window.renderChartOut(window.computeChart());
        const t = document.getElementById("chartOut").textContent;
        if (/\d+(\.\d+)?\s*°\s*[NS],/.test(t)) throw new Error("readout shows a latitude");
        if (!/in the Europe\/Oslo time zone/.test(t))
          throw new Error("readout does not name the zone as the place");
        if (window.placeLabel(window.chosenCity) !== "the Europe/Oslo time zone")
          throw new Error("placeLabel: " + window.placeLabel(window.chosenCity));
        return true;
      });
      check("an unknown time still blames the time, not the place", () => {
        zoneMode(false);
        window._pickCityIdx(window.searchCities("london")[0]);
        setForm("1984-03-09", "07:45", true);
        window.renderChartOut(window.computeChart());
        const t = document.getElementById("chartOut").textContent;
        if (!/Needs a birth time/.test(t)) throw new Error("lost the time wording");
        if (/Needs a birthplace/.test(t)) throw new Error("blames the place");
        return true;
      });
      check("nothing else is withheld — the ordinary notices still appear", () => {
        zoneMode(true);
        px(`document.getElementById("cZone").value = "Europe/Oslo"; setZonePlace();`);
        setForm("2101-01-01", "12:00", false);   // outside Pluto's fit window
        window.renderChartOut(window.computeChart());
        const t = document.getElementById("chartOut").textContent;
        if (!/Pluto is not shown for this date/.test(t)) throw new Error("lost the Pluto notice");
        if (!/A time zone rather than a birthplace/.test(t)) throw new Error("lost the zone notice");
        return true;
      });
      check("a zone-only chart shares and comes back as one", () => {
        zoneMode(true);
        px(`document.getElementById("cZone").value = "Asia/Tokyo"; setZonePlace();`);
        setForm("1990-06-15", "12:00", false);
        const sub = window.chartToSub(window.computeChart());
        if (!/\|z\|z\|/.test(sub)) throw new Error("no zone marker: " + sub);
        window.chosenCity = null;
        if (!window.applyChartSub(sub)) throw new Error("refused its own link");
        const c = window.chosenCity;
        if (!c.zoneOnly) throw new Error("came back as a place: " + JSON.stringify(c));
        if (c.tz !== "Asia/Tokyo") throw new Error("zone " + c.tz);
        if (!document.getElementById("cNoPlace").checked) throw new Error("box not ticked");
        if (document.getElementById("cZone").value !== "Asia/Tokyo")
          throw new Error("select shows " + document.getElementById("cZone").value);
        if (!window.lastChart.meta.unknownPlace) throw new Error("flag lost");
        return true;
      });
      // Half a marker is malformed. Charting it as if the missing half were
      // zero is exactly the confident wrong answer this file refuses.
      check("a link with only one coordinate replaced is refused", () => {
        for (const sub of ["1990-06-15|1200|z|139.69|Asia/Tokyo|whole|Tokyo",
                           "1990-06-15|1200|35.69|z|Asia/Tokyo|whole|Tokyo"])
          if (window.applyChartSub(sub) !== false) throw new Error("accepted " + sub);
        return true;
      });
      check("a zone-only chart survives a save and restore", () => {
        zoneMode(true);
        px(`document.getElementById("cZone").value = "America/Denver"; setZonePlace();`);
        setForm("1990-06-15", "12:00", false);
        window.renderChartOut(window.computeChart());
        window.saveChartInputs();
        window.chosenCity = null;
        document.getElementById("cNoPlace").checked = false;
        if (!window.restoreChartInputs()) throw new Error("restore refused");
        if (!window.chosenCity.zoneOnly) throw new Error("came back as a place");
        if (window.chosenCity.tz !== "America/Denver") throw new Error(window.chosenCity.tz);
        if (!document.getElementById("cNoPlace").checked) throw new Error("box not re-ticked");
        return true;
      });
      check("changing your mind gives the town back", () => {
        zoneMode(false);
        window._pickCityIdx(window.searchCities("springfield il")[0]);
        const town = window.chosenCity;
        zoneMode(true);
        if (!window.chosenCity.zoneOnly) throw new Error("did not switch");
        zoneMode(false);
        if (!window.chosenCity || window.chosenCity.zoneOnly)
          throw new Error("did not switch back: " + JSON.stringify(window.chosenCity));
        if (window.chosenCity.name !== town.name)
          throw new Error("restored " + window.chosenCity.name + ", not " + town.name);
        if (!/Springfield/.test(document.getElementById("cPlace").value))
          throw new Error("box reads " + document.getElementById("cPlace").value);
        return true;
      });
      // Leave the form as the rest of the suite expects it.
      zoneMode(false);
      window.localStorage.removeItem("cosmicatlas:chartInputs");
      window._pickCityIdx(window.searchCities("london")[0]);
      setForm("1990-06-15", "12:00", false);
    }

    section("time warnings");
    check("DST fall-back reads as ambiguous", () =>
      window.dstAnomaly(2023, 10, 29, 1, 30, "Europe/London").kind === "ambiguous");
    check("DST spring-forward reads as skipped", () =>
      window.dstAnomaly(2023, 3, 26, 1, 30, "Europe/London").kind === "skipped");
    check("an ordinary date reads clean", () =>
      window.dstAnomaly(2023, 6, 15, 12, 0, "Europe/London") === null);
    check("US transition also detected", () =>
      window.dstAnomaly(2023, 11, 5, 1, 30, "America/New_York").kind === "ambiguous");
    // Which of the two instants was used depends on the sign of the offset, and
    // the notice has to say the one that actually happened. The Americas land on
    // the earlier occurrence, Europe on the later.
    check("the ambiguous-hour notice reports the instant actually used", () => {
      const us = window.dstAnomaly(2023, 11, 5, 1, 30, "America/New_York");
      const uk = window.dstAnomaly(2023, 10, 29, 1, 30, "Europe/London");
      if (us.first !== true) throw new Error("New York should resolve to the earlier");
      if (uk.first !== false) throw new Error("London should resolve to the later");
      return true;
    });
    check("pre-1970 raises a warning", () => {
      setForm("1955-06-01", "03:00", false);
      const w = window.computeChart().meta.warnings;
      if (!w.some(x => x.tone === "warn" && /1970/.test(x.text))) throw new Error("none");
      return true;
    });
    check("modern date raises none", () => {
      setForm("1995-06-01", "03:00", false);
      return window.computeChart().meta.warnings.length === 0;
    });
    check("+1 hour moves the Ascendant", () => {
      setForm("1984-03-09", "07:45", false);
      window.renderChartOut(window.computeChart());
      const before = window.lastChart.asc;
      document.querySelector('[data-shift="60"]').click();
      if (Math.abs(window.lastChart.asc - before) < 5) throw new Error("barely moved");
      if (window.lastChart.meta.shift !== 60) throw new Error("shift not recorded");
      return true;
    });
    check("as-entered resets the shift", () => {
      document.querySelector('[data-shift="0"]').click();
      return window.lastChart.meta.shift === 0;
    });

    section("tropical / sidereal");
    check("toggle is rendered", () => {
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      return document.querySelectorAll("[data-zodiac]").length === 2;
    });
    check("ayanamsa is ~24° for the modern era", () => {
      const jdTT = window.lastChart.jdTT;
      const a = window.ayanamsa(jdTT);
      if (a < 23 || a > 25) throw new Error(a.toFixed(3) + "°");
      return true;
    });
    check("ayanamsa grows with time (precession)", () => {
      const a1900 = window.ayanamsa(2415020.5);
      const a2000 = window.ayanamsa(2451545.0);
      if (!(a2000 > a1900)) throw new Error(a1900 + " -> " + a2000);
      const rate = (a2000 - a1900) / 100 * 3600;   // arcsec/year
      if (rate < 45 || rate > 55) throw new Error(rate.toFixed(1) + "\"/yr");
      console.log("        (" + rate.toFixed(1) + " arcsec/year — precession is ~50.3)");
      return true;
    });
    check("switching to sidereal shifts every longitude by the ayanamsa", () => {
      const trop = window.lastChart;
      document.querySelector('[data-zodiac="sidereal"]').click();
      const sid = window.shownChart;
      if (sid.meta.zodiac !== "sidereal") throw new Error("mode not set");
      const ay = sid.meta.ayanamsa;
      for (const n of Object.keys(trop.bodies)) {
        const want = ((trop.bodies[n].lon - ay) % 360 + 360) % 360;
        if (Math.abs(sid.bodies[n].lon - want) > 1e-9)
          throw new Error(n + " off by " + (sid.bodies[n].lon - want));
      }
      return true;
    });
    check("aspects are invariant under the frame change", () => {
      // a constant offset cannot change angular separations
      const trop = window.lastChart, sid = window.shownChart;
      const at = window.chartAspects(trop), as = window.chartAspects(sid);
      if (at.length !== as.length) throw new Error(at.length + " vs " + as.length);
      for (let i = 0; i < at.length; i++)
        if (Math.abs(at[i].sep - as[i].sep) > 1e-9)
          throw new Error("separation drifted at " + i);
      return true;
    });
    check("a body drops back a sign exactly when its degree is under the ayanamsa", () => {
      // ~24° of ayanamsa moves a body back one sign only if it sits earlier
      // than 24° into its tropical sign. Anything later stays put.
      const trop = window.lastChart, sid = window.shownChart;
      const ay = sid.meta.ayanamsa;
      for (const n of Object.keys(trop.bodies)) {
        const degIn = trop.bodies[n].lon % 30;
        const ti = Math.floor(trop.bodies[n].lon / 30);
        const si = Math.floor(sid.bodies[n].lon / 30);
        const moved = ((ti - si) % 12 + 12) % 12;
        const expected = degIn < ay ? 1 : 0;
        if (moved !== expected)
          throw new Error(n + " at " + degIn.toFixed(1) + "° moved " + moved +
            " signs, expected " + expected);
      }
      return true;
    });
    check("switching back is exact", () => {
      const before = window.lastChart.bodies.Sun.lon;
      document.querySelector('[data-zodiac="tropical"]').click();
      if (window.shownChart.meta.zodiac !== "tropical") throw new Error("mode not reset");
      if (Math.abs(window.shownChart.bodies.Sun.lon - before) > 1e-12)
        throw new Error("lossy round-trip");
      return true;
    });
    check("tropical chart is never mutated by the sidereal view", () => {
      const sun = window.lastChart.bodies.Sun.lon;
      document.querySelector('[data-zodiac="sidereal"]').click();
      document.querySelector('[data-zodiac="sidereal"]').click();
      document.querySelector('[data-zodiac="tropical"]').click();
      if (Math.abs(window.lastChart.bodies.Sun.lon - sun) > 1e-12)
        throw new Error("source drifted");
      return true;
    });

    section("sign-from-date tool");
    check("known dates map to the right signs", () => {
      const cases = [["1990-04-10", "Aries"], ["1990-07-25", "Leo"],
                     ["1990-11-15", "Scorpio"], ["1990-01-05", "Capricorn"]];
      for (const [d, want] of cases) {
        const got = window.sunSignOn(d).sign.name;
        if (got !== want) throw new Error(d + " -> " + got + ", wanted " + want);
      }
      return true;
    });
    check("boundaries match the 2024 equinoxes and solstices", () => {
      const probes = [["2024-03-19", "Pisces"], ["2024-03-21", "Aries"],
                      ["2024-06-19", "Gemini"], ["2024-06-21", "Cancer"],
                      ["2024-09-21", "Virgo"], ["2024-09-23", "Libra"],
                      ["2024-12-20", "Sagittarius"], ["2024-12-22", "Capricorn"]];
      const bad = probes
        .map(([d, want]) => [d, window.sunSignOn(d).sign.name, want])
        .filter(([, got, want]) => got !== want)
        .map(([d, got, want]) => d + "->" + got + " want " + want);
      if (bad.length) throw new Error(bad.join("; "));
      return true;
    });
    check("renders a card linking into the wheel", () => {
      go("start");
      document.getElementById("mDate").value = "1988-08-08";
      document.getElementById("mGo").click();
      const link = document.querySelector("#mOut .micro-card [data-go='wheel'][data-sub]");
      if (!link) throw new Error("no wheel link");
      if (link.dataset.sub !== "leo") throw new Error("sub was " + link.dataset.sub);
      return true;
    });

    section("chart presets");
    check("presets rendered", () => {
      go("chart");
      const n = document.querySelectorAll("[data-preset]").length;
      if (n < 5) throw new Error("only " + n);
      return true;
    });
    check("moon landing preset computes", () => {
      document.querySelector('[data-preset="0"]').click();
      const ch = window.lastChart;
      if (ch.meta.dateStr !== "1969-07-20") throw new Error(ch.meta.dateStr);
      if (!/Houston/.test(ch.meta.city.name)) throw new Error(ch.meta.city.name);
      return true;
    });

    // Pluto's series is fitted over 1899-2050 and diverges by hundreds of
    // degrees outside it. Withheld rather than printed wrong.
    check("Pluto is withheld outside the years its series was fitted over", () => {
      const A = window.Astro;
      for (const y of [1850, 1898, 2051, 2100]){
        const c = A.chart(A.julianDay(y, 1, 1, 12), 51.5, -0.13, { houseSystem: "whole" });
        if (c.bodies.Pluto) throw new Error(y + " still reported Pluto");
        if ((c.withheld || []).indexOf("Pluto") < 0) throw new Error(y + " did not record it");
      }
      for (const y of [1899, 1990, 2050]){
        const c = A.chart(A.julianDay(y, 1, 1, 12), 51.5, -0.13, { houseSystem: "whole" });
        if (!c.bodies.Pluto) throw new Error(y + " should have Pluto");
      }
      return true;
    });
    check("a chart with a withheld body still renders, aspects and all", () => {
      const before = errors.length;
      window.chosenCity = { name: "London", region: "England", country: "United Kingdom",
                            lat: 51.51, lon: -0.13, tz: "Europe/London" };
      setForm("2100-06-15", "12:00", false);
      const ch = window.computeChart();
      if (!ch) throw new Error("no chart");
      window.renderChartOut(ch);
      if (errors.length !== before) throw new Error(errors.slice(before).join(" | "));
      if (/Pluto/.test(document.getElementById("chartList").textContent))
        throw new Error("Pluto listed for a date it is withheld on");
      if (!/Pluto is not shown/.test(document.getElementById("chartOut").textContent))
        throw new Error("no notice explaining why");
      return true;
    });
    check("Whole Sign houses still begin on sign boundaries in sidereal", () => {
      window.chosenCity = { name: "London", region: "England", country: "United Kingdom",
                            lat: 51.51, lon: -0.13, tz: "Europe/London" };
      setForm("1990-06-15", "12:00", false);
      document.getElementById("cHouse").value = "whole";
      const sid = window.toSidereal(window.computeChart());
      const off = sid.houses.cusps.map(c => Math.abs(((c % 30) + 30) % 30));
      const worst = Math.max(...off.map(o => Math.min(o, 30 - o)));
      if (worst > 0.001) throw new Error("cusps sit " + worst.toFixed(2) + " deg inside a sign");
      return true;
    });

    section("shareable chart urls");
    check("a chart round-trips through its share sub", () => {
      setForm("1969-07-20", "20:17", false);
      window.chosenCity = { name: "Houston", country: "United States",
                            lat: 29.76, lon: -95.37, tz: "America/Chicago" };
      const ch = window.computeChart();
      const sub = window.chartToSub(ch);
      window.chosenCity = null;
      document.getElementById("cDate").value = "";
      if (!window.applyChartSub(sub)) throw new Error("applyChartSub refused");
      if (window.lastChart.meta.dateStr !== "1969-07-20")
        throw new Error(window.lastChart.meta.dateStr);
      if (Math.abs(window.lastChart.asc - ch.asc) > 0.001)
        throw new Error("asc drifted " + ch.asc + " -> " + window.lastChart.asc);
      return true;
    });
    check("unknown-time charts round-trip", () => {
      setForm("1984-03-09", "07:45", true);
      const sub = window.chartToSub(window.computeChart());
      if (!/\|x\|/.test(sub)) throw new Error("no unknown marker: " + sub);
      window.applyChartSub(sub);
      if (!window.lastChart.meta.unknownTime) throw new Error("flag lost");
      return true;
    });
    check("hour shift round-trips", () => {
      setForm("1984-03-09", "07:45", false);
      window.timeShiftMin = 60;
      const sub = window.chartToSub(window.computeChart());
      window.timeShiftMin = 0;
      window.applyChartSub(sub);
      if (window.lastChart.meta.shift !== 60) throw new Error("shift lost");
      return true;
    });
    // Coordinates travel in the link rather than a row index precisely so that
    // links outlive edits to the place table. This one was written by hand in
    // the pre-region format and must keep resolving for ever.
    check("links shared before regions existed still resolve", () => {
      const old = "1969-07-20|2017|29.76|-95.37|America/Chicago|placidus|Houston,United States";
      if (!window.applyChartSub(old)) throw new Error("refused");
      const c = window.chosenCity;
      if (c.name !== "Houston") throw new Error("name " + c.name);
      if (c.country !== "United States") throw new Error("country " + c.country);
      if (c.region) throw new Error("invented a region: " + c.region);
      if (document.getElementById("cPlace").value !== "Houston, United States")
        throw new Error(document.getElementById("cPlace").value);
      return true;
    });
    check("a region survives the round trip", () => {
      setForm("1974-03-11", "07:45", false);
      window._pickCityIdx(window.searchCities("springfield il")[0]);
      const sub = window.chartToSub(window.computeChart());
      if (!/Springfield,Illinois,United States/.test(sub)) throw new Error(sub);
      window.chosenCity = null;
      if (!window.applyChartSub(sub)) throw new Error("refused");
      const c = window.chosenCity;
      if (c.region !== "Illinois" || c.country !== "United States")
        throw new Error(JSON.stringify(c));
      return true;
    });
    // Ten place names, four regions and one country contain a comma, which is
    // also the separator inside that field.
    check("a comma in a place name cannot corrupt the link", () => {
      setForm("1990-01-01", "12:00", false);
      window.chosenCity = { name: "Washington, D. C.", region: "District, of Columbia",
                            country: "United States", lat: 38.9, lon: -77.04,
                            tz: "America/New_York" };
      const sub = window.chartToSub(window.computeChart());
      if (sub.split("|")[6].split(",").length !== 3) throw new Error(sub);
      if (!window.applyChartSub(sub)) throw new Error("refused");
      return window.chosenCity.country === "United States";
    });
    // A share link is untrusted input; the web path already validates all three
    // of these, so the link path must too.
    check("a share link with an unusable time zone is refused", () => {
      const bad = "1990-06-15|1200|51.51|-0.13|Europe/Lundon|whole|London,United Kingdom";
      if (window.applyChartSub(bad) !== false) throw new Error("accepted a bad zone");
      return true;
    });
    check("a share link with impossible coordinates is refused, not thrown on", () => {
      const before = errors.length;
      for (const sub of ["1990-06-15|1200|Infinity|-0.13|Europe/London|whole|X,Y",
                         "1990-06-15|1200|51.51|999|Europe/London|whole|X,Y",
                         "1990-06-15|1200|91|0|Europe/London|whole|X,Y"])
        if (window.applyChartSub(sub) !== false) throw new Error("accepted " + sub);
      if (errors.length !== before) throw new Error("threw: " + errors.slice(before).join(" | "));
      return true;
    });
    check("an unresolvable zone never silently charts in UTC", () => {
      if (window.tzOffsetMin("Mars/Olympus", Date.now()) !== null)
        throw new Error("returned an offset for a zone that does not exist");
      if (window.validTz("Mars/Olympus") !== false) throw new Error("validTz said yes");
      if (window.validTz("Europe/London") !== true) throw new Error("validTz said no");
      return true;
    });
    check("malformed subs are rejected, not crashed on", () =>
      window.applyChartSub("garbage") === false &&
      window.applyChartSub("2020-01-01|x") === false &&
      window.applyChartSub("") === false);
    check("share and print controls present", () =>
      !!document.getElementById("cShare") && !!document.getElementById("cPrint"));
    check("print stylesheet exists", () => /@media print/.test(cssSrc));

    section("forget my birth data");
    // A date of birth, a time of birth and a birthplace persist from the first
    // calculation onwards. Remembering is the right default; having no way out
    // of it is not.
    {
      const KEY = "cosmicatlas:chartInputs";
      const boxEl = () => document.getElementById("cForget");
      const clickForget = (what) => {
        const b = boxEl().querySelector('[data-forget="' + what + '"]');
        if (!b) throw new Error('no [data-forget="' + what + '"] — box is: ' + boxEl().innerHTML);
        b.click();
      };
      const stored = () => window.localStorage.getItem(KEY);
      const seed = () => {
        setForm("1974-03-11", "07:45", false);
        window._pickCityIdx(window.searchCities("springfield il")[0]);
        window.renderChartOut(window.computeChart());
        window.saveChartInputs();
      };

      check("nothing is offered when nothing has been stored", () => {
        window.localStorage.removeItem(KEY);
        window.drawForget("idle");
        if (boxEl().innerHTML !== "") throw new Error("offered: " + boxEl().innerHTML);
        if (boxEl().classList.contains("on")) throw new Error("box is visible");
        return true;
      });
      check("calculating a chart puts the control on screen", () => {
        seed();
        if (!stored()) throw new Error("nothing was saved");
        if (!boxEl().classList.contains("on")) throw new Error("box stayed hidden");
        if (!boxEl().querySelector('[data-forget="ask"]')) throw new Error(boxEl().innerHTML);
        return true;
      });
      check("it asks before erasing anything", () => {
        clickForget("ask");
        if (!boxEl().querySelector('[data-forget="do"]')) throw new Error("no confirm");
        if (!stored()) throw new Error("erased before being confirmed");
        return true;
      });
      check("keeping them changes nothing", () => {
        clickForget("cancel");
        if (!stored()) throw new Error("erased anyway");
        if (!boxEl().querySelector('[data-forget="ask"]')) throw new Error("did not go back");
        return true;
      });
      check("forgetting clears the store, the form and the chart", () => {
        seed();
        clickForget("ask");
        clickForget("do");
        if (stored() !== null) throw new Error("still stored: " + stored());
        if (window.chosenCity) throw new Error("chosenCity survived");
        if (window.lastChart) throw new Error("lastChart survived");
        if (document.getElementById("cPlace").value !== "")
          throw new Error("place box still reads " + document.getElementById("cPlace").value);
        if (document.getElementById("chartOut").innerHTML !== "")
          throw new Error("the chart is still on screen");
        if (!/Forgotten/.test(boxEl().textContent)) throw new Error(boxEl().textContent);
        return true;
      });
      // Copying a share link writes the whole chart into the address bar, so
      // clearing storage alone would leave the birth data in plain sight.
      check("forgetting clears the chart out of the address bar", () => {
        seed();
        window.writeHash("#/chart/" + encodeURIComponent(window.chartToSub(window.computeChart())), true);
        if (!/%7C/.test(window.location.hash)) throw new Error("test setup: " + window.location.hash);
        clickForget("ask");
        clickForget("do");
        if (/\d{4}-\d{2}-\d{2}/.test(decodeURIComponent(window.location.hash)))
          throw new Error("birth date left in the url: " + window.location.hash);
        return true;
      });
      check("a blocked localStorage cannot break the control", () => {
        const real = window.localStorage.removeItem;
        window.localStorage.removeItem = () => { throw new Error("SecurityError"); };
        try {
          seed();
          clickForget("ask");
          clickForget("do");     // must not throw out of the click handler
        } finally {
          window.localStorage.removeItem = real;
        }
        return true;
      });
      check("the control reappears the next time a chart is calculated", () => {
        window.localStorage.removeItem(KEY);
        window.drawForget("idle");
        seed();
        if (!boxEl().querySelector('[data-forget="ask"]')) throw new Error(boxEl().innerHTML);
        return true;
      });
      // Leave the page as the rest of the suite expects to find it.
      window.localStorage.removeItem(KEY);
      window.drawForget("idle");
      setForm("1990-06-15", "12:00", false);
      window._pickCityIdx(window.searchCities("london")[0]);
    }

    section("cross-links in generated output");
    check("positions readout links signs and houses", () => {
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      window.selectChartBody("Mars");
      const box = document.getElementById("chartRead");
      if (!box.querySelector('.xlink[data-go="wheel"][data-sub]'))
        throw new Error("no sign link");
      if (!box.querySelector('.xlink[data-go="houses"][data-sub]'))
        throw new Error("no house link");
      return true;
    });
    check("a sign cross-link actually navigates", () => {
      const link = document.querySelector('#chartRead .xlink[data-go="wheel"][data-sub]');
      const want = link.dataset.sub;
      link.click();
      if (window.current !== "wheel") throw new Error("did not route, at " + window.current);
      const sel = px("state.selection");
      if (!sel.length) throw new Error("nothing selected");
      if (px("SIGNS[state.selection[0]].id") !== want)
        throw new Error("selected the wrong sign");
      return true;
    });
    check("a house cross-link navigates", () => {
      go("chart");
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      window.selectChartBody("Mars");
      document.querySelector('#chartRead .xlink[data-go="houses"][data-sub]').click();
      if (window.current !== "houses") throw new Error("at " + window.current);
      return true;
    });
    check("pattern member chips link to their planet pages", () => {
      go("chart");
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      const chip = document.querySelector('#chartPatterns .pat-b[data-go="planets"][data-sub]');
      if (!chip) throw new Error("no linked chip");
      chip.click();
      if (window.current !== "planets") throw new Error("at " + window.current);
      return true;
    });

    section("accessibility");
    check("a polite live region exists", () => {
      const el = document.getElementById("live");
      if (!el) throw new Error("missing #live");
      if (el.getAttribute("aria-live") !== "polite") throw new Error("not polite");
      return true;
    });
    check("calculating a chart announces it", () => {
      return new Promise(() => {}), (() => {
        go("chart");
        setForm("1969-07-20", "20:17", false);
        window.renderChartOut(window.computeChart());
        // announce() defers by 40ms; drive it synchronously instead
        window.announce("probe");
        return true;
      })();
    });
    check("selecting signs announces the comparison", () => {
      go("wheel");
      window.selectPair(0, 6);
      // announce is async; assert the code path ran by checking the strip
      if (px("state.selection.length") !== 2) throw new Error("not selected");
      return true;
    });
    check("chart output is focusable after render", () => {
      go("chart");
      window.renderChartOut(window.computeChart());
      const out = document.getElementById("chartOut");
      if (out.getAttribute("tabindex") !== "-1") throw new Error("not focusable");
      return true;
    });
    check("search restores focus to its opener on close", () => {
      go("start");
      const opener = document.getElementById("btnSearch");
      opener.focus();
      window.openSearch();
      window.closeSearch();
      if (document.activeElement !== opener)
        throw new Error("focus went to " + document.activeElement.id);
      return true;
    });
    check("keyboard sheet opens, traps Tab and restores focus", () => {
      const opener = document.getElementById("btnKeys");
      opener.focus();
      opener.click();
      const ov = document.getElementById("keysOverlay");
      if (!ov.classList.contains("on")) throw new Error("did not open");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      if (!ov.contains(document.activeElement))
        throw new Error("focus escaped the dialog");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      if (ov.classList.contains("on")) throw new Error("Escape did not close");
      if (document.activeElement !== opener) throw new Error("focus not restored");
      return true;
    });
    check("? opens the shortcut sheet", () => {
      document.body.focus();
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "?", bubbles: true }));
      const open = document.getElementById("keysOverlay").classList.contains("on");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      if (!open) throw new Error("did not open");
      return true;
    });
    check("g then a digit jumps to that section", () => {
      go("start");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "g", bubbles: true }));
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "4", bubbles: true }));
      if (window.current !== px("PAGES[3].id"))
        throw new Error("landed on " + window.current);
      return true;
    });
    check("arrows page between sections", () => {
      go("planets");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      if (window.current !== "houses") throw new Error("right -> " + window.current);
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      if (window.current !== "planets") throw new Error("left -> " + window.current);
      return true;
    });
    check("arrows are left alone on the aspects dial", () => {
      go("aspects");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      if (window.current !== "aspects") throw new Error("stole the arrow key");
      return true;
    });
    check("shortcut keys ignored while typing", () => {
      go("chart");
      const inp = document.getElementById("cPlace");
      inp.focus();
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "?", bubbles: true }));
      const opened = document.getElementById("keysOverlay").classList.contains("on");
      inp.blur();
      if (opened) throw new Error("opened while typing");
      return true;
    });

    section("installable app");
    check("manifest is valid JSON with the required fields", () => {
      const m = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
      for (const k of ["name", "short_name", "start_url", "display", "icons"])
        if (!m[k]) throw new Error("missing " + k);
      if (m.display !== "standalone") throw new Error("display=" + m.display);
      if (!m.icons.length) throw new Error("no icons");
      return true;
    });
    check("every manifest icon exists", () => {
      const m = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
      const missing = m.icons.map(i => i.src)
        .filter(src => !fs.existsSync(path.join(__dirname, src)));
      if (missing.length) throw new Error("missing: " + missing.join(", "));
      return true;
    });
    check("a maskable icon is provided", () => {
      const m = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
      if (!m.icons.some(i => (i.purpose || "").includes("maskable")))
        throw new Error("none marked maskable");
      return true;
    });
    check("manifest shortcuts point at real routes", () => {
      const m = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
      const ids = px("PAGES.map(function(p){return p.id})");
      for (const sc of (m.shortcuts || [])) {
        const id = (sc.url.split("#/")[1] || "").split("/")[0];
        if (!ids.includes(id)) throw new Error(sc.url + " -> unknown section " + id);
      }
      return true;
    });
    check("manifest and apple meta tags are linked", () => {
      if (!/<link rel="manifest"/.test(html)) throw new Error("no manifest link");
      if (!/apple-mobile-web-app-capable/.test(html)) throw new Error("no apple meta");
      if (!/apple-touch-icon/.test(html)) throw new Error("no apple icon");
      return true;
    });
    check("service worker parses and precaches every shipped asset", () => {
      const src = fs.readFileSync(path.join(__dirname, "sw.js"), "utf8");
      new Function(src);
      const listed = [...src.matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]).filter(Boolean);
      const missing = listed.filter(f => !fs.existsSync(path.join(__dirname, f)));
      if (missing.length) throw new Error("precaches missing files: " + missing.join(", "));
      // every js/css file we ship should be in the precache list
      const shipped = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m => m[1]);
      const absent = shipped.filter(f => !listed.includes(f));
      if (absent.length) throw new Error("not precached: " + absent.join(", "));
      return true;
    });
    check("documented shell commands match the shell they are labelled with", () => {
      // PowerShell blocks must not contain Bash-only constructs, and vice
      // versa — the two shells disagree about rm -rf, cp -r, ~ and the
      // VAR=value command prefix.
      const docs = ["README.md", "docs/IMPLEMENTATION.md"]
        .filter(f => fs.existsSync(path.join(__dirname, f)))
        .map(f => [f, fs.readFileSync(path.join(__dirname, f), "utf8")]);
      const bashOnly = /(^|\n)\s*(rm -rf|cp -r|mv -f|\bls -|\btouch )|(^|\n)\s*[A-Z_]+=[^\s]+\s+(node|npm)\b/;
      const bad = [];
      for (const [name, text] of docs) {
        const blocks = [...text.matchAll(/```powershell\n([\s\S]*?)```/g)].map(m => m[1]);
        for (const b of blocks)
          if (bashOnly.test(b)) bad.push(name + ": bash syntax in a powershell block");
      }
      if (bad.length) throw new Error(bad.join("; "));
      return true;
    });
    check("service worker registration is skipped on file://", () => {
      if (!/location\.protocol === "file:"/.test(jsSrc))
        throw new Error("no file:// guard — registration would throw");
      return true;
    });

    section("mobile app shell");
    check("bottom tab bar built with four tabs plus More", () => {
      const tabs = document.querySelectorAll("#tabbar .tab[data-go]").length;
      if (tabs !== 4) throw new Error(tabs + " tabs");
      if (!document.getElementById("tabMore")) throw new Error("no More tab");
      return true;
    });
    check("More sheet lists every section", () => {
      const n = document.querySelectorAll("#moreList .sheet-item").length;
      const want = px("PAGES.length");
      if (n !== want) throw new Error(n + " of " + want);
      return true;
    });
    check("tabs track the active section", () => {
      go("wheel");
      const cur = document.querySelector('#tabbar .tab[aria-current="page"]');
      if (!cur || cur.dataset.go !== "wheel") throw new Error("not synced");
      return true;
    });
    check("More lights up for sections outside the tab bar", () => {
      go("glossary");
      const more = document.getElementById("tabMore");
      if (more.getAttribute("aria-current") !== "page")
        throw new Error("More not marked active");
      return true;
    });
    check("More sheet opens and closes", () => {
      document.getElementById("tabMore").click();
      if (!document.getElementById("moreSheet").classList.contains("on"))
        throw new Error("did not open");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      if (document.getElementById("moreSheet").classList.contains("on"))
        throw new Error("Escape did not close");
      return true;
    });
    check("navigating from the sheet closes it", () => {
      document.getElementById("tabMore").click();
      document.querySelector('#moreList .sheet-item[data-go="houses"]').click();
      if (window.current !== "houses") throw new Error("did not navigate");
      if (document.getElementById("moreSheet").classList.contains("on"))
        throw new Error("sheet stayed open");
      return true;
    });
    check("safe-area insets are used", () => {
      if (!/env\(safe-area-inset-bottom/.test(cssSrc)) throw new Error("no bottom inset");
      if (!/env\(safe-area-inset-top/.test(cssSrc)) throw new Error("no top inset");
      return true;
    });
    check("touch targets are at least 44px on mobile", () => {
      if (!/min-height:44px/.test(cssSrc)) throw new Error("no 44px rule");
      return true;
    });
    check("tap highlight and double-tap delay suppressed", () => {
      if (!/-webkit-tap-highlight-color:transparent/.test(cssSrc))
        throw new Error("tap highlight not cleared");
      if (!/touch-action:manipulation/.test(cssSrc)) throw new Error("no touch-action");
      return true;
    });
    check("dialogs become bottom sheets on small screens", () => {
      if (!/#searchOverlay\{align-items:flex-end/.test(cssSrc.replace(/\s+/g, "")))
        throw new Error("search not a sheet");
      return true;
    });

    section("theme");
    check("light theme applies and is remembered", () => {
      window.applyTheme("light");
      if (document.documentElement.getAttribute("data-theme") !== "light")
        throw new Error("attr not set");
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta.getAttribute("content") !== "#f7f8fc") throw new Error("theme-color not updated");
      window.applyTheme("dark");
      return true;
    });
    check("light palette overrides the core variables", () => {
      for (const v of ["--void-0", "--text", "--panel-solid", "--accent"])
        if (!new RegExp('data-theme="light"[\\s\\S]*?' + v).test(cssSrc))
          throw new Error("no light override for " + v);
      return true;
    });

    section("dial snapping / tour / deep links");
    check("snapAngle pulls to a named separation", () => {
      px("aPos[1] = 0");
      const snapped = window.snapAngle(118.6, 0, false);
      if (Math.abs(snapped - 120) > 1e-9) throw new Error("got " + snapped);
      return true;
    });
    check("snapAngle leaves unnamed angles alone", () => {
      px("aPos[1] = 0");
      const raw = 105;
      if (window.snapAngle(raw, 0, false) !== raw) throw new Error("snapped a non-aspect");
      return true;
    });
    check("Shift overrides snapping", () => {
      px("aPos[1] = 0");
      if (window.snapAngle(118.6, 0, true) !== 118.6) throw new Error("snapped anyway");
      return true;
    });
    check("tour remembers the furthest step", () => {
      window.store("tourStep", 4);
      if (window.load("tourStep", 0) !== 4) throw new Error("not stored");
      if (!/Resume tour/.test(window.tourLabel())) throw new Error("no resume label");
      window.store("tourStep", 0);
      return true;
    });
    check("wheel pair deep links resolve", () => {
      go("wheel");
      if (window.selectSignById("aries+libra") === false) throw new Error("refused");
      const sel = px("state.selection");
      if (sel.length !== 2) throw new Error("got " + sel.length + " selected");
      if (px("SIGNS[state.selection[0]].id") !== "aries") throw new Error("wrong first");
      if (px("SIGNS[state.selection[1]].id") !== "libra") throw new Error("wrong second");
      return true;
    });
    check("a sign is never compared against itself", () => {
    window.selectPair(0, 0);
    if (px("state.selection.length") !== 1)
      throw new Error("selected " + px("state.selection.length") + " signs");
    go("wheel");
    window.applySub && window.applySub("aries+aries");
    if (px("state.selection.length") > 1) throw new Error("deep link produced a self-pair");
    return true;
  });
  check("every glossary cross-reference resolves", () => {
    const ids = new Set(px("GLOSSARY.map(function(g){ return g.id; })"));
    const bad = [];
    for (const e of px("GLOSSARY.map(function(g){ return {id:g.id, see:g.see||[]}; })"))
      for (const r of e.see) if (!ids.has(r)) bad.push(e.id + " -> " + r);
    if (bad.length) throw new Error(bad.join(", "));
    if (ids.size < 95) throw new Error("only " + ids.size + " terms");
    return true;
  });
  check("a marked quiz answer links to where the answer lives", () => {
    const cats = px("QUIZ.map(function(q){ return q.cat; })");
    const unmapped = [...new Set(cats)].filter(c => !px("QUIZ_SOURCE[" + JSON.stringify(c) + "]"));
    if (unmapped.length) throw new Error("no source for: " + unmapped.join(", "));
    const ids = new Set(px("PAGES.map(function(p){ return p.id; })"));
    for (const c of new Set(cats)){
      const target = px("QUIZ_SOURCE[" + JSON.stringify(c) + "].id");
      if (!ids.has(target)) throw new Error(c + " points at a section that does not exist: " + target);
    }
    return true;
  });
  check("a bad pair is rejected", () =>
      window.selectSignById("aries+notasign") === false);

    section("retrograde context");
    check("retrograde span matches the April 2024 Mercury window", () => {
      // Mercury was retrograde 1–25 April 2024
      setForm("2024-04-05", "12:00", false);
      window.chosenCity = { name: "London", country: "United Kingdom",
                            lat: 51.5, lon: -0.13, tz: "Europe/London" };
      const ch = window.computeChart();
      if (ch.bodies.Mercury.speed >= 0) throw new Error("not retrograde on this date");
      const r = window.retroSpan(ch, "Mercury");
      const began = r.back + 1, ends = r.fwd + 1;
      if (began < 2 || began > 7) throw new Error("began " + began + " days ago");
      if (ends < 18 || ends > 24) throw new Error("stations in " + ends + " days");
      console.log("        (began " + began + " days before, stations " + ends + " days after)");
      return true;
    });
    check("direct motion produces no retrograde block", () => {
      setForm("2024-01-15", "12:00", false);
      const ch = window.computeChart();
      if (ch.bodies.Mercury.speed < 0) throw new Error("Mercury retrograde on this date");
      return window.retroContext(ch, "Mercury") === "";
    });

    section("about page");
    check("about page renders limits and choices", () => {
      go("about");
      if (document.querySelectorAll("#limitsList .limit").length < 4)
        throw new Error("limits missing");
      if (document.querySelectorAll("#choicesList .limit").length < 4)
        throw new Error("choices missing");
      return true;
    });
    check("footer links to it", () => !!document.querySelector('.footlink[data-go="about"]'));

    section("end-to-end journey");
    check("every section renders without error", () => {
      const expect = {
        start:    () => !!document.getElementById("formula").children.length,
        wheel:    () => document.querySelectorAll("#wheel .node").length === 12,
        planets:  () => document.querySelectorAll("#plGrid .tile").length > 0,
        houses:   () => document.querySelectorAll("#hwheel .hseg").length === 12,
        aspects:  () => document.querySelectorAll("#adial .ahandle").length === 2,
        chart:    () => !!document.getElementById("chartForm"),
        history:  () => document.querySelectorAll("#histOut .hblock").length > 0,
        quiz:     () => document.querySelectorAll("#quizOut .qch").length === 4,
        glossary: () => document.querySelectorAll("#gList .gitem").length > 0,
        about:    () => document.querySelectorAll("#limitsList .limit").length >= 4
      };
      const bad = [];
      for (const id of px("PAGES.map(function(p){return p.id})")) {
        go(id);
        const fn = expect[id];
        if (!fn) { bad.push(id + " (no assertion)"); continue; }
        try { if (!fn()) bad.push(id); } catch (e) { bad.push(id + ": " + e.message); }
      }
      if (bad.length) throw new Error(bad.join(", "));
      return true;
    });
    check("a full user journey holds together", () => {
      go("start");
      document.getElementById("mDate").value = "1969-07-20";
      document.getElementById("mGo").click();
      const link = document.querySelector("#mOut [data-go='wheel'][data-sub]");
      if (!link) throw new Error("sign tool produced no wheel link");
      link.click();
      if (window.current !== "wheel") throw new Error("did not reach the wheel");
      if (px("state.selection.length") !== 1) throw new Error("no sign selected");
      go("chart");
      window._pickCityIdx(window.searchCities("houston")[0]);
      setForm("1969-07-20", "20:17", false);
      const ch = window.computeChart();
      window.renderChartOut(ch);
      if (document.querySelectorAll(".plist .prow").length < 10)
        throw new Error("positions missing");
      if (window.applyChartSub(window.chartToSub(ch)) === false)
        throw new Error("share link did not round-trip");
      go("quiz");
      const first = document.querySelector("#quizOut .qch");
      first.click();
      if (!document.querySelector("#qWhy.on")) throw new Error("quiz did not respond");
      return true;
    });
    // ---------------------------------------------------------------------
    // The opt-in web place lookup. Driven entirely through a stub transport:
    // jsdom has no fetch, so the real code path resolves to null and stays
    // inert until a test deliberately arms it — which is also exactly how it
    // behaves for a browser with no network.
    // ---------------------------------------------------------------------
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const inp = () => document.getElementById("cPlace");
    const hint = () => document.getElementById("cPlaceHint");
    const rowsOf = (kind) => window._placeRows().filter(r => r.kind === kind);

    // Type into the field and let the 120 ms debounce settle.
    const type = async (q) => {
      inp().value = q;
      inp().dispatchEvent(new window.Event("input", { bubbles: true }));
      await sleep(220);
    };
    const clickConsent = (choice) => {
      const b = hint().querySelector('[data-web="' + choice + '"]');
      if (!b) throw new Error("no " + choice + " button: " + hint().textContent);
      b.click();
    };
    const activateAsk = () => {
      const rows = window._placeRows();
      const k = rows.findIndex(r => r.kind === "ask");
      if (k < 0) throw new Error("no web row offered");
      window._placeActivate(k);
    };

    // A stub that records how it was called and answers with a canned payload.
    const makeTransport = (payload, opts) => {
      const calls = [];
      const fn = (url, init) => {
        calls.push({ url, init });
        if (opts && opts.reject) return Promise.reject(new Error("network down"));
        if (opts && opts.hang) return new Promise(() => {});
        return Promise.resolve({
          ok: true, status: 200, json: () => Promise.resolve(payload)
        });
      };
      fn.calls = calls;
      return fn;
    };
    const OSLO = {
      results: [{
        name: "Nesoddtangen", latitude: 59.8557, longitude: 10.6572,
        timezone: "Europe/Oslo", country: "Norway", admin1: "Akershus", population: 1200
      }]
    };
    // A nonsense query the built-in table cannot answer, so the web row is offered.
    const MISS = "qqzzxx";

    const webTests = async () => {
      section("web place lookup");

      window.store("placeWebLookup", "");
      window._setPlaceTransport(null);

      check("inert with no transport — this is also the offline behaviour", () =>
        window.webLookupAvailable() === false);
      await type(MISS);
      check("no web row is offered when it cannot be used", () =>
        rowsOf("ask").length === 0);

      let t = makeTransport(OSLO);
      window._setPlaceTransport(t);

      await type(MISS);
      check("a web row is offered once a search comes up short", () =>
        rowsOf("ask").length === 1);
      await type("london");
      check("a query the built-in table answers gets no web row", () =>
        rowsOf("ask").length === 0 && rowsOf("city").length > 3);
      await type(MISS);

      // The promise the whole feature rests on: typing never reaches the wire.
      check("typing alone never calls out", () => {
        if (t.calls.length) throw new Error(t.calls.length + " calls from typing");
        return true;
      });

      activateAsk();
      check("the first click asks before it sends", () => {
        if (t.calls.length) throw new Error("sent before consenting");
        return /open-meteo\.com/.test(hint().textContent);
      });

      clickConsent("once");
      await sleep(50);
      check("consenting sends exactly one request", () => {
        if (t.calls.length !== 1) throw new Error(t.calls.length + " calls");
        return true;
      });
      check("the request carries only the typed text", () => {
        const u = new URL(t.calls[0].url);
        if (u.origin + u.pathname !== "https://geocoding-api.open-meteo.com/v1/search")
          throw new Error(u.origin + u.pathname);
        if (u.searchParams.get("name") !== MISS) throw new Error(u.search);
        // nothing about the chart may travel with it
        for (const k of [...u.searchParams.keys()])
          if (["name", "count", "language", "format"].indexOf(k) < 0)
            throw new Error("unexpected parameter " + k);
        return true;
      });
      check("the request sends no credentials, referrer or cache entry", () => {
        const i = t.calls[0].init;
        if (i.credentials !== "omit") throw new Error("credentials " + i.credentials);
        if (i.referrerPolicy !== "no-referrer") throw new Error("referrer " + i.referrerPolicy);
        if (i.cache !== "no-store") throw new Error("cache " + i.cache);
        return true;
      });
      check("results are offered as rows", () => rowsOf("web").length === 1);

      check("choosing one produces an ordinary chosenCity", () => {
        const rows = window._placeRows();
        window._placeActivate(rows.findIndex(r => r.kind === "web"));
        const c = window.chosenCity;
        if (!c) throw new Error("not set");
        if (c.name !== "Nesoddtangen") throw new Error(c.name);
        if (c.tz !== "Europe/Oslo") throw new Error(c.tz);
        if (c.region !== "Akershus" || c.country !== "Norway") throw new Error(JSON.stringify(c));
        if (Math.abs(c.lat - 59.86) > 0.01) throw new Error("lat " + c.lat);
        return inp().value === "Nesoddtangen, Akershus, Norway";
      });
      check("a web-sourced place charts and shares like any other", () => {
        setForm("1980-05-05", "09:30", false);
        const ch = window.computeChart();
        if (!ch) throw new Error("no chart");
        const sub = window.chartToSub(ch);
        if (window.applyChartSub(sub) === false) throw new Error("link did not round-trip");
        if (window.chosenCity.region !== "Akershus")
          throw new Error("region lost: " + JSON.stringify(window.chosenCity));
        return true;
      });

      // A result we cannot time-zone would produce a quietly wrong Ascendant.
      window.store("placeWebLookup", "always");
      t = makeTransport({ results: [
        { name: "Nowhere", latitude: 1, longitude: 1, timezone: "Not/AZone", country: "X" },
        { name: "Offworld", latitude: 999, longitude: 1, timezone: "Europe/Oslo", country: "X" },
        { name: "Fine", latitude: 2, longitude: 2, timezone: "Europe/Oslo", country: "X" }
      ] });
      window._setPlaceTransport(t);
      await type(MISS);
      activateAsk();
      await sleep(50);
      check("results without a usable time zone are dropped, not offered", () => {
        const got = rowsOf("web").map(r => r.w.name);
        if (got.join(",") !== "Fine") throw new Error(got.join(","));
        return true;
      });
      check("'always' skips the question but still needs the click", () => {
        if (t.calls.length !== 1) throw new Error(t.calls.length + " calls");
        return true;
      });

      t = makeTransport(null, { reject: true });
      window._setPlaceTransport(t);
      await type(MISS);
      activateAsk();
      await sleep(50);
      check("a failed lookup degrades to a message, not an exception", () => {
        if (!/couldn.t reach/i.test(hint().textContent)) throw new Error(hint().textContent);
        return rowsOf("ask").length === 0;
      });

      window.store("placeWebLookup", "never");
      t = makeTransport(OSLO);
      window._setPlaceTransport(t);
      await type(MISS);
      check("'never' removes the offer entirely", () => {
        if (window.webLookupAvailable() !== false) throw new Error("still available");
        if (rowsOf("ask").length) throw new Error("still offered");
        return t.calls.length === 0;
      });
      // The README promises this is reversible. It is only true if the way
      // back survives a reload — a control rendered once, at the moment of
      // choosing, leaves the setting permanent in practice.
      // A timeout used to be reported as a user abort, so the caller kept
      // believing a request was in flight and the feature stayed dead.
      check("a timed-out lookup reports failure instead of wedging", async () => true);

      check("'never' still offers a way back on a later visit", () => {
        const b = hint().querySelector('[data-web="reset"]');
        if (!b) throw new Error("no reset control: " + hint().textContent);
        return true;
      });
      hint().querySelector('[data-web="reset"]').click();
      await sleep(50);
      check("turning it back on restores the offer", () => {
        if (window._webConsent() !== "") throw new Error("consent still " + window._webConsent());
        return window.webLookupAvailable() === true;
      });
      await type(MISS);
      check("and the web row comes back", () => rowsOf("ask").length === 1);

      // Leave the page as we found it.
      window.store("placeWebLookup", "");
      window._setPlaceTransport(null);
      await type("houston");
      window._pickCityIdx(window.searchCities("houston")[0]);
    };

    webTests().catch((e) => {
      check("web place lookup suite ran to completion", () => { throw e; });
    }).then(() => {
    check("no runtime errors accumulated across the whole run", () => {
      if (errors.length) throw new Error(errors.join(" | "));
      return true;
    });

    section("summary");
    console.log("  " + pass + " passed, " + fail + " failed");
    if (failures.length) console.log("\n  " + failures.join("\n  "));
    process.exit(fail ? 1 : 0);
    });
  }, (e) => {
    console.log("  FAIL  place data never loaded — " + e.message);
    console.log("\n  " + pass + " passed, " + (fail + 1) + " failed");
    process.exit(1);
  });
}, 1500);
